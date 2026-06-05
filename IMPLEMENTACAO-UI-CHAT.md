# Implementação — UI no Chat (preview do conteúdo dentro do Claude/ChatGPT)

> Como levar o **preview do conteúdo para dentro da conversa** — o cliente vê o carrossel/
> anúncio/Reel renderizado **no próprio chat**, sem abrir o editor — e como tornar isso um
> **padrão reutilizável para qualquer tool** do OS (painéis, formulários, dashboards).
>
> Base técnica: **MCP Apps** (padrão aberto lançado em 26/jan/2026 por Anthropic + OpenAI, em cima
> do MCP-UI e do Apps SDK). A MESMA UI roda em **Claude, ChatGPT, Goose, VS Code, Postman** sem
> reescrever — porque o backend é o teu MCP.
>
> **Encaixe na arquitetura:** esta é a materialização do lever do [`IMPLEMENTACAO-OS.md`](IMPLEMENTACAO-OS.md)
> ("maximize o que vive no MCP, minimize o per-client"). O preview vira **artefato do control
> plane** — central, versionado, atualiza grátis pra toda a frota.
>
> **Status:** arquitetura/proposta. Depende do MCP (Fase 2 em diante) e do criador deployado.
> **Sugestão de roadmap:** "Fase 5 — UI no chat", depois do deploy do criador. **Criado:** 2026-06-03.

---

## 1. Objetivo e princípios

### O problema
Hoje o conteúdo gerado só é **visto** abrindo o editor do app (`criador-conteudo-visual`). No fluxo
de chat (o cliente conversando com o Claude via conector MCP), a tool `criar_conteudo` devolve só
**texto** ("Conteúdo criado: output/conteudo/..."). O cliente não *vê* o que foi feito — precisa
sair do chat, abrir o app, achar o arquivo. Isso quebra a tese de **fricção zero** do OS.

### A solução
A tool passa a devolver, junto do resultado, uma **UI renderizada inline na conversa**: o carrossel
aparece desenhado, navegável, com botões ("aprovar", "publicar", "ajustar"). Sem abrir o editor.

E mais: isso **não é um hack pro preview** — é uma **camada genérica de UI** do OS. Qualquer tool
futura (relatório, painel de frota, aprovação) declara sua própria *view* e ganha UI no chat de
graça.

### Princípios de design
- **A UI é função pura do dado.** O preview já é `Content → RichSpec → canvas` (ver §2). Nada de
  estado escondido no editor. Isso é o que torna o preview portável pro chat.
- **Renderer compartilhado, fonte única de verdade.** O mesmo código desenha no editor do app **e**
  no chat. Nunca dois renderers divergindo.
- **UI vive no control plane (MCP).** Leve, central, versionada → update grátis pra frota. O pesado
  (render de vídeo, Chromium) continua no data plane per-client.
- **Cross-host por padrão.** Escreve uma view, roda em Claude e ChatGPT (padrão MCP Apps). Nunca
  acoplar a um host específico.
- **Segurança herdada do MCP.** Iframe sandboxed; toda ação volta como **tool call** auditada e
  confirmada — mesma disciplina do [`tools/files.ts`](ferramentas/mcps/server/src/tools/files.ts).

---

## 2. O que JÁ existe — a fundação (não precisa inventar)

O preview do criador **já é uma função pura de dados**. Essa é a descoberta que viabiliza tudo:

```
Content (JSON)  ──compose──▶  RichSpec  ──render──▶  canvas (pixels)
```

| Etapa | Arquivo | O que faz |
|---|---|---|
| **Dado** | [content.schema.ts](ferramentas/apps/criador-conteudo-visual/lib/schemas/content.schema.ts) | `ContentSchema` (união: `carrossel`/`anuncio`/`estatico`/`video`…). É o JSON que a tool já gera. |
| **Compose** | [compose.ts](ferramentas/apps/criador-conteudo-visual/lib/renderer/compose.ts) | `composeFrame(content, index, slug, activeHeadline) → RichSpec`. **Pura.** Calcula layout, tipografia, marca, área segura. |
| **Render** | [FrameCanvas.tsx](ferramentas/apps/criador-conteudo-visual/components/editor/FrameCanvas.tsx) | Desenha o `RichSpec` com React + Konva (canvas). |

