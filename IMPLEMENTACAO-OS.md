# Implementação — Infosaas OS (arquitetura geral)

> A "constituição" do Infosaas OS: o modelo geral (control plane + data plane), a camada de
> storage, a **regra de decisão para qualquer ferramenta**, o deploy do Criador de Conteúdo e a
> **distribuição em frota** (como uma atualização sua reflete em todos os clientes).
>
> O detalhe do **servidor MCP** (control plane) vive em [`IMPLEMENTACAO-MCP.md`](IMPLEMENTACAO-MCP.md).
> Este doc é o nível acima: como tudo se encaixa e como escala.
>
> **Status:** arquitetura. MCP Fase 1 + Fase 2/Camada 1 já em produção (ver doc do MCP).
> Criador e frota ainda não construídos. **Atualizado:** 2026-06-08 — storage/hospedagem agora
> **por-cliente** (Nextcloud e VPS do site dele), **billing em dois tiers** (chat grátis × editor
> BYOK) e **painel self-service** como peça nova do control plane.

---

## 1. Modelo mental: Control Plane + Data Plane

Tudo no OS se organiza em duas camadas. Essa separação resolve as aparentes contradições
(MCP central vs app por-cliente) e guia toda decisão futura.

```
CONTROL PLANE (central, seu, multi-tenant)        DATA PLANE (por cliente, isolado)
┌─────────────────────────────────┐               ┌──────────────────────────┐
│ MCP — a PORTA ÚNICA do OS         │               │ criador (instância dele) │
│  + tools leves (CRUD, busca)     │──── chama ───▶│ browser worker (dele)    │
│  + provisionamento / auth / audit│               │ render worker (dele)     │
│ Painel — cofre de credenciais     │               │ Nextcloud DELE (storage) │
│  + login + emissão de token MCP   │               │ VPS do site DELE          │
└─────────────────────────────────┘               └──────────────────────────┘
        UM pra todos os clientes                       UM stack/infra por cliente
```

> **O storage e a hospedagem migraram pro data plane (por-cliente).** Cada cliente tem o
> **Nextcloud dele** e (trilha futura) o **VPS do site dele**. Isso **não** contradiz "control
> plane central = retenção": o central é o **compute/inteligência** (MCP + voz/DNA encodados), não
> a custódia de dado. Storage/hospedagem são camadas burras que o cliente não opera sem o MCP — o
> moat segue na inteligência central. O **painel** é a peça nova do control plane que guarda as
> credenciais desses recursos do cliente e emite a auth do conector.

- **Control plane** = leve, stateless, central. Atualizar custa **quase nada** (muda 1 coisa,
  todos pegam na hora). É onde vive o MCP e as tools leves.
- **Data plane** = pesado, stateful, isolado **por cliente**. Atualizar exige **gestão de frota**
  (§5). É onde vivem os workloads pesados (criador com vídeo, automação de browser, render).

> Princípio inegociável: **tudo no OS é acionável via MCP.** O MCP é a única porta; por baixo, ele
> executa a tool leve nele mesmo **ou** chama o workload per-client. O cliente só vê "o Claude".

---

## 2. Regra de decisão para QUALQUER ferramenta nova

Antes de construir uma ferramenta, classifique-a. Isso define onde ela roda e como atualiza.

| Tipo | Exemplos | Onde vive | Update |
|---|---|---|---|
| **Leve / stateless** | CRUD de arquivo, busca, chamada de API, gerador simples | **Dentro do MCP central** (multi-tenant por pasta/`tenant.json`) | ✅ grátis (central) |
| **Pesada / stateful** | criador (Chromium+ffmpeg), automação de browser (sessão), render de vídeo, runtime grande | **Instância por cliente**, chamada pelo MCP | ⚠️ via frota (§5) |

**Sempre, para qualquer tool:** exposta via MCP · isolada por tenant · mesmo template de
provisionamento/auth/audit.

**Lever de design:** como o update central é grátis e o per-client custa, **maximize o que vive no
MCP** e **minimize o que é per-client**. Quanto mais magra a parte pesada, mais barata a frota.

---

## 3. Camada de Storage — os dois mundos

O OS tem **dois realms** de armazenamento, ambos acessíveis pelo MCP:

```
┌─ Mundo Nextcloud ──────────┐   ┌─ Mundo Git ────────────────┐
│  dna/ · conteúdo · output/ │   │  site · LPs · código        │
│  → tools CRUD (já feitas)  │   │  → tools git-backed →       │
│  → app criador             │   │     commit+push+deploy auto │
└────────────────────────────┘   └─────────────────────────────┘
```

### Nextcloud (conteúdo / cérebro) — POR-CLIENTE
- **Backend WebDAV já construído e dormente** no MCP (Fase 2 do doc do MCP). Decisão técnica:
  **WebDAV-direto via HTTP, não FUSE/mount** — limpo pro container do Easypanel.
