import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { buildSystemPrompt } from "@infosaas/content";
import { tenantDnaReader } from "../brain/dna-reader.js";

/**
 * Prompt `criar-conteudo` (chat-native): injeta o MESMO system prompt do DNA usado
 * pelo editor e instrui o LLM do HOST (Claude/GPT do cliente) a gerar o conteúdo.
 *
 * Billing: o MCP NÃO chama LLM aqui — quem escreve é o host, pago pela assinatura do
 * cliente (tier grátis). O modo `editor` (BYOK, pixel-perfect) é caminho à parte.
 *
 * Stage 0: prova a tese (mesmas regras, de graça). As tools de validar/salvar/preview
 * entram nos próximos stages (schema + renderer).
 */
export function registerCriarConteudoPrompt(server: McpServer, tenant: string): void {
  server.registerPrompt(
    "criar-conteudo",
    {
      title: "Criar conteúdo",
      description:
        "Cria conteúdo de Instagram (carrossel/post/anúncio) aplicando o DNA da empresa — voz, ICP, fase do funil. O próprio Claude gera, seguindo as mesmas regras do editor.",
      // Args do prompt SÃO strings na UI do host (campos de texto): campo vazio chega
      // como "". Por isso aceitamos string livre e normalizamos por dentro — usar
      // z.enum aqui quebra com "" ("Failed to attach prompt").
      argsSchema: {
        brief: z.string().optional().describe("sobre o que é o conteúdo"),
        tipo: z.string().optional().describe("carrossel | post | anuncio (default: carrossel)"),
        fase: z.string().optional().describe("descoberta | relacionamento | prontidao (default: descoberta)"),
        produto: z.string().optional().describe("id do produto em destaque (anúncio/prontidão)"),
        template: z.string().optional().describe("editorial | bold | narrativa (default: editorial)"),
      },
    },
    async ({ brief, tipo, fase, produto, template }) => {
      const pick = <T extends string>(v: string | undefined, allowed: readonly T[], def: T): T => {
        const x = (v ?? "").trim().toLowerCase();
        return (allowed as readonly string[]).includes(x) ? (x as T) : def;
      };
      const contentType = pick(tipo, ["carrossel", "post", "anuncio"] as const, "carrossel");
      const funnelPhase = pick(fase, ["descoberta", "relacionamento", "prontidao"] as const, "descoberta");
      const templateId = pick(template, ["editorial", "bold", "narrativa"] as const, "editorial");
      const produtoId = (produto ?? "").trim() || undefined;

      let dnaPrompt: string;
      try {
        dnaPrompt = await buildSystemPrompt(tenantDnaReader(tenant), {
          funnelPhase,
          contentType,
          template: templateId,
          productId: produtoId,
        });
      } catch {
        return {
          messages: [
            {
              role: "user" as const,
              content: {
                type: "text" as const,
                text:
                  "Não consegui carregar o DNA da empresa (faltam pelo menos `dna/empresa/VOZ.md` e " +
                  "`dna/empresa/DESIGN.md`, e a skill da fase em `dna/skills/`). Peça ao cliente para " +
                  "completar o DNA no Nextcloud antes de criar conteúdo.",
              },
            },
          ],
        };
      }

      const instrucao =
        `Crie um ${contentType} para a fase de ${funnelPhase} do funil` +
        (brief ? `, sobre: ${brief}.` : ".") +
        " Siga RIGOROSAMENTE as regras da empresa abaixo (voz, ICP, fase, identidade visual). " +
        (contentType === "carrossel"
          ? "Entregue de 2 a 10 slides (capa, conteúdo, fechamento) e a legenda. "
          : contentType === "anuncio"
            ? "Entregue 3 headlines (até 70 caracteres cada) e o corpo do anúncio. "
            : "Entregue headline, subheadline, corpo e a legenda. ") +
        "Não invente dados — use o DNA. Mostre o resultado de forma clara para aprovação.";

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `${instrucao}\n\n--- REGRAS DA EMPRESA (DNA) ---\n${dnaPrompt}`,
            },
          },
        ],
      };
    },
  );
}
