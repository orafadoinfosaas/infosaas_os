import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getStorage } from "../storage/index.js";
import { audit } from "../audit.js";

type Result = { content: { type: "text"; text: string }[]; isError?: boolean };
const ok = (text: string): Result => ({ content: [{ type: "text", text }] });
const fail = (text: string): Result => ({ content: [{ type: "text", text }], isError: true });

/**
 * Camada 1: CRUD genérico sobre o OS do tenant. Tudo passa pelo storage
 * (anti path-traversal) e é auditado. Ações destrutivas (sobrescrever/apagar)
 * exigem confirmação explícita — a tool instrui o Claude a confirmar com o
 * usuário antes de marcar `confirmar`.
 */
export function registerFileTools(server: McpServer, tenant: string): void {
  const fs = getStorage(tenant);

  server.registerTool(
    "listar_arquivos",
    {
      title: "Listar arquivos do OS",
      description:
        "Lista arquivos e pastas em um diretório do OS da empresa (dna/, output/, etc.). Caminho vazio = raiz.",
      inputSchema: { caminho: z.string().default("").describe("pasta a listar, relativa à raiz do OS") },
    },
    async ({ caminho }) => {
      const entries = await fs.list(caminho);
      audit(tenant, "listar_arquivos", { caminho, n: entries.length });
      if (!entries.length) return ok(`Vazio ou inexistente: ${caminho || "(raiz)"}`);
      const txt = entries
        .map((e) => (e.type === "dir" ? `📁 ${e.path}/` : `📄 ${e.path}  (${e.size ?? 0} b)`))
        .join("\n");
      return ok(txt);
    },
  );

  server.registerTool(
    "ler_arquivo",
    {
      title: "Ler arquivo do OS",
      description: "Lê o conteúdo de um arquivo do OS da empresa.",
      inputSchema: { caminho: z.string().min(1).describe("arquivo a ler, relativo à raiz do OS") },
    },
    async ({ caminho }) => {
      if (!(await fs.exists(caminho))) return fail(`Não encontrado: ${caminho}`);
      const text = await fs.read(caminho);
      audit(tenant, "ler_arquivo", { caminho, bytes: text.length });
      return ok(text);
    },
  );

  server.registerTool(
    "escrever_arquivo",
    {
      title: "Escrever arquivo no OS",
      description:
        "Cria ou sobrescreve um arquivo no OS. Se o arquivo JÁ EXISTE, confirme com o usuário e só então chame com confirmar_sobrescrita=true.",
      inputSchema: {
        caminho: z.string().min(1).describe("arquivo a escrever, relativo à raiz do OS"),
        conteudo: z.string().describe("conteúdo completo do arquivo"),
        confirmar_sobrescrita: z.boolean().optional().describe("true para autorizar sobrescrever um arquivo existente"),
      },
    },
    async ({ caminho, conteudo, confirmar_sobrescrita }) => {
      const existe = await fs.exists(caminho);
      if (existe && !confirmar_sobrescrita) {
        return ok(
          `⚠️ Já existe um arquivo em "${caminho}". Confirme com o usuário se quer SOBRESCREVER e chame de novo com confirmar_sobrescrita=true.`,
        );
      }
      await fs.write(caminho, conteudo);
      audit(tenant, "escrever_arquivo", { caminho, bytes: conteudo.length, sobrescrito: existe });
      return ok(`✅ ${existe ? "Sobrescrito" : "Criado"}: ${caminho} (${conteudo.length} b)`);
    },
  );

  server.registerTool(
    "editar_arquivo",
    {
      title: "Editar arquivo do OS",
      description:
        "Substituição cirúrgica num arquivo: troca a primeira ocorrência ÚNICA de `buscar` por `substituir`. Falha se `buscar` não existir ou for ambíguo (várias ocorrências).",
      inputSchema: {
        caminho: z.string().min(1).describe("arquivo a editar"),
        buscar: z.string().min(1).describe("trecho exato a localizar (deve ser único no arquivo)"),
        substituir: z.string().describe("texto que entra no lugar"),
      },
    },
    async ({ caminho, buscar, substituir }) => {
      if (!(await fs.exists(caminho))) return fail(`Não encontrado: ${caminho}`);
      const original = await fs.read(caminho);
      const parts = original.split(buscar);
      if (parts.length === 1) return fail(`Trecho não encontrado em ${caminho}.`);
      if (parts.length > 2) return fail(`Trecho ambíguo (${parts.length - 1} ocorrências) em ${caminho}. Refine o "buscar".`);
      const novo = parts[0] + substituir + parts[1];
      await fs.write(caminho, novo);
      audit(tenant, "editar_arquivo", { caminho, delta: novo.length - original.length });
      return ok(`✅ Editado: ${caminho}`);
    },
  );

  server.registerTool(
    "mover_arquivo",
    {
      title: "Mover/renomear arquivo do OS",
      description:
        "Move ou renomeia um arquivo. Se o destino JÁ EXISTE, confirme com o usuário e chame com confirmar_sobrescrita=true.",
      inputSchema: {
        origem: z.string().min(1).describe("caminho atual"),
        destino: z.string().min(1).describe("novo caminho"),
        confirmar_sobrescrita: z.boolean().optional(),
      },
    },
    async ({ origem, destino, confirmar_sobrescrita }) => {
      if (!(await fs.exists(origem))) return fail(`Origem não encontrada: ${origem}`);
      if ((await fs.exists(destino)) && !confirmar_sobrescrita) {
        return ok(`⚠️ Já existe algo em "${destino}". Confirme e chame com confirmar_sobrescrita=true.`);
      }
      await fs.move(origem, destino);
      audit(tenant, "mover_arquivo", { origem, destino });
      return ok(`✅ Movido: ${origem} → ${destino}`);
    },
  );

  server.registerTool(
    "apagar_arquivo",
    {
      title: "Apagar arquivo do OS",
      description:
        "Apaga um arquivo do OS. Ação destrutiva: SEMPRE confirme com o usuário antes e só então chame com confirmar=true.",
      inputSchema: {
        caminho: z.string().min(1).describe("arquivo a apagar"),
        confirmar: z.boolean().describe("precisa ser true; só após o usuário confirmar"),
      },
    },
    async ({ caminho, confirmar }) => {
      if (!(await fs.exists(caminho))) return fail(`Não encontrado: ${caminho}`);
      if (!confirmar) {
        return ok(`⚠️ Apagar "${caminho}" é irreversível. Confirme com o usuário e chame de novo com confirmar=true.`);
      }
      await fs.remove(caminho);
      audit(tenant, "apagar_arquivo", { caminho });
      return ok(`🗑️ Apagado: ${caminho}`);
    },
  );
}
