# Implementação — Infosaas OS via MCP

> Documento de arquitetura e instrução para transformar o **Infosaas OS** (o "Business Brain")
> em um serviço acessível pelo cliente **direto no Claude**, sem IDE, usando um **servidor MCP
> oficial** que lê a memória da empresa no Nextcloud (Hetzner Storage Share) e executa
> automações.
>
> **Status:** Fase 1 (cérebro só-leitura) e Fase 2/Camada 1 (CRUD do OS) **em produção** em
> `mcp.infosaas.ai`. Tools semânticas (Fase 2) / OAuth (Fase 3) / onboarding (Fase 4) pendentes.
> **Visão geral da arquitetura do OS (control plane + data plane + frota):**
> [`IMPLEMENTACAO-OS.md`](IMPLEMENTACAO-OS.md).
> **Stack escolhida:** SDK oficial do MCP (`@modelcontextprotocol/sdk`, TypeScript).

---

## 1. Objetivo e princípios

### O problema
O Infosaas OS é uma estrutura de pastas (DNA da empresa + ferramentas + conteúdo) que hoje só é
plenamente utilizável dentro de uma IDE com Claude Code. **A maioria dos clientes não sabe usar
uma IDE.** Precisamos de um caminho de baixíssima fricção.

### A solução
Um **servidor MCP remoto** que:
1. Expõe a **memória da empresa** (o `dna/`) como *resources* que o Claude lê sob demanda.
2. Expõe **automações** (conteúdo, publicação, e operacional) como *tools*.
3. Expõe os **comandos prontos** (ex. `/criar-conteudo`) como *prompts* selecionáveis no menu.
4. É **multi-tenant**: um único servidor atende vários clientes, cada um isolado na sua pasta.

O cliente conecta esse servidor como um **conector remoto no Claude Desktop / claude.ai** e passa
a *conversar* com o cérebro da empresa dele e *disparar* automações — sem IDE, sem escrever prompts.

### Divisão de papéis (regra de ouro)
| Ator | Onde atua | O que faz |
|---|---|---|
| **Você (Infosaas)** | IDE / Claude Code (git) | Constrói sites, escreve as **tools** do MCP, faz deploy |
| **Cliente** | Chat do Claude (conector remoto) | *Consome*: conversa com o cérebro, dispara tools |
| **Ambos** | Nextcloud (UI tipo Drive) | *Editam dados/conteúdo* em zonas separadas |

### Princípios de design
- **Storage e compute são camadas separadas.** Nextcloud guarda arquivos; a VPS roda código.
- **Git = espinha de engenharia** (template do OS + código das tools). **Pasta Nextcloud por
  cliente = OS vivo do cliente.** Não versionar dados de cliente no git da Infosaas.
- **Zonas de escrita separadas:** humano edita `dna/`; agente só escreve em `output/`.
- **Tools modulares:** adicionar capacidade = largar um arquivo + habilitar por tenant.
- **Comece simples (single-tenant + token), evolua (multi-tenant + OAuth).**

---

## 2. Arquitetura

```
┌──────────────────┐   conector remoto MCP      ┌─────────────────────────────┐
│  Claude Desktop  │ ──── (HTTPS + OAuth) ─────▶ │  MCP Server (Node/TS)        │
│  claude.ai       │ ◀──── tools/resources ───── │  VPS Hostinger (existente)   │
│  (o cliente)     │                             │  reverse proxy (TLS) → :8787 │
└──────────────────┘                             │  + site Astro (já roda aqui) │
                                                 │  + app conteúdo (Fase 2)     │
                                                 └──────────────┬──────────────┘
                                                                 │ WebDAV (rclone mount)
                                                                 │ app password Nextcloud
                                                                 ▼
                                                  ┌─────────────────────────────┐
                                                  │  Hetzner Storage Share       │
                                                  │  (Nextcloud GERENCIADO)      │
                                                  │  /clientes/<tenant>/         │
                                                  │    dna/  output/  config/    │
                                                  └─────────────────────────────┘
                                                                 ▲ sync
                                                  ┌──────────────┴──────────────┐
                                                  │  Cliente / Você (Nextcloud   │
                                                  │  desktop, web, mobile)       │
                                                  └─────────────────────────────┘
```

### Por que o MCP precisa de VPS (e não "roda no Nextcloud")
- **Nextcloud = armazenamento.** Guarda, versiona e sincroniza *arquivos*. Não roda processos.
- **MCP server = computação.** É um *processo HTTP rodando* que lê dados e executa ações.
- O **Hetzner Storage Share é Nextcloud GERENCIADO** → você **não tem root/SSH** nele → não dá
  pra instalar o MCP lá. Por isso o MCP roda numa VPS onde você TEM root.
- **Você já tem essa VPS: a Hostinger** (hoje serve só o site Astro). O MCP entra nela, ao lado
  do site. Não precisa contratar máquina nova.
- A VPS Hostinger conversa com as pastas do Storage Share via **WebDAV** (API HTTP nativa do
  Nextcloud), autenticando com uma **app password**. É só HTTPS entre provedores diferentes
  (Hostinger → Hetzner) — funciona normalmente.