**Consequência:** pra ter preview no chat, **não reescrevemos o renderer** — reaproveitamos
`composeFrame` + um renderer de `RichSpec`. O editor não é pré-requisito; o dado é.

### Pegadinhas reais dessa fundação (herdadas, precisam de tratamento)
1. **`compose.ts` usa o browser.** `measureCtx()` cria um `<canvas>` e usa `document` pra medir
   texto (linhas reais da fonte). → Roda **no iframe** (que é um browser); **não** roda no Node do
   MCP. Isso empurra o render pro **lado do cliente (iframe)**, não pro servidor. (No Degrau 1,
   onde geramos PNG no servidor, isso muda — ver §7.)
2. **URLs de asset são relativas ao app.** `assetUrl()` devolve `/api/assets/<slug>/<ref>` para
   imagens não-http. No chat o iframe **não** está no domínio do app → esses caminhos quebram. →
   No chat, **toda imagem precisa virar URL absoluta** (R2, ou servida pelo MCP). Carrosséis sem
   imagem (só texto+marca) funcionam sem isso.
3. **Vídeo não passa pelo Konva.** `frameOf()` retorna fallback inerte pra `content_type: 'video'`
   — o Reel tem editor próprio e é um MP4. → Preview de vídeo no chat = **player do MP4 renderizado**
   (`rendered_ref` no R2), não canvas. Caso à parte (§8).
4. **Fontes.** `FrameCanvas` espera `waitForFonts()` (Sora etc.). O bundle do iframe precisa
   **embutir/carregar as fontes da marca** ou o layout mede errado.

---

## 3. Modelo mental — o preview é artefato do CONTROL PLANE

Hoje o renderer mora **dentro do app** (data plane, **uma instância por cliente**). A virada de
chave é **extrair `Content→RichSpec→render` para um pacote compartilhado** e **servi-lo pelo MCP**.

```
ANTES                                  DEPOIS
┌─ app criador (per-client) ─┐         ┌─ pacote @infosaas/renderer (central) ─┐
│ schema + compose + canvas  │         │ schema + compose + canvas (1 fonte)   │
│ (cada cliente tem o seu)   │         └───────────┬───────────────┬───────────┘
└────────────────────────────┘                     │ usa            │ serve bundle
                                       ┌────────────▼──────┐  ┌──────▼───────────────┐
                                       │ app criador        │  │ MCP (control plane)  │
                                       │ (editor) — import  │  │ ui:// resource → chat│
                                       └────────────────────┘  └──────────────────────┘
```

**Por que isso é a tua arquitetura, não contra ela:**

| Ganho | Como |
|---|---|
| **Update grátis pra frota** | O preview é leve e central (MCP). Melhorou o canvas? Deploy único, todos veem. Sem gestão de frota. |
| **Fonte única de verdade** | Editor do app **e** chat usam o MESMO renderer. Hoje divergiriam. |
| **Pesado continua isolado** | Render de vídeo, Chromium, ffmpeg ficam no app per-client. Só a *visualização* sobe. |
| **Lever de design respeitado** | [`IMPLEMENTACAO-OS.md:53`](IMPLEMENTACAO-OS.md): maximizar o que vive no MCP. |

> **Decisão central:** o renderer deixa de ser código do app e vira **pacote compartilhado**,
> consumido pelo app (editor) e servido pelo MCP (chat). O app **importa**; o MCP **serve o bundle**.

---

## 4. O padrão genérico de "views" (o que torna replicável)

Em vez de "preview de conteúdo", o MCP ganha um **registro de views**. Cada view é uma UI
auto-contida (HTML+JS num iframe). Cada tool aponta para a view que renderiza o resultado dela.

