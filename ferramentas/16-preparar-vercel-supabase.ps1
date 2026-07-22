param(
  [switch]$ApplySchema,
  [string]$EnvFile = '.env.local',
  [string]$SchemaFile = '.\sql\supabase-manual-init.sql'
)

$ErrorActionPreference = 'Stop'

function Read-DotEnvFile {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Arquivo de ambiente nao encontrado: $Path"
  }

  $values = @{}

  foreach ($line in Get-Content -LiteralPath $Path) {
    $trimmed = $line.Trim()

    if ([string]::IsNullOrWhiteSpace($trimmed) -or $trimmed.StartsWith('#')) {
      continue
    }

    $separatorIndex = $trimmed.IndexOf('=')
    if ($separatorIndex -lt 1) {
      continue
    }

    $key = $trimmed.Substring(0, $separatorIndex).Trim()
    $value = $trimmed.Substring($separatorIndex + 1).Trim()

    if (
      ($value.StartsWith('"') -and $value.EndsWith('"')) -or
      ($value.StartsWith("'") -and $value.EndsWith("'"))
    ) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    $values[$key] = $value
  }

  return $values
}

function Require-Value {
  param(
    [hashtable]$Values,
    [string]$Key
  )

  $value = $Values[$Key]
  if ([string]::IsNullOrWhiteSpace($value)) {
    throw "Variavel obrigatoria ausente em ${EnvFile}: $Key"
  }

  return $value
}

function Test-CommandExists {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name
  )

  return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Mask-ConnectionString {
  param(
    [Parameter(Mandatory = $true)]
    [string]$ConnectionString
  )

  return ($ConnectionString -replace '://([^:]+):([^@]+)@', '://$1:***@')
}

function Invoke-SchemaApply {
  param(
    [Parameter(Mandatory = $true)]
    [string]$ConnectionString,
    [Parameter(Mandatory = $true)]
    [string]$SqlFile
  )

  if (-not (Test-Path -LiteralPath $SqlFile)) {
    throw "Arquivo SQL nao encontrado: $SqlFile"
  }

  if (-not (Test-CommandExists -Name 'docker')) {
    throw 'Docker nao encontrado. Instale/inicie o Docker Desktop para aplicar o schema automaticamente.'
  }

  Write-Host ''
  Write-Host '[preparar-vercel] Aplicando schema no banco remoto...'

  $resolvedSqlFile = (Resolve-Path -LiteralPath $SqlFile).Path

  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = 'docker'
  $psi.Arguments = 'run --rm -i postgres:16-alpine psql "{0}"' -f $ConnectionString
  $psi.UseShellExecute = $false
  $psi.RedirectStandardInput = $true
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.CreateNoWindow = $true

  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $psi
  $null = $process.Start()

  try {
    $inputStream = [System.IO.File]::OpenRead($resolvedSqlFile)
    try {
      $inputStream.CopyTo($process.StandardInput.BaseStream)
    }
    finally {
      $inputStream.Dispose()
      $process.StandardInput.Close()
    }

    $stdout = $process.StandardOutput.ReadToEnd()
    $stderr = $process.StandardError.ReadToEnd()
    $process.WaitForExit()
    $exitCode = $process.ExitCode
  }
  finally {
    $process.Dispose()
  }

  if (-not [string]::IsNullOrWhiteSpace($stdout)) {
    Write-Host $stdout
  }

  if (-not [string]::IsNullOrWhiteSpace($stderr)) {
    Write-Host $stderr
  }

  if ($exitCode -ne 0) {
    throw "Falha ao aplicar schema. Codigo de saida: $exitCode"
  }

  Write-Host '[preparar-vercel] Schema aplicado com sucesso.'
}

$envValues = Read-DotEnvFile -Path $EnvFile

$databaseUrl = Require-Value -Values $envValues -Key 'DATABASE_URL'
$sessionSecret = Require-Value -Values $envValues -Key 'SESSION_SECRET'
$sessionCookieSecure = Require-Value -Values $envValues -Key 'SESSION_COOKIE_SECURE'
$pgssl = Require-Value -Values $envValues -Key 'PGSSL'
$serialSecret = Require-Value -Values $envValues -Key 'SERIAL_SECRET'

Write-Host ''
Write-Host '=== Variaveis para cadastrar na Vercel ==='
Write-Host "DATABASE_URL=$databaseUrl"
Write-Host "SESSION_SECRET=$sessionSecret"
Write-Host "SESSION_COOKIE_SECURE=true"
Write-Host "PGSSL=$pgssl"
Write-Host "SERIAL_SECRET=$serialSecret"

Write-Host ''
Write-Host '=== Validacao local ==='
Write-Host ("DATABASE_URL: {0}" -f (Mask-ConnectionString -ConnectionString $databaseUrl))
Write-Host "SESSION_SECRET: OK"
Write-Host "SESSION_COOKIE_SECURE local: $sessionCookieSecure"
Write-Host "PGSSL: $pgssl"
Write-Host "SERIAL_SECRET: OK"

if ($ApplySchema) {
  Invoke-SchemaApply -ConnectionString $databaseUrl -SqlFile $SchemaFile
} else {
  Write-Host ''
  Write-Host 'Schema nao aplicado nesta execucao.'
  Write-Host 'Para aplicar automaticamente no banco, rode:'
  Write-Host 'powershell -ExecutionPolicy Bypass -File .\ferramentas\16-preparar-vercel-supabase.ps1 -ApplySchema'
}
