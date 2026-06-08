# @infosaas/content

Núcleo **compartilhado** do conteúdo do Infosaas OS. É a fonte única das regras que
precisam valer **igual no editor (app) e no chat (MCP)**.

Consumido por:
- **`ferramentas/apps/criador-conteudo-visual`** (editor) — passa um `DnaReader` backed por `fs`.
- **`ferramentas/mcps/server`** (chat-native) — passa um `DnaReader` backed pelo storage do tenant.

## Conteúdo (por fase de extração)

- **Stage 0 (atual):** montagem do **system prompt do DNA** — `loadDNAFiles`,
  `assembleSystemPrompt`, `buildSystemPrompt`, `DnaReader`. Sem dependência de runtime (zod-free).
- **Stage 1 (planejado):** `ContentSchema` + a árvore `schemas/*` (zod 4).
- **Stage 2 (planejado):** `commands.ts` (os 16 comandos determinísticos) + templates.

## Contrato `DnaReader`

A leitura do DNA é **injetada** — o pacote não conhece `fs` nem WebDAV. Quem consome fornece:

```ts
interface DnaReader {
  readDnaFile(relativePath: string): Promise<string>   // rejeita se não existir
  listDnaMarkdown(relativeDir: string): Promise<string[]>
  readSkillFile(filename: string): Promise<string>     // rejeita se não existir
}
```

## Build

```bash
npm install
npm run build   # tsc → dist/ (ESM + d.ts)
```

Consumido via dependência `file:` (sem workspace): os consumidores apontam
`"@infosaas/content": "file:../../packages/content"` e usam o `dist/` compilado.
