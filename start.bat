@echo off
cd /d "%~dp0"
start "M67 Preview Server" /min cmd /c "node server.mjs"
timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:4173"
