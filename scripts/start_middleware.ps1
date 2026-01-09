# Script para levantar el middleware de forma persistente
# Uso: .\scripts\start_middleware.ps1 [--port PORT]

param(
    [int]$Port = 9000
)

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Iniciando Middleware (Persistente)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$rootDir = Split-Path -Parent $PSScriptRoot
$middlewareDir = Join-Path $rootDir "middleware"

Write-Host "Iniciando middleware en puerto $Port" -ForegroundColor Yellow

$args = "-m uvicorn main:app --host 0.0.0.0 --port $Port --reload"
$process = Start-Process python -ArgumentList $args -WorkingDirectory $middlewareDir -PassThru -WindowStyle Hidden

if ($process) {
    Write-Host "  [OK] Middleware iniciado (PID: $($process.Id)) en http://127.0.0.1:$Port" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] No se pudo iniciar el Middleware" -ForegroundColor Red
    exit 1
}