```
ui://infosaas/preview-conteudo   ← carrossel / anúncio / estático (a primeira)
ui://infosaas/preview-video      ← player do Reel renderizado
ui://infosaas/aprovar-conteudo   ← preview + botões (aprovar / publicar / ajustar)
ui://infosaas/painel-os          ← dashboard do OS do cliente
ui://infosaas/painel-frota       ← status das instâncias (uso interno)
```

No [`server.ts`](ferramentas/mcps/server/src/server.ts), isso é **um registro a mais**, ao lado dos
existentes:

```ts
// src/server.ts — depois (conceitual)
await registerBrainResources(server, tenantId);
registerSearchTool(server, tenantId);
registerFileTools(server, tenantId);
registerUiViews(server);              // ⭐ novo: registra os ui:// resources (bundles)
```

E cada tool **anexa um `_meta`** apontando pra view + devolve o **dado estruturado**:

```ts
// a tool criar_conteudo passa a devolver dado + view (conceitual)
return {
  content: [{ type: "text", text: `Carrossel "${data.topic}" pronto.` }], // fallback textual
  structuredContent: data,                                  // o Content JSON (o iframe consome)
  _meta: {
    // padrão MCP Apps / Apps SDK — aponta a UI que renderiza este resultado
    "openai/outputTemplate": "ui://infosaas/preview-conteudo",
    "mcp/ui": "ui://infosaas/preview-conteudo",
  },
};
```

> **"Adicionar UI a uma tool nova" = escrever uma view + apontar o `_meta`.** É esse o "replicar
> pra qualquer ferramenta" pedido. O registro de views é a fábrica; cada view é um molde.

### Anatomia de uma view
Uma view é registrada como **resource** do tipo HTML (mime `text/html`), servida pelo MCP:

```ts
// src/ui/registry.ts — conceitual
export function registerUiViews(server: McpServer): void {
  server.registerResource(
    "preview-conteudo",
    "ui://infosaas/preview-conteudo",
    { title: "Preview de conteúdo", mimeType: "text/html" },
    async () => ({
      contents: [{
        uri: "ui://infosaas/preview-conteudo",
        mimeType: "text/html",
        text: PREVIEW_CONTEUDO_HTML,   // shell HTML que carrega o bundle do renderer
      }],
    })
  );
  // ... demais views
}
```

O HTML é um **shell mínimo** que: (a) carrega o bundle `@infosaas/renderer`, (b) lê o
`structuredContent` pela bridge do host, (c) chama `composeFrame` + desenha, (d) expõe botões que
chamam tools de volta.

---

## 5. Como o host renderiza (o padrão MCP Apps por baixo)

Fluxo de uma chamada com UI, fim a fim:

```
1. cliente no chat: "cria um carrossel sobre onboarding"
2. host (Claude/ChatGPT) chama a tool criar_conteudo no teu MCP
3. MCP gera o Content (via app) e devolve: { structuredContent: Content, _meta: {...ui://preview-conteudo} }
4. host lê o _meta → busca o resource ui://infosaas/preview-conteudo (HTML) no teu MCP
5. host renderiza esse HTML num IFRAME SANDBOXED inline no chat
6. host entrega o structuredContent ao iframe pela bridge (postMessage / window.openai)
7. iframe: composeFrame(content, i) → desenha o carrossel no canvas → cliente VÊ
8. cliente clica "Publicar" no iframe → bridge dispara tool call publicar_instagram → MCP executa
```

**Pontos do padrão (jan/2026):**
- UI roda em **iframe sandboxed** com permissões restritas.
- Comunicação iframe↔host por **JSON-RPC sobre `postMessage`** (`ui/*`), **auditável**.
- **Toda ação exige aprovação explícita** do usuário — casa com a disciplina de confirmação que
  você já usa em [`files.ts`](ferramentas/mcps/server/src/tools/files.ts) (sobrescrever/apagar).
- **Mesmo resource, vários hosts:** Claude, ChatGPT, Goose, VS Code, Postman renderizam a mesma
  view sem mudança de código.

