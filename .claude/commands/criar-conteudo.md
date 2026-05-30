---
name: criar-conteudo
description: Cria um conteúdo de Instagram completo (carrossel/post/anúncio) usando a mesma rota que o navegador usa — aplica DNA + ICP + voz + densidade + DNA do produto, salva em disco e linka uma thread.
---

# /criar-conteudo

Cria um conteúdo de Instagram **completo** no Criador de Conteúdo Visual, com a **mesma qualidade do fluxo do navegador**. Você (Claude) orquestra três chamadas à API local do app pra:

1. Gerar o conteúdo via `gpt-5.4-nano` com o system prompt completo (DNA empresa + posicionamento + ICP + voz Infosaas/FLG calibrada + densidade Instagram + ban de meta-linguagem + padrões de naturalidade + DNA do produto se houver).
2. Salvar em disco com `content.json` + `caption.md`.
3. Criar uma thread linkada (aparece em **Suas criações** na sidebar).

## Quando o usuário invocar este comando

### 1. Identifique o que ele já passou na mensagem

Procure por:
- **Tipo**: carrossel, estatico/post, anuncio
- **Fase**: descoberta, relacionamento, prontidão
- **Voz**: infosaas (institucional) ou flg (Rafael, pessoal)
- **Produto** (opcional, só faz sentido em anúncio ou prontidão): consultoria, enterprise, mvp, suporte
- **Brief**: o tema/pauta — pode vir como frase corrida, com ou sem o token `--`

### 2. Pergunte só o que faltar (via AskUserQuestion)

**Brief é OBRIGATÓRIO** — se não veio, peça em texto. Os demais têm default:
- Tipo default: `carrossel`
- Fase default: `descoberta`
- Voz default: `infosaas`
- Produto default: nenhum

**Não pergunte tudo em sequência se o usuário já passou.** Só pergunte o que ficou ambíguo ou faltando.

### 3. Pré-condições

- O dev server precisa estar rodando em `http://localhost:3000`. Se não estiver, avise e pare.
- A `OPENAI_API_KEY` precisa estar no `.env.local` (a rota retorna 503 se não).

### 4. Mapeamentos

- Tipo `post`/`estatico` no input do usuário → `contentType: 'post'` na API (compatibilidade com schema).
- Tipo `anuncio` → `contentType: 'anuncio'`.
- Tipo `carrossel` → `contentType: 'carrossel'`.
- Fase `prontidao` (sem til) → `funnelPhase: 'prontidao'`.
- Voz `flg` → `author: 'flg'`; `infosaas` → `author: 'infosaas'`.
- Produto `consultoria` → `productId: 'produto-consultoria'` (e análogos: `produto-enterprise`, `produto-mvp`, `produto-suporte`).
- Template (base) default: `editorial`. Para fase `prontidao`, use `bold`. Para `relacionamento`, mantém `editorial`.

### 5. Orquestração (3 chamadas)

Use o Bash tool com um pequeno script node `.mjs`:

```js
const base = 'http://localhost:3000'

// 1) Generate (mesma rota e prompt do navegador)
const gen = await (await fetch(base + '/api/generate', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mode: 'generate',
    contentType,    // 'carrossel' | 'post' | 'anuncio'
    funnelPhase,    // 'descoberta' | 'relacionamento' | 'prontidao'
    templateId,     // 'editorial' | 'bold' | 'narrativa'
    author,         // 'infosaas' | 'flg'
    productId,      // 'produto-<x>' | undefined
    brief,          // string com o tema
  }),
})).json()
if (!gen.content) { /* falha, mostre gen.reply */ }

// 2) Save (mesma rota do autosave do editor)
const { slug } = await (await fetch(base + '/api/content/save', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content: gen.content, caption: gen.caption ?? '' }),
})).json()

// 3) Thread + link (entra em "Suas criações")
const formatForThread = contentType === 'post' ? 'estatico' : contentType
const { id: threadId } = await (await fetch(base + '/api/threads', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    brief,
    platform: 'instagram',
    format: formatForThread,
    communication: funnelPhase,
    author,
    product: productId,
  }),
})).json()
await fetch(base + '/api/threads/' + threadId, {
  method: 'PATCH', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ slug }),
})

console.log('slug:', slug)
console.log('thread:', threadId)
console.log('URL: ' + base + '/editor?slug=' + slug)
```

Salve no `/tmp/<algo>.mjs`, rode com `node`, e capture o slug + URL.

### 6. Devolva pro usuário

- Confirme em uma frase o que foi criado (tipo, fase, voz, produto se houver).
- Mostre o URL `/editor?slug=...` clicável.
- Liste em 2–3 bullets curtos o que pode ajustar a seguir (ex.: "Recarregue se o editor já estiver aberto", "Adicione imagens via Layout").
- **Não cole o conteúdo gerado** na resposta — o usuário abre no navegador pra ver.

### 7. Se algo falhar

- Generate retornou 503 → "OPENAI_API_KEY não está configurada no `.env.local`".
- Generate retornou 502 → "Falha no gpt-5.4-nano, tente de novo daqui a pouco".
- Save falhou → mostre o erro retornado.
- Thread falhou → o conteúdo já está salvo; me reporte e linko manualmente.

## Exemplos de uso

- `/criar-conteudo` — interativo, pergunta o brief e usa defaults.
- `/criar-conteudo brief="a armadilha de automatizar processos sem ter processos"` — usa defaults pro resto.
- `/criar-conteudo carrossel descoberta flg -- como times de TI ficam reféns de processos não escritos`
- `/criar-conteudo anuncio prontidao infosaas produto=consultoria -- oferta de consultoria pra escalar operação`

## Quando NÃO usar este comando

- Se o usuário só quer **um esqueleto vazio** pra preencher manualmente → não invoque este comando, escreva `content.json` direto no disco com campos vazios (mais rápido, sem custo de IA).
- Se o usuário pediu pra editar um conteúdo existente → use o agente Canvas (chat do editor), não recrie.
