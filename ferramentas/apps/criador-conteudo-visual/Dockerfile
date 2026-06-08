# App unificado (criador-conteudo-visual) — Next 16 / React 19.
# Build NÃO-standalone (next start): node_modules completo no runtime, robusto com
# deps nativas (Remotion/ffmpeg-static/sharp). Base Debian (glibc) — NÃO alpine.
# IMPORTANTE: o contexto de build é a RAIZ do repo (precisa de ferramentas/packages + dna).
# No Easypanel: Dockerfile = ferramentas/apps/criador-conteudo-visual/Dockerfile, contexto = raiz.
FROM node:22-bookworm-slim

# Pacotes do workspace primeiro (content → renderer → cofre): cada um buildado (dist).
# Os file: deps do app resolvem pra estes diretórios.
WORKDIR /repo/ferramentas/packages/content
COPY ferramentas/packages/content/package.json ferramentas/packages/content/package-lock.json* ./
RUN npm install
COPY ferramentas/packages/content/tsconfig.json ./
COPY ferramentas/packages/content/src ./src
RUN npm run build

WORKDIR /repo/ferramentas/packages/renderer
COPY ferramentas/packages/renderer/package.json ferramentas/packages/renderer/package-lock.json* ./
RUN npm install
COPY ferramentas/packages/renderer/tsconfig.json ferramentas/packages/renderer/build.mjs ./
COPY ferramentas/packages/renderer/src ./src
COPY ferramentas/packages/renderer/assets ./assets
RUN npm run build

WORKDIR /repo/ferramentas/packages/cofre
COPY ferramentas/packages/cofre/package.json ferramentas/packages/cofre/package-lock.json* ./
RUN npm install
COPY ferramentas/packages/cofre/tsconfig.json ./
COPY ferramentas/packages/cofre/src ./src
RUN npm run build

# App: instala (resolve @infosaas/* já buildados + jose) e builda o Next.
# NODE_ENV NÃO é setado aqui — o build precisa das devDependencies (tailwind, tsc).
WORKDIR /repo/ferramentas/apps/criador-conteudo-visual
COPY ferramentas/apps/criador-conteudo-visual/package.json ferramentas/apps/criador-conteudo-visual/package-lock.json* ./
RUN npm install
COPY ferramentas/apps/criador-conteudo-visual/ ./

# DNA disponível em build E runtime (config/company.ts lê REPO_ROOT/dna).
COPY dna /data/dna
ENV REPO_ROOT=/data

RUN npm run build

# Runtime: next start sobe em produção. Env (Logto, OpenAI, cofre…) vem do Easypanel.
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "run", "start"]
