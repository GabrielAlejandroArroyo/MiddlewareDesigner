# Script para levantar los microfrontends de forma persistente
# Uso: .\scripts\start_frontend.ps1

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Iniciando Microfrontends (Persistentes)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$rootDir = Split-Path -Parent $PSScriptRoot
$batPath = Join-Path $PSScriptRoot "run_frontend.bat"

Write-Host "Lanzando frontend via batch file..." -ForegroundColor Yellow

$process = Start-Process cmd.exe -ArgumentList "/c $batPath" -PassThru -WindowStyle Hidden

if ($process) {
    Write-Host "  [OK] Frontend lanzado (PID: $($process.Id), Puerto: 4200)" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] No se pudo lanzar el archivo batch" -ForegroundColor Red
}
