@echo off
setlocal

cd /d "%~dp0\.."

set "RESTORE_FILE=%~1"

if "%RESTORE_FILE%"=="" (
  for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; $dialog = New-Object System.Windows.Forms.OpenFileDialog; $dialog.Title = 'Selecione o backup SQL'; $dialog.Filter = 'Arquivos SQL (*.sql)|*.sql|Todos os arquivos (*.*)|*.*'; $dialog.Multiselect = $false; if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { $dialog.FileName }"`) do set "RESTORE_FILE=%%i"
)

if "%RESTORE_FILE%"=="" (
  echo.
  echo Nenhum arquivo foi selecionado.
  echo.
  pause
  exit /b 0
)

if not exist "%RESTORE_FILE%" (
  echo.
  echo Arquivo nao encontrado:
  echo %RESTORE_FILE%
  echo.
  pause
  exit /b 1
)

echo Verificando se o container do PostgreSQL esta em execucao...
docker compose ps postgres | findstr /C:"running" /C:"healthy" >nul
if errorlevel 1 (
  echo.
  echo O servico "postgres" nao parece estar em execucao.
  echo Inicie o sistema antes com: docker compose up -d
  echo.
  pause
  exit /b 1
)

echo.
echo ATENCAO: a restauracao vai sobrescrever os dados atuais do banco.
set /p CONFIRM=Deseja continuar? (S/N): 
if /I not "%CONFIRM%"=="S" (
  echo Operacao cancelada.
  echo.
  pause
  exit /b 0
)

echo.
echo Limpando schema public atual...
docker compose exec -T postgres psql -U postgres -d sistema_fenix -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
if errorlevel 1 (
  echo.
  echo Falha ao limpar o banco antes da restauracao.
  echo.
  pause
  exit /b 1
)

echo.
echo Restaurando backup de:
echo %RESTORE_FILE%
echo.

type "%RESTORE_FILE%" | docker compose exec -T postgres psql -U postgres -d sistema_fenix
if errorlevel 1 (
  echo.
  echo Falha ao restaurar o backup.
  echo.
  pause
  exit /b 1
)

echo.
echo Restauracao concluida com sucesso.
echo Recarregue o sistema no navegador.
echo.
pause
