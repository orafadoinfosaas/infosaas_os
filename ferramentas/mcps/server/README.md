# Infosaas OS — MCP Server

Servidor MCP que expõe o **cérebro da empresa** (`dna/`) dentro do Claude, sem IDE.
Implementa a **Fase 1** do [`IMPLEMENTACAO-MCP.md`](../../../IMPLEMENTACAO-MCP.md): cérebro
**só-leitura**, single-tenant, auth por **bearer token**.

## O que esta fase entrega
- Servidor HTTP **Streamable HTTP** (`POST /mcp`) + healthcheck (`GET /health`).
- `dna/**/*.md` exposto como **resources** (`infosaas://dna/<caminho>`).
- Tool **`buscar_no_cerebro(consulta)`** — busca por palavra-chave no `dna/`.
- Auth **bearer** (`MCP_TOKEN`), comparação de tempo constante.
- `tenantPath()` com proteção anti path-traversal (base do isolamento da Fase 3).

## Rodar em dev
```bash
cd ferramentas/mcps/server
cp .env.example .env.local      # preencha MCP_TOKEN
npm install
npm run dev                     # tsx watch — sobe em http://localhost:8787
```
Em dev (sem `CLIENTS_ROOT`), o servidor lê o `dna/` **deste repo** automaticamente.

## Build / produção
```bash
npm run build && npm start
```
Em produção, defina `CLIENTS_ROOT=/mnt/clientes` (mount do Nextcloud) — aí o tenant
resolve para `/mnt/clientes/<TENANT_ID>/dna`. Deploy via systemd + reverse proxy
(Nginx/Caddy) com TLS em `mcp.infosaas.ai` — ver §6 do doc.

## Variáveis de ambiente
| Var | Default | Para quê |
|---|---|---|
| `MCP_TOKEN` | — (obrigatório) | bearer que o conector do Claude envia |
| `PORT` | `8787` | porta HTTP local (atrás do proxy) |
| `TENANT_ID` | `infosaas` | tenant fixo na Fase 1 |
| `CLIENTS_ROOT` | vazio (dev = repo) | raiz das pastas de cliente em produção |
| `APP_URL` | vazio | app de conteúdo na mesma VPS (Fase 2) |

## Estrutura
```
src/
├── index.ts          # bootstrap HTTP + bearer + Streamable HTTP
├── server.ts         # monta o McpServer (registra resources/tools)
├── auth/bearer.ts    # Fase 1: token simples (Fase 3: OAuth)
├── fs/paths.ts       # tenantPath() — resolução segura por tenant
└── brain/
    ├── resources.ts  # dna/ como resources
    └── search.ts     # tool buscar_no_cerebro
```

## Conectar no Claude (Fase 1)
Claude Desktop → **Configurações → Conectores → Adicionar conector personalizado** →
URL `https://mcp.infosaas.ai/mcp`, autenticando com o **token** fornecido.
Localmente, aponte para `http://localhost:8787/mcp`.

## Próximas fases
- **Fase 2** — `src/tools/` (`criar_conteudo`, `publicar_instagram`) + `src/prompts/`.
- **Fase 3** — OAuth multi-tenant, `tenancy/`, registro modular por `tenant.json`.
- **Fase 4** — `scripts/provisionar-cliente.sh`.