- **Decisão atualizada (2026-06-08): cada cliente tem o Nextcloud DELE**, não um Storage Share
  central da Infosaas. Como WebDAV-direto liga em **URL + credencial** (não em pasta montada),
  "plugar" vira **`{url, user, app-password}` por tenant**, guardado no **painel** (Fase 4 do MCP).
  Isolamento passa de lógico → **físico**. Custo novo: N Nextclouds heterogêneos pedem
  **health-check por tenant**.
- **Onde isso destrava o CRUD via chat:** o cliente que usa **Claude Chat** (não Claude Code) ganha
  CRUD completo do DNA dele via MCP — exatamente a fricção-zero que o OS persegue.
- **Atenção:** o **app criador usa filesystem direto** (não WebDAV). Pra ele, persistência = **volume**
  por instância; sincronizar com o Nextcloud do cliente é etapa posterior (rclone sidecar ou mount).

### Billing do conteúdo — dois tiers (decisão-chave)
O MCP **não roda LLM**: no chat, quem gera é o LLM do host (assinatura do cliente). Isso separa:
- **Chat via MCP** → texto gerado pelo **Claude/GPT do cliente** → **custo zero p/ Infosaas**.
- **Editor** → pipeline do app chama a OpenAI com a **API key do cliente (BYOK)** → pago, controlado.

Imagem (`gpt-image-1`) e vídeo (Remotion/ffmpeg) sempre caem no tier pago/render. Detalhe e os dois
modos de `criar_conteudo` em [`IMPLEMENTACAO-MCP.md`](IMPLEMENTACAO-MCP.md) (Fase 2).

### Git (site / LPs / código)
- Vive no repo, deploya pela VPS. Editar pelo chat = tool **git-backed**: edita via GitHub API →
  commit → push → webhook do Easypanel → redeploy automático. Guardrails: confirmação, e build que
  falha seguro (erro = deploy falha, site atual continua). Trilha à parte, depois das Camadas 1–2.
- **Atualização planejada — gestão de site no VPS do cliente.** Próximo salto do OS: o cliente
  **ajusta cada seção de cada página** e **cria páginas novas** via MCP, e **conecta o VPS dele**
  pra publicação/atualização (creds no painel). Duas peças novas e não-triviais:
  1. **Content-model de página/seção** — editar estrutura, não HTML cru. É um *CMS-sobre-git*.
  2. **VPS do cliente** — o MCP opera a infra **conectada** do cliente, não só a da Infosaas.
  Projeto à parte, depois da base de chat/conteúdo provar. Coerente com "storage/hospedagem podem
  ser do cliente; a inteligência fica central".

---

## 4. Deploy do Criador de Conteúdo (primeiro tool do data plane)

### Decisão: instância por cliente (fechada)
O app é **mono-empresa por processo** (`COMPANY_ID` no boot, sem auth, sem isolamento). Multi-tenant
seria refactor real com risco de vazamento. Como o modelo é **premium / poucos clientes**, o caminho
é **uma instância por cliente** — quase zero código, isolamento natural, BYOK e liability de graça.

### Paridade 100% (vídeo incluso) — o que precisa TER
- Container **base Debian** (não Alpine) com **Chromium + libs do sistema** (Remotion) e **ffmpeg**
  (`ffmpeg-static`). Vídeo/Reels funciona igual ao local.
- As **3 pastas do OS na hierarquia certa** (o app resolve por `REPO_ROOT` relativo ao CWD):
  `dna/`, `marketing/conteudo/`, `.claude/skills/comunicacao-funil/`.
- **Env**: `OPENAI_API_KEY` (obrigatória — texto `gpt-5.4-nano`, imagem `gpt-image-1`, transcrição
  Whisper API), `COMPOSIO_API_KEY`, `R2_*` (5 vars), `COMPANY_ID`, `OPENAI_ADMIN_KEY` (opcional).
- **Volume persistente** em `marketing/conteudo` + **`/tmp` gravável**.

### O que precisa FAZER (achados da auditoria)
- ⚠️ **Skill fora do git:** `.claude/skills/comunicacao-funil/` existe local mas é **gitignored** →
  um deploy via GitHub não a teria. Resolver: des-ignorar essa pasta **ou** embuti-la na imagem.
- ⚠️ **Migração de mídia:** carrosséis (json/captions/thumbs/imagens) estão no git; **assets de vídeo
  são ignorados** (`videos/**/assets/`). "Exatamente o que tenho local" exige **migração única** dos
  MP4s pro volume.
