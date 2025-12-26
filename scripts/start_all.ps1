# Script maestro para levantar todos los servicios (backend, middleware y frontend)
# Uso: .\scripts\start_all.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  Iniciando Todos los Servicios" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

# Obtener la ruta del directorio de scripts
$scriptsDir = $PSScriptRoot

# Iniciar servicios backend
Write-Host "Iniciando servicios backend..." -ForegroundColor Cyan
$backendJob = Start-Job -ScriptBlock {
    param($scriptPath)
    & "$scriptPath\start_backend.ps1"
} -ArgumentList $scriptsDir

Start-Sleep -Seconds 3

# Iniciar middleware
Write-Host "Iniciando middleware..." -ForegroundColor Cyan
$middlewareJob = Start-Job -ScriptBlock {
    param($scriptPath)
    & "$scriptPath\start_middleware.ps1"
} -ArgumentList $scriptsDir

Start-Sleep -Seconds 2

# Iniciar microfrontends
Write-Host "Iniciando microfrontends..." -ForegroundColor Cyan
$frontendJob = Start-Job -ScriptBlock {
    param($scriptPath)
    & "$scriptPath\start_frontend.ps1"
} -ArgumentList $scriptsDir

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  Todos los Servicios Iniciados" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "Servicios Backend: http://localhost:8000+" -ForegroundColor Green
Write-Host "Middleware: http://localhost:9000" -ForegroundColor Green
Write-Host "Microfrontends: http://localhost:4200+" -ForegroundColor Green
Write-Host ""
Write-Host "Presiona Ctrl+C para detener todos los servicios" -ForegroundColor Yellow
Write-Host ""

# Función para limpiar procesos al salir
function Cleanup {
    Write-Host ""
    Write-Host "Deteniendo todos los servicios..." -ForegroundColor Yellow
    
    Stop-Job -Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job -Job $middlewareJob -ErrorAction SilentlyContinue
    Stop-Job -Job $frontendJob -ErrorAction SilentlyContinue
    
    Remove-Job -Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $middlewareJob -ErrorAction SilentlyContinue
    Remove-Job -Job $frontendJob -ErrorAction SilentlyContinue
    
    Write-Host "Todos los servicios detenidos" -ForegroundColor Green
}

# Capturar Ctrl+C
[Console]::TreatControlCAsInput = $false
try {
    while ($true) {
        Start-Sleep -Seconds 1
        
        # Verificar si algún job falló
        if ($backendJob.State -eq "Failed" -or $middlewareJob.State -eq "Failed" -or $frontendJob.State -eq "Failed") {
            Write-Host "Error: Uno o más servicios fallaron" -ForegroundColor Red
            Cleanup
            exit 1
        }
    }
} finally {
    Cleanup
}

