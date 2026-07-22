@echo off
setlocal
set SCRIPT_PATH=%~dp0
powershell -ExecutionPolicy Bypass -File "%SCRIPT_PATH%12-zerar-sistema.ps1" %*
endlocal
