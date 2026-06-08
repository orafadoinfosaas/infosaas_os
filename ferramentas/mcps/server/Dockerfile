# Infosaas OS MCP — Fase 2 (chat-native) + Fase 5 (preview MCP Apps).
# IMPORTANTE: o build context é a RAIZ do repo (server/, packages/* e dna/).
# Estrutura do monorepo é REPLICADA na imagem; os pacotes file: são BUILDADOS na ordem
# content → renderer → server (renderer depende de content; server depende dos dois).

# --- build ---
FROM node:22-alpine AS build

# 1) @infosaas/content → dist/
WORKDIR /repo/ferramentas/packages/content
COPY ferramentas/packages/content/package.json ferramentas/packages/content/package-lock.json* ./
RUN npm install
COPY ferramentas/packages/content/tsconfig.json ./
COPY ferramentas/packages/content/src ./src
RUN npm run build

# 2) @infosaas/renderer → dist/ (compose + bundle do preview: tsc + esbuild)
WORKDIR /repo/ferramentas/packages/renderer
COPY ferramentas/packages/renderer/package.json ferramentas/packages/renderer/package-lock.json* ./
RUN npm install
COPY ferramentas/packages/renderer/tsconfig.json ferramentas/packages/renderer/build.mjs ./
COPY ferramentas/packages/renderer/src ./src
COPY ferramentas/packages/renderer/assets ./assets
RUN npm run build

# 3) @infosaas/cofre → dist/ (tenants + tokens + secrets cifrados no Postgres)
WORKDIR /repo/ferramentas/packages/cofre
COPY ferramentas/packages/cofre/package.json ferramentas/packages/cofre/package-lock.json* ./
RUN npm install
COPY ferramentas/packages/cofre/tsconfig.json ./
COPY ferramentas/packages/cofre/src ./src
RUN npm run build

# 4) servidor MCP
WORKDIR /repo/ferramentas/mcps/server
COPY ferramentas/mcps/server/package.json ferramentas/mcps/server/package-lock.json* ./
RUN npm install
COPY ferramentas/mcps/server/tsconfig.json ./
COPY ferramentas/mcps/server/src ./src
RUN npm run build

# --- runtime ---
FROM node:22-alpine
ENV NODE_ENV=production

# Cada pacote: package.json + deps de produção + dist. Tem que estar COMPLETO antes do
# install do consumidor (renderer depende de content; server, dos dois).
WORKDIR /repo/ferramentas/packages/content
COPY ferramentas/packages/content/package.json ferramentas/packages/content/package-lock.json* ./
RUN npm install --omit=dev
COPY --from=build /repo/ferramentas/packages/content/dist ./dist

WORKDIR /repo/ferramentas/packages/renderer
COPY ferramentas/packages/renderer/package.json ferramentas/packages/renderer/package-lock.json* ./
RUN npm install --omit=dev
COPY --from=build /repo/ferramentas/packages/renderer/dist ./dist

WORKDIR /repo/ferramentas/packages/cofre
COPY ferramentas/packages/cofre/package.json ferramentas/packages/cofre/package-lock.json* ./
RUN npm install --omit=dev
COPY --from=build /repo/ferramentas/packages/cofre/dist ./dist

WORKDIR /repo/ferramentas/mcps/server
COPY ferramentas/mcps/server/package.json ferramentas/mcps/server/package-lock.json* ./
RUN npm install --omit=dev
COPY --from=build /repo/ferramentas/mcps/server/dist ./dist

# dna/ embutido na imagem — single-tenant na Fase 1/2.
COPY dna /data/dna
ENV REPO_ROOT=/data

# TENANT_ID e MCP_TOKEN vêm das Environment Variables do Easypanel (NÃO hardcode aqui).
ENV PORT=8787
EXPOSE 8787
CMD ["node", "dist/index.js"]
