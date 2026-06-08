# Infosaas OS MCP — Fase 2 (single-tenant, CRUD + chat-native).
# IMPORTANTE: o build context é a RAIZ do repo (precisa de server/, packages/content/ e dna/).
# No Easypanel: Build method = Dockerfile · Dockerfile path = ferramentas/mcps/server/Dockerfile
#
# O server depende de @infosaas/content via dependência file: (../../packages/content).
# Por isso a estrutura do monorepo é REPLICADA na imagem e o pacote é BUILDADO antes do server.

# --- build ---
FROM node:22-alpine AS build

# 1) pacote compartilhado @infosaas/content → dist/
WORKDIR /repo/ferramentas/packages/content
COPY ferramentas/packages/content/package.json ferramentas/packages/content/package-lock.json* ./
RUN npm install
COPY ferramentas/packages/content/tsconfig.json ./
COPY ferramentas/packages/content/src ./src
RUN npm run build

# 2) servidor MCP — resolve @infosaas/content por file:../../packages/content
WORKDIR /repo/ferramentas/mcps/server
COPY ferramentas/mcps/server/package.json ferramentas/mcps/server/package-lock.json* ./
RUN npm install
COPY ferramentas/mcps/server/tsconfig.json ./
COPY ferramentas/mcps/server/src ./src
RUN npm run build

# --- runtime ---
FROM node:22-alpine
ENV NODE_ENV=production

# pacote: package.json + deps de produção (zod) + dist já buildado.
# Tem que estar COMPLETO antes do install do server (que cria o symlink @infosaas/content).
WORKDIR /repo/ferramentas/packages/content
COPY ferramentas/packages/content/package.json ferramentas/packages/content/package-lock.json* ./
RUN npm install --omit=dev
COPY --from=build /repo/ferramentas/packages/content/dist ./dist

# servidor: package.json + deps de produção (symlinka o pacote) + dist buildado.
WORKDIR /repo/ferramentas/mcps/server
COPY ferramentas/mcps/server/package.json ferramentas/mcps/server/package-lock.json* ./
RUN npm install --omit=dev
COPY --from=build /repo/ferramentas/mcps/server/dist ./dist

# dna/ (memória da empresa) embutido na imagem — single-tenant na Fase 1/2.
# Atualizar o dna/ = novo push → Easypanel rebuilda. (Com Nextcloud isso vira WebDAV por env.)
COPY dna /data/dna
ENV REPO_ROOT=/data

# TENANT_ID e MCP_TOKEN vêm das Environment Variables do Easypanel (NÃO hardcode aqui).
ENV PORT=8787
EXPOSE 8787
CMD ["node", "dist/index.js"]
