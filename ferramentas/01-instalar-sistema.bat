@echo off
setlocal

cd /d "%~dp0\.."

echo ==========================================
echo   Instalacao do Sistema Fenix via Docker
echo ==========================================
echo.

docker --version >nul 2>&1
if errorlevel 1 (
  echo Docker Desktop nao foi encontrado.
  echo Instale o Docker Desktop antes de continuar.
  echo https://www.docker.com/products/docker-desktop/
  echo.
  pause
  exit /b 1
)

echo Verificando acesso ao Docker...
call :ensure_docker_ready
if errorlevel 1 exit /b 1

echo.
echo Subindo os containers do sistema...
docker compose up --build -d
if errorlevel 1 (
  echo.
  echo Falha ao instalar/iniciar o sistema.
  echo.
  pause
  exit /b 1
)

echo.
echo Sistema instalado com sucesso.
echo URL: http://localhost:3001
echo Na primeira abertura, copie a chave exibida na tela inicial e realize a ativacao no seu ativador externo.
echo.
call "%~dp0\00-abrir-fenix-app.bat"
pause

:ensure_docker_ready
docker info >nul 2>&1
if not errorlevel 1 exit /b 0

echo O Docker Desktop parece nao estar iniciado.
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
