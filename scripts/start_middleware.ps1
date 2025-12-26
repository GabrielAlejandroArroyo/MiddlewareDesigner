# Script para levantar el middleware
# Uso: .\scripts\start_middleware.ps1 [--port PORT]

param(
    [int]$Port = 9000
)

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Iniciando Middleware" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Obtener la ruta del directorio raíz del proyecto
$rootDir = Split-Path -Parent $PSScriptRoot
$middlewareDir = Join-Path $rootDir "middleware"

if (-not (Test-Path $middlewareDir)) {
    Write-Host "Error: No se encontro la carpeta 'middleware'" -ForegroundColor Red
    exit 1
}

Write-Host "Iniciando middleware en puerto $Port" -ForegroundColor Yellow

# Verificar si existe requirements.txt e instalar dependencias
$requirementsPath = Join-Path $middlewareDir "requirements.txt"
if (Test-Path $requirementsPath) {
    Write-Host "  Verificando dependencias..." -ForegroundColor Gray
    cmd /c "pip install -q -r $requirementsPath"
}

Write-Host "  [OK] Middleware configurado en http://127.0.0.1:$Port" -ForegroundColor Green
Write-Host ""

# Iniciar el middleware
Push-Location $middlewareDir
try {
    # Usar 0.0.0.0 para evitar problemas de binding en Windows
    python -m uvicorn main:app --host 0.0.0.0 --port $Port --reload
} finally {
    Pop-Location
    Write-Host ""
    Write-Host "Middleware detenido" -ForegroundColor Green
}
