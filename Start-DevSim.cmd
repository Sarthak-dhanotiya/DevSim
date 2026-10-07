@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-local.ps1" -RestartBackend
if errorlevel 1 goto failed
echo Open http://localhost:3000 after the backend finishes starting.
pause
exit /b 0
:failed
echo DevSim could not start. See the error above.
pause
exit /b 1