- ⚠️ **Zero auth no app:** exposto, qualquer um na URL gasta a chave e mexe em tudo. MVP: **basic auth
  no Easypanel/Traefik** na frente; auth real depois. **BYOK por cliente** (chave OpenAI dele).
- Criar o **Dockerfile** (Debian + deps + `remotion browser ensure` no build + `next build`).
- **Proxy:** `buffering off` (SSE do watcher) + **timeouts longos** (render/transcribe até 600s).
- **Watcher (chokidar):** funciona em volume local; em storage remoto não dispara → polling.

### Performance
- Gargalo = **render de vídeo** (Chromium headless, síncrono, ~1–2 vCPU + 1–2 GB por render
  concorrente). **Dimensionar a VPS** + **limite de concorrência**.
- Evolução (não-MVP): mover render pra **fila/worker** (assíncrono) pra escalar e controlar custo.

> **Custo honesto:** o vídeo é o que pesa em RAM/CPU/$ — e no modelo per-client **multiplica por
> cliente**. É o ponto que mais merece atenção no desenho de escala.

---

## 5. Distribuição e Frota — como um update reflete em TODOS os clientes

A pergunta central do per-client: **você atualiza a base uma vez e a frota converge.** Isso só é
possível por uma separação rígida:

> **Código = imagem compartilhada e versionada. Dados = por cliente.**
> Cada instância roda a MESMA imagem; só muda env + volume. Instâncias são "gado, não bicho de
> estimação" — idênticas e descartáveis. **Nunca forke código por cliente** (customização = config/
> flag/dado, jamais branch do cliente).

### Existem dois "bases" — e os clientes não rodam o seu código
| Camada | O que é | Onde mora | Quem usa |
|---|---|---|---|
| **Código-fonte** | onde você programa | **GitHub** (`infosaas_os`) | **você** |
| **Imagem (o molde)** | o tool já "compilado" | **container registry** (ex. GHCR) | **os clientes** |

O cliente **não puxa código do GitHub** — roda uma **imagem pronta** do **registry**. O **registry é
a origem única** que reflete pra toda a frota.

### O pipeline (origem → clientes)
```
1. você edita o tool local
2. git push → GitHub                          ← a verdade do CÓDIGO (onde você trabalha)
3. CI (GitHub Actions) builda a imagem UMA vez
4. push da imagem → registry: criador:v3      ← o "BASE" que reflete pros clientes ⭐
5. cada instância de cliente PUXA criador:v3 (do registry) + dados/env dele intactos
```

```
        ┌──────────── GitHub (código) ── push → CI builda ────────────┐
        └─────────────────────────┬───────────────────────────────────┘
                                   ▼
                    Registry (GHCR): criador:v3      ← ORIGEM única
                                   │  (todos puxam daqui)
            ┌──────────────────────┼──────────────────────┐
            ▼                      ▼                      ▼
      acme: criador:v3        beta: criador:v3       gama: criador:v2 (pinado)
        + dados acme            + dados beta            + dados gama
```

### Easypanel no modelo de frota
Diferente do MCP (que hoje **builda do GitHub**), os serviços de cliente apontam pra **imagem do
registry** (`ghcr.io/orafadoinfosaas/criador:stable`). Update = **puxar a imagem nova** (redeploy),
sem rebuildar. "Build once, run everywhere."

### Segurança do rollout (pra um update não quebrar todo mundo)
- **Canary / estágios:** sobe na sua instância + 1 cliente amigo, valida, **depois** o resto.
- **Canais / pin:** cliente premium num canal **estável**; pode pinar versão.
- **Migração de dados:** mudança de schema (`content.json`) precisa de **migração por instância** no
  update. É o maior risco — manter dados retrocompatíveis.
- **Rollback:** guarde a imagem anterior; voltar = trocar a tag.

### Várias ferramentas = manifesto por cliente
```
acme → { criador: v3, browser-worker: v1, render: v2 }
beta → { criador: v3 }
gama → { criador: v2(pin), site-editor: v1 }
```
Cada tool é uma imagem versionada; o stack do cliente é um conjunto `{tool: versão}`. Um **control
plane** lê esse manifesto e **converge** as instâncias. A "fábrica" amadurece em "gestor de frota".

---

## 6. Trilha de maturidade (não construir cedo demais)

| Estágio | Clientes | Como atualiza a frota |
|---|---|---|
| **0 — Manual** | 1–2 | redeploy na mão em cada serviço do Easypanel |
| **1 — Script** | punhado | script que chama a **API do Easypanel** → "atualiza a frota com 1 comando" |
| **2 — Control plane** | muitos | manifesto + canais + canary + **auto-pull** (Watchtower/GitOps) + migração + rollback |

> Construa cada degrau **quando doer**. Provisione 1–2 clientes na mão, prove o padrão, **depois**
> automatize. Automatizar cedo = construir a fábrica errada.

