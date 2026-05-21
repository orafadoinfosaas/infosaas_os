# Seção 10 — Exemplos de Aplicação

> **Propósito desta seção no brandbook:** Mostrar como o sistema visual da Infosaas® se aplica fora do site institucional — em apresentações, redes sociais, email, documentos formais e product cards. Cada superfície tem suas próprias restrições e oportunidades, mas todas partem do mesmo sistema de tokens.

---

## 10.1 Apresentação (slides)

### Contexto de uso

Propostas comerciais, pitches para clientes, apresentações internas de projeto, reuniões de kickoff.

### Layout base

**Slide de capa:**
- Fundo: laranja `#FF3D00` ou preto `#000000`
- Logo: `logo-branco.svg` no canto superior esquerdo
- Símbolo decorativo: `simbolo-branco.svg` escalado, offset, low-opacity
- Título: Sora 800, display, branco, 3 linhas máximo, alinhado à esquerda
- Subtítulo: Sora 400, 20px, rgba(255,255,255,0.75)

**Slide de conteúdo:**
- Fundo: `#F5F5F5` (branco-off)
- Eyebrow: Sora 500, 11px, laranja, uppercase
- Headline: Sora 700, 32–40px, preto
- Body: Sora 400, 18px, cinza-600
- Numeração de slide: cinza-400, canto inferior direito

**Slide de dado/número:**
- Número grande: Sora 900, 80–100px, laranja ou preto
- Label: Sora 600, 18px, cinza-600

**Slide de citação/depoimento:**
- Fundo preto
- Aspas: `"` em laranja, Sora 900, 80px
- Citação: Sora 400, 22px, branco
- Atribuição: Sora 600, 14px, cinza-400

### Regras gerais de slides

- Nunca centralizar texto — sempre alinhado à esquerda
- Máximo de 3 pontos por slide
- Sem clip-art, ilustrações ou fotos de banco de imagem genéricas
- Fontes: apenas Sora — sem mistura
- Transição entre slides: nenhuma ou fade simples (200ms)

---

## 10.2 Redes sociais

### Instagram (feed)

**Formato:** 1080×1080px (quadrado) ou 1080×1350px (retrato)

**Variante laranja (padrão):**
- Fundo laranja `#FF3D00`
- Texto: branco, Sora 800/900
- Símbolo decorativo em background
- Máximo 3 linhas de texto principal

**Variante off-white:**
- Fundo `#F5F5F5`
- Texto preto, palavra de destaque em laranja
- Ideal para dados, quotes, listas curtas

**Variante preta:**
- Fundo preto
- Texto branco-off
- Para posts de posicionamento mais sóbrios

### LinkedIn

**Formato de post com imagem:** 1200×628px

**Estrutura:**
- Logo no canto superior direito
- Headline ocupando 60–70% do frame
- Fundo laranja, preto ou off-white

**Regras para LinkedIn:**
- Texto do post: até 3 parágrafos, sem emojis em excesso
- Voz: profissional, mais pessoal que o site — "a gente" é aprovado
- Posts de case: screenshot do projeto + headline de resultado

### Reels / Stories

- Formato: 1080×1920px
- Logo no topo
- Texto grande, poucos elementos
- Sem animação complexa — fade ou estático

### Regras gerais para redes

- Nunca usar fotos de banco de imagem genéricas
- Nunca misturar as 4 cores da paleta em um único post
- Manter identidade mesmo em formatos pequenos (logo sempre legível)
- Hashtags: no máximo 5 no LinkedIn, no máximo 10 no Instagram

---

## 10.3 Email e comunicação

### Assinatura de email

**Estrutura:**
```
[Nome]
[Cargo] · infosaas®
[email] · [telefone]
[logo-black.svg] [tamanho: 80px de largura]
```

**Regras:**
- Fonte: substituição segura — Arial 13px (Sora não é fonte segura de email)
- Cor do nome: `#000000`
- Cor de destaque (cargo, marca): `#FF3D00`
- Sem foto de perfil na assinatura
- Sem citações motivacionais ou disclaimers longos
- Sem ícones de redes sociais em excesso — no máximo LinkedIn

