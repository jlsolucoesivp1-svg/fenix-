@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0\.."

set "BACKUP_DIR=%CD%\backups"
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm-ss"') do set "STAMP=%%i"
set "BACKUP_FILE=%BACKUP_DIR%\sistema_fenix_!STAMP!.sql"

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
echo Gerando backup em:
echo %BACKUP_FILE%
echo.

docker compose exec -T postgres pg_dump -U postgres -d sistema_fenix > "%BACKUP_FILE%"
if errorlevel 1 (
  echo.
  echo Falha ao gerar o backup do banco.
  echo.
  pause
  exit /b 1
)

echo.
echo Backup concluido com sucesso.
echo Arquivo salvo em:
echo %BACKUP_FILE%
echo.
pause
