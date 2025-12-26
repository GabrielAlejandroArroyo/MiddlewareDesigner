# Script maestro para levantar todos los servicios (backend, middleware y frontend)
# Uso: .\scripts\start_all.ps1

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  Middleware Designer - Reiniciando Ecosistema" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

# --- FASE 1: BAJADA DE SERVICIOS EXISTENTES ---
Write-Host "[0/3] Bajando procesos existentes (Python/Node)..." -ForegroundColor Yellow

# Detener procesos hijos persistentes
$processes = Get-Process | Where-Object { $_.Name -match "python" -or $_.Name -match "node" }
if ($processes) {
    $processes | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "  ✓ $($processes.Count) procesos detenidos." -ForegroundColor Green
} else {
    Write-Host "  ✓ No se encontraron procesos activos." -ForegroundColor Gray
}

# Detener Jobs de PowerShell previos
Get-Job | Stop-Job -ErrorAction SilentlyContinue
Get-Job | Remove-Job -ErrorAction SilentlyContinue

# Esperar a que los puertos se liberen
Write-Host "  Esperando liberación de puertos..." -ForegroundColor Gray
Start-Sleep -Seconds 2

Write-Host ""

# --- FASE 2: LEVANTADO DE SERVICIOS ---

# Obtener la ruta del directorio de scripts
$scriptsDir = $PSScriptRoot

# Iniciar servicios backend
Write-Host "[1/3] Iniciando servicios backend..." -ForegroundColor Cyan
$backendJob = Start-Job -ScriptBlock {
    param($scriptPath)
    Set-Location (Split-Path $scriptPath)
    & "$scriptPath\start_backend.ps1"
} -ArgumentList $scriptsDir

Start-Sleep -Seconds 5

# Iniciar middleware
Write-Host "[2/3] Iniciando middleware..." -ForegroundColor Cyan
$middlewareJob = Start-Job -ScriptBlock {
    param($scriptPath)
    & "$scriptPath\start_middleware.ps1"
} -ArgumentList $scriptsDir

# Esperar a que el middleware levante la base de datos y el socket
Start-Sleep -Seconds 5

# Iniciar microfrontends
Write-Host "[3/3] Iniciando microfrontends..." -ForegroundColor Cyan
$frontendJob = Start-Job -ScriptBlock {
    param($scriptPath)
    & "$scriptPath\start_frontend.ps1"
} -ArgumentList $scriptsDir

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  Todos los Procesos Reiniciados" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Servicios Backend: http://127.0.0.1:8000+" -ForegroundColor Green
Write-Host "  Middleware:        http://127.0.0.1:9000" -ForegroundColor Green
Write-Host "  Frontend (UI):     http://127.0.0.1:4200" -ForegroundColor Green
Write-Host ""
Write-Host "Presiona Ctrl+C para detener todos los servicios" -ForegroundColor Yellow
Write-Host ""

# Función para limpiar procesos al salir
function Cleanup {
    Write-Host "`nDeteniendo todos los procesos..." -ForegroundColor Yellow
    
    Stop-Job -Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job -Job $middlewareJob -ErrorAction SilentlyContinue
    Stop-Job -Job $frontendJob -ErrorAction SilentlyContinue
    
    Remove-Job -Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $middlewareJob -ErrorAction SilentlyContinue
    Remove-Job -Job $frontendJob -ErrorAction SilentlyContinue
    
    Get-Process | Where-Object { $_.Name -match "python" -or $_.Name -match "node" } | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Write-Host "Todos los procesos detenidos." -ForegroundColor Green
}

# Monitoreo de salud
try {
    while ($true) {
        Start-Sleep -Seconds 5
        
        if ($backendJob.State -eq "Failed") {
            Write-Host "Error: El proceso de Backend fallo." -ForegroundColor Red
            Receive-Job -Job $backendJob
            break
        }
        if ($middlewareJob.State -eq "Failed") {
            Write-Host "Error: El proceso de Middleware fallo." -ForegroundColor Red
            Receive-Job -Job $middlewareJob
            break
        }
        if ($frontendJob.State -eq "Failed") {
            Write-Host "Error: El proceso de Frontend fallo." -ForegroundColor Red
            Receive-Job -Job $frontendJob
            break
        }
    }
} finally {
    Cleanup
}
