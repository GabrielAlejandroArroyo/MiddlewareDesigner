# Script para levantar el middleware
# Uso: .\scripts\start_middleware.ps1 [--port PORT]

param(
    [int]$Port = 9000
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Iniciando Middleware" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Obtener la ruta del directorio raíz del proyecto
$rootDir = Split-Path -Parent $PSScriptRoot
$middlewareDir = Join-Path $rootDir "middleware"

if (-not (Test-Path $middlewareDir)) {
    Write-Host "Error: No se encontró la carpeta 'middleware'" -ForegroundColor Red
    Write-Host "Creando estructura básica..." -ForegroundColor Yellow
    
    # Crear estructura básica si no existe
    New-Item -ItemType Directory -Path $middlewareDir -Force | Out-Null
    Write-Host "Carpeta 'middleware' creada. Por favor, configura el middleware." -ForegroundColor Yellow
    exit 1
}

# Buscar main.py o app.py en el middleware
$mainFile = $null
if (Test-Path (Join-Path $middlewareDir "main.py")) {
    $mainFile = "main.py"
} elseif (Test-Path (Join-Path $middlewareDir "app.py")) {
    $mainFile = "app.py"
} else {
    Write-Host "Error: No se encontró main.py o app.py en el middleware" -ForegroundColor Red
    exit 1
}

Write-Host "Iniciando middleware en puerto $Port" -ForegroundColor Yellow

# Verificar si existe requirements.txt e instalar dependencias
$requirementsPath = Join-Path $middlewareDir "requirements.txt"
if (Test-Path $requirementsPath) {
    Write-Host "Instalando dependencias..." -ForegroundColor Gray
    Push-Location $middlewareDir
    pip install -q -r requirements.txt
    Pop-Location
}

# Verificar si existe pyproject.toml
$pyprojectPath = Join-Path $middlewareDir "pyproject.toml"
if (Test-Path $pyprojectPath) {
    Write-Host "Instalando dependencias desde pyproject.toml..." -ForegroundColor Gray
    Push-Location $middlewareDir
    pip install -q -e .
    Pop-Location
}

Write-Host "[OK] Middleware iniciado en http://localhost:$Port" -ForegroundColor Green
Write-Host ""
Write-Host "Presiona Ctrl+C para detener el middleware" -ForegroundColor Yellow
Write-Host ""

# Iniciar el middleware
Push-Location $middlewareDir
try {
    uvicorn "${mainFile}:app" --host 0.0.0.0 --port $Port --reload
} finally {
    Pop-Location
    Write-Host ""
    Write-Host "Middleware detenido" -ForegroundColor Green
}

