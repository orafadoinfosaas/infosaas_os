# Seção 03 — Cores

> **Propósito desta seção no brandbook:** Documentar a paleta oficial, os tokens de cor, a hierarquia de uso e as combinações permitidas e proibidas. O sistema de cores da Infosaas® é deliberadamente minimalista — uma cor de acento, três neutros. A restrição é intencional.

---

## 03.1 Paleta primária

São as quatro cores que definem a Infosaas®. Tudo mais é derivado ou ausente.

| Nome | Token | HEX | Papel |
|---|---|---|---|
| Laranja Primário | `--laranja` | `#FF3D00` | Único acento de marca. CTA, destaques, fundos de seção. |
| Preto | `--preto` | `#000000` | Texto primário em superfície clara; fundo hero invertido e footer. |
| Branco Off | `--branco-off` | `#F5F5F5` | Fundo padrão de página. Levemente aquecido — nunca branco puro. |
| Cinza Claro | `--cinza-claro` | `#D9D9D9` | Bordas, divisores, estado desabilitado. |

**Regra de ouro:** Essas quatro cores são as únicas cores de marca. Nunca adicionar uma quinta cor "para variar". A contenção é o que torna o laranja poderoso.

---

## 03.2 Paleta de estados do laranja

Derivadas do laranja primário, usadas exclusivamente para estados de interação e overlay decorativo. **Não são cores de marca secundárias — nunca publicar como paleta.**

| Token | HEX | Uso |
|---|---|---|
| `--laranja-hover` | `#FF5520` | Estado hover de botões e links laranja |
| `--laranja-press` | `#E03600` | Estado press/active |
| `--laranja-soft` | `#FFEDE6` | Fundo tintado — usado com muita moderação (ex: ticket bar, highlight suave) |
| `--laranja-deep` | `#B82C00` | Overlay decorativo do símbolo sobre fundo laranja (baixo contraste intencional) |

---

## 03.3 Rampa de neutros

Usada para texto secundário, fundos elevados, separadores e UI chrome. **Não são cores de marca** — são utilitários de interface.

| Token | HEX | Uso típico |
|---|---|---|
| `--cinza-100` | `#F5F5F5` | Equivalente ao branco-off |
| `--cinza-200` | `#ECECEC` | Hover em botões ghost e links |
| `--cinza-300` | `#D9D9D9` | Borda padrão (`--border`) |
| `--cinza-400` | `#B5B5B5` | Texto muted em fundos escuros |
| `--cinza-500` | `#8A8A8A` | Texto sutil/captions |
| `--cinza-600` | `#5C5C5C` | Texto secundário em fundos claros |
| `--cinza-700` | `#2E2E2E` | Texto de suporte em fundos escuros; bordas fortes |
| `--cinza-900` | `#0A0A0A` | Quase preto — raramente usado |

---

## 03.4 Tokens semânticos

Usar sempre os tokens semânticos em componentes — nunca hardcodar hex.

| Token semântico | Valor | Uso |
|---|---|---|
| `--bg` | `--branco-off` | Fundo de página |
| `--bg-elev` | `#FFFFFF` | Cards e superfícies elevadas |
| `--bg-invert` | `--preto` | Hero invertido, footer |
| `--bg-accent` | `--laranja` | Seções de acento laranja |
| `--fg` | `--preto` | Texto principal |
| `--fg-muted` | `--cinza-600` | Texto secundário |
| `--fg-subtle` | `--cinza-500` | Captions, labels |
| `--fg-on-accent` | `--branco` | Texto sobre fundo laranja |
| `--fg-on-dark` | `--branco-off` | Texto sobre fundo preto |
| `--border` | `--cinza-300` | Borda padrão 1px |
| `--border-strong` | `--preto` | Borda estampada (uso em cards de destaque) |
| `--accent` | `--laranja` | CTA, links, destaques |

---

## 03.5 Combinações de cor aprovadas

Estas são as combinações que estão dentro do sistema de marca:

| Fundo | Texto | Uso |
|---|---|---|
| `#FF3D00` laranja | `#FFFFFF` branco | Hero com fundo laranja, banners, seção CTA laranja |
| `#F5F5F5` branco-off | `#000000` preto | Página padrão, documentos, conteúdo principal |
| `#000000` preto | `#F5F5F5` branco-off | Footer, hero invertido, seções escuras |
| `#FFFFFF` branco | `#000000` preto | Cards elevados sobre fundo branco-off |
| Qualquer fundo | `#FF3D00` laranja | Palavra de destaque dentro de texto preto/branco, CTA |

---

## 03.6 Combinações proibidas

| Combinação | Por quê evitar |
|---|---|
| Laranja sobre preto (grandes áreas) | Contraste agressivo, desequilibra a hierarquia visual |
| Laranja sobre branco com gradiente | Dilui o impacto do acento |
| Paleta arco-íris (múltiplas cores) | Fora do sistema — parece outra marca |
| Tons pastel ou lavanda derivados | Incompatíveis com o posicionamento premium |
| Tints/shades de laranja como "cores secundárias" | Os derivados do laranja são tokens de estado, não de marca |

---

## 03.7 Três padrões de superfície recorrentes

Toda aplicação visual da Infosaas® usa um destes três padrões:

**1. Bloco laranja sólido**
- Fundo: `#FF3D00`
- Texto: branco
- Símbolo decorativo em `#B82C00` (overlay de baixo contraste)
- Tipografia Sora 900, tight
- Usado em: heroes principais, banners de campanha, seções CTA de alta importância

**2. Documento off-white**
- Fundo: `#F5F5F5`
- Texto: preto
- Acento laranja em uma palavra, KPI ou CTA
- Generoso espaço em branco, sem ornamentos
- Usado em: corpo do site, apresentações, documentos

**3. Inversão preta**
- Fundo: `#000000`
- Texto: `#F5F5F5`
- Acento laranja nos destaques
- Usado em: footer, heroes secundários, seções de prova social

---

## 03.8 Acessibilidade

| Combinação | Contraste | Aprovado para |
|---|---|---|
| `#FFFFFF` sobre `#FF3D00` | 3.4:1 | Texto grande (18px+), logos, ícones |
| `#000000` sobre `#F5F5F5` | 19.4:1 | Qualquer tamanho de texto |
| `#F5F5F5` sobre `#000000` | 19.4:1 | Qualquer tamanho de texto |
| `#FF3D00` sobre `#F5F5F5` | 3.9:1 | Texto grande / elementos de destaque |

> Para texto de corpo (abaixo de 18px), usar branco/preto — não laranja. O laranja é acento, não texto corrido.

---

## Referências desta seção

- `dna/empresa/DESIGN.md` — paleta primária oficial
- `dna/identidade-visual/colors_and_type.css` — todos os tokens CSS
- `dna/identidade-visual/preview/colors-primary.html` — preview visual da paleta
- `dna/identidade-visual/preview/colors-neutral-ramp.html` — preview da rampa de neutros
- `dna/identidade-visual/preview/colors-pairings.html` — preview de combinações