### Topologia de deploy: central, multi-tenant (decisão fechada)
**Uma única VPS Hostinger da Infosaas atende todos os clientes**, cada um isolado por pasta +
auth. Não há deploy na infra do cliente.

**Por que central (e não na VPS do cliente) — é uma decisão de negócio, não só técnica:**
- **Recorrência / retenção.** O cérebro, as tools e as atualizações ficam na **sua** infra. O
  cliente mantém o serviço porque o valor vive do seu lado — é produto contínuo, não entrega
  avulsa. Rodar na máquina do cliente abriria a porta pra ele te cortar e ficar com tudo.
- **Update em 1 lugar.** Criou/melhorou uma tool? Deploy único na VPS → todos os clientes
  habilitados recebem na hora. Sem gestão de frota (N máquinas).
- **Fricção zero pro cliente.** Ele não precisa ter, manter ou entender infra nenhuma.

Trade-off assumido: o dado do cliente transita pela infra da Infosaas (isolamento **lógico**, não
físico). Isso se mitiga com a checklist de isolamento da §5 / Fase 3 (auth por tenant,
`tenantPath()`, app passwords com escopo mínimo, logs por tenant).

### Fluxo de uma requisição (exemplo)
1. Cliente no Claude: *"Cria um carrossel sobre onboarding para o ICP de educação."*
2. Claude chama a tool `criar_conteudo` do conector → POST para o MCP na VPS.
3. MCP identifica o **tenant** pelo token/OAuth → resolve a pasta `/clientes/acme/`.
4. MCP lê o `dna/` daquele cliente (via rclone mount) para montar o contexto.
5. MCP executa a automação (gera o conteúdo) e **escreve em `output/`** daquele cliente.
6. Nextcloud sincroniza `output/` → o cliente vê o arquivo aparecer no Drive dele.
7. MCP devolve o resultado ao Claude → cliente vê no chat.

---

## 3. Infraestrutura

### 3.1 Componentes e custo
| Componente | Produto | Custo aprox. | Observação |
|---|---|---|---|
| Storage (memória + sync) | Hetzner **Storage Share** | já assinado | Nextcloud gerenciado, sem root |
| Compute (MCP) | **VPS Hostinger existente** | já assinado | hoje serve o site Astro; o MCP entra junto |
| TLS + domínio | reverse proxy + DNS `mcp.infosaas.ai` | ~0 | Let's Encrypt automático |
| LLM | OpenAI (já usado no app) | uso | tools de geração reaproveitam o app |

> Sem custo de infra novo: o MCP roda na VPS Hostinger que já existe, multi-tenant, ao lado do
> site. Escala vertical (plano maior na Hostinger) só quando precisar.

**O que já roda na VPS hoje:** só o **site Astro** (`marketing/site/code`), estático e leve.
**O app `criador-conteudo-visual`** roda local/Nextcloud por enquanto — só vira pré-requisito na
**Fase 2** (ações). Quando deployado **na mesma VPS**, o MCP o chama por `http://localhost:3000`
(sem expor o app publicamente). **A Fase 1 (cérebro só-leitura) não depende do app.**

### 3.2 Preparar a VPS (uma vez)
```bash
# Você JÁ tem a VPS Hostinger com o site. Só adicionar runtime + rclone.
# Apontar DNS A record: mcp.infosaas.ai → IP da sua VPS Hostinger.

# Na VPS (Ubuntu/Debian):
sudo apt update && sudo apt install -y curl rclone
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt install -y nodejs
# Reverse proxy: REAPROVEITE o que já serve o site.
#   - Se já tem Nginx servindo o Astro → adicione um server block pro subdomínio (ver §6.3).
#   - Se não tem nada/quer simplicidade → instale o Caddy (TLS automático).
```

### 3.3 Conectar a VPS ao Nextcloud via WebDAV (rclone)
No Nextcloud (web do cliente ou da Infosaas): **Configurações → Segurança → criar "App password"**
(uma por tenant, ou uma de serviço com acesso à raiz `/clientes`).

```bash
# Na VPS, configurar o remote rclone do tipo "webdav":
rclone config
#   name: ncloud
#   type: webdav
#   url:  https://<sua-instancia>.your-storageshare.de/remote.php/dav/files/<usuario>/
#   vendor: nextcloud
#   user: <usuario>
#   pass: <app-password>

# Montar como disco local (somente o diretório dos clientes):
sudo mkdir -p /mnt/clientes
rclone mount ncloud:clientes /mnt/clientes \
  --vfs-cache-mode writes \
  --dir-cache-time 10s \
  --poll-interval 15s \
  --daemon
```

**Notas de performance/consistência:**
- `--vfs-cache-mode writes` deixa leitura rápida e escrita confiável.
- `--dir-cache-time 10s` mantém a árvore "fresca" o suficiente para o agente ver arquivos novos.
- Para escala, considere trocar `rclone mount` por **`rclone sync` agendado** (cópia local) para
  leitura + WebDAV direto só para escrita. Comece com o mount; é mais simples.
- O mount deve subir como serviço (systemd) — ver §8.

