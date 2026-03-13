# Script para levantar los microfrontends de forma persistente
# Uso: .\scripts\start_frontend.ps1

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Iniciando Microfrontends (Persistentes)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$rootDir = Split-Path -Parent $PSScriptRoot

# Designer UI (puerto 4200)
$batPath = Join-Path $PSScriptRoot "run_frontend.bat"
Write-Host "Lanzando Designer UI via batch file..." -ForegroundColor Yellow

$process = Start-Process cmd.exe -ArgumentList "/c $batPath" -PassThru -WindowStyle Hidden

if ($process) {
    Write-Host "  [OK] Designer UI lanzado (PID: $($process.Id), Puerto: 4200)" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] No se pudo lanzar Designer UI" -ForegroundColor Red
}

# App Runtime (puerto 4201)
$runtimeDir = Join-Path $rootDir "microfrontends\app-runtime"
if (Test-Path (Join-Path $runtimeDir "node_modules")) {
    $runtimeBat = Join-Path $PSScriptRoot "run_app_runtime.bat"
    Write-Host "Lanzando App Runtime via batch file..." -ForegroundColor Yellow
    $runtimeProc = Start-Process cmd.exe -ArgumentList "/c $runtimeBat" -PassThru -WindowStyle Hidden
    if ($runtimeProc) {
        Write-Host "  [OK] App Runtime lanzado (PID: $($runtimeProc.Id), Puerto: 4201)" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] No se pudo lanzar App Runtime" -ForegroundColor Red
    }
} else {
    Write-Host "  [SKIP] App Runtime: node_modules no encontrado. Ejecute 'npm install' en microfrontends/app-runtime primero." -ForegroundColor Yellow
}
