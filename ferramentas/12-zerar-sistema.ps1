param(
  [switch]$Force
)

$ErrorActionPreference = 'Stop'

function Write-Step {
  param([string]$Message)
  Write-Host "[reset-system] $Message"
}

if (-not $Force) {
  Write-Host ""
  Write-Host "Este script vai apagar TODOS os dados do sistema no PostgreSQL:"
  Write-Host "- usuarios"
  Write-Host "- clientes"
  Write-Host "- ordens de servico"
  Write-Host "- vendas"
  Write-Host "- financeiro"
  Write-Host "- configuracoes e companyInfo"
  Write-Host ""
  $confirmation = Read-Host "Digite ZERAR para continuar"
  if ($confirmation -ne 'ZERAR') {
    Write-Host "Operacao cancelada."
    exit 1
  }
}

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $projectRoot

Write-Step "Verificando o container do PostgreSQL..."
docker compose ps postgres | Out-Null

Write-Step "Apagando registros e singletons do banco..."
docker compose exec postgres psql -U postgres -d sistema_fenix -c "TRUNCATE TABLE app_records, app_singletons;"

Write-Step "Sistema zerado com sucesso."
Write-Host "Ao abrir o sistema novamente, sera necessario cadastrar o usuario inicial e as novas OS comecarao em 1."
