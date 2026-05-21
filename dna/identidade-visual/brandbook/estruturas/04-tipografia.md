# Seção 04 — Tipografia

> **Propósito desta seção no brandbook:** Documentar a família tipográfica oficial, os pesos em uso, a escala de tamanhos, as regras de espaçamento e os contextos de aplicação. A tipografia da Infosaas® é uma fonte única — Sora. Nenhuma outra fonte deve ser usada em superfícies de marca.

> **Nota importante:** O site institucional atual usa Gotham (self-hosted). Gotham continuará sendo usado naquele contexto até migração. A fonte **oficial de marca** é Sora — a ser usada em todas as novas aplicações, brandbook, apresentações, documentos e materiais.

---

## 04.1 Fonte oficial: Sora

**Fonte:** Sora  
**Origem:** Google Fonts — gratuita, código aberto  
**URL:** [fonts.google.com/specimen/Sora](https://fonts.google.com/specimen/Sora)  
**Uso:** Display, headings, body, UI — é a única fonte da Infosaas® para texto

**Pesos disponíveis e em uso:**

| Peso | Nome | Uso principal |
|---|---|---|
| 300 | Light | Display muito grande — uso restrito |
| 400 | Regular | Corpo de texto corrido |
| 500 | Medium | Labels, eyebrows, texto de suporte |
| 600 | SemiBold | Subtítulos, call-outs |
| **700** | **Bold** | **Headings padrão (h2, h3, h4)** |
| **800** | **ExtraBold** | **Display, h1, manchetes** |

---

## 04.2 Fonte de código: JetBrains Mono

**Fonte:** JetBrains Mono  
**Uso:** Exclusivamente para blocos de código, snippets, tokens técnicos  
**Pesos:** 400 e 500  
**Nunca usar em texto corrido, headings ou UI**

---

## 04.3 Escala tipográfica

| Token CSS | Tamanho | Peso | Line-height | Uso |
|---|---|---|---|---|
| `--fs-display-xl` | clamp(56px → 112px) | 800 | 0.95 | Headlines gigantes — uso em hero extremamente impactante |
| `--fs-display` | clamp(44px → 80px) | 800 | 0.95 | Hero principal — 3 linhas empilhadas |
| `--fs-h1` | clamp(36px → 56px) | 800 | 0.95 | H1 de página — usado apenas uma vez por página |
| `--fs-h2` | clamp(28px → 40px) | 700 | 1.1 | Títulos de seção |
| `--fs-h3` | clamp(22px → 28px) | 700 | 1.1 | Subtítulos, títulos de card |
| `--fs-h4` | 18px | 700 ou 500 | 1.1 | Labels de feature, títulos menores |
| `--fs-body-lg` | 18px | 400 | 1.55 | Parágrafo de destaque, intro de seção |
| `--fs-body` | 16px | 400 | 1.55 | Corpo de texto padrão |
| `--fs-body-sm` | 14px | 400–500 | 1.55 | Notas, legendas, metadados |
| `--fs-caption` | 12px | 500 | 1.4 | Captions de imagem, timestamps |
| `--fs-eyebrow` | 12px | 500 | — | Labels de seção — sempre em maiúsculo com tracking |

---

## 04.4 Tracking (letter-spacing)

| Token | Valor | Quando usar |
|---|---|---|
| `--tr-tight` | `-0.02em` | Display e headings — aperta o tipo, dá peso e presença |
| `--tr-eyebrow` | `+0.12em` | Eyebrows e labels em caixa alta — abre o texto para legibilidade |

**Regra:** Display e headings sempre com tracking negativo. Labels uppercase sempre com tracking positivo. Corpo nunca com tracking manual.

---

## 04.5 Hierarquia visual em texto

```
EYEBROW (12px / 500 / +0.12em / uppercase)     ← sempre acima do título
────────────────────────────────────────────────
Display ou H1 (44–80px / 800 / -0.02em)        ← manchete principal
Subtítulo ou H2 (28–40px / 700 / -0.02em)      ← título de seção
Intro / H3 (18px / 400 / 1.65 line-height)     ← parágrafo de abertura
Corpo (16px / 400 / 1.55 line-height)          ← texto corrido
Caption (12px / 500 / muted)                   ← metadados e notas
```

---

## 04.6 Regras de caixa (capitalização)

| Contexto | Regra | Exemplo |
|---|---|---|
| Headings e display | Sentence case | "A plataforma que funcionava antes de você crescer" |
| Eyebrows e labels | UPPERCASE | "SEGMENTO: EDUCAÇÃO" |
| Botões | Sentence case | "Fale com a gente" |
| Wordmark | lowercase sempre | `infosaas®` |
| Nomes de produto | Capitalizado | "MVP Ágil", "Suporte Premium" |

**Nunca:** HEADLINES EM CAIXA ALTA fora de contexto de eyebrow.

---

## 04.7 Períodos no display

Headings de três linhas empilhadas usam períodos ao final de cada linha — é parte da voz da marca:

> A plataforma que funcionava  
> antes de você crescer  
> não vai funcionar depois.

O ponto no final não é pontuação comum — é elemento de voz e estilo. Usar apenas em linhas curtas e empilhadas (3 linhas máximo).

---

## 04.8 O que nunca fazer com tipografia

| Proibido | Por quê |
|---|---|
| Usar outra fonte além de Sora (ou JetBrains Mono para código) | Dilui a identidade — uma fonte é o sistema |
| Usar Sora 100, 200 em texto marketing | Pesos muito leves comprometem a presença da marca |
| Usar letras maiúsculas em headings longos | Cansativo e inconsistente com a voz direta |
| Aumentar tracking em corpo de texto | Torna a leitura lenta |
| Justificar texto | Cria rios e é incompatível com o estilo minimalista |
| Usar itálico em headings display | Sora itálico não está na escala da marca |
| Misturar dois pesos em uma mesma linha de heading | Inconsistente — escolha um peso por elemento |

---

## 04.9 Como carregar Sora

**Via Google Fonts (recomendado para web):**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

**CSS:**
```css
--font-sans: "Sora", ui-sans-serif, system-ui, -apple-system, sans-serif;
```

---

## Referências desta seção

- `dna/identidade-visual/colors_and_type.css` — tokens de tipografia completos
- `dna/identidade-visual/preview/type-display-scale.html` — escala de display ao vivo
- `dna/identidade-visual/preview/type-specimen.html` — specimen completo
- `dna/identidade-visual/preview/type-body-utility.html` — body e utilitários