### 3.4 Layout de pastas por cliente (no Nextcloud)
```
/clientes/
  acme/                         # tenant = acme
    dna/                        # MEMÓRIA — só humano edita (via Nextcloud)
      empresa/  produtos/  perfil-de-cliente-ideal/  identidade-visual/
    output/                     # PRODUÇÃO — só o agente escreve
      conteudo/  relatorios/
    config/
      tenant.json               # quais tools este cliente enxerga, metadados, limites
  beta-corp/
    dna/  output/  config/
```

> **Zonas de escrita separadas** evitam conflitos de sync ("conflicted copy"): humano mexe em
> `dna/`, agente só escreve em `output/`.

---

## 4. Estrutura do projeto MCP (no repo)

Local sugerido: `ferramentas/mcps/server/`.

```
ferramentas/mcps/server/
├── package.json
├── tsconfig.json
├── .env.example
├── src/
│   ├── index.ts                # bootstrap HTTP + Caddy upstream
│   ├── server.ts               # cria o McpServer e registra tools/resources/prompts
│   ├── auth/
│   │   ├── bearer.ts           # Fase 1: token simples
│   │   └── oauth.ts            # Fase 3: OAuth 2.0 multi-tenant
│   ├── tenancy/
│   │   ├── resolve-tenant.ts   # token/OAuth → tenantId → pasta
│   │   └── tenant-config.ts    # lê config/tenant.json (tools habilitadas, limites)
│   ├── fs/
│   │   ├── paths.ts            # resolução SEGURA de caminho (anti path-traversal)
│   │   └── nextcloud.ts        # leitura/escrita sob /mnt/clientes/<tenant>
│   ├── brain/
│   │   ├── resources.ts        # expõe dna/ como resources
│   │   └── search.ts           # tool buscar_no_cerebro
│   ├── tools/
│   │   ├── registry.ts         # registro modular (carrega tools por tenant)
│   │   ├── criar-conteudo.ts   # tool de conteúdo (reaproveita o app)
│   │   ├── publicar-instagram.ts
│   │   └── _exemplo-operacional.ts
│   └── prompts/
│       └── criar-conteudo.ts   # /criar-conteudo como prompt MCP
└── README.md
```

### Dependências
```jsonc
// package.json (essencial)
{
  "name": "infosaas-os-mcp",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.x",   // SDK oficial — confira a versão atual
    "express": "^5",
    "zod": "^3",
    "gray-matter": "^4",                    // ler frontmatter dos .md do dna/
    "fast-glob": "^3"
  },
  "devDependencies": { "tsx": "^4", "typescript": "^5", "@types/express": "^5" }
}
```

> ⚠️ A API do SDK do MCP evolui. Os trechos de código abaixo são **referência conceitual** —
> confirme nomes/assinaturas na doc oficial da versão instalada antes de colar.

---

## 5. Implementação faseada

### Visão geral das fases
| Fase | Entrega | Auth | Tenancy |
|---|---|---|---|
| **1** | Cérebro só-leitura no chat | Bearer token | Single (cliente = você) |
| **2** | Tools de ação (conteúdo/publicação) | Bearer token | Single |
| **3** | Multi-tenant + isolamento | OAuth 2.0 | Multi |
| **4** | Onboarding produtizado (provisiona cliente) | OAuth 2.0 | Multi |

---

### FASE 1 — Cérebro só-leitura (~1 semana)

**Meta:** cliente abre o Claude e conversa com a memória da empresa. Valida a tese de fricção.

**Entregáveis:**
- MCP server HTTP (Streamable HTTP) no ar em `mcp.infosaas.ai`.
- `dna/` exposto como **resources**.
- 1 tool `buscar_no_cerebro(consulta)`.
- Auth por **bearer token** (single-tenant: a pasta é fixa).

#### 5.1 Servidor e transporte (Streamable HTTP)
```ts
// src/index.ts — referência conceitual
import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { buildServer } from "./server.js";
import { checkBearer } from "./auth/bearer.js";

const app = express();
app.use(express.json());

app.post("/mcp", async (req, res) => {
  if (!checkBearer(req)) return res.status(401).json({ error: "unauthorized" });

  // Stateless: um transport por requisição (simples para começar).
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  const server = buildServer({ tenantId: "infosaas" }); // single-tenant na Fase 1
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.listen(8787, () => console.log("MCP on :8787"));
```

```ts
// src/auth/bearer.ts
import type { Request } from "express";
export function checkBearer(req: Request): boolean {
  const tok = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  return !!tok && tok === process.env.MCP_TOKEN;
}
```

#### 5.2 Montar o McpServer
```ts
// src/server.ts — referência conceitual
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerBrainResources } from "./brain/resources.js";
import { registerSearchTool } from "./brain/search.js";

export function buildServer({ tenantId }: { tenantId: string }) {
  const server = new McpServer({ name: "infosaas-os", version: "1.0.0" });
  registerBrainResources(server, tenantId);  // dna/ como resources
  registerSearchTool(server, tenantId);       // tool buscar_no_cerebro
  return server;
}
```

