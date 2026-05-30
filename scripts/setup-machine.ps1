# Setup de máquina nova — infosaas-os (Windows / PowerShell)
# Uso: pwsh scripts/setup-machine.ps1   (ou)   powershell -File scripts/setup-machine.ps1

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$app = Join-Path $repo 'ferramentas/apps/criador-conteudo-visual'
$mcps = Join-Path $repo 'ferramentas/mcps'
$missing = @()

function Copy-EnvExample($dir) {
  $example = Join-Path $dir '.env.example'
  $local = Join-Path $dir '.env.local'
  if (-not (Test-Path $example)) { return }
  if (Test-Path $local) {
    Write-Host "  já existe: $local (mantido)" -ForegroundColor DarkGray
  } else {
    Copy-Item $example $local
    Write-Host "  criado:    $local (preencha os valores)" -ForegroundColor Yellow
    $script:missing += $local
  }
}

Write-Host "`n== infosaas-os :: setup ==" -ForegroundColor Cyan

# 1. Node
try {
  $node = (node --version)
  Write-Host "Node: $node" -ForegroundColor Green
} catch {
  Write-Host "Node.js não encontrado — instale Node 20+ antes de continuar." -ForegroundColor Red
  exit 1
}

# 2. .env.local a partir dos exemplos
Write-Host "`n[1/3] Variáveis de ambiente"
Copy-EnvExample $app
Copy-EnvExample $mcps

# 3. Dependências do app
Write-Host "`n[2/3] Instalando dependências do app (npm install)..."
Push-Location $app
npm install
Pop-Location

# 4. Resumo
Write-Host "`n[3/3] Pronto." -ForegroundColor Green
if ($missing.Count -gt 0) {
  Write-Host "`nFALTA PREENCHER (tokens/secrets):" -ForegroundColor Yellow
  foreach ($m in $missing) { Write-Host "  - $m" }
  Write-Host "`n  Mínimo p/ rodar: OPENAI_API_KEY em $app\.env.local" -ForegroundColor Yellow
}
Write-Host "`nRodar o app:" -ForegroundColor Cyan
Write-Host "  cd ferramentas/apps/criador-conteudo-visual; npm run dev"
Write-Host "  http://localhost:3000`n"
