import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ContentSchema, contentRelDir, generateSlug, CONTENT_TYPE_DIRS, type Content } from "@infosaas/content";
import { getStorage } from "../storage/index.js";
import { audit } from "../audit.js";

type Result = { content: { type: "text"; text: string }[]; isError?: boolean; structuredContent?: Record<string, unknown> };
const ok = (text: string, structuredContent?: Record<string, unknown>): Result => ({ content: [{ type: "text", text }], structuredContent });
const fail = (text: string): Result => ({ content: [{ type: "text", text }], isError: true });

// Raiz da zona do AGENTE no OS do tenant. O editor lê desta mesma raiz (output/),
// então o que o chat grava aqui aparece no editor — é o que liga "abrir no editor".
const OUTPUT_ROOT = "output";

/**
 * Tools de conteúdo (chat-native). O LLM do HOST gera o Content (tier grátis,
 * seguindo o prompt `criar-conteudo` com o DNA); estas tools só PERSISTEM e LISTAM —
 * nada de chamar OpenAI no servidor. Imagem/vídeo/publicação (BYOK) entram à parte.
 */
export function registerContentTools(server: McpServer, tenant: string): void {
  const fs = getStorage(tenant);

  server.registerTool(
    "criar_conteudo",
    {
      title: "Salvar conteúdo criado",
      description:
        "Valida e salva no OS do cliente o conteúdo que você acabou de criar (carrossel/post/anúncio), " +
        "aplicando o DNA. Passe `conteudo` no formato do Content e, opcionalmente, a `legenda`. " +
        "Use depois de gerar seguindo o DNA (prompt criar-conteudo). O arquivo aparece no Drive do " +
        "cliente e fica editável no editor.",
      inputSchema: {
        conteudo: z
          .record(z.string(), z.any())
          .describe(
            "o Content JSON: content_type ('carrossel'|'estatico'|'anuncio'…), topic, funnel_phase " +
              "('descoberta'|'relacionamento'|'prontidao'), template_id ('editorial'|'bold'|'narrativa'), " +
              "format {width,height}, e slides[] (carrossel) ou headlines[3]+body (anúncio) ou headline/body (estático)",
          ),
        legenda: z.string().optional().describe("legenda (caption) do post, em markdown"),
      },
    },
    async ({ conteudo, legenda }) => {
      const parsed = ContentSchema.safeParse(conteudo);
      if (!parsed.success) {
        const issues = parsed.error.issues
          .slice(0, 8)
          .map((i) => `- ${i.path.join(".") || "(raiz)"}: ${i.message}`)
          .join("\n");
        audit(tenant, "criar_conteudo", { ok: false, erros: parsed.error.issues.length });
        return fail(`O conteúdo não passou na validação. Corrija estes pontos e chame de novo:\n${issues}`);
      }
      const content = parsed.data as Content;
      const slug = generateSlug(content.topic);
      const dir = `${OUTPUT_ROOT}/${contentRelDir(content.content_type, slug)}`;
      await fs.write(`${dir}/content.json`, JSON.stringify(content, null, 2));
      if (legenda != null) await fs.write(`${dir}/caption.md`, legenda);
      audit(tenant, "criar_conteudo", { ok: true, slug, content_type: content.content_type });
      return ok(
        `✅ Conteúdo salvo: ${dir}/content.json (slug: ${slug}). Já aparece no Drive do cliente e pode ser aberto no editor.`,
        { slug, dir, content_type: content.content_type },
      );
    },
  );

  server.registerTool(
    "listar_criacoes",
    {
      title: "Listar criações",
      description: "Lista os conteúdos já criados no OS do cliente (em output/), do mais recente ao mais antigo.",
      inputSchema: {},
    },
    async () => {
      const rows: { slug: string; content_type: string; topic: string; created_at: string; status: string }[] = [];
      for (const typeDir of CONTENT_TYPE_DIRS) {
        let entries;
        try {
          entries = await fs.list(`${OUTPUT_ROOT}/instagram/${typeDir}`);
        } catch {
          continue;
        }
        for (const e of entries) {
          if (e.type !== "dir") continue;
          try {
            const raw = await fs.read(`${OUTPUT_ROOT}/instagram/${typeDir}/${e.name}/content.json`);
            const c = JSON.parse(raw) as Content;
            rows.push({
              slug: e.name,
              content_type: c.content_type,
              topic: c.topic,
              created_at: c.created_at,
              status: c.publish_status ?? "draft",
            });
          } catch {
            // sem content.json válido — ignora
          }
        }
      }
      audit(tenant, "listar_criacoes", { n: rows.length });
      if (!rows.length) return ok("Nenhuma criação ainda em output/.");
      rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
      const txt = rows
        .map((r) => `• ${r.topic}  —  ${r.content_type} · ${r.status}  ·  slug: ${r.slug}`)
        .join("\n");
      return ok(txt, { criacoes: rows });
    },
  );

  server.registerTool(
    "obter_criacao",
    {
      title: "Obter uma criação",
      description: "Lê uma criação salva (content.json + legenda) pelo slug, para revisar ou continuar editando.",
      inputSchema: { slug: z.string().min(1).describe("slug da criação (ver listar_criacoes)") },
    },
    async ({ slug }) => {
      for (const typeDir of CONTENT_TYPE_DIRS) {
        const dir = `${OUTPUT_ROOT}/instagram/${typeDir}/${slug}`;
        if (!(await fs.exists(`${dir}/content.json`))) continue;
        const raw = await fs.read(`${dir}/content.json`);
        const caption = await fs.read(`${dir}/caption.md`).catch(() => "");
        audit(tenant, "obter_criacao", { slug, content_type: typeDir });
        const legendaTxt = caption ? `\n\n--- LEGENDA ---\n${caption}` : "";
        return ok(`${raw}${legendaTxt}`, { slug, content: JSON.parse(raw), caption });
      }
      return fail(`Criação não encontrada: ${slug}`);
    },
  );
}
