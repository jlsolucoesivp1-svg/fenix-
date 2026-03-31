@echo off
setlocal

set "APP_URL=http://localhost:3001"

call :open_browser_app "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not errorlevel 1 exit /b 0

call :open_browser_app "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not errorlevel 1 exit /b 0

call :open_browser_app "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not errorlevel 1 exit /b 0

call :open_browser_app "%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not errorlevel 1 exit /b 0

echo.
echo Nao foi possivel iniciar o navegador em modo app.
echo Instale o Microsoft Edge ou Google Chrome e tente novamente.
pause
exit /b 1

:open_browser_app
set "BROWSER_EXE=%~1"
if not exist "%BROWSER_EXE%" exit /b 1

start "" "%BROWSER_EXE%" --app="%APP_URL%"
exit /b 0