#### 5.3 Resolução segura de caminho (CRÍTICO desde já)
```ts
// src/fs/paths.ts
import path from "node:path";

const ROOT = process.env.CLIENTS_ROOT ?? "/mnt/clientes";

/** Resolve um caminho DENTRO da pasta do tenant. Bloqueia path traversal. */
export function tenantPath(tenantId: string, ...parts: string[]): string {
  const base = path.resolve(ROOT, tenantId);
  const full = path.resolve(base, ...parts);
  if (full !== base && !full.startsWith(base + path.sep)) {
    throw new Error("path traversal bloqueado");
  }
  return full;
}
```

#### 5.4 Expor o `dna/` como resources
```ts
// src/brain/resources.ts — referência conceitual
import fg from "fast-glob";
import { readFile } from "node:fs/promises";
import { tenantPath } from "../fs/paths.js";

export async function registerBrainResources(server, tenantId: string) {
  const dnaDir = tenantPath(tenantId, "dna");
  const files = await fg("**/*.md", { cwd: dnaDir });

  for (const rel of files) {
    server.registerResource(
      rel,                                 // nome
      `infosaas://dna/${rel}`,             // URI
      { title: rel, mimeType: "text/markdown" },
      async () => ({
        contents: [{
          uri: `infosaas://dna/${rel}`,
          text: await readFile(tenantPath(tenantId, "dna", rel), "utf8"),
        }],
      })
    );
  }
}
```

#### 5.5 Tool de busca no cérebro
```ts
// src/brain/search.ts — referência conceitual
import { z } from "zod";
import fg from "fast-glob";
import { readFile } from "node:fs/promises";
import { tenantPath } from "../fs/paths.js";

export function registerSearchTool(server, tenantId: string) {
  server.registerTool(
    "buscar_no_cerebro",
    {
      title: "Buscar no cérebro da empresa",
      description: "Busca trechos relevantes na memória (dna/) da empresa do cliente.",
      inputSchema: { consulta: z.string().describe("o que procurar") },
    },
    async ({ consulta }) => {
      const dnaDir = tenantPath(tenantId, "dna");
      const files = await fg("**/*.md", { cwd: dnaDir });
      const termos = consulta.toLowerCase().split(/\s+/);
      const hits: string[] = [];

      for (const rel of files) {
        const txt = await readFile(tenantPath(tenantId, "dna", rel), "utf8");
        const linhas = txt.split("\n");
        linhas.forEach((linha, i) => {
          if (termos.some((t) => linha.toLowerCase().includes(t))) {
            hits.push(`${rel}:${i + 1}  ${linha.trim()}`);
          }
        });
      }
      const texto = hits.slice(0, 40).join("\n") || "Nada encontrado.";
      return { content: [{ type: "text", text: texto }] };
    }
  );
}
```

> Busca por palavra-chave é suficiente na Fase 1. Quando o cérebro crescer, troque por
> **RAG/embeddings** (ver §9).

**Critério de aceite da Fase 1:**
- Conector aparece no Claude Desktop e lista a tool + os resources.
- Cliente pergunta "qual nosso posicionamento?" e o Claude responde com base no `dna/`.

---

### FASE 2 — Tools de ação

**Meta:** o cliente deixa de só *ler* o cérebro e passa a *disparar ações* — gerar conteúdo
aplicando o DNA dele e (opcional) publicar. Aqui nasce o catálogo de tools reutilizáveis.

**Entregáveis:**
- Tool `criar_conteudo` (gera via API do app e escreve só em `output/`).
- Tool `publicar_instagram` (opcional, via Composio/Activepieces).
- Prompt `criar-conteudo` selecionável no menu do Claude.

**Pré-requisito:** deployar o `criador-conteudo-visual` (hoje roda local/Nextcloud) na **mesma
VPS Hostinger** do MCP. Aí o MCP o chama por `http://localhost:3000` — sem expor o app
publicamente e sem latência de rede externa (`APP_URL=http://localhost:3000` no `.env`).

Reaproveitar o app. Duas estratégias:
- **(a)** O MCP chama a API HTTP do app (`/api/generate`, `/api/publish`) via `localhost` — desacoplado.
- **(b)** O MCP importa as libs do app diretamente — menos saltos de rede.

Recomendado: **(a)** no começo (o app já existe e tem as rotas). O MCP vira um "tradutor"
chat→API e cuida do contexto/tenant.

