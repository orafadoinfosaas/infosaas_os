# Seção 05 — Iconografia

> **Propósito desta seção no brandbook:** Documentar o sistema de ícones da Infosaas® — qual biblioteca, quais tamanhos, estilo visual, regras de uso e o que evitar. A Infosaas® não mantém um set próprio de ícones — usa Lucide como sistema padrão, complementado pelo símbolo de marca para uso decorativo.

---

## 05.1 Biblioteca oficial: Lucide

**Biblioteca:** Lucide Icons  
**Site:** [lucide.dev](https://lucide.dev)  
**Estilo:** Outline (apenas traços, sem preenchimento)  
**Peso de traço:** 1.5–2px  
**Box padrão:** 24px × 24px  

Lucide é open-source, mantida ativamente e cobre todos os casos de uso de UI. É o único set de ícones aprovado para uso em interfaces, documentos e apresentações.

---

## 05.2 Tamanhos de ícone

| Tamanho | Contexto |
|---|---|
| 16px | Ícone inline ao lado de texto de corpo (labels, status, chips) |
| 20px | Prefixo/sufixo de inputs, ícone em tab bar |
| 24px | Ícone standalone em toolbar, sidebar, botões com ícone |
| 40px+ | Ícone decorativo em cards de feature ou seções de destaque |

**Regra:** Nunca redimensionar um ícone de forma não-proporcional. Manter sempre em múltiplos de 4px.

---

## 05.3 Cor dos ícones

**Regra fundamental:** Os ícones herdam a cor do texto ao redor via `currentColor`. Nunca hardcodar hex em ícones.

| Contexto | Cor do ícone |
|---|---|
| Fundo claro, texto normal | `--fg` (preto) |
| Fundo claro, texto muted | `--fg-muted` (cinza-600) |
| Fundo escuro | `--fg-on-dark` (branco-off) |
| Fundo laranja | `--fg-on-accent` (branco) |
| Elemento de destaque/CTA | `--accent` (laranja) |

```css
/* Correto — herda cor do contexto */
.icon { color: currentColor; }

/* Proibido — hardcode de hex */
.icon { color: #FF3D00; }
```

---

## 05.4 O símbolo de marca como elemento decorativo

O símbolo `S` (`simbolo-*.svg`) não é um ícone de UI — é um elemento de marca. Tem dois papéis:

1. **Logo:** Versão isolada do wordmark (ver seção 02-logo)
2. **Motivo decorativo:** Escalado em 60–120% do frame, com baixo contraste, sobre fundo laranja

O símbolo **nunca** é usado no lugar de um ícone Lucide dentro de uma interface. São elementos com propósitos completamente diferentes.

---

## 05.5 O que não fazer

| Proibido | Por quê |
|---|---|
| Misturar Lucide com ícones de outra biblioteca na mesma superfície | Cria inconsistência visual imediata |
| Usar ícones preenchidos (filled) ou duotone | Fora do estilo — o sistema é outline |
| Usar emojis como ícones em UI ou marketing | Fora do sistema — emojis não são aprovados |
| Usar glifos Unicode como ícones (★ ✓ →) | Usar equivalentes Lucide: `Star`, `Check`, `ArrowRight` |
| Usar ícones 3D ou ilustrativos | Incompatível com o sistema clean da marca |
| Criar ícones customizados sem aprovação | A consistência do set é uma decisão de sistema |

---

## 05.6 Como usar Lucide

**Via CDN (HTML/JS):**
```html
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
```

**Via NPM (projetos com bundler):**
```bash
npm install lucide-react   # React
npm install lucide         # Vanilla JS
```

**Uso básico em HTML:**
```html
<i data-lucide="arrow-right" style="width:24px;height:24px;"></i>
<script>lucide.createIcons();</script>
```

**Uso em React:**
```jsx
import { ArrowRight } from 'lucide-react';
<ArrowRight size={24} strokeWidth={1.5} />
```

**Parâmetros padrão:**
- `size`: 24
- `strokeWidth`: 1.5
- `color`: currentColor

---

## 05.7 Ícones comuns no sistema Infosaas®

Lista de referência dos ícones mais usados na marca:

| Uso | Ícone Lucide |
|---|---|
| Link externo / CTA | `ArrowRight` ou `ExternalLink` |
| Check / confirmação | `Check` ou `CheckCircle` |
| Menu mobile | `Menu` |
| Fechar | `X` |
| Telefone / WhatsApp | `Phone` |
| Email | `Mail` |
| Calendário | `Calendar` |
| Usuário / perfil | `User` |
| Configurações | `Settings` |
| Documento | `FileText` |
| Código | `Code` |
| Performance | `Zap` |
| Segurança | `Shield` |
| Integração | `Link` ou `Plug` |

---

## Referências desta seção

- [lucide.dev](https://lucide.dev) — biblioteca completa com busca
- `dna/identidade-visual/README.md` — seção de iconografia (regras gerais)
- `dna/identidade-visual/assets/logos/simbolo-*.svg` — símbolo de marca para uso decorativo
