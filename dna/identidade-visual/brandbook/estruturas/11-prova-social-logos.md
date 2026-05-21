# Seção 11 — Prova Social: Logos de Clientes

> **Propósito desta seção no brandbook:** Definir o processo de recebimento, normalização e uso dos logos de clientes em contextos de prova social — logo strip, portfólio, cases e apresentações. Logos de terceiros têm variações de cor, contraste e formato que precisam ser padronizadas antes de serem usadas no sistema Infosaas®.

---

## 11.1 Dois contextos de uso

Logos de clientes aparecem em dois contextos com regras visuais distintas:

| Contexto | Visual | Onde aparece |
|---|---|---|
| **Logo Strip (prova social)** | Monocromático — cinza-400 (`#9E9E9E`) | Home, landing pages, seção "Clientes" |
| **Case / Portfólio** | Cor original do cliente | Página de case, proposta comercial, apresentação |

Nunca usar a versão colorida no logo strip. Nunca desaturar o logo dentro de um case.

---

## 11.2 Formato de entrega exigido

Ao receber um logo de cliente, solicitar ou exportar:

| Parâmetro | Requisito |
|---|---|
| **Formato preferido** | SVG — vetor, escala sem perda |
| **Formato alternativo** | PNG com fundo transparente, mínimo 400px de largura |
| **Fundo** | Sempre transparente — nunca branco ou colorido |
| **Variante de cor** | Solicitar versão em preto sólido ou escuro se disponível |
| **Orientação** | Horizontal preferencial — mais fácil de encaixar em strips |

Se o cliente enviar logo com fundo branco ou JPEG, reprocessar antes de salvar na pasta.

---

## 11.3 Nomenclatura de arquivo

Padrão: `logo-[slug-do-cliente].[ext]`

Onde `[slug-do-cliente]` é o nome do cliente em minúsculo, sem acentos, palavras separadas por hífen.

Exemplos:
- `logo-microsaas.svg`
- `logo-v4-company.png`
- `logo-instituto-singular.png`

Versão colorida (quando salvar as duas):
- `logo-[slug]-color.png` — versão original em cor
- `logo-[slug].png` — versão normalizada para uso em strip (mono)

**Nunca salvar com nomes genéricos como `Frame.png`, `Group.png`, `image 1.png`.**

---

## 11.4 Catálogo atual

Logos existentes em `dna/identidade-visual/ativos/logos-clientes/` e seus nomes corretos:

| Arquivo atual | Nome correto | Cliente | Estado |
|---|---|---|---|
| `Frame.png` | `logo-microsaas.png` | microSaaS | Escuro, ok para strip |
| `Frame-1.png` | `logo-ai-builders.png` | AI Builders | Escuro, ok para strip |
| `Frame-2.png` | `logo-comunidade-sem-codar.png` | Comunidade Sem Codar | Escuro, ok para strip |
| `Frame-3.png` | `logo-instituto-singular-color.png` | Instituto Singular | Tem cor (dourado) — precisa versão mono |
| `Group.png` | `logo-v4-company.png` | V4 Company | Preto, ok para strip |
| `Group 10005.png` | `logo-speake-color.png` | Speake | Tem cor (roxo) — precisa versão mono |
| `Group 10006.png` | `logo-rufy-color.png` | Rufy | Tem cor (laranja/vermelho) — precisa versão mono |
| `Group 10007.png` | `logo-g4-color.png` | G4 | Tem cor (rosa/salmão) — precisa versão mono |
| `Group 10067.png` | `logo-turbox.png` | Turbox | Escuro, ok para strip |
| `image 1.png` | `logo-phlebo-academy.png` | Phlebo Academy | Escuro, ok para strip |
| `image 9.png` | `logo-pandora-treinamentos.png` | Pandora Treinamentos | Escuro, ok para strip |
| `image 10.png` | `logo-esporte-educa-color.png` | Esporte Educa | Tem cor (laranja) — precisa versão mono |
| `image 11.png` | `logo-fideliza-pro-color.png` | Fideliza Pro | Tem cor (azul) — precisa versão mono |
| `image 12.png` | `logo-idomestica-color.png` | iDoméstica | Tem cor (laranja) — precisa versão mono |
| `Ativo 13 1.png` | `logo-nulink-color.png` | Nulink | Tem cor (verde gradiente) — precisa versão mono |

**Resumo:** 8 logos prontos para strip · 7 logos precisam de versão monocromática

---

## 11.5 Como normalizar para strip (versão mono)

O objetivo é deixar todos os logos com tom neutro equivalente a cinza-400 (`#9E9E9E`) para fundos claros, ou cinza-200 (`#E0E0E0`) para fundos escuros.

**No Figma:**
1. Importar o logo original
2. Selecionar todos os elementos e aplicar `Fill: #9E9E9E`
3. Se houver gradiente, substituir por cor sólida
4. Exportar como PNG 2x com fundo transparente

**Alternativa (CSS filter):**
```css
.logo-strip img {
  filter: grayscale(1) brightness(0.6);
  opacity: 0.6;
  transition: opacity 200ms var(--ease);
}
.logo-strip img:hover {
  opacity: 0.9;
}
```

O `filter` resolve a maioria dos casos sem precisar de variante de arquivo separada.

---

## 11.6 Uso no Logo Strip

Regras de exibição no componente Logo Strip (detalhado em [Seção 09 — Componentes, item 13](./09-componentes.md)):

- Logos em cinza-400 — versão mono ou `filter: grayscale(1) brightness(0.6)`
- Altura padrão por logo: **28–36px**
- Mínimo de 6 logos para strip animada — abaixo disso, usar grid estático
- Duplicar o set para o loop ser seamless no scroll infinito
- Máximo 10 logos na strip visível por vez (clientes excedentes entram na rotação)
- Sempre com eyebrow acima: "Parte do portfólio" ou "Clientes que confiam"

---

## 11.7 Uso em cases e portfólio

Quando o logo aparece junto ao nome do projeto ou resultado:

- Usar versão colorida original (com fundo transparente)
- Tamanho: suficiente para leitura — nunca abaixo de 80px de largura
- Não aplicar filtro de cor da Infosaas® sobre o logo do cliente
- Não sobrepor o logo do cliente com outros elementos gráficos

---

## 11.8 Processo de adição de novo cliente

Checklist ao integrar um novo logo ao sistema:

- [ ] Receber arquivo SVG ou PNG com fundo transparente
- [ ] Renomear para `logo-[slug-do-cliente]-color.[ext]`
- [ ] Criar versão monocromática → `logo-[slug-do-cliente].png`
- [ ] Salvar ambas em `dna/identidade-visual/ativos/logos-clientes/`
- [ ] Adicionar linha na tabela do catálogo (seção 11.4)
- [ ] Adicionar no componente Logo Strip do site se aprovado para prova social

---

## Referências desta seção

- `dna/identidade-visual/ativos/logos-clientes/` — pasta dos logos
- [Seção 09 — Componentes, item 11 (Social Proof Bar)](./09-componentes.md)
- [Seção 09 — Componentes, item 13 (Logo Strip)](./09-componentes.md)
- [Seção 10 — Exemplos de Aplicação, item 10.6 (Consistência)](./10-exemplos-aplicacao.md)