```ts
// src/tools/criar-conteudo.ts — referência conceitual
import { z } from "zod";
import { tenantPath } from "../fs/paths.js";
import { writeFile, mkdir } from "node:fs/promises";

export function registerCriarConteudo(server, tenantId: string) {
  server.registerTool(
    "criar_conteudo",
    {
      title: "Criar conteúdo de Instagram",
      description: "Gera carrossel/post/anúncio aplicando o DNA do cliente e salva em output/.",
      inputSchema: {
        tipo: z.enum(["carrossel", "post", "anuncio"]).default("carrossel"),
        fase: z.enum(["descoberta", "relacionamento", "prontidao"]).default("descoberta"),
        brief: z.string(),
        produto: z.enum(["consultoria", "enterprise", "mvp", "suporte"]).optional(),
      },
    },
    async (args) => {
      // 1) chama a API do app de conteúdo (passando o DNA do tenant)
      const r = await fetch(`${process.env.APP_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "generate", ...args, tenantId }),
      });
      if (r.status === 503) {
        return { content: [{ type: "text", text: "OPENAI_API_KEY ausente no app." }], isError: true };
      }
      const data = await r.json();

      // 2) ESCREVE só em output/ (zona do agente)
      const dir = tenantPath(tenantId, "output", "conteudo");
      await mkdir(dir, { recursive: true });
      await writeFile(`${dir}/${data.slug}.json`, JSON.stringify(data, null, 2));

      return { content: [{ type: "text", text: `Conteúdo criado: output/conteudo/${data.slug}` }] };
    }
  );
}
```

**Prompt selecionável** (o "/criar-conteudo" no menu do Claude):
```ts
// src/prompts/criar-conteudo.ts — referência conceitual
server.registerPrompt(
  "criar-conteudo",
  {
    title: "Criar conteúdo",
    description: "Fluxo guiado para criar conteúdo de Instagram com o DNA da empresa.",
    argsSchema: { brief: z.string().optional() },
  },
  ({ brief }) => ({
    messages: [{
      role: "user",
      content: { type: "text", text:
        `Quero criar um conteúdo. ${brief ?? ""} ` +
        `Use a tool criar_conteudo. Se faltar tipo/fase/produto, me pergunte só o que faltar.` },
    }],
  })
);
```

**Critério de aceite da Fase 2:**
- Cliente escolhe **Criar conteúdo** no menu (ou pede no chat) e o arquivo aparece em
  `output/conteudo/` no Drive dele.
- O agente **nunca** escreve fora de `output/` (zona do agente preservada).

---

### FASE 3 — Multi-tenant + isolamento

**Meta:** um único servidor passa a atender **vários clientes** com isolamento por auth — cada
um só enxerga e acessa a própria pasta e as próprias tools.

**Mudanças-chave:**
1. **Auth vira OAuth 2.0.** O conector remoto do Claude faz o cliente "logar"; o servidor MCP
   valida e descobre **qual tenant** é aquele usuário.
2. `resolveTenant(req)` → `tenantId` → todas as operações passam por `tenantPath(tenantId, ...)`.
3. **`config/tenant.json`** define quais tools aquele cliente enxerga.

```ts
// src/tenancy/resolve-tenant.ts — referência conceitual
export async function resolveTenant(req): Promise<string> {
  // OAuth: extrair claim (ex. "org") do token validado → mapear pra tenantId.
  const claim = req.auth?.org;                    // preenchido pelo middleware OAuth
  if (!claim) throw new Error("sem tenant no token");
  return claim;                                   // ex.: "acme"
}
```

```ts
// src/tools/registry.ts — registro modular por tenant
import { readFile } from "node:fs/promises";
import { tenantPath } from "../fs/paths.js";

const ALL = {
  criar_conteudo: () => import("./criar-conteudo.js"),
  publicar_instagram: () => import("./publicar-instagram.js"),
  // _exemplo_operacional: () => import("./_exemplo-operacional.js"),
};

export async function registerToolsForTenant(server, tenantId: string) {
  const cfg = JSON.parse(await readFile(tenantPath(tenantId, "config", "tenant.json"), "utf8"));
  const habilitadas: string[] = cfg.tools ?? [];
  for (const nome of habilitadas) {
    const mod = await ALL[nome]?.();
    mod?.register(server, tenantId);
  }
}
```

#### Visibilidade de tools por cliente (catálogo vs sob medida)
**Regra de ouro: código compartilhado, visibilidade isolada.** O código de *todas* as tools mora
na mesma VPS, mas o que cada cliente **vê** é decidido na conexão, pela auth dele — não pela
existência do arquivo. No `buildServer(tenantId)`, só são registradas as tools daquele tenant; o
`tools/list` do MCP devolve apenas essas. **O cliente B nunca recebe a definição da tool do A.**

Duas categorias:

| Tipo | Exemplo | Quem habilita |
|---|---|---|
| **Catálogo** (reutilizável) | `criar_conteudo`, `publicar_instagram` | vários clientes ligam |
| **Sob medida** (bespoke) | `gerar_relatorio_vendas` (só do A) | só o tenant dono |

Cenário: o cliente A pede uma tool nova. Você cria, faz **deploy único** na VPS (o código passa a
existir pra todos) e liga o flag **só no `tenant.json` do A**:

```jsonc
// /clientes/acme/config/tenant.json   → A enxerga a bespoke
{ "nome": "ACME Educação",
  "tools": ["criar_conteudo", "publicar_instagram", "gerar_relatorio_vendas"],
  "limites": { "geracoes_por_dia": 50 } }
```
```jsonc
// /clientes/beta/config/tenant.json    → B NÃO enxerga (config não menciona a tool)
{ "nome": "Beta Corp",
  "tools": ["criar_conteudo"] }
