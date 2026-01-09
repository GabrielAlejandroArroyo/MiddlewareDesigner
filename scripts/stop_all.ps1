# Script para detener todos los servicios del ecosistema (Backend, Middleware y Frontend)
# Uso: .\scripts\stop_all.ps1

$ErrorActionPreference = "SilentlyContinue"

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  Middleware Designer - Deteniendo Todo" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

# 1. Detener procesos de Python (Backend y Middleware)
Write-Host "[1/2] Deteniendo procesos de Python (Microservicios y Middleware)..." -ForegroundColor Cyan
# Matamos de forma forzada y todo el árbol de procesos (/T)
taskkill /F /IM python.exe /T 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Procesos de Python detenidos." -ForegroundColor Green
} else {
    Write-Host "  [INFO] No se encontraron procesos de Python activos." -ForegroundColor Gray
}

# 2. Detener procesos de Node/Angular (Frontend)
Write-Host "[2/2] Deteniendo procesos de Node/Angular (Frontend)..." -ForegroundColor Cyan
taskkill /F /IM node.exe /T 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Procesos de Node detenidos." -ForegroundColor Green
} else {
    Write-Host "  [INFO] No se encontraron procesos de Node activos." -ForegroundColor Gray
}

# 3. Limpieza de Jobs de PowerShell (por si acaso)
Get-Job | Stop-Job -ErrorAction SilentlyContinue
Get-Job | Remove-Job -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  ECOSISTEMA DETENIDO CORRECTAMENTE" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
