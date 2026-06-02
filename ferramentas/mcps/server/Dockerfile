# Infosaas OS MCP — Fase 1 (single-tenant, só-leitura).
# IMPORTANTE: o build context é a RAIZ do repo (precisa do server/ E do dna/).
# No Easypanel: Build method = Dockerfile · Dockerfile path = ferramentas/mcps/server/Dockerfile

# --- build ---
FROM node:22-alpine AS build
WORKDIR /app
COPY ferramentas/mcps/server/package.json ferramentas/mcps/server/package-lock.json* ./
RUN npm install
COPY ferramentas/mcps/server/tsconfig.json ./
COPY ferramentas/mcps/server/src ./src
RUN npm run build

# --- runtime ---
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY ferramentas/mcps/server/package.json ferramentas/mcps/server/package-lock.json* ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist

# dna/ (memória da empresa) embutido na imagem — single-tenant na Fase 1.
# Atualizar o dna/ = novo push → Easypanel rebuilda. (Na Fase 3 isso vira mount do Nextcloud.)
COPY dna /data/dna
ENV REPO_ROOT=/data

# TENANT_ID e MCP_TOKEN vêm das Environment Variables do Easypanel (NÃO hardcode aqui).
ENV PORT=8787
EXPOSE 8787
CMD ["node", "dist/index.js"]