> ⚠️ A API exata (nomes de `_meta`, formato do bundle, mime `text/html+skybridge` vs `text/html`)
> evolui. Confirmar na doc da versão instalada do SDK do MCP / Apps SDK antes de colar — mesma
> ressalva que já está no [`IMPLEMENTACAO-MCP.md`](IMPLEMENTACAO-MCP.md).

---

## 6. Arquitetura técnica — o pacote `@infosaas/renderer`

### Extração (o trabalho de base do Degrau 2)
Mover do app para um pacote compartilhado do monorepo:

```
ferramentas/packages/renderer/          ← NOVO pacote compartilhado
├── package.json                        (name: @infosaas/renderer)
├── src/
│   ├── schemas/        ← move de criador/lib/schemas (content, slide, layout, branding…)
│   ├── compose.ts      ← move de criador/lib/renderer/compose.ts (puro)
│   ├── templates/      ← move de criador/lib/templates
│   ├── render-canvas.ts← renderer de RichSpec p/ <canvas> (vanilla, SEM React/Konva)
│   └── index.ts
└── dist/
    └── preview.iife.js ← BUNDLE único pro iframe (esbuild)
```

**Quem passa a consumir:**
- **App criador (editor):** troca os imports locais por `@infosaas/renderer`. `FrameCanvas` (Konva)
  pode continuar — ou migrar pro `render-canvas` vanilla pra ter 1 renderer só (decisão em aberto).
- **MCP:** importa o pacote só para **servir `dist/preview.iife.js`** dentro do shell HTML da view.

> **Por que um renderer vanilla (canvas puro) no `render-canvas.ts`?** Konva+React é pesado pra um
> iframe de chat. Um renderer vanilla que consome o mesmo `RichSpec` deixa o bundle pequeno e sem
> dependência de framework. `RichSpec` já é o "contrato" — desenhar é mecânico (ver `FrameCanvas`
> como referência 1:1).

### Resolver as pegadinhas da §2 no pacote
| Pegadinha | Tratamento no pacote |
|---|---|
| `compose` usa `document`/canvas | OK no iframe (é browser). Manter. |
| `assetUrl` relativo | Parametrizar: `composeFrame(content, i, { assetBase })` → no chat, `assetBase` = URL absoluta do R2/MCP. |
| Fontes da marca | Bundle embute `@font-face` (Sora/Gotham) como base64 ou aponta CDN próprio; `waitForFonts()` antes de medir. |
| Vídeo | View separada (`preview-video`) com `<video src={rendered_ref}>`; não usa canvas. |

### Onde o asset vive (imagens do carrossel)
- Carrossel **só texto+marca**: renderiza sem asset externo. **Funciona já.**
- Carrossel **com imagem**: a imagem precisa estar em **URL absoluta**. Como o app já publica via
  **R2** ([`lib/publish/r2.ts`](ferramentas/apps/criador-conteudo-visual/lib/publish/r2.ts)), o
  caminho natural é: ao gerar, subir os assets pro R2 e gravar a URL absoluta no `Content`. Aí o
  preview no chat consome direto do R2.

---

## 7. Implementação faseada (2 degraus)

### Degrau 1 — Preview ESTÁTICO (PNG), funciona em qualquer LLM HOJE
**Sem MCP Apps, sem iframe.** A tool devolve **imagens** renderizadas. Todo host MCP exibe `content`
do tipo imagem inline.

```ts
// criar_conteudo (conceitual) — Degrau 1
const pngs = await renderFramesToPng(content);   // 1 PNG por slide
return {
  content: [
    { type: "text", text: `Carrossel "${content.topic}" — ${pngs.length} slides:` },
    ...pngs.map((b64) => ({ type: "image", data: b64, mimeType: "image/png" })),
  ],
};
```

**Como gerar o PNG:** o app já exporta frames ([`FrameExporter.tsx`](ferramentas/apps/criador-conteudo-visual/components/editor/FrameExporter.tsx)).
Duas opções:
- **(a) reusar o app:** rota `/api/preview` que recebe `Content` e devolve PNGs (Chromium headless
  já está no container do criador pro Remotion). O MCP chama por `localhost`.
