# Seção 02 — Logo

> **Propósito desta seção no brandbook:** Documentar as versões do logo, quando usar cada uma, espaçamentos mínimos, tamanhos mínimos e usos proibidos. É a seção mais crítica para consistência de marca — qualquer uso incorreto do logo compromete o posicionamento premium.

---

## 02.1 Anatomia do Logo

O logo da Infosaas® é composto por dois elementos:

1. **Símbolo (símbolo isolado):** O glifo "S" em formato de quadrado arredondado — chunky, com raio de borda expressivo. É o elemento de maior reconhecimento da marca.
2. **Wordmark (logo completo):** Símbolo + tipografia "infosaas" em Sora 700, com o ® posicionado no canto superior direito do "s" final.

O wordmark e o símbolo são usados de formas distintas — nunca intercambiáveis sem critério.

---

## 02.2 Versões disponíveis

Existem 6 versões do logo, em 2 formatos cada (SVG e PNG):

| Versão | Arquivo SVG | Quando usar |
|---|---|---|
| Logo preto | `logo-black.svg` | Fundo claro (branco-off, branco, cinza-claro) |
| Logo branco | `logo-branco.svg` | Fundo escuro (preto, cinza-700+) |
| Logo laranja | `logo-laranja.svg` | Situações de destaque em fundo claro — uso restrito |
| Símbolo preto | `simbolo-black.svg` | Fundo claro — uso como elemento isolado ou favicon |
| Símbolo branco | `simbolo-branco.svg` | Fundo escuro — uso como elemento isolado |
| Símbolo laranja | `simbolo-laranja.svg` | Uso decorativo em fundo claro — com moderação |

**Caminho dos arquivos:** `dna/identidade-visual/assets/logos/`

### Tabela de uso por fundo

| Cor de fundo | Logo recomendado |
|---|---|
| `#F5F5F5` branco-off (padrão) | `logo-black.svg` |
| `#FFFFFF` branco puro | `logo-black.svg` |
| `#000000` preto | `logo-branco.svg` |
| `#FF3D00` laranja | `logo-branco.svg` — nunca o laranja sobre laranja |
| Cinza escuro (`--cinza-700` ou mais escuro) | `logo-branco.svg` |
| Foto ou imagem de fundo | `logo-branco.svg` com fundo escurecido; ou `logo-black.svg` com área clara definida |

---

## 02.3 Espaço de proteção (clear space)

O logo precisa de uma área de respiro ao redor — livre de outros elementos visuais, texto ou bordas.

**Regra:** Mínimo de **1× a altura do símbolo** em todos os quatro lados do lockup completo.

```
┌─ clear space = altura do símbolo ──────────────────────┐
│                                                        │
│   [S] infosaas®                                        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 02.4 Tamanho mínimo

| Elemento | Tamanho mínimo |
|---|---|
| Símbolo isolado | 24px de altura |
| Logo completo (wordmark) | 80px de largura |

Abaixo desses tamanhos, o logo perde legibilidade e não deve ser usado. Nesses casos, preferir o símbolo isolado.

---

## 02.5 O ® na wordmark

- O símbolo ® sempre aparece ao lado superior-direito do último "s" de "infosaas".
- É parte integrante do logo — nunca removido.
- O wordmark é sempre em **caixa baixa: `infosaas®`** — nunca INFOSAAS, Infosaas ou variantes capitalizadas.

---

## 02.6 Usos proibidos

Os usos a seguir comprometem a marca e nunca devem ser feitos:

| Proibido | Por quê |
|---|---|
| Distorcer ou esticar o logo (alterar proporções) | Deforma a geometria do símbolo |
| Recolorir o logo com cores fora do sistema | Dilui o posicionamento e confunde |
| Usar logo laranja sobre fundo laranja | Sem contraste, ilegível |
| Usar logo preto sobre fundo escuro | Sem contraste, ilegível |
| Adicionar sombra, contorno ou efeito ao logo | Não faz parte do sistema |
| Colocar o logo sobre padrões ou texturas complexas | Compromete a leitura |
| Alterar a tipografia do wordmark | O wordmark é um arquivo fixo — não é texto editável |
| Remover o ® | A marca é registrada — omitir o símbolo é incorreto |
| Usar INFOSAAS em caixa alta como substituto do logo | Wordmark tem geometria própria |
| Colocar o logo dentro de formas (círculo, quadrado) | Não faz parte do sistema |

---

## 02.7 O símbolo como motivo decorativo

O símbolo isolado (`simbolo-*.svg`) tem um segundo uso: elemento decorativo escalado em alta percentagem (60–120% do frame), com baixo contraste (sobreposição tonal), visível nos banners de fundo laranja.

**Regras para uso decorativo:**
- Apenas sobre fundo laranja (`#FF3D00`), com o símbolo em `#B82C00` (`--laranja-deep`)
- Nunca em fundo branco ou preto como motivo decorativo (perde a sutileza)
- O símbolo decorativo fica sempre parcialmente cortado pelo frame — nunca centralizado e completo
- É usado como textura, não como logo — não precisa de espaço de proteção neste modo

---

## 02.8 Aplicação no site (referência)

- **Header:** `logo-black.svg` sobre fundo branco-off, sticky
- **Footer:** `logo-branco.svg` sobre fundo preto
- **Hero com fundo laranja:** `logo-branco.svg` + símbolo decorativo em `--laranja-deep`

---

## Referências desta seção

- `dna/identidade-visual/assets/logos/` — arquivos SVG e PNG oficiais
- `dna/identidade-visual/preview/brand-logo-lockup.html` — preview interativo
- `dna/identidade-visual/preview/brand-simbolo.html` — preview do símbolo
- `dna/identidade-visual/assets/banners/logo-bloom.png` — referência de uso sobre laranja
