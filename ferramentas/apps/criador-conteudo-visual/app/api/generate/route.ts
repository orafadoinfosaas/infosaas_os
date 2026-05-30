import { NextRequest, NextResponse } from 'next/server'
import { generateObject, generateText, tool, stepCountIs } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { buildSystemPrompt } from '@/lib/dna/loader'
import { creativeSchemaFor, assembleContent } from '@/lib/chat/creative-schema'
import { ContentSchema, type Content } from '@/lib/schemas/content.schema'
import { applyCommands, makeCommand, summarizeCommands, type Command } from '@/lib/chat/commands'
import { generateAndSaveImage } from '@/lib/images/generate'
import type { ContentType, FunnelPhase, TemplateId } from '@/lib/chat/flow-state'

type Body = {
  mode: 'generate' | 'refine'
  contentType: ContentType
  funnelPhase: FunnelPhase
  templateId: TemplateId
  productId?: string
  author?: string
  brief?: string
  userMessage?: string
  history?: { role: 'user' | 'assistant'; content: string }[]
  currentContent?: Content | null
  slug?: string // necessário p/ salvar imagens geradas via tool generateImage
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'IA não configurada. Defina OPENAI_API_KEY no .env.local.' },
      { status: 503 }
    )
  }

  const body = (await req.json()) as Body
  const contentType = body.contentType ?? 'carrossel'
  const funnelPhase = body.funnelPhase ?? 'descoberta'
  const templateId = body.templateId ?? 'editorial'
  // produto e autor: do body ou preservados do conteúdo atual (refino)
  const productId = body.productId ?? body.currentContent?.product_id
  const author = body.author ?? body.currentContent?.author ?? 'infosaas'

  const baseSystem = await buildSystemPrompt({ funnelPhase, contentType, template: templateId, productId })

  // Quem fala: voz institucional (Infosaas) ou pessoal (Rafael / FLG).
  const speakerSection =
    author === 'flg'
      ? `\n\n## Identidade do autor (voz) — FLG (Rafael Almeida)
Você É **Rafael Almeida**, sócio-fundador da Infosaas, escrevendo no SEU perfil pessoal (FLG). É a SUA voz, SUA visão, SUA opinião — você está conversando em primeira pessoa com quem te lê. Não é um copywriter falando sobre o tema: é VOCÊ, com nome e cara, dando sua leitura.

Regras OBRIGATÓRIAS para HEADLINES E BODIES (vale pros dois):
- Use 1ª pessoa EXPLÍCITA na MAIORIA das headlines E na MAIORIA dos parágrafos de corpo: "eu", "meu", "minha", "pra mim", "comigo", "vi", "tenho visto", "venho observando", "acredito", "penso", "na minha leitura", "no meu dia a dia", "já passei por isso", "quando eu…".
- Headline OU parágrafo de corpo sem marcador pessoal? Reescreva. Você está FALANDO, não narrando de fora.
- ASSINE opinião. Conte casos próprios ("outro dia…", "uma vez vi…", "lá na Infosaas…", "no meu time…").
- Mencione a Infosaas com posse ("na Infosaas", "no meu time") — é seu projeto.

PROIBIDO neste modo:
- Frases neutras "muitas empresas erram" → diga "tenho visto várias empresas errarem".
- "Nós" corporativo distante.

Exemplos PADRÃO-OURO de FLG (calibrados pelo próprio Rafael — escreva ASSIM):

Par 1
- Headline: "Eu já vi times colocarem tudo no automático… e do nada travar."
- Corpo: "A promessa parecia simples: cortar esforço manual. Só que ninguém tinha desenhado o fluxo direito. A automação virou um caos completo."

Par 2
- Headline: "Pra mim, o problema começa quando o processo 'mora na cabeça' de alguém."
- Corpo: "No meu dia a dia, isso aparece assim: um passo faz sentido pra quem está operando, mas não faz sentido algum pra plataforma. Aí a ferramenta espera o que nem a operação consegue garantir."

Par 3
- Headline: "Toda sexta tem 'ajuste rápido' em um processo confuso."
- Corpo: "E no dia que o time precisa, as regras mudam sem tempo de adaptação. Quem faz sabe 'no feeling'. Qualquer solução sem processo aumenta o caos da operação."`
      : `\n\n## Identidade do autor (voz) — Infosaas®
Você escreve como a **Infosaas®** — voz INSTITUCIONAL da empresa. Use "nós" ou impessoal, posicionamento corporativo de studio premium de tecnologia B2B. NUNCA fale em primeira pessoa do singular (eu, meu, minha) — não é uma pessoa falando, é a empresa.`

  // Densidade de texto: o copy VAI NA ARTE (peça visual), então é curto e escaneável.
  // O texto longo/explicativo vai na caption, não nos campos do conteúdo.
  const densityByType: Record<string, string> = {
    carrossel: `- CAPA (slide 1, "cover"): headline = frase COMPLETA e impactante, de 45 a 60 caracteres, ocupando 2–3 linhas (ex.: "Automatizar sem processo é construir na areia"). Subheadline opcional e curta.
- SLIDES 2 a 9 ("content"): construam uma narrativa de transformação NESTA ordem — contexto → fundo do poço → escalada → topo da montanha.
- Headline de CADA slide de conteúdo: frase desenvolvida de 45 a 70 caracteres (2–3 linhas). NUNCA 1–3 palavras soltas.
- VARIE a densidade do corpo: uns slides com 1–2 parágrafos curtos, outros com 1 parágrafo mais desenvolvido, e às vezes só corpo (headline vazia). Corpo: até ~280 caracteres no total, separando parágrafos por \\n\\n.
- FECHAMENTO (último slide, "closing"): headline de virada + CTA.
- Use de 6 a 9 slides no total.`,
    anuncio: `- headlines: cada uma é uma frase completa de 40 a 70 caracteres (nunca 1–2 palavras soltas).
- body: 1 frase curta (≈120 caracteres).`,
    post: `- headline: frase COMPLETA e impactante, de 45 a 60 caracteres, ocupando 2–3 linhas (ex.: "Automatizar sem processo é construir na areia"). NUNCA 1–3 palavras soltas.
- subheadline: 1 linha de apoio, opcional (até ~80 caracteres).
- body: 1–2 frases curtas (até ~200 caracteres), opcional.`,
  }
  const density = densityByType[contentType] ?? densityByType.post

  // Modo determina como o modelo "responde": generate produz JSON estruturado;
  // refine opera o canvas via tools (texto natural no final).
  const responseSection =
    body.mode === 'refine'
      ? `\n\n## Como operar (refino)
Você opera o editor via TOOLS. Cada pedido do usuário se traduz em uma ou mais chamadas de tool. Para pedidos HEURÍSTICOS ("em todos os slides com X", "onde Y for Z"), SEMPRE chame getState primeiro pra ver o estado real — não chute por memória. Depois de aplicar as edições, responda em texto NATURAL e CURTO (1–3 frases), em português, sem mencionar nomes de tools nem JSON.`
      : `\n\n## Como responder
Você está num editor de conteúdo. Responda SEMPRE com dois campos:
- "reply": uma mensagem curta e natural em português (conversa com o usuário). NUNCA inclua JSON, código ou os textos do conteúdo crus aqui.
- "content": o conteúdo estruturado seguindo o schema. Sempre preencha (modo de criação).
Escreva o "caption" como uma legenda completa para Instagram (quebras de linha + hashtags), na voz da marca.${
          contentType === 'carrossel'
            ? '\nNo carrossel: o primeiro slide é "cover", o último é "closing", os do meio são "content".'
            : ''
        }`

  let system =
    baseSystem +
    responseSection +
    `

## Densidade de texto (Instagram) — IMPORTANTE
Regra geral: HEADLINES são frases COMPLETAS e desenvolvidas (com sujeito e verbo, 2–3 linhas) — NUNCA 1 a 3 palavras soltas. Já o CORPO é conciso e escaneável (sem parágrafos longos). Respeite as faixas de caracteres abaixo: elas têm mínimo e máximo, não escreva abaixo do mínimo.
${density}
O conteúdo longo, explicações e desenvolvimento vão na "caption" (legenda) — NUNCA nos campos da arte.` +
    speakerSection +
    `\n\n## Linguagem proibida — IMPORTANTE
A estrutura narrativa (contexto, fundo do poço, escalada, topo da montanha) é só uma BÚSSOLA INTERNA para a sequência de ideias — JAMAIS aparece no texto. Não escreva nem use sinônimos/metáforas dessas palavras na arte ou na legenda. Lista proibida (e variantes): "conflito", "fundo do poço", "escalada", "topo da montanha", "vale da morte", "jornada do herói", "ato 1/2/3", "início meio e fim", "trilhar a montanha", "antagonista", "virada do herói". Escreva sobre o tema CONCRETO, com observações e exemplos reais, sem nunca citar a estrutura.

## Estilo de escrita — natural e cotidiano (BRASIL, REDE SOCIAL)
Isto NÃO é manual nem ensaio. É Instagram. Pessoas escrevem rápido, curto, com cara de fala. Siga estas regras à risca:

EVITE em massividade o travessão "—". MÁXIMO 1 uso no post inteiro. Prefira ponto, vírgula, "que", ou começar parágrafo novo.

EVITE estes padrões cliché/aforísticos (são as principais armadilhas que deixam tudo igual):
- "Não é X, é Y" / "Não é sobre X, é sobre Y" → vira esquema frio, todo mundo usa.
- "Quando X, Y" como abertura de frase → soa filosofia barata.
- Sequências curtas de frases-aforismo ("X é Y. Y é Z. Z é a chave.").
- "É hora de…", "Chegou a hora de…", "É o momento de…".

EVITE vocabulário polido/empresarial-pomposo. Estas palavras/expressões NÃO entram (use sinônimos populares ou mude a ideia): "vira refém", "trilhar", "ativo subestimado", "estado da arte", "jornada", "leitura cuidadosa", "compromisso", "alavancar", "destravar", "no fim das contas", "no fim do dia", "tangibilizar", "potencializar", "robusto", "consolidar", "promover", "agendar uma conversa", "rumo a", "patamar".

USE linguagem de gente de verdade no Brasil:
- Frases curtas e DIRETAS, com cara de fala (não de redação escolar).
- Gírias leves e expressões do dia a dia OK: "rola", "vira bagunça", "tem hora que", "sabe quando…?", "acaba que", "fica feio", "se vira", "dá ruim", "complica tudo", "trava", "puxa logo", "fica de pé", "vai mal".
- Fragmentos curtos são bem-vindos: "Sério.", "É isso.", "Pesado.", "Doido.".
- Pode começar frase com "E", "Mas", "Aí", "Tipo" sem medo.
- Pontuação imperfeita é OK — NÃO escreva como mestre de gramática. Soa robô.

## Padrões de naturalidade (CALIBRADOS pelo Rafael — vale pros dois autores)

Estes padrões foram extraídos de exemplos reescritos pelo próprio Rafael. Aplique sempre:

- **Gerundivo brasileiro** quando rolar: "quem está operando" > "quem opera"; "quem está fazendo" > "quem faz"; "quem está chegando" > "quem chega". Soa muito mais BR.
- **Qualificadores simples** pra ritmo/ênfase, sem medo de gastar uma palavra: "completo", "confuso", "algum", "qualquer", "todo mundo", "sem tempo de adaptação", "do nada", "do jeito que tá". Ex.: "um caos completo", "não faz sentido algum", "Qualquer solução…".
- **Ordem natural BR** (não invertida): "nem a operação consegue" > "a operação nem consegue"; "do nada travar" > "travar do nada".
- **Vocabulário B2B SaaS REAL**, palavras que tech operations usam: "plataforma" (não "sistema"), "operação" como ente concreto, "fluxo", "regra", "automação", "time", "processo", "ferramenta". Evite "negócio", "organização", "iniciativa", "modelagem", "stakeholders".
- **Aspas em termos coloquiais** funcionam ótimo: "ajuste rápido", "no feeling", "mora na cabeça", "do nada", "no automático", "no chute".
- **Termine o slide com uma CONSEQUÊNCIA CLARA** e simples — não com aforismo "X é Y". Exemplo de fechamento bom: "Qualquer solução sem processo aumenta o caos da operação." Exemplo a EVITAR: "Processo é a chave." (aforismo barato).
- **Frases podem ser MAIS LONGAS** se forem fluentes. Cara de fala = fluência, NÃO brevidade forçada. Não corte tudo no osso achando que isso é natural — não é.`

  const creative = creativeSchemaFor(contentType)

  // No refino, o copiloto opera em LOOP via tools (igual o Cursor edita código):
  // chama uma tool, vê o resultado, decide a próxima. As tools documentam-se
  // sozinhas — aqui é só o meta-uso.
  const commandsHelp =
    body.mode === 'refine'
      ? `\n\n## Copiloto do canvas (refino) — você tem TOOLS
Você tem ferramentas (tools) para editar o canvas cirurgicamente. Cada tool documenta seu uso na própria descrição — leia o que cada uma faz e use a apropriada. Pode chamar VÁRIAS em sequência: depois de cada chamada você vê o resultado e decide a próxima.

ÍNDICES — ATENÇÃO:
- O parâmetro slideIndex das tools é 0-BASED: o primeiro slide é 0, o segundo é 1, etc.
- O conteúdo JSON que você vê tem um campo "index" em cada slide que é 1-BASED (rótulo humano). NÃO use esse "index" como slideIndex — subtraia 1.
- Exemplo: para o slide cujo "index": 5 no JSON, passe slideIndex=4 nas tools.
- Para post/anúncio (não-carrossel) sempre use slideIndex=0.

QUANDO chamar getState ANTES de editar (obrigatório):
- Pedidos heurísticos: "em todos os slides em que X", "onde o body está vazio", "naqueles que ainda não foram tocados", "se o tipo for content"…
- Pedidos que se referem ao estado atual com incerteza: "qual a base atual?", "esse slide já tem imagem?"
- Não chute por memória — chame getState, leia, decida.

QUANDO NÃO precisa de getState: pedidos explícitos com índice ("esconde a subheadline do slide 3", "duplica o slide 5") ou globais ("muda a base pra bold", "esconde a logo").

Para reescrever um conteúdo do zero, faça via MÚLTIPLAS chamadas a setText (uma por slide+campo) — não há tool de "regerar tudo".

Depois das edições, responda em texto natural curto (1–3 frases), em português, dizendo o que foi feito — use a numeração 1-based humana ("slide 3", não "slide 2") para o usuário não se perder.

Se o usuário só conversa ou faz pergunta sem pedir mudança, responda em texto SEM chamar nenhuma tool.`
      : ''
  system += commandsHelp

  const messages: { role: 'user' | 'assistant'; content: string }[] = []
  if (body.mode === 'refine') {
    if (body.currentContent) {
      messages.push({
        role: 'user',
        content: `Conteúdo atual (referência):\n${JSON.stringify(body.currentContent, null, 2)}`,
      })
    }
    for (const m of body.history ?? []) messages.push(m)
    messages.push({ role: 'user', content: body.userMessage ?? '' })
  } else {
    messages.push({
      role: 'user',
      content: `Crie um ${contentType} para a fase "${funnelPhase}" (template "${templateId}").\n\nTema/Brief: ${body.brief ?? ''}`,
    })
  }

  // ─── MODO GENERATE: cria do brief com generateObject ────────────────────────
  if (body.mode === 'generate') {
    const outSchema = z.object({ reply: z.string(), content: creative.nullable() })
    let object: z.infer<typeof outSchema>
    try {
      const result = await generateObject({ model: openai('gpt-5.4-nano'), system, messages, schema: outSchema })
      object = result.object
    } catch (e) {
      console.error('[api/generate] generate error:', e)
      return NextResponse.json({ error: 'Falha ao gerar conteúdo.' }, { status: 502 })
    }

    if (!object.content) {
      return NextResponse.json({ reply: object.reply, content: null, caption: null })
    }

    const assembled = assembleContent({
      contentType,
      funnelPhase,
      templateId,
      productId,
      author,
      creative: object.content,
      base: body.currentContent ?? null,
    })
    const parsed = ContentSchema.safeParse(assembled)
    if (!parsed.success) {
      console.error('[api/generate] assembled inválido:', parsed.error.issues)
      return NextResponse.json({ error: 'Conteúdo gerado inválido.' }, { status: 422 })
    }
    return NextResponse.json({ reply: object.reply, content: parsed.data, caption: object.content.caption })
  }

  // ─── MODO REFINE: multi-step com tools ──────────────────────────────────────
  if (!body.currentContent) {
    return NextResponse.json({ error: 'Refino requer currentContent.' }, { status: 400 })
  }

  let state: Content = body.currentContent
  let captionUpdate: string | null = null
  const applied: Command[] = []
  const dispatch = (cmd: Command) => {
    const { content: next, caption } = applyCommands(state, [cmd])
    state = next
    if (caption !== null) captionUpdate = caption
    applied.push(cmd)
  }

  // Enums reaproveitados nas inputSchemas das tools.
  const FieldZ = z.enum(['headline', 'subheadline', 'body', 'cta'])
  const BaseZ = z.enum(['editorial', 'bold', 'narrativa'])
  const SlideTypeZ = z.enum(['cover', 'content', 'closing'])
  const LogoVariantZ = z.enum(['preto', 'branco', 'laranja'])
  const CornerZ = z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right'])
  const NumberingStyleZ = z.enum(['fraction', 'index'])
  const MediaKindZ = z.enum(['image', 'none'])
  const MediaModeZ = z.enum(['cover', 'element'])
  const MediaPosZ = z.enum(['top', 'middle', 'bottom'])
  const AlignZ = z.enum(['left', 'center', 'right'])

  const tools = {
    setText: tool({
      description: 'Substitui o texto de um campo (headline/subheadline/body/cta) em um slide. slideIndex é 0-based; para post/anúncio use 0.',
      inputSchema: z.object({ slideIndex: z.number().int(), field: FieldZ, text: z.string() }),
      execute: async (input) => {
        dispatch(makeCommand({ kind: 'setText', slideIndex: input.slideIndex, field: input.field, text: input.text }))
        return { ok: true }
      },
    }),
    hideField: tool({
      description: 'Esconde (true) ou mostra (false) um campo de texto em um slide.',
      inputSchema: z.object({ slideIndex: z.number().int(), field: FieldZ, hidden: z.boolean() }),
      execute: async (input) => {
        dispatch(makeCommand({ kind: 'hideField', slideIndex: input.slideIndex, field: input.field, hidden: input.hidden }))
        return { ok: true }
      },
    }),
    setFieldStyle: tool({
      description: 'Ajusta estilo de um campo de texto. Combine livremente fontSize, letterSpacing (px), lineHeight (multiplicador), align, marginTop/marginBottom (px), paddingX (px).',
      inputSchema: z.object({
        slideIndex: z.number().int(),
        field: FieldZ,
        fontSize: z.number().optional(),
        letterSpacing: z.number().optional(),
        lineHeight: z.number().optional(),
        align: AlignZ.optional(),
        marginTop: z.number().optional(),
        marginBottom: z.number().optional(),
        paddingX: z.number().optional(),
      }),
      execute: async (input) => {
        dispatch(
          makeCommand({
            kind: 'setFieldStyle',
            slideIndex: input.slideIndex,
            field: input.field,
            fontSize: input.fontSize ?? null,
            letterSpacing: input.letterSpacing ?? null,
            lineHeight: input.lineHeight ?? null,
            align: input.align ?? null,
            marginTop: input.marginTop ?? null,
            marginBottom: input.marginBottom ?? null,
            paddingX: input.paddingX ?? null,
          })
        )
        return { ok: true }
      },
    }),
    duplicateSlide: tool({
      description: 'Duplica um slide do carrossel. Máx 10 slides.',
      inputSchema: z.object({ slideIndex: z.number().int() }),
      execute: async (input) => {
        dispatch(makeCommand({ kind: 'duplicateSlide', slideIndex: input.slideIndex }))
        return { ok: true }
      },
    }),
    removeSlide: tool({
      description: 'Remove um slide do carrossel. Mín 2 slides.',
      inputSchema: z.object({ slideIndex: z.number().int() }),
      execute: async (input) => {
        dispatch(makeCommand({ kind: 'removeSlide', slideIndex: input.slideIndex }))
        return { ok: true }
      },
    }),
    setBase: tool({
      description: 'Troca a base (template) e re-tematiza os fundos.',
      inputSchema: z.object({ baseId: BaseZ }),
      execute: async (input) => {
        dispatch(makeCommand({ kind: 'setBase', baseId: input.baseId }))
        return { ok: true }
      },
    }),
    setSlideType: tool({
      description: 'Transforma um slide em cover, content ou closing.',
      inputSchema: z.object({ slideIndex: z.number().int(), slideType: SlideTypeZ }),
      execute: async (input) => {
        dispatch(makeCommand({ kind: 'setSlideType', slideIndex: input.slideIndex, slideType: input.slideType }))
        return { ok: true }
      },
    }),
    moveSlide: tool({
      description: 'Move um slide de uma posição para outra (ambas 0-based).',
      inputSchema: z.object({ slideIndex: z.number().int(), toIndex: z.number().int() }),
      execute: async (input) => {
        dispatch(makeCommand({ kind: 'moveSlide', slideIndex: input.slideIndex, toIndex: input.toIndex }))
        return { ok: true }
      },
    }),
    setCaption: tool({
      description: 'Substitui a legenda completa do post (caption.md).',
      inputSchema: z.object({ text: z.string() }),
      execute: async (input) => {
        dispatch(makeCommand({ kind: 'setCaption', text: input.text }))
        return { ok: true }
      },
    }),
    setLogo: tool({
      description: 'Ajusta a logo: show (esconde/mostra), variant (preto/branco/laranja), position (4 cantos).',
      inputSchema: z.object({
        show: z.boolean().optional(),
        variant: LogoVariantZ.optional(),
        position: CornerZ.optional(),
      }),
      execute: async (input) => {
        dispatch(
          makeCommand({
            kind: 'setLogo',
            logoShow: input.show ?? null,
            logoVariant: input.variant ?? null,
            logoPosition: input.position ?? null,
          })
        )
        return { ok: true }
      },
    }),
    setNumbering: tool({
      description: 'Ajusta a numeração de slides: show, style (fraction "1/10" ou index "01"), position (4 cantos).',
      inputSchema: z.object({
        show: z.boolean().optional(),
        style: NumberingStyleZ.optional(),
        position: CornerZ.optional(),
      }),
      execute: async (input) => {
        dispatch(
          makeCommand({
            kind: 'setNumbering',
            numberingShow: input.show ?? null,
            numberingStyle: input.style ?? null,
            numberingPosition: input.position ?? null,
          })
        )
        return { ok: true }
      },
    }),
    setHandle: tool({
      description: 'Ajusta o handle: show (esconder/mostrar) e/ou name (o @nome, ex.: "@infosaas").',
      inputSchema: z.object({ show: z.boolean().optional(), name: z.string().optional() }),
      execute: async (input) => {
        dispatch(
          makeCommand({
            kind: 'setHandle',
            handleShow: input.show ?? null,
            text: input.name ?? null,
          })
        )
        return { ok: true }
      },
    }),
    setMedia: tool({
      description:
        'Mídia do slide: kind ("image"/"none"), mode ("cover"/"element"), position (só p/ element: top/middle/bottom), radius (px), ref (URL/filename). Para remover use kind="none". Para adicionar via URL passe ref (kind vira "image" automático).',
      inputSchema: z.object({
        slideIndex: z.number().int(),
        kind: MediaKindZ.optional(),
        mode: MediaModeZ.optional(),
        position: MediaPosZ.optional(),
        radius: z.number().optional(),
        ref: z.string().optional(),
      }),
      execute: async (input) => {
        dispatch(
          makeCommand({
            kind: 'setMedia',
            slideIndex: input.slideIndex,
            mediaKind: input.kind ?? null,
            mediaMode: input.mode ?? null,
            mediaPosition: input.position ?? null,
            mediaRadius: input.radius ?? null,
            mediaRef: input.ref ?? null,
          })
        )
        return { ok: true }
      },
    }),
    setMask: tool({
      description:
        'Máscara sobre a mídia (só cover). gradientOn=true liga degradê (use top/mid/bottom 0..1); =false volta a uniforme. opacity (0..1) para uniforme. color em hex #RRGGBB.',
      inputSchema: z.object({
        slideIndex: z.number().int(),
        gradientOn: z.boolean().optional(),
        top: z.number().optional(),
        mid: z.number().optional(),
        bottom: z.number().optional(),
        opacity: z.number().optional(),
        color: z.string().optional(),
      }),
      execute: async (input) => {
        dispatch(
          makeCommand({
            kind: 'setMask',
            slideIndex: input.slideIndex,
            maskGradientOn: input.gradientOn ?? null,
            maskTop: input.top ?? null,
            maskMid: input.mid ?? null,
            maskBottom: input.bottom ?? null,
            maskOpacity: input.opacity ?? null,
            maskColor: input.color ?? null,
          })
        )
        return { ok: true }
      },
    }),
    generateImage: tool({
      description:
        'Gera uma imagem com IA (gpt-image-1, quality low) e aplica como mídia de um slide. Use quando o usuário pedir "gera uma imagem de…", "põe uma foto de…", "cria uma arte de…". Requer que o conteúdo já esteja salvo (slug).',
      inputSchema: z.object({
        slideIndex: z.number().int(),
        prompt: z.string(),
        mode: MediaModeZ.optional(),
        position: MediaPosZ.optional(),
      }),
      execute: async (input) => {
        if (!body.slug) {
          return { error: 'É preciso salvar o conteúdo antes de gerar imagens.' }
        }
        try {
          const { filename } = await generateAndSaveImage({
            prompt: input.prompt,
            slug: body.slug,
            aspectRatio: state.format.aspect_ratio,
          })
          dispatch(
            makeCommand({
              kind: 'setMedia',
              slideIndex: input.slideIndex,
              mediaKind: 'image',
              mediaRef: filename,
              mediaMode: input.mode ?? 'cover',
              mediaPosition: input.position ?? null,
            })
          )
          return { ok: true, filename }
        } catch (e) {
          console.error('[generateImage tool] error:', e)
          return { error: 'Falha ao gerar imagem.' }
        }
      },
    }),
    getState: tool({
      description:
        'Retorna o conteúdo atual após as edições já feitas neste turno. Use quando precisar inspecionar para decidir o próximo passo (ex.: "quais slides têm body vazio?").',
      inputSchema: z.object({}),
      execute: async () => {
        return { content: state }
      },
    }),
  }

  let finalText = ''
  try {
    const result = await generateText({
      model: openai('gpt-5.4-nano'),
      system,
      messages,
      tools,
      stopWhen: stepCountIs(30),
      providerOptions: { openai: { parallelToolCalls: false } },
    })
    finalText = result.text
  } catch (e) {
    console.error('[api/generate] refine error:', e)
    return NextResponse.json({ error: 'Falha no refino.' }, { status: 502 })
  }

  const parsed = ContentSchema.safeParse(state)
  if (!parsed.success) {
    console.error('[api/generate] estado final inválido:', parsed.error.issues)
    return NextResponse.json({ error: 'Edições produziram conteúdo inválido.' }, { status: 422 })
  }

  if (applied.length > 0) console.log('[api/generate] tools aplicadas:', summarizeCommands(applied))

  return NextResponse.json({
    reply: finalText,
    content: applied.length > 0 ? parsed.data : null,
    caption: captionUpdate,
    commandsApplied: applied.length > 0 ? summarizeCommands(applied) : undefined,
  })
}
