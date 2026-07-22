param(
  [Parameter(Mandatory = $true)]
  [string]$SourceContainer,

  [string]$SourceDatabase = 'sistema_fenix',

  [string]$SourceUser = 'postgres',

  [string]$OutputFile
)

$ErrorActionPreference = 'Stop'

function Write-Step {
  param([string]$Message)
  Write-Host "[supabase-export] $Message"
}

function Write-Utf8NoBomFile {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,

    [Parameter(Mandatory = $true)]
    [AllowEmptyString()]
    [string[]]$Lines
  )

  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, ($Lines -join [Environment]::NewLine) + [Environment]::NewLine, $utf8NoBom)
}

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $projectRoot

$backupDir = Join-Path $projectRoot 'backups'
if (-not (Test-Path $backupDir)) {
  New-Item -ItemType Directory -Path $backupDir | Out-Null
}

if ([string]::IsNullOrWhiteSpace($OutputFile)) {
  $stamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
  $OutputFile = Join-Path $backupDir "supabase-data_$stamp.sql"
}

$tempFile = Join-Path ([System.IO.Path]::GetTempPath()) ("fenix_supabase_export_" + [System.Guid]::NewGuid().ToString('N') + ".sql")
$containerTempFile = "/tmp/fenix_supabase_export_$([System.Guid]::NewGuid().ToString('N')).sql"

try {
  Write-Step "Verificando se o container de origem existe..."
  $containerCheck = & docker inspect $SourceContainer 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) {
    throw "Container '$SourceContainer' nao encontrado. Detalhes: $($containerCheck.Trim())"
  }

  Write-Step "Gerando dump UTF-8 dentro do container..."
  $dumpCommand = @(
    'exec',
    '-i',
    $SourceContainer,
    'sh',
    '-lc',
    "export PGCLIENTENCODING=UTF8; pg_dump -U '$SourceUser' -d '$SourceDatabase' --data-only --inserts --column-inserts --no-owner --no-privileges --table=public.app_records --table=public.app_singletons -f '$containerTempFile'"
  )

  $dumpOutput = & docker @dumpCommand 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) {
    throw "Falha ao gerar o dump. Detalhes: $($dumpOutput.Trim())"
  }

  Write-Step "Copiando dump bruto do container sem passar pelo console..."
  $copyOutput = & docker cp "${SourceContainer}:${containerTempFile}" $tempFile 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) {
    throw "Falha ao copiar o dump do container. Detalhes: $($copyOutput.Trim())"
  }

  Write-Step "Adaptando dump para restore no Supabase..."
  $rawLines = Get-Content -Path $tempFile -Encoding UTF8
  $filteredLines = New-Object System.Collections.Generic.List[string]

  foreach ($line in $rawLines) {
    $trimmed = $line.Trim()

    if ($trimmed -like 'SET *') { continue }
    if ($trimmed -like 'SELECT pg_catalog.set_config*') { continue }
    if ($trimmed -like '\restrict*') { continue }
    if ($trimmed -like '\unrestrict*') { continue }
    if ($trimmed -eq '--') { continue }
    if ($trimmed -like '--*Dumped*') { continue }
    if ($trimmed -like '--*Started on*') { continue }
    if ($trimmed -like '--*Completed on*') { continue }
    if ($trimmed -like '--*Name:*') { continue }
    if ($trimmed -like '--*TOC entry*') { continue }
    if ($trimmed -like '--*Dependencies:*') { continue }
    if ($trimmed -like 'ALTER TABLE * OWNER TO *') { continue }

    $filteredLines.Add($line)
  }

  $finalLines = New-Object System.Collections.Generic.List[string]
  $finalLines.Add('-- Fenix data export for Supabase restore')
  $finalLines.Add("-- Source container: $SourceContainer")
  $finalLines.Add("-- Exported at: $(Get-Date -Format 'yyyy-MM-ddTHH:mm:ssK')")
  $finalLines.Add('BEGIN;')
  $finalLines.Add('')
  $finalLines.AddRange($filteredLines)
  $finalLines.Add('')
  $finalLines.Add('COMMIT;')

  Write-Utf8NoBomFile -Path $OutputFile -Lines $finalLines

  Write-Step "Arquivo SQL gerado em:"
  Write-Host $OutputFile
  Write-Host ''
  Write-Host 'Restore no Supabase:'
  Write-Host "1. Garanta que o schema ja foi criado no Supabase."
  Write-Host '2. Defina SUPABASE_DATABASE_URL com sslmode=require.'
  Write-Host "3. Rode: powershell -ExecutionPolicy Bypass -File .\ferramentas\15-restaurar-supabase.ps1 -InputFile '$OutputFile'"
}
finally {
  try {
    & docker exec $SourceContainer sh -lc "rm -f '$containerTempFile'" 2>$null | Out-Null
  }
  catch {
  }
  if (Test-Path $tempFile) {
    Remove-Item -LiteralPath $tempFile -Force
  }
}
