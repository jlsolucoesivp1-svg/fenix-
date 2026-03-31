param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('install', 'open', 'stop', 'backup', 'restore')]
    [string]$Action
)

Add-Type -AssemblyName System.Windows.Forms

$rootDir = Split-Path -Parent $PSScriptRoot
Set-Location $rootDir

function Show-Info($message, $title = 'Sistema Fenix') {
    [System.Windows.Forms.MessageBox]::Show($message, $title, [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information) | Out-Null
}

function Show-Error($message, $title = 'Sistema Fenix') {
    [System.Windows.Forms.MessageBox]::Show($message, $title, [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error) | Out-Null
}

function Show-Warning($message, $title = 'Sistema Fenix') {
    [System.Windows.Forms.MessageBox]::Show($message, $title, [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Warning) | Out-Null
}

function Confirm-Action($message, $title = 'Sistema Fenix') {
    $result = [System.Windows.Forms.MessageBox]::Show($message, $title, [System.Windows.Forms.MessageBoxButtons]::YesNo, [System.Windows.Forms.MessageBoxIcon]::Question)
    return $result -eq [System.Windows.Forms.DialogResult]::Yes
}

function Ensure-DockerInstalled {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw 'Docker Desktop nao foi encontrado. Instale o Docker Desktop antes de continuar.'
    }
}

function Start-DockerDesktopIfNeeded {
    & docker info *> $null
    if ($LASTEXITCODE -eq 0) {
        return
    }

    $possiblePaths = @(
        "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
        "$env:LocalAppData\Programs\Docker\Docker\Docker Desktop.exe"
    )

    $dockerDesktopExe = $possiblePaths | Where-Object { Test-Path $_ } | Select-Object -First 1
    if (-not $dockerDesktopExe) {
        throw 'Nao foi possivel localizar o executavel do Docker Desktop. Abra o Docker Desktop manualmente e tente novamente.'
    }

    Start-Process -FilePath $dockerDesktopExe | Out-Null

    for ($attempt = 0; $attempt -lt 24; $attempt++) {
        Start-Sleep -Seconds 5
        & docker info *> $null
        if ($LASTEXITCODE -eq 0) {
            return
        }
    }

    throw 'O Docker Desktop nao ficou pronto a tempo.'
}

function Invoke-DockerCompose {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,
        [switch]$IgnoreErrors
    )

    $output = & docker compose @Arguments 2>&1 | Out-String
    if (-not $IgnoreErrors -and $LASTEXITCODE -ne 0) {
        throw ($output.Trim())
    }
    return $output.Trim()
}

function Open-AppBrowser {
    $appUrl = 'http://localhost:3001'
    $possibleBrowsers = @(
        "$env:ProgramFiles(x86)\Microsoft\Edge\Application\msedge.exe",
        "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
        "$env:ProgramFiles(x86)\Google\Chrome\Application\chrome.exe",
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe"
    )

    $browserExe = $possibleBrowsers | Where-Object { Test-Path $_ } | Select-Object -First 1
    if ($browserExe) {
        Start-Process -FilePath $browserExe -ArgumentList "--app=$appUrl" | Out-Null
        return
    }

    Start-Process $appUrl | Out-Null
}

function Ensure-PostgresRunning {
    $status = Invoke-DockerCompose -Arguments @('ps', 'postgres') -IgnoreErrors
    if ($status -notmatch 'healthy' -and $status -notmatch 'running') {
        throw 'O servico postgres nao parece estar em execucao.'
    }
}

function Run-Install {
    Ensure-DockerInstalled
    Start-DockerDesktopIfNeeded

    Show-Info 'A instalacao vai iniciar agora. Isso pode levar alguns minutos.'

    Invoke-DockerCompose -Arguments @('up', '--build', '-d') | Out-Null

    Open-AppBrowser
    Show-Info 'Sistema instalado com sucesso e janela do sistema aberta.`n`nNa primeira execucao, copie a chave exibida na tela inicial e gere a ativacao no seu ativador externo.'
}

function Run-Open {
    Ensure-DockerInstalled
    Start-DockerDesktopIfNeeded
    Invoke-DockerCompose -Arguments @('up', '-d') | Out-Null
    Open-AppBrowser
}

function Run-Stop {
    Ensure-DockerInstalled
    Start-DockerDesktopIfNeeded
    Invoke-DockerCompose -Arguments @('down') | Out-Null
    Show-Info 'Sistema parado com sucesso.'
}

function Run-Backup {
    Ensure-DockerInstalled
    Start-DockerDesktopIfNeeded
    Ensure-PostgresRunning

    $backupDir = Join-Path $rootDir 'backups'
    if (-not (Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir | Out-Null
    }

    $stamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
    $backupFile = Join-Path $backupDir "sistema_fenix_$stamp.sql"

    $content = & docker compose exec -T postgres pg_dump -U postgres -d sistema_fenix 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) {
        throw ($content.Trim())
    }

    Set-Content -Path $backupFile -Value $content -Encoding UTF8
    Show-Info "Backup concluido com sucesso.`n`nArquivo salvo em:`n$backupFile"
}

function Run-Restore {
    Ensure-DockerInstalled
    Start-DockerDesktopIfNeeded
    Ensure-PostgresRunning

    $dialog = New-Object System.Windows.Forms.OpenFileDialog
    $dialog.Title = 'Selecione o backup SQL'
    $dialog.Filter = 'Arquivos SQL (*.sql)|*.sql|Todos os arquivos (*.*)|*.*'
    $dialog.Multiselect = $false

    if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
        return
    }

    $restoreFile = $dialog.FileName
    if (-not (Confirm-Action "A restauracao vai sobrescrever os dados atuais do banco.`n`nArquivo:`n$restoreFile`n`nDeseja continuar?")) {
        return
    }

    $resetOutput = & docker compose exec -T postgres psql -U postgres -d sistema_fenix -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) {
        throw ($resetOutput.Trim())
    }

    $restoreOutput = Get-Content -Path $restoreFile | & docker compose exec -T postgres psql -U postgres -d sistema_fenix 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) {
        throw ($restoreOutput.Trim())
    }

    Show-Info 'Restauracao concluida com sucesso.'
}

try {
    switch ($Action) {
        'install' { Run-Install }
        'open' { Run-Open }
        'stop' { Run-Stop }
        'backup' { Run-Backup }
        'restore' { Run-Restore }
    }
} catch {
    $message = $_.Exception.Message
    if ([string]::IsNullOrWhiteSpace($message)) {
        $message = 'Ocorreu um erro durante a execucao.'
    }
    Show-Error $message
    exit 1
}
