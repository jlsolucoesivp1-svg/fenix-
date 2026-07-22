param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('install', 'open', 'stop', 'backup', 'restore')]
    [string]$Action
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

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

function New-ProgressWindow {
    $form = New-Object System.Windows.Forms.Form
    $form.Text = 'Sistema Fenix - Instalacao'
    $form.Width = 520
    $form.Height = 170
    $form.StartPosition = 'CenterScreen'
    $form.FormBorderStyle = 'FixedDialog'
    $form.MaximizeBox = $false
    $form.MinimizeBox = $false
    $form.ControlBox = $false
    $form.TopMost = $true

    $titleLabel = New-Object System.Windows.Forms.Label
    $titleLabel.Text = 'Instalando o Sistema Fenix'
    $titleLabel.Font = New-Object System.Drawing.Font('Segoe UI', 12, [System.Drawing.FontStyle]::Bold)
    $titleLabel.AutoSize = $true
    $titleLabel.Location = New-Object System.Drawing.Point(20, 18)

    $statusLabel = New-Object System.Windows.Forms.Label
    $statusLabel.Text = 'Preparando...'
    $statusLabel.Font = New-Object System.Drawing.Font('Segoe UI', 9)
    $statusLabel.AutoSize = $false
    $statusLabel.Width = 460
    $statusLabel.Height = 34
    $statusLabel.Location = New-Object System.Drawing.Point(20, 52)

    $progressBar = New-Object System.Windows.Forms.ProgressBar
    $progressBar.Minimum = 0
    $progressBar.Maximum = 100
    $progressBar.Value = 0
    $progressBar.Style = 'Continuous'
    $progressBar.Width = 460
    $progressBar.Height = 22
    $progressBar.Location = New-Object System.Drawing.Point(20, 90)

    $percentLabel = New-Object System.Windows.Forms.Label
    $percentLabel.Text = '0%'
    $percentLabel.Font = New-Object System.Drawing.Font('Segoe UI', 9, [System.Drawing.FontStyle]::Bold)
    $percentLabel.AutoSize = $true
    $percentLabel.Location = New-Object System.Drawing.Point(20, 118)

    $form.Controls.Add($titleLabel)
    $form.Controls.Add($statusLabel)
    $form.Controls.Add($progressBar)
    $form.Controls.Add($percentLabel)
    $form.Show()
    [System.Windows.Forms.Application]::DoEvents()

    return @{
        Form = $form
        StatusLabel = $statusLabel
        ProgressBar = $progressBar
        PercentLabel = $percentLabel
    }
}

function Set-ProgressState {
    param(
        [Parameter(Mandatory = $true)]
        $Window,
        [Parameter(Mandatory = $true)]
        [string]$Message,
        [Parameter(Mandatory = $true)]
        [int]$Percent,
        [switch]$Indeterminate
    )

    $safePercent = [Math]::Max(0, [Math]::Min(100, $Percent))
    $Window.StatusLabel.Text = $Message
    $Window.ProgressBar.Style = if ($Indeterminate) { 'Marquee' } else { 'Continuous' }
    if (-not $Indeterminate) {
        $Window.ProgressBar.Value = $safePercent
    }
    $Window.PercentLabel.Text = "$safePercent%"
    [System.Windows.Forms.Application]::DoEvents()
}

function Close-ProgressWindow {
    param($Window)

    if ($null -ne $Window -and $null -ne $Window.Form -and -not $Window.Form.IsDisposed) {
        $Window.Form.Close()
        $Window.Form.Dispose()
    }
}

function Ensure-DockerInstalled {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw 'Docker Desktop nao foi encontrado. Instale o Docker Desktop antes de continuar.'
    }
}

function Get-DockerInfoResult {
    $dockerInfoOutput = & docker info 2>&1 | Out-String

    return @{
        ExitCode = $LASTEXITCODE
        Output = $dockerInfoOutput.Trim()
    }
}

function Resolve-DockerAccessError {
    param(
        [string]$DockerInfoOutput
    )

    if ($DockerInfoOutput -match 'permission denied while trying to connect to the docker API') {
        return 'O Docker Desktop esta instalado, mas o usuario atual nao conseguiu acessar o servico do Docker.' +
            "`n`nAbra o Docker Desktop e verifique se ele terminou de iniciar." +
            "`nSe o problema continuar, adicione o usuario do Windows ao grupo docker-users e entre novamente na sessao."
    }

    if ($DockerInfoOutput -match 'Error loading config file: .*Access is denied') {
        return 'O Docker Desktop foi encontrado, mas o arquivo de configuracao em %USERPROFILE%\.docker\config.json esta sem permissao de leitura.' +
            "`n`nCorrija as permissoes dessa pasta/arquivo ou recrie a configuracao do Docker Desktop para o usuario atual."
    }

    return $null
}

function Start-DockerDesktopIfNeeded {
    $dockerInfo = Get-DockerInfoResult
    if ($dockerInfo.ExitCode -eq 0) {
        return
    }

    $dockerAccessError = Resolve-DockerAccessError -DockerInfoOutput $dockerInfo.Output
    if ($dockerAccessError) {
        throw $dockerAccessError
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
        $dockerInfo = Get-DockerInfoResult
        if ($dockerInfo.ExitCode -eq 0) {
            return
        }

        $dockerAccessError = Resolve-DockerAccessError -DockerInfoOutput $dockerInfo.Output
        if ($dockerAccessError) {
            throw $dockerAccessError
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
    $progressWindow = $null

    try {
        $progressWindow = New-ProgressWindow
        Set-ProgressState -Window $progressWindow -Message 'Verificando o Docker Desktop...' -Percent 10

        Ensure-DockerInstalled
        Set-ProgressState -Window $progressWindow -Message 'Iniciando o Docker Desktop, se necessario...' -Percent 25
        Start-DockerDesktopIfNeeded

        Set-ProgressState -Window $progressWindow -Message 'Criando containers e instalando dependencias. Isso pode levar alguns minutos...' -Percent 65 -Indeterminate
        Invoke-DockerCompose -Arguments @('up', '--build', '-d') | Out-Null

        Set-ProgressState -Window $progressWindow -Message 'Abrindo o sistema no navegador...' -Percent 90
        Open-AppBrowser

        Set-ProgressState -Window $progressWindow -Message 'Instalacao concluida com sucesso.' -Percent 100
        Start-Sleep -Milliseconds 500
    } finally {
        Close-ProgressWindow $progressWindow
    }

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
