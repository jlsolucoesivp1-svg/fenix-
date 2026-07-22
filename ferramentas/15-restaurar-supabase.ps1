param(
  [Parameter(Mandatory = $true)]
  [string]$InputFile,

  [string]$EnvFile = '.env.local'
)

$ErrorActionPreference = 'Stop'

function Read-DotEnvValue {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [Parameter(Mandatory = $true)]
    [string]$Key
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    return $null
  }

  foreach ($line in Get-Content -LiteralPath $Path) {
    $trimmed = $line.Trim()
    if ([string]::IsNullOrWhiteSpace($trimmed) -or $trimmed.StartsWith('#')) {
      continue
    }

    $separatorIndex = $trimmed.IndexOf('=')
    if ($separatorIndex -lt 1) {
      continue
    }

    $currentKey = $trimmed.Substring(0, $separatorIndex).Trim()
    if ($currentKey -ne $Key) {
      continue
    }

    $value = $trimmed.Substring($separatorIndex + 1).Trim()
    if (
      ($value.StartsWith('"') -and $value.EndsWith('"')) -or
      ($value.StartsWith("'") -and $value.EndsWith("'"))
    ) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    return $value
  }

  return $null
}

$connectionString = $env:SUPABASE_DATABASE_URL
if ([string]::IsNullOrWhiteSpace($connectionString)) {
  $databaseUrl = Read-DotEnvValue -Path $EnvFile -Key 'DATABASE_URL'
  $pgssl = Read-DotEnvValue -Path $EnvFile -Key 'PGSSL'

  if (-not [string]::IsNullOrWhiteSpace($databaseUrl)) {
    $connectionString = $databaseUrl

    if (
      -not [string]::IsNullOrWhiteSpace($pgssl) -and
      $pgssl.ToLowerInvariant() -ne 'disable' -and
      $connectionString -notmatch 'sslmode='
    ) {
      $separator = '?'
      if ($connectionString.Contains('?')) {
        $separator = '&'
      }
      $connectionString = "$connectionString${separator}sslmode=require"
    }
  }
}

if ([string]::IsNullOrWhiteSpace($connectionString)) {
  throw 'SUPABASE_DATABASE_URL nao definida e DATABASE_URL nao encontrada no .env.local.'
}

if (-not (Test-Path -LiteralPath $InputFile)) {
  throw "Arquivo SQL nao encontrado: $InputFile"
}

Write-Host "[supabase-restore] Importando arquivo para o Supabase..."
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = 'docker'
$psi.Arguments = 'run --rm -i postgres:16-alpine psql "{0}"' -f $connectionString
$psi.UseShellExecute = $false
$psi.RedirectStandardInput = $true
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.CreateNoWindow = $true

$process = New-Object System.Diagnostics.Process
$process.StartInfo = $psi
$null = $process.Start()

try {
  $inputStream = [System.IO.File]::OpenRead((Resolve-Path -LiteralPath $InputFile))
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
  throw "Falha no restore. Codigo de saida: $exitCode"
}

Write-Host "[supabase-restore] Restore concluido."
