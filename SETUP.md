# Setup — máquina nova

Passo a passo pra colocar o repositório `infosaas-os` rodando do zero em outro computador.

## TL;DR (atalho)

```bash
git clone <repo-url>
cd infosaas-os

# Roda o script de setup (cria .env.local a partir dos exemplos + instala deps)
#   Windows (PowerShell):
pwsh scripts/setup-machine.ps1
#   macOS/Linux:
bash scripts/setup-machine.sh

# Depois preencha os tokens nos .env.local indicados pelo script e rode o app:
cd ferramentas/apps/criador-conteudo-visual && npm run dev
```

---

## Pré-requisitos

- **Node.js 20+** (testado com 24.x). Confira: `node --version`.
- **Git**.
- **Claude Code** instalado (se for usar o agente/skills/slash commands).

## 1. Clonar

```bash
git clone <repo-url>
cd infosaas-os
```

O que vem no clone: todo o código do app, o DNA da marca (`dna/`), conteúdos já
criados (`marketing/conteudo/`), linhas editoriais (`marketing/social/`), o site
(`marketing/site/`), e o slash command `/criar-conteudo` (`.claude/commands/`).

## 2. App "Criador de Conteúdo Visual"

```bash
cd ferramentas/apps/criador-conteudo-visual
npm install
cp .env.example .env.local      # Windows: copy .env.example .env.local
```

Edite `.env.local` e preencha pelo menos:

- `OPENAI_API_KEY` — **obrigatório**. Sem isso, geração de texto/imagem retorna 503.
- `COMPOSIO_API_KEY` — opcional (publicação no Instagram). Sem isso o app degrada com elegância.

Rode:

```bash
npm run dev
# abre em http://localhost:3000
```

## 3. MCP servers do Claude Code (opcional, só se for usar o agente no IDE)

Os tokens dos MCP servers ficam **fora do git**. Use os templates:

```bash
cd ferramentas/mcps
cp .env.example .env.local      # preencha ACTIVEPIECES_MCP_TOKEN
```

Depois registre os MCP servers no Claude Code da máquina nova. Ex. Activepieces:

```bash
claude mcp add activepieces --transport http \
  "https://activepieces-activepieces.zdnmrb.easypanel.host/api/v1/projects/Na7cDZQONlKnnMvCgPxfq/mcp-server/http" \
  --header "Authorization: Bearer <SEU_TOKEN>"
```

A estrutura de referência está em `ferramentas/mcps/mcp.json` (template, sem token).

## O que NÃO vem pelo git (e por quê)

| Item | Onde configurar |
|------|-----------------|
| `node_modules/` | `npm install` no app |
| `OPENAI_API_KEY` e outros segredos do app | `ferramentas/apps/criador-conteudo-visual/.env.local` |
| Token Activepieces | `ferramentas/mcps/.env.local` + `claude mcp add` |
| `.claude/settings.local.json` | gerado pelo Claude Code; você reaceita permissões na 1ª execução |
| `.claude/skills/` | compartilhadas globalmente pelo Claude Code (`~/.claude/skills/`) |

## Conferir que está tudo certo

```bash
# App responde?
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/

# Geração configurada? (deve devolver JSON, não 503)
curl -s -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"mode":"generate","contentType":"post","funnelPhase":"descoberta","templateId":"editorial","brief":"teste"}'
```
