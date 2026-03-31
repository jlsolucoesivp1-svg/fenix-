@echo off
setlocal

cd /d "%~dp0\.."

docker --version >nul 2>&1
if errorlevel 1 (
  echo Docker Desktop nao foi encontrado.
  echo.
  pause
  exit /b 1
)

call :ensure_docker_ready
if errorlevel 1 exit /b 1

echo Parando o sistema...
docker compose down
if errorlevel 1 (
  echo.
  echo Nao foi possivel parar o sistema.
  echo.
  pause
  exit /b 1
)

echo.
echo Sistema parado com sucesso.
echo.
pause

:ensure_docker_ready
docker info >nul 2>&1
if not errorlevel 1 exit /b 0

echo Docker Desktop nao esta iniciado.
echo Tentando abrir o Docker Desktop automaticamente...
call :start_docker_desktop
if errorlevel 1 (
  echo.
  pause
  exit /b 1
)

set /a attempts=0
:wait_for_docker
docker info >nul 2>&1
if not errorlevel 1 exit /b 0

set /a attempts+=1
if %attempts% geq 24 (
  echo O Docker Desktop nao ficou pronto a tempo.
  echo Aguarde ele terminar de iniciar e execute este arquivo novamente.
  echo.
  pause
  exit /b 1
)

echo Aguardando o Docker Desktop iniciar...
timeout /t 5 /nobreak >nul
goto :wait_for_docker

:start_docker_desktop
set "dockerDesktopExe=%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
if exist "%dockerDesktopExe%" (
  start "" "%dockerDesktopExe%"
  exit /b 0
)

set "dockerDesktopExe=%LocalAppData%\Programs\Docker\Docker\Docker Desktop.exe"
if exist "%dockerDesktopExe%" (
  start "" "%dockerDesktopExe%"
  exit /b 0
)

echo Nao foi possivel localizar o executavel do Docker Desktop.
echo Abra o Docker Desktop manualmente e tente novamente.
exit /b 1