- **(b) no MCP:** render server-side via `node-canvas` + `render-canvas.ts`. Mais leve, mas
  `compose.ts` usa `document` → precisa shim de canvas no Node. (a) é o caminho mais curto.

| Prós | Contras |
|---|---|
| Funciona **esta semana**, em **todos** os hosts (não exige MCP Apps) | É **imagem** — sem clicar, navegar slide ou aprovar inline |
| Reusa export que já existe | Render no servidor (custo de Chromium por chamada na opção a) |
| Valida a sensação "vi meu conteúdo no chat" | Não é o ativo estratégico (não replica como camada) |

**Meta do Degrau 1:** provar valor rápido. Carrossel sem imagem externa já fecha o ciclo.

### Degrau 2 — Preview INTERATIVO (iframe / MCP Apps) — o ativo estratégico
O iframe com o renderer real (§4–§6). Cliente navega slides, troca o headline ativo do anúncio,
aprova e publica — **sem abrir o editor**.

**Entregáveis:**
1. Pacote `@infosaas/renderer` extraído + bundle `preview.iife.js` (esbuild).
2. `registerUiViews(server)` no MCP + shell HTML das views.
3. Bridge: ler `structuredContent`, desenhar, e mapear botões → tool calls.
4. `criar_conteudo` devolve `structuredContent` + `_meta` (view).
5. Assets em URL absoluta (R2) no `Content`.

| Prós | Contras |
|---|---|
| **Interativo**: navega, aprova, publica inline | Mais trabalho (extração + bundle + bridge) |
| **Replicável**: vira a camada de UI de todo o OS | Depende do padrão MCP Apps no host (Claude/ChatGPT ✅) |
| **Central/versionado**: update grátis pra frota | Atenção a versão do SDK (API evoluindo) |
| Renderer = fonte única (editor + chat) | — |

**Ordem recomendada:** Degrau 1 **agora** (valida), Degrau 2 como a **Fase 5 do OS** (constrói o
ativo). Não pular o 1 — ele desmente/valida a hipótese antes do investimento do 2.

---

## 8. Vídeo / Reel — o caso especial

Vídeo **não** é canvas. O preview no chat é o **MP4 final** (`video.rendered_ref`), não um desenho.

- View dedicada `ui://infosaas/preview-video` com `<video controls src={rendered_ref}>`.
- O `rendered_ref` é o MP4 com marca/legenda **já no R2** (ver
  [`project_pipeline_video`] — pipeline corte → Remotion → R2).
- **Degrau 1 (estático) pra vídeo:** devolver o **thumbnail/poster** + link, já que o MP4 inline
  depende do host suportar `<video>` no iframe. Player completo = Degrau 2.
- O render pesado continua **per-client** (Chromium+ffmpeg). O chat só **exibe** o resultado já
  pronto no R2. Coerente com control plane (exibe) × data plane (produz).

---

## 9. Cross-host — uma view, vários chats

O padrão MCP Apps faz a mesma view rodar em múltiplos hosts. O que muda por host é só a **bridge**
(como o iframe recebe o dado e dispara ações):

| Host | Suporte | Bridge |
|---|---|---|
| **Claude** (Desktop/web) | ✅ MCP Apps (jan/2026) | `ui/*` JSON-RPC sobre postMessage |
| **ChatGPT** | ✅ Apps SDK | `window.openai` + postMessage |
| **Goose, VS Code (Copilot), Postman** | ✅ | MCP Apps |

> Encapsular a bridge num módulo `bridge.ts` do bundle (detecta o host, normaliza `getData()` e
> `callTool()`). A view chama a abstração, não o host. Assim "escreve uma vez, roda em todos".

---

## 10. Segurança

