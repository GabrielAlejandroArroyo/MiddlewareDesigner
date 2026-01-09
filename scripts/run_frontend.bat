@echo off
cd /d "%~dp0\..\microfrontends\designer-ui"
echo Iniciando Angular... > "%~dp0\frontend_log.txt"
npx.cmd ng serve --port 4200 --host 0.0.0.0 --open false >> "%~dp0\frontend_log.txt" 2>&1