```

O registry carrega só o que está na lista do tenant → a bespoke do A **não é registrada** na
sessão do B → **invisível pro B.** Deploy é global; visibilidade é por cliente.

**Notas críticas:**
- **Não executar código de tool vindo do Nextcloud.** O *flag* (`tenant.json`) pode morar na pasta
  do cliente, mas o **código das tools fica no repo/VPS** (que você controla). Carregar/rodar
  código de uma pasta que o cliente edita = risco de execução remota (RCE).
- **Atualizar a lista no Claude.** Ao ligar uma tool nova, o cliente pode precisar **reconectar**
  o conector — ou o servidor emite **`notifications/tools/list_changed`** e o Claude atualiza
  sozinho. Implementar essa notificação deixa a UX fluida.

**Checklist de isolamento (segurança):**
- [ ] Todo acesso a arquivo passa por `tenantPath()` (anti path-traversal).
- [ ] `tenantId` vem **sempre** do token/OAuth, **nunca** de um parâmetro da tool.
- [ ] Tools registradas por tenant; código fora do alcance de escrita do cliente.
- [ ] App passwords do Nextcloud com escopo mínimo.
- [ ] Logs por tenant; sem vazar conteúdo de um tenant no log de outro.
- [ ] Rate limit por tenant (`limites` do `tenant.json`).

**Critério de aceite da Fase 3:**
- Dois tenants conectados ao mesmo servidor: cada um lê só o próprio `dna/` e enxerga apenas as
  tools do próprio `tenant.json`.
- Tentativa de um tenant acessar a pasta/tool de outro é bloqueada (`tenantPath()` + auth).

---

### FASE 4 — Onboarding produtizado

**Meta:** transformar "adicionar um cliente" de tarefa manual em **um comando** — provisiona
pasta, DNA template, config e acesso, e entrega o guia de conexão.

**Entregáveis:**
- `scripts/provisionar-cliente.sh <tenantId> "<Nome>"` (ponta a ponta).
- Template de `dna/` versionado no git (base de todo cliente novo).
- Guia de 1 página (§7) + roteiro de call de onboarding.

Script que provisiona um cliente novo de ponta a ponta:
```bash
# scripts/provisionar-cliente.sh <tenantId> "<Nome>"
# 1) cria /clientes/<tenant>/{dna,output,config} no Nextcloud (via rclone)
# 2) copia o TEMPLATE de dna/ do git para a pasta do cliente
# 3) gera config/tenant.json com as tools padrão
# 4) cria o usuário/registro OAuth do tenant
# 5) imprime o guia "Adicione este conector no Claude" com a URL e o passo a passo
```

Entregar ao cliente um **guia de 1 página** (ver §7) e, idealmente, fazer o setup do conector
**junto, numa call de onboarding**.

**Critério de aceite da Fase 4:**
- Rodar o script com um `tenantId` novo cria a pasta completa no Nextcloud e deixa o tenant
  pronto pra conectar — sem nenhum passo manual.
- Um cliente novo conecta o conector e usa o cérebro seguindo apenas o guia de 1 página.

---

## 5.5 Modelo de dados do app no deploy (`criador-conteudo-visual`)

### Princípio: o filesystem É o banco — e isso é proposital
O app **não tem banco de dados externo** e **não precisa de um**. Ele lê o DNA de arquivos e
escreve o conteúdo gerado como arquivos (`content.json`, `caption.md`, threads). Isso dá de
graça: sincronização via Nextcloud, edição humana no Drive, versionamento no git e o cliente
*vendo* os arquivos surgirem. Um banco quebraria essa elegância. Um índice de busca
(RAG/embeddings) só entra **no futuro**, e **em cima** dos arquivos — não no lugar deles (ver §9).

### O único ponto que quebra no deploy: a raiz relativa
Hoje todo acesso a arquivo é centralizado em
[`config/company.ts`](../apps/criador-conteudo-visual/config/company.ts) — `getDnaPath()`,
`getOutputPath()`, `getSkillsPath()`. Mas a raiz é resolvida de forma **relativa ao monorepo**:

```ts
const REPO_ROOT = path.resolve(process.cwd(), '../../..')   // ⚠️ quebra no deploy
```

No deploy isso falha porque (a) o app não terá o monorepo 3 níveis acima e (b) o DNA que importa
**não é o do repo, é o do cliente** (em `/mnt/clientes/<tenant>/dna`).

**Boa notícia:** como `writer.ts`, `reader.ts`, `threads.ts` e `dna/loader.ts` passam *todos* por
essas funções, conserta-se o app inteiro mexendo **só nesse arquivo**.

### Refactor: raiz por env + tenant
```ts
// config/company.ts — depois
import path from 'path'

// No deploy: CLIENTS_ROOT=/mnt/clientes  |  Local (dev): fallback pro monorepo (não quebra nada)
const CLIENTS_ROOT = process.env.CLIENTS_ROOT ?? path.resolve(process.cwd(), '../../..')