### Template de email de proposta

- Header: logo centralizado com fundo branco, linha hairline abaixo
- Body: fonte Arial/Helvetica 16px, cor `#0A0A0A`, line-height 1.6
- Destaque: texto em `#FF3D00` para números e CTAs importantes
- CTA button: tabela HTML com fundo `#FF3D00`, texto branco, `border-radius: 8px`
- Footer: cinza-500, 12px, logo menor

### Regras gerais de email

- Nunca usar imagem como único conteúdo (problema de entregabilidade)
- Assunto do email: sem emojis, específico — não "Proposta"
- Saudação: "Olá [Nome]," — nunca "Prezado(a)"
- Assinatura: sempre, mesmo em respostas

---

## 10.4 Documentos formais

### Proposta comercial (PDF)

**Estrutura de páginas:**
1. Capa (laranja ou preta) — nome do cliente, projeto, data
2. Índice
3. Contexto do negócio — problema diagnosticado
4. Solução proposta — escopo, tecnologias, metodologia
5. Time envolvido — nomes, cargos, experiência relevante
6. Timeline — cronograma visual
7. Investimento — valores e condições
8. Próximos passos — CTA claro

**Visual:**
- Cabeçalho: logo-black.svg, linha laranja hairline abaixo
- Rodapé: `infosaas® · infosaas.ai` em cinza-500
- Numeração de página: canto inferior direito, cinza-400
- Fonte: Sora (se o PDF for exportado de Figma ou via CSS) ou Georgia/Helvetica para PDF Word
- Destaque em laranja: apenas para KPIs, valores e elementos críticos

### Contrato

- Cabeçalho: logo-black.svg + nome das partes
- Corpo: Times New Roman 12px ou Arial 12px (padrão jurídico)
- Sem elementos decorativos
- Rodapé com numeração de página e `infosaas®`

### Brief de projeto

- Layout mais livre, pode usar Sora em PDF
- Eyebrow por seção em laranja
- Grid 2 colunas para comparações
- Screenshots se necessário

---

## 10.5 Product Card

Cartão de produto físico ou digital para uso em apresentações, site, redes e PDFs.

### Anatomia

- Fundo: branco (`--bg-elev`) ou laranja (variante de destaque)
- Raio: `--radius-xl` (32px)
- Padding: `--space-7` (48px)
- Eyebrow: nome da linha de produto (ex: "MVP Ágil")
- Headline: proposta de valor em 2–3 linhas
- Body: 2–3 bullets do que está incluído
- Ticket bar: "A partir de R$ X.000/mês" em laranja
- CTA: botão primário ou ghost

### Variantes

**Card branco:**
- Contexto: grid de produtos em fundo off-white
- Borda: 1px solid `--border`

**Card laranja:**
- Contexto: produto em destaque, seção CTA
- Fundo laranja, todos os textos em branco

**Card dark:**
- Contexto: página de produto individual, modo escuro
- Fundo preto, textos branco-off, acento laranja

---

## 10.6 Consistência entre superfícies

A marca deve ser reconhecível em qualquer superfície sem precisar do logo. Para isso:

| Elemento-chave | Como manter |
|---|---|
| Tom de voz | Premissas, não promessas. Sem imperativo. Sem corporatês. |
| Tipografia | Sora sempre. Apenas Sora. |
| Paleta | Um acento (laranja) + três neutros. Nada mais. |
| Alinhamento | Esquerda em todos os formatos — nunca centralizado |
| Espaçamento | Generoso. Se parecer apertado, abrir mais. |
| Logo | Sempre com ® em minúsculo — nunca INFOSAAS |

---

## Referências desta seção

- `dna/identidade-visual/ativos/aplicacoes-banners-com-gente/` — exemplos com foto
- `dna/identidade-visual/ativos/aplicacoes-banners-sem-gente/` — exemplos com símbolo
- `dna/identidade-visual/ui_kits/marketing/` — componentes de marketing em código
- `dna/empresa/VOZ.md` — regras de voz para todos os canais
