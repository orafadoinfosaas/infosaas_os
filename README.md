# InfoSaaS — Site Institucional

Site institucional da [InfoSaaS](https://infosaas.ai), construído com Astro 6 e React 19. Geração estática com deploy via Docker/EasyPanel.

---

## Stack

| Tecnologia | Versão | Função |
|---|---|---|
| [Astro](https://astro.build) | ^6.3 | Framework principal (SSG) |
| [React](https://react.dev) | ^19 | Componentes interativos |
| [intl-tel-input](https://intl-tel-input.com) | ^29 | Campo de telefone internacional |
| Node.js | >=22.12 | Runtime de build |
| Nginx | alpine | Servidor de produção |

---

## Estrutura de Páginas

```
/                          → Home
/studio                    → InfoSaaS Studio (equipe e fundadores)
/contato                   → Formulário de contato

/segmentos/educacao        → Segmento: Educação
/segmentos/enterprise      → Segmento: Enterprise
/segmentos/saude           → Segmento: Saúde

/solucoes/consultoria      → Solução: Consultoria
/solucoes/enterprise       → Solução: Enterprise
/solucoes/mvp              → Solução: MVP
```

---

## Estrutura do Código

```
src/
├── layouts/
│   └── BaseLayout.astro          # Layout base com Head, Header e Footer
├── pages/
│   ├── index.astro               # Home
│   ├── studio.astro              # Studio
│   ├── contato.astro             # Contato
│   ├── segmentos/
│   │   ├── educacao.astro
│   │   ├── enterprise.astro
│   │   └── saude.astro
│   └── solucoes/
│       ├── consultoria.astro
│       ├── enterprise.astro
│       └── mvp.astro
├── components/
│   ├── Header.astro
│   ├── Footer.astro
│   └── sections/
│       ├── home/                 # Hero, About, Customers, SocialNumbers
│       ├── studio/               # Hero, About, Founders, SocialNumbers
│       ├── contato/              # FormContato
│       ├── consultoria/          # Hero, About, Benefits, HowItWorks, SocialNumbers, CTA
│       ├── mvp/                  # Hero, About, Benefits, HowItWorks, SocialNumbers, CTA
│       ├── enterprise-sol/       # Hero, About, Benefits, HowItWorks, SocialNumbers, CTA
│       ├── educacao/             # Hero, About, Problems, SocialNumbers
│       ├── enterprise/           # Hero, About, Problems, SocialNumbers
│       ├── saude/                # Hero, About, Problems, SocialNumbers
│       └── shared/               # CTA.astro, Soluctions.astro (componentes reutilizáveis)
└── styles/
    └── global.css
public/
├── fonts/
├── logos/
├── logos-clientes/
├── favicon.svg / favicon.ico / favicon.png
├── img-og-meta.jpg               # OG meta image
└── BG-SITE.png                   # Background principal
```

---

## Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (http://localhost:4321)
npm run dev

# Gerar build de produção
npm run build

# Pré-visualizar build local
npm run preview
```

---

## Deploy com Docker (EasyPanel)

O projeto usa build multi-stage: Node 22 compila os assets estáticos, Nginx alpine os serve em produção.

### Build e execução local

```bash
docker build -t infosaas-site .
docker run -p 80:80 infosaas-site
```

### EasyPanel

1. Crie um novo **App** no EasyPanel
2. Selecione a fonte como **GitHub** e aponte para este repositório
3. O EasyPanel detecta o `Dockerfile` automaticamente
4. Defina a porta exposta como `80`
5. Salve e faça o deploy

> O build já inclui compressão gzip e cache de assets estáticos com `Cache-Control: immutable`.

---

## Configurações

### `astro.config.mjs`

```js
export default defineConfig({
  site: 'https://infosaas.ai',
});
```

O site usa **output estático** (padrão do Astro). Todas as páginas são pré-renderizadas em HTML no momento do build.

---

## Segmentos e Soluções

**Segmentos** descrevem os mercados atendidos pela InfoSaaS:
- **Educação** — Plataformas e ferramentas para instituições de ensino
- **Saúde** — Sistemas para clínicas, hospitais e operadoras
- **Enterprise** — Soluções para grandes empresas

**Soluções** descrevem os produtos/serviços oferecidos:
- **MVP** — Desenvolvimento ágil de produto mínimo viável
- **Consultoria** — Diagnóstico e estratégia de transformação digital
- **Enterprise** — Implementação completa para grandes operações

---

## Licença

Proprietário — InfoSaaS Ltda. Todos os direitos reservados.