export function companyConfigFor(tenantId: string): CompanyConfig {
  // Em dev sem CLIENTS_ROOT, tenantId pode ser '.' (lê o próprio repo); no deploy é o cliente.
  const root = process.env.CLIENTS_ROOT ? path.join(CLIENTS_ROOT, tenantId) : CLIENTS_ROOT
  return {
    id: tenantId,
    name: tenantId,
    dnaPath:    path.join(root, 'dna'),
    skillsPath: path.join(root, '.claude', 'skills', 'comunicacao-funil'),
    outputPath: path.join(root, 'output'),   // antes: marketing/conteudo — agora output/ do tenant
    publish: {
      activepieces_webhook_url: process.env.ACTIVEPIECES_WEBHOOK_URL ?? '',
      activepieces_webhook_secret: process.env.ACTIVEPIECES_WEBHOOK_SECRET,
    },
  }
}
```

O **`tenantId` vem na requisição** (o MCP já sabe qual cliente é, pela auth) — as rotas
`/api/generate`, `/api/content`, etc. passam a receber `tenantId` e resolvem o caminho daquele
cliente. O app já tinha o esqueleto multi-empresa (`COMPANIES` + `COMPANY_ID`); estamos só
tornando-o **por-requisição** em vez de **por-processo**.

> Fluxo: cliente fala no Claude → MCP identifica `tenant=acme` pela auth → chama
> `http://localhost:3000/api/generate` com `tenantId=acme` → app lê `/mnt/clientes/acme/dna` e
> escreve em `/mnt/clientes/acme/output` → Nextcloud sincroniza → cliente vê.

### Persistência: VPS ≠ serverless
- Em **serverless (Vercel)** o filesystem é efêmero/somente-leitura → as escritas **sumiriam**.
- Na **sua VPS com `next start`** (processo Node de vida longa) o disco é **persistente e
  gravável** → o modelo de arquivos funciona.
- Regra: `outputPath` aponta pro **mount do Nextcloud** (`/mnt/clientes/<tenant>/output`),
  **nunca** pra dentro do `.next/` (build). O DNA é lido em **runtime** (não embutir no build).
- Recomendado: build com `output: 'standalone'` no `next.config.ts` e rodar via systemd/PM2.

### Pegadinha: watcher inotify não dispara em mount FUSE
O app usa `chokidar` ([`lib/content/watcher.ts`](../apps/criador-conteudo-visual/lib/content/watcher.ts))
para atualizar "Suas criações" em tempo real via inotify. Em **mount rclone/FUSE, eventos inotify
normalmente não chegam** → a UI não atualiza sozinha. Dois consertos:
1. Ligar **`usePolling: true`** no chokidar (resolve; custa um pouco de CPU), ou
2. Como o próprio app escreve via API, **invalidar o cache na escrita** sem depender de watch.

### `.env` adicional do app (na VPS)
```bash
# ferramentas/apps/criador-conteudo-visual/.env.local (no deploy)
CLIENTS_ROOT=/mnt/clientes
OPENAI_API_KEY=...
# COMPOSIO_API_KEY=...  (opcional, publicação)
```

---

## 6. Deploy (VPS)

### 6.1 systemd — rclone mount
```ini
# /etc/systemd/system/ncloud-mount.service
[Unit]
Description=rclone mount Nextcloud clientes
After=network-online.target
[Service]
ExecStart=/usr/bin/rclone mount ncloud:clientes /mnt/clientes \
  --vfs-cache-mode writes --dir-cache-time 10s --poll-interval 15s
ExecStop=/bin/fusermount -u /mnt/clientes
Restart=always
[Install]
WantedBy=default.target
```

### 6.2 systemd — MCP server
```ini
# /etc/systemd/system/infosaas-mcp.service
[Unit]
Description=Infosaas OS MCP
After=ncloud-mount.service
Requires=ncloud-mount.service
[Service]
WorkingDirectory=/opt/infosaas-mcp
ExecStart=/usr/bin/node dist/index.js
EnvironmentFile=/opt/infosaas-mcp/.env
Restart=always
[Install]
WantedBy=multi-user.target
```

### 6.3 Reverse proxy (TLS + subdomínio, convivendo com o site)
O site Astro já roda nessa VPS. Adicione só o subdomínio do MCP, **reaproveitando o proxy atual**.

**Se já existe Nginx servindo o site** (provável na Hostinger):
```nginx
# /etc/nginx/sites-available/mcp.infosaas.ai  (+ certbot pra TLS)
server {
    server_name mcp.infosaas.ai;
    location / {
        proxy_pass http://localhost:8787;
        proxy_http_version 1.1;
        proxy_set_header Connection "";        # streaming/SSE do MCP
        proxy_buffering off;
    }
}
# sudo certbot --nginx -d mcp.infosaas.ai
```

**Ou, se preferir Caddy** (TLS automático, sem certbot) — usável em paralelo ao Nginx só se as
portas 80/443 estiverem livres; senão fique no Nginx:
```
# /etc/caddy/Caddyfile
mcp.infosaas.ai {
    reverse_proxy localhost:8787
}
```
```bash
sudo systemctl enable --now ncloud-mount infosaas-mcp
sudo systemctl reload nginx   # ou: enable --now caddy
```

