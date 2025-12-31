# Script para ejecutar la migración del middleware
# Uso: .\scripts\migrate_middleware.ps1

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Migracion de Base de Datos del Middleware" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Obtener el directorio raíz del proyecto
$rootDir = Split-Path -Parent $PSScriptRoot
$middlewareDir = Join-Path $rootDir "middleware"

if (-not (Test-Path $middlewareDir)) {
    Write-Host "ERROR: No se encontro el directorio 'middleware'" -ForegroundColor Red
    exit 1
}

Write-Host "Ejecutando migracion..." -ForegroundColor Yellow
Write-Host ""

# Cambiar al directorio del middleware y ejecutar el script
Set-Location $middlewareDir
python scripts/migrate_add_swagger_fields.py

$exitCode = $LASTEXITCODE

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "Migracion completada exitosamente." -ForegroundColor Green
} else {
    Write-Host "Error durante la migracion. Codigo de salida: $exitCode" -ForegroundColor Red
}

Set-Location $rootDir
exit $exitCode
