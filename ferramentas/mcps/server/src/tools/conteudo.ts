import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ContentSchema,
  contentRelDir,
  generateSlug,
  CONTENT_TYPE_DIRS,
  CommandSchema,
  makeCommand,
  applyCommands,
  summarizeCommands,
  type Command,
  type Content,
} from "@infosaas/content";
import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import type { Storage } from "../storage/index.js";
import { getStorage } from "../storage/index.js";
import { audit } from "../audit.js";
import { PREVIEW_CONTEUDO_URI } from "../ui/views.js";

type Result = { content: { type: "text"; text: string }[]; isError?: boolean; structuredContent?: Record<string, unknown> };
const ok = (text: string, structuredContent?: Record<string, unknown>): Result => ({ content: [{ type: "text", text }], structuredContent });
const fail = (text: string): Result => ({ content: [{ type: "text", text }], isError: true });

// Raiz da zona do AGENTE no OS do tenant. O editor lê desta mesma raiz (output/),
// então o que o chat grava aqui aparece no editor — é o que liga "abrir no editor".
const OUTPUT_ROOT = "output";

/** Localiza a pasta de uma criação pelo slug (varre os tipos). null se não achar. */
async function findContentDir(fs: Storage, slug: string): Promise<string | null> {
  for (const typeDir of CONTENT_TYPE_DIRS) {
    const dir = `${OUTPUT_ROOT}/instagram/${typeDir}/${slug}`;
    if (await fs.exists(`${dir}/content.json`)) return dir;
  }
  return null;
}

/**
 * Tools de conteúdo (chat-native). O LLM do HOST gera o Content (tier grátis,
 * seguindo o prompt `criar-conteudo` com o DNA); estas tools só PERSISTEM e LISTAM —
 * nada de chamar OpenAI no servidor. Imagem/vídeo/publicação (BYOK) entram à parte.
 */
export function registerContentTools(server: McpServer, tenant: string): void {
  const fs = getStorage(tenant);

  registerAppTool(
    server,
    "criar_conteudo",
    {
      title: "Salvar conteúdo criado",
      description:
        "Valida e salva no OS do cliente o conteúdo que você acabou de criar (carrossel/post/anúncio), " +
        "aplicando o DNA. Passe `conteudo` no formato do Content e, opcionalmente, a `legenda`. " +
        "Use depois de gerar seguindo o DNA (prompt criar-conteudo). O arquivo aparece no Drive do " +
        "cliente, mostra um preview visual no chat e fica editável no editor.",
      // Liga a tool à view de preview (MCP Apps p/ Claude; outputTemplate p/ ChatGPT).
      _meta: {
        ui: { resourceUri: PREVIEW_CONTEUDO_URI },
        "openai/outputTemplate": PREVIEW_CONTEUDO_URI,
      },
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
        // `content` alimenta o preview no chat (a view lê structuredContent.content).
        { slug, dir, content_type: content.content_type, content: content as unknown as Record<string, unknown> },
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
      const dir = await findContentDir(fs, slug);
      if (!dir) return fail(`Criação não encontrada: ${slug}`);
      const raw = await fs.read(`${dir}/content.json`);
      const caption = await fs.read(`${dir}/caption.md`).catch(() => "");
      audit(tenant, "obter_criacao", { slug });
      const legendaTxt = caption ? `\n\n--- LEGENDA ---\n${caption}` : "";
      return ok(`${raw}${legendaTxt}`, { slug, content: JSON.parse(raw), caption });
    },
  );

  server.registerTool(
    "editar_conteudo",
    {
      title: "Editar conteúdo (refino cirúrgico)",
      description:
        "Aplica edições PONTUAIS a uma criação salva, sem regerar tudo (igual ao editor). Passe o `slug` " +
        "e uma lista de `comandos`; cada comando tem um `kind` e os campos relevantes (slideIndex é 0-based):\n" +
        "- setText {slideIndex, field:'headline'|'subheadline'|'body'|'cta', text}\n" +
        "- hideField {slideIndex, field, hidden:boolean}\n" +
        "- setFieldStyle {slideIndex, field, fontSize?, lineHeight?, letterSpacing?, align?, marginTop?, marginBottom?, paddingX?}\n" +
        "- duplicateSlide {slideIndex} · removeSlide {slideIndex} · moveSlide {slideIndex, toIndex}\n" +
        "- setSlideType {slideIndex, slideType:'cover'|'content'|'closing'}\n" +
        "- setBase {baseId:'editorial'|'bold'|'narrativa'}\n" +
        "- setCaption {text}  (atualiza a legenda)\n" +
        "- setLogo {logoShow?, logoVariant?:'preto'|'branco'|'laranja', logoPosition?:'top-left'|'top-right'|'bottom-left'|'bottom-right'}\n" +
        "- setNumbering {numberingShow?, numberingStyle?:'fraction'|'index', numberingPosition?}\n" +
        "- setHandle {handleShow?, text}  (text = @handle)\n" +
        "- setMedia {slideIndex, mediaKind:'image'|'none', mediaRef?, mediaMode?:'cover'|'element', mediaPosition?, mediaRadius?}\n" +
        "- setMask {slideIndex, maskOpacity?, maskColor?, maskGradientOn?, maskTop?, maskMid?, maskBottom?}",
      inputSchema: {
        slug: z.string().min(1).describe("slug da criação (ver listar_criacoes)"),
        comandos: z
          .array(z.record(z.string(), z.any()))
          .min(1)
          .describe("lista de comandos a aplicar, cada um com `kind` + campos relevantes"),
      },
    },
    async ({ slug, comandos }) => {
      const dir = await findContentDir(fs, slug);
      if (!dir) return fail(`Criação não encontrada: ${slug}`);

      const current = ContentSchema.safeParse(JSON.parse(await fs.read(`${dir}/content.json`)));
      if (!current.success) return fail(`content.json inválido em ${slug}.`);

      const cmds: Command[] = [];
      const ignorados: string[] = [];
      for (const c of comandos) {
        const v = CommandSchema.safeParse(makeCommand(c as Partial<Command> & { kind: Command["kind"] }));
        if (v.success) cmds.push(v.data as Command);
        else ignorados.push(`${(c as { kind?: string }).kind ?? "?"} (${v.error.issues[0]?.message ?? "inválido"})`);
      }
      if (!cmds.length) return fail(`Nenhum comando válido. Ignorados: ${ignorados.join("; ")}`);

      const { content: next, caption } = applyCommands(current.data as Content, cmds);
      await fs.write(`${dir}/content.json`, JSON.stringify(next, null, 2));
      if (caption != null) await fs.write(`${dir}/caption.md`, caption);

      audit(tenant, "editar_conteudo", { slug, aplicados: cmds.length, ignorados: ignorados.length });
      const extra = ignorados.length ? `  (ignorados: ${ignorados.join("; ")})` : "";
      return ok(`✅ ${slug}: ${summarizeCommands(cmds)}${extra}`, { slug, aplicados: cmds.length });
    },
  );
}