> Importante: o transporte do MCP usa streaming (SSE). Desligue buffering no proxy
> (`proxy_buffering off` no Nginx) pra resposta não ficar presa.

### 6.4 `.env` (na VPS, fora do git)
```bash
# /opt/infosaas-mcp/.env
MCP_TOKEN=<token-forte-fase-1>
CLIENTS_ROOT=/mnt/clientes
APP_URL=http://localhost:3000             # app conteúdo na MESMA VPS (Fase 2); vazio na Fase 1
# Fase 3:
OAUTH_ISSUER=...
OAUTH_AUDIENCE=...
```

---

## 7. Como o cliente conecta (guia de 1 página)

> **Conectar o cérebro da sua empresa ao Claude**
> 1. Abra o **Claude Desktop** (ou claude.ai).
> 2. **Configurações → Conectores → Adicionar conector personalizado**.
> 3. Cole a URL: `https://mcp.infosaas.ai/mcp`
> 4. Clique em **Conectar** e faça login quando solicitado (OAuth).
> 5. Pronto: peça *"qual nosso posicionamento?"* ou escolha o comando **Criar conteúdo** no menu.

(Na Fase 1, em vez de OAuth, o conector usa um **token** que a Infosaas fornece — o cliente cola
o token uma vez.)

---

## 8. Segurança

- **Isolamento de tenant** é o item nº 1 (ver checklist na Fase 3).
- **Zonas de escrita:** agente só escreve em `output/`. Nunca deixar tool escrever em `dna/`.
- **Segredos fora do git:** tokens, app passwords e `OPENAI_API_KEY` vivem em `.env` na VPS e no
  app — nunca no repositório. (O repo já tem histórico de remover token vazado do `mcp.json`;
  manter essa disciplina.)
- **App password do Nextcloud** por serviço; revogável a qualquer momento sem trocar senha.
- **TLS sempre** (Caddy/Let's Encrypt). MCP remoto nunca em HTTP puro.
- **Rate limit + limites por tenant** para conter abuso e custo de LLM.
- **Auditoria:** logar `tenantId + tool + timestamp` (sem vazar conteúdo entre tenants).

---

## 9. Evoluções futuras

- **RAG/embeddings** para o cérebro: quando o `dna/` crescer além do que cabe no contexto,
  indexar em um vetor (ex. sqlite-vec/pgvector local na VPS) e trocar `buscar_no_cerebro` por
  busca semântica.
- **`rclone sync` agendado** (cópia local) em vez de mount, para leitura mais rápida em escala.
- **Cache de DNA por tenant** em memória, invalidado por `--poll-interval`.
- **Tools operacionais** (CRM, e-mail, planilhas) conforme a necessidade do cliente — cada uma é
  um arquivo em `src/tools/` habilitado no `tenant.json`.
- **Observabilidade** (uso por tenant, custo de LLM por cliente) para precificação.

---

## 10. Roadmap / checklist

**Fase 1 — Cérebro só-leitura**
- [ ] Preparar a **VPS Hostinger existente** (Node 22 + rclone) + DNS `mcp.infosaas.ai`
- [ ] rclone mount do Storage Share em `/mnt/clientes` (systemd)
- [ ] Scaffold `ferramentas/mcps/server/` (SDK oficial)
- [ ] Streamable HTTP + bearer token
- [ ] `dna/` como resources + tool `buscar_no_cerebro`
- [ ] Reverse proxy (**Nginx do site** / ou Caddy) + TLS + deploy systemd
- [ ] Conectar no Claude Desktop e validar

**Fase 2 — Tools de ação**
- [ ] Tool `criar_conteudo` (via API do app)
- [ ] Tool `publicar_instagram`
- [ ] Prompt `criar-conteudo` no menu
- [ ] Escrita restrita a `output/`

**Fase 3 — Multi-tenant**
- [ ] OAuth 2.0 + `resolveTenant`
- [ ] `tenant.json` + registro modular de tools
- [ ] Checklist de isolamento completo
- [ ] Rate limit por tenant

**Fase 4 — Onboarding**
- [ ] `scripts/provisionar-cliente.sh`
- [ ] Template de `dna/` versionado no git
- [ ] Guia de 1 página + call de onboarding

---

## Apêndice — decisões registradas
- **SDK oficial do MCP** (não framework de terceiros): controle total, dono da stack.
- **Cliente sempre no Claude** (Desktop/web) via conector remoto — alvo único.
- **Topologia única: central, multi-tenant, na VPS Hostinger da Infosaas.** Topologia "na VPS do
  cliente" foi **descartada** — central garante recorrência/retenção (valor na infra da Infosaas)
  e update em 1 lugar.
- **Storage Share é gerenciado** → MCP roda na VPS Hostinger (onde há root), ligada ao Nextcloud
  por WebDAV.
- **Git = template/engenharia; Nextcloud = OS vivo do cliente.**
- **Código das tools compartilhado na VPS; visibilidade por `tenant.json`** (deploy global,
  visibilidade por cliente). Nunca executar código vindo do Nextcloud.
- **Single-tenant + token primeiro; multi-tenant + OAuth depois.**
