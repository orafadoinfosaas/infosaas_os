# Seção 08 — Tokens de Design

> **Propósito desta seção no brandbook:** Documentar todos os tokens de sistema — espaçamento, raios de borda, sombras e motion. São os valores numéricos que garantem ritmo visual e consistência em todas as superfícies da marca. Nenhum valor fora deste sistema deve ser introduzido sem decisão explícita.

---

## 08.1 O que são tokens de design

Tokens são variáveis CSS que armazenam valores de design. Usar tokens em vez de valores hardcoded garante que uma mudança de sistema se propague para todos os componentes automaticamente.

**Fonte:** `dna/identidade-visual/colors_and_type.css`  
**Uso:** Importar o arquivo e usar as variáveis CSS em qualquer projeto Infosaas®

---

## 08.2 Espaçamento

Base: **4px**. Todos os valores são múltiplos de 4.

| Token | Valor | Uso típico |
|---|---|---|
| `--space-1` | 4px | Micro-espaçamento — gap interno de chip, margem de ícone |
| `--space-2` | 8px | Espaçamento entre elementos muito próximos |
| `--space-3` | 12px | Gap em listas, espaçamento interno de badge |
| `--space-4` | 16px | Padding padrão de elemento (input, tag) |
| `--space-5` | 24px | Gap entre grupo de elementos, padding de card pequeno |
| `--space-6` | 32px | Padding interno de card, gap de grid |
| `--space-7` | 48px | Separação entre seções internas |
| `--space-8` | 64px | Padding vertical de seção (desktop) |
| `--space-9` | 96px | Padding vertical de seção generosa (hero) |
| `--space-10` | 128px | Espaçamento máximo — separação entre módulos grandes |

**Regra:** Nunca usar valores fora desta escala (ex: 20px, 36px, 52px). Se uma composição "pede" um valor não-padrão, ajustar o layout para usar o valor mais próximo.

---

## 08.3 Raios de borda (border-radius)

O símbolo da Infosaas® é um quadrado arredondado com raio expressivo. Esse ratio é ecoado em todos os elementos do sistema — a marca tem cantos arredondados, nunca agressivos.

| Token | Valor | Uso |
|---|---|---|
| `--radius-sm` | 6px | Tags, chips, badges pequenos |
| `--radius` | 12px | Inputs, rows de lista, cards compactos |
| `--radius-md` | 18px | Botões |
| `--radius-lg` | 24px | Cards de conteúdo, modais |
| `--radius-xl` | 32px | Hero blocks, seções com borda arredondada |
| `--radius-pill` | 999px | Badges circulares, tags pill |

**Regra:** Nunca usar `border-radius: 0` exceto em seções de fundo full-bleed (sem borda visível). Nunca usar valores intermediários como 8px, 16px, 20px.

---

## 08.4 Sombras (elevation)

Sistema de sombra mínimo e funcional. Não há sombras exageradas ou dramáticas — elevação é sutil.

| Token | Valor | Uso |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.06)` | Inputs, campos de formulário |
| `--shadow` | `0 4px 14px rgba(0,0,0,0.08)` | Cards padrão em fundo claro |
| `--shadow-lg` | `0 18px 40px -10px rgba(0,0,0,0.18)` | Menus flutuantes, modais, dropdowns |
| `--shadow-accent` | `0 12px 30px -8px rgba(255,61,0,0.45)` | CTA em hover — glowing laranja sutil |

**Regras:**
- Nunca empilhar mais de uma sombra por elemento
- Nunca usar sombras coloridas além do `--shadow-accent` nos CTAs
- Cards sobre fundo branco-off usam `--shadow` — cards sobre branco puro podem usar `--shadow-sm`
- Elevação não existe em fundos escuros (preto, laranja) — elementos nestes contextos usam bordas ao invés de sombra

---

## 08.5 Motion (animação e transição)

A Infosaas® usa movimento mínimo e funcional. Sem bounce, sem parallax agressivo, sem rotação.

### Curvas de easing

| Token | Valor | Caráter |
|---|---|---|
| `--ease` | `cubic-bezier(0.2, 0.7, 0.2, 1)` | Saída suave — padrão para transições de UI |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrada energética, saída suave — para elementos que entram na tela |

Nunca usar `ease-in-out` padrão do CSS — é simétrico e parece mecânico.

### Durações

| Token | Valor | Quando usar |
|---|---|---|
| `--dur-fast` | 120ms | Hover em botões, mudança de estado imediata |
| `--dur` | 200ms | Transições de UI padrão (card hover, dropdown) |
| `--dur-slow` | 320ms | Elementos grandes entrando na tela, modais |

### Movimentos aprovados

| Movimento | Valor | Uso |
|---|---|---|
| Hover lift em card | `translateY(-2px)` em 200ms | Cards de solução, cards de produto |
| Hover em botão CTA | `scale(1.01)` ou só cor | Botão primário |
| Press em botão | `scale(0.985)` em 120ms | Feedback de clique |
| Fade in de elemento | `opacity 0→1` em 200ms | Dropdowns, tooltips |
| Slide de dropdown | `translateY(-4px)→0` + opacity | Menus de navegação |

### O que nunca fazer com motion

| Proibido | Por quê |
|---|---|
| Bouncing (spring physics) | Parece app de jogos — incompatível com premium |
| Rotação de elementos de UI | Sem precedente no sistema |
| Parallax de scroll intenso | Distrai do conteúdo |
| Animação de texto (typing, letter-by-letter) | Lento e afeta legibilidade |
| Skeleton loading colorido | Usar cinza neutro se necessário |
| Transições acima de 400ms | Parecem lentas e amadorísticas |

---

## 08.6 Focus ring (acessibilidade)

Todos os elementos interativos devem ter um anel de foco visível. O sistema usa laranja, não o azul padrão do browser.

```css
:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 61, 0, 0.35);
}
```

Nunca remover o focus ring sem substituir por uma alternativa equivalente — é um requisito de acessibilidade.

---

## 08.7 Grades e layout

| Parâmetro | Valor | Uso |
|---|---|---|
| Largura máxima de conteúdo | 1240px | Container padrão do site |
| Padding lateral (container) | 32px (desktop), 20px (mobile) | Respiro entre conteúdo e borda |
| Padding de seção vertical | `--space-8` a `--space-9` (64–96px) | Espaço entre seções |
| Colunas de grid (desktop) | 2, 3 ou 4 colunas | Usar grids semânticos — nunca 12-col genérico no marketing |
| Gap de grid | `--space-6` a `--space-7` (32–48px) | Espaço entre cards e colunas |

---

## Referências desta seção

- `dna/identidade-visual/colors_and_type.css` — todos os tokens em CSS
- `dna/identidade-visual/preview/spacing-scale.html` — escala de espaçamento ao vivo
- `dna/identidade-visual/preview/spacing-radii.html` — raios ao vivo
- `dna/identidade-visual/preview/spacing-shadows.html` — sombras ao vivo