Herda tudo do MCP + camada do iframe:
- **Iframe sandboxed** com permissões mínimas (sem acesso ao DOM do host).
- **Toda ação = tool call** auditada ([`audit.ts`](ferramentas/mcps/server/src/audit.ts)) e
  **confirmada** pelo usuário — mesma regra de `escrever_arquivo`/`apagar_arquivo`.
- **`tenantId` sempre da auth**, nunca do iframe. O iframe manda *intenção*; o MCP resolve o tenant
  e valida (checklist da Fase 3 do [`IMPLEMENTACAO-MCP.md`](IMPLEMENTACAO-MCP.md)).
- **Sem código de cliente no bundle.** O renderer é teu, central, versionado. O iframe nunca
  executa nada vindo do Nextcloud.
- **Assets por URL assinada** (R2) quando privados; nada de path relativo vazando estrutura.

---

## 11. Decisões fechadas
- **A UI é função pura do dado** — reaproveita `Content → RichSpec → canvas` que já existe.
- **Renderer vira pacote compartilhado** (`@infosaas/renderer`), consumido pelo app e servido pelo
  MCP. Fonte única de verdade.
- **UI mora no control plane (MCP)**; o pesado (render de vídeo) continua per-client.
- **Padrão MCP Apps** (não solução proprietária de um host) → cross-host de graça.
- **Dois degraus:** PNG estático primeiro (valida), iframe interativo depois (ativo).
- **Vídeo = player do MP4 do R2**, não canvas.
- **Ações pela UI = tool calls auditadas e confirmadas.**

## 12. Decisões em aberto
1. **Renderer único vs dois:** migrar o editor do Konva pro `render-canvas` vanilla (1 renderer) ou
   manter Konva no app e vanilla no chat (2 caminhos do mesmo `RichSpec`)?
2. **Onde gera o PNG do Degrau 1:** rota no app (reusa Chromium) vs `node-canvas` no MCP.
3. **Assets:** subir tudo pro R2 na geração (URL absoluta sempre) vs só quando houver imagem.
4. **Fontes no bundle:** embutir base64 (bundle maior, zero dependência) vs CDN próprio.
5. **Quando construir:** Degrau 1 já na Fase 2; Degrau 2 como Fase 5 (depois do deploy do criador).

## 13. Roadmap
**Degrau 1 — preview estático (PNG)**
- [ ] Rota `/api/preview` no app (recebe `Content`, devolve PNGs) — ou render no MCP.
- [ ] `criar_conteudo` devolve `content` com `type: image`.
- [ ] Validar inline no Claude e no ChatGPT.

**Degrau 2 — preview interativo (MCP Apps)**
- [ ] Extrair `ferramentas/packages/renderer` (schemas + compose + templates + render-canvas).
- [ ] App criador passa a importar `@infosaas/renderer` (editor intacto).
- [ ] Bundle `preview.iife.js` (esbuild) + fontes da marca.
- [ ] `registerUiViews(server)` + shells HTML das views (preview-conteudo, preview-video).
- [ ] `bridge.ts` (Claude + ChatGPT) — `getData()` / `callTool()`.
- [ ] `criar_conteudo` devolve `structuredContent` + `_meta` (view).
- [ ] Assets em URL absoluta (R2) no `Content`.
- [ ] View `aprovar-conteudo` (preview + botões → tools de publicar/ajustar).

**Replicação (a camada vira produto)**
- [ ] `painel-os` / `painel-frota` como novas views — provar que "nova tool = nova view".

---

## Apêndice — relação com outros docs
- [`IMPLEMENTACAO-OS.md`](IMPLEMENTACAO-OS.md) — arquitetura geral (control plane × data plane ×
  frota). Esta UI é control-plane; o lever "maximizar o MCP" é a justificativa.
- [`IMPLEMENTACAO-MCP.md`](IMPLEMENTACAO-MCP.md) — o servidor MCP (onde as views se registram, ao
  lado de tools/resources/prompts; herda auth, tenancy e auditoria).
- Pipeline de vídeo (memória `project_pipeline_video`) — origem do `rendered_ref` (MP4 no R2) que a
  view de vídeo exibe.
