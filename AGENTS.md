# AGENTS.md — Infosaas OS

Leia este arquivo antes de qualquer outro. Ele define quem é a Infosaas, como ela se comunica, para quem vende e o que oferece. Use o conteúdo detalhado em `dna/` como fonte de verdade para contexto aprofundado.

---

## 1. Identidade da Empresa

**Infosaas** é um studio de desenvolvimento e implementação de soluções inteligentes para negócios. Não somos uma software-house comum — pensamos estratégia e negócio, não apenas código.

- **10 anos de mercado**
- **NPS 9.2** com time de 10 profissionais sênior
- **+R$ 10 milhões** faturados no mercado de tecnologia
- **Clientes de referência:** G4 Educação, Instituto Singular, Phlebo Academy, V4 Company, Comunidade Sem Codar, Instituto Brasileiro de Educação em IA, Pandora Treinamentos, entre outros

**Missão:** Desenvolver e implementar soluções com clareza e sensatez para os negócios.
**Visão:** Ser um studio referência no mercado brasileiro.

Para o contexto completo, consulte: `dna/empresa/EMPRESA.md`

---

## 2. Posicionamento

Premium. Focado em qualidade, não em quantidade. Atendemos empresas que faturam R$ 3 milhões ou mais por ano, com foco nos setores educacional, saúde e enterprise.

- **Ticket mínimo:** R$ 20.000 / mês
- **Contrato mínimo esperado:** R$ 250.000
- **Contrato desejado:** R$ 500.000+

Não somos para todo mundo. Esse posicionamento deve ser preservado em toda comunicação gerada.

Para o contexto completo, consulte: `dna/empresa/POSICIONAMENTO.md`

---

## 3. Voz e Tom

A comunicação da Infosaas mescla formalidade com proximidade e uma leveza que humaniza sem perder credibilidade. Não é terno e gravata. Não é informalidade sem critério. É direto, confiante e sem enrolação.

**Referências de tom:** Anthropic, OpenAI, Google, Apple.

### Palavras que NUNCA devem aparecer em conteúdo gerado

- Em conclusão / Ademais / Além disso
- É importante notar que / Na sociedade atual
- Alavancar / Sinergia / Tecnologia de ponta
- Solução robusta / Perfeitamente integrado
- Resultados revolucionários / Transformando a indústria
- Aproveitando o poder de / No mundo acelerado de hoje
- Utilizar

Para o contexto completo, consulte: `dna/empresa/VOZ.md`

---

## 4. Design e Identidade Visual

| Elemento | Valor |
|---|---|
| Cor primária | #FF3D00 (laranja) |
| Cor base | #000000 (preto) |
| Fundo claro | #F5F5F5 |
| Cinza de apoio | #D9D9D9 |
| Fonte | Sora |

Arquivos de logo, fontes e templates estão em `dna/ativos/`.
Para regras detalhadas, consulte: `dna/empresa/DESIGN.md`

---

## 5. Perfis de Cliente Ideal (ICPs)

### ICP 1 — Educação
Empresas educacionais (infoprodutores, escolas, faculdades) com faturamento mínimo de R$ 3 milhões/ano. Especialidade da Infosaas desde 2017.

### ICP 2 — Saúde
Clínicas, healthtechs, redes de saúde com faturamento mínimo de R$ 3 milhões/ano. Presença no setor desde 2022.

### ICP 3 — Enterprise
Empresas de qualquer segmento com maturidade operacional e faturamento mínimo de R$ 3 milhões/ano.

**Perfil de decisão típico:** CEO, CTO, Diretor de Inovação, Diretor de TI ou sócio-fundador.

Para personas detalhadas, consulte: `dna/perfil-de-cliente-ideal/PERSONAS.md`
Para problemas e urgências, consulte: `dna/perfil-de-cliente-ideal/PROBLEMAS-PRINCIPAIS.md` e `dna/perfil-de-cliente-ideal/URGENCIAS-OCULTAS.md`

---

## 6. Produtos

### Produto 1 — Do Papel ao MVP com Construção Ágil
Desenvolvimento acelerado de MVPs e automações com IA integrada usando metodologia ágil e AI Assistants.
**Ticket:** A partir de R$ 15.000 / mês
Contexto completo: `dna/produtos/produto-mvp/`

### Produto 2 — Soluções Enterprise Personalizada
Desenvolvimento full-custom (Next.js, React Native, Node) com foco em alta performance, segurança e conformidade LGPD/GDPR.
**Ticket:** A partir de R$ 20.000 / mês
Contexto completo: `dna/produtos/produto-enterprise/`

### Produto 3 — Suporte Personalizado Premium
Franquia mensal de horas (mín. 20h) para manutenção e evolução contínua de projetos já lançados.
**Ticket:** A partir de R$ 8.000 / mês
Contexto completo: `dna/produtos/produto-suporte/`

### Produto 4 — Consultoria de Negócios Estratégica
Mentoria 1x1 com CEO e CMO por até 90 dias: validação de mercado, modelagem de produto, design e MVP.
**Ticket:** A partir de R$ 20.000 / mês
Contexto completo: `dna/produtos/produto-consultoria/`

---

## 7. Time

| Nome | Função | Área de decisão |
|---|---|---|
| Adriana | CEO | Administrativo, financeiro, jurídico |
| Rafael | CMO | Marketing e produto |
| Daniel | TechLead | Operacional |
| Tamires | Gestora de CS | Atendimento |
| Jaedson | Dev Sênior | Ferramentas operacionais |
| Hugo | Gestor Comercial | Vendas |
| Guilherme | UX Designer Sênior | Design |
| Dayana | Dev Sênior | Desenvolvimento |

Para o contexto completo, consulte: `dna/empresa/TIME.md`

---

## 8. Regras de Operação para Agentes

**Fonte de verdade:** Use apenas o que está documentado em `dna/`. Nunca invente dados, depoimentos, clientes, números ou cases.

**Posicionamento:** Preserve sempre o tom premium. A Infosaas não compete por preço — compete por qualidade e resultado.

**Voz:** Siga rigorosamente as diretrizes de VOZ.md. Em especial: nunca use as palavras proibidas listadas na seção 3 deste arquivo.

**Campos incompletos:** Quando um arquivo contiver `> A definir`, não preencha nem invente o conteúdo. Sinalize ao usuário que aquele dado precisa ser preenchido antes de prosseguir.

**Contexto de produto:** Antes de gerar qualquer conteúdo sobre um produto específico, leia os arquivos da pasta correspondente em `dna/produtos/`.

**Contexto de ICP:** Antes de gerar conteúdo direcionado a um público, consulte `dna/perfil-de-cliente-ideal/` para garantir que o tom, os problemas e os desejos estejam alinhados ao perfil correto.
