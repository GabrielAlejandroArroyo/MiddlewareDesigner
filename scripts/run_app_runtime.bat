@echo off
cd /d "%~dp0\..\microfrontends\app-runtime"
set NODE_OPTIONS=--max-old-space-size=4096
echo Iniciando App Runtime... > "%~dp0\app_runtime_log.txt"
npx.cmd ng serve --port 4201 --host 0.0.0.0 --open false >> "%~dp0\app_runtime_log.txt" 2>&1