---

## 7. Como nasce um cliente (visão produto)

```
cliente novo recebe:
  ├─ conta no PAINEL              (login + cofre: Nextcloud, OpenAI, Composio, R2, VPS dele)
  ├─ tenant no MCP central        (cérebro + tools leves, isolado por auth/painel)
  ├─ instância(s) de workload      (criador, etc. — imagem do registry + volume + env dele)
  ├─ Nextcloud DELE conectado      (storage do DNA/output — CRUD via chat)
  └─ conector no Claude (MCP)       (a porta única — Desktop/web; token vem do painel)
```
O cliente cria **pelo app OU pelo Claude**, sem nunca abrir localhost. Tudo aponta pro mesmo acervo.
Provisionamento começa **manual** e vira **painel self-service** (Fase 4 do MCP) conforme a frota
cresce (§6). O painel é onde o cliente pluga o Nextcloud dele e as keys (BYOK/Composio).

---

## 8. Decisões fechadas
- **Modelo geral:** control plane central (MCP + painel) + data plane per-client.
- **Storage/hospedagem podem ser do cliente** (Nextcloud dele; VPS do site dele). O central é o
  compute/inteligência — não a custódia de dado. Não quebra o moat (lock-in = inteligência central).
- **Criador:** instância por cliente (não multi-tenant).
- **Distribuição:** imagem versionada num **registry**; build once → frota puxa. Nunca forke código.
- **Paridade do criador:** 100%, **vídeo incluso**.
- **Billing em dois tiers:** chat via MCP = LLM do host (assinatura do cliente, custo zero); editor
  = OpenAI com **BYOK** do cliente. Imagem/vídeo sempre no tier pago.
- **Storage destino:** Nextcloud **por-cliente** (WebDAV-direto), conectado via painel.
- **Painel self-service** (Fase 4 do MCP) = cofre de credenciais + auth do tenant.
- **Auth do app no MVP:** basic auth no Easypanel.

## 9. Decisões em aberto
1. **Skill fora do git:** des-ignorar `.claude/skills/comunicacao-funil` **vs** embutir na imagem.
2. **Storage antes do Nextcloud:** aceitar escrita efêmera **vs** volume Easypanel como ponte.
3. **Vídeo:** render **síncrono** (MVP) **vs** fila/worker (escala).
4. **Registry:** GHCR (grátis, casa com o GitHub) **vs** outro.
5. **Quando** construir o script de frota / control plane (§6).
6. **`criar_conteudo` no chat:** quão determinística a voz fica no modo `chat-native` (LLM do host
   seguindo a skill) **vs** a garantia pixel-perfect do editor — calibrar até onde o chat basta.
7. **Gestão de site:** content-model próprio (CMS-sobre-git) **vs** editar arquivos do repo direto;
   e o protocolo de conexão ao VPS do cliente (SSH? agente? webhook de deploy?).

## 10. Roadmap consolidado
1. **(feito)** MCP Fase 1 (cérebro) + Fase 2/Camada 1 (CRUD do OS) em produção.
2. **PUSH ATUAL — chat-native com paridade de tools + preview em iframe.** `criar_conteudo`
   (host LLM escreve), `editar_conteudo` (16 comandos determinísticos), `preview_conteudo`
   (iframe/MCP Apps, render client-side), `salvar`/`listar`/threads. Vídeo adiado; imagem/publicar
   = BYOK. Base: extrair `@infosaas/content` + `@infosaas/renderer`. *(maior prioridade — destrava
   marketing/vendas; detalhe na Fase 2 do doc do MCP)*
3. **Nextcloud por-cliente** (WebDAV-direto, creds por tenant) → CRUD do DNA via chat.
4. **Painel v1** — cofre (Nextcloud, OpenAI, Composio) + emissão do token MCP. Acelera multi-tenant.
5. **Composio** plugado no `publicar_instagram` (conexão do painel).
6. **Deploy do Criador** (instância — a sua `infosaas` primeiro): Dockerfile full-parity + volume +
   basic auth; resolver skill-fora-do-git + migração de mídia. Habilita o modo `editor` (BYOK).
7. **Pipeline de frota:** GitHub Actions → GHCR → Easypanel apontando pra imagem.
8. **2º cliente** pelo painel → prova o padrão.
9. **Degrau 2 da UI (iframe interativo)** e **gestão de site** (CMS-sobre-git + VPS do cliente) —
   os dois grandes, depois da base provar. **Fase 3 do MCP** (OAuth) conforme necessidade.

---

## Apêndice — relação com outros docs
- [`IMPLEMENTACAO-MCP.md`](IMPLEMENTACAO-MCP.md) — detalhe do servidor MCP (control plane): fases,
  código, storage WebDAV, deploy, isolamento de tenant.
