#!/usr/bin/env bash
# Setup de máquina nova — infosaas-os (macOS / Linux)
# Uso: bash scripts/setup-machine.sh

set -euo pipefail
repo="$(cd "$(dirname "$0")/.." && pwd)"
app="$repo/ferramentas/apps/criador-conteudo-visual"
mcps="$repo/ferramentas/mcps"
missing=()

copy_env_example() {
  local dir="$1"
  [ -f "$dir/.env.example" ] || return 0
  if [ -f "$dir/.env.local" ]; then
    echo "  já existe: $dir/.env.local (mantido)"
  else
    cp "$dir/.env.example" "$dir/.env.local"
    echo "  criado:    $dir/.env.local (preencha os valores)"
    missing+=("$dir/.env.local")
  fi
}

echo ""
echo "== infosaas-os :: setup =="

# 1. Node
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js não encontrado — instale Node 20+ antes de continuar."
  exit 1
fi
echo "Node: $(node --version)"

# 2. .env.local a partir dos exemplos
echo ""
echo "[1/3] Variáveis de ambiente"
copy_env_example "$app"
copy_env_example "$mcps"

# 3. Dependências do app
echo ""
echo "[2/3] Instalando dependências do app (npm install)..."
(cd "$app" && npm install)

# 4. Resumo
echo ""
echo "[3/3] Pronto."
if [ ${#missing[@]} -gt 0 ]; then
  echo ""
  echo "FALTA PREENCHER (tokens/secrets):"
  for m in "${missing[@]}"; do echo "  - $m"; done
  echo ""
  echo "  Mínimo p/ rodar: OPENAI_API_KEY em $app/.env.local"
fi
echo ""
echo "Rodar o app:"
echo "  cd ferramentas/apps/criador-conteudo-visual && npm run dev"
echo "  http://localhost:3000"
echo ""
