# Script maestro para levantar todos los servicios (backend, middleware y frontend) de forma persistente
# Uso: .\scripts\start_all.ps1

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  Middleware Designer - Iniciando Ecosistema" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

# --- FASE 1: BAJADA DE SERVICIOS EXISTENTES ---
Write-Host "[0/3] Limpiando procesos previos..." -ForegroundColor Yellow
# Matar procesos de python y node de forma recursiva
taskkill /F /IM python.exe /T 2>$null
taskkill /F /IM node.exe /T 2>$null

Get-Job | Stop-Job -ErrorAction SilentlyContinue
Get-Job | Remove-Job -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# --- FUNCION DE ESPERA ---
function Wait-ForUrl($url, $name) {
    Write-Host "  Esperando a $name en $url..." -ForegroundColor Gray
    for ($i = 1; $i -le 30; $i++) { # Aumentamos el tiempo de espera a 60s total
        try {
            # Intentamos con 127.0.0.1 para la verificación interna
            $testUrl = $url.Replace("localhost", "127.0.0.1")
            $resp = curl.exe -s -o /dev/null -w "%{http_code}" --max-time 2 $testUrl
            if ($resp -eq "200") {
                Write-Host "  [OK] $name ONLINE." -ForegroundColor Green
                return $true
            }
        } catch { }
        Start-Sleep -Seconds 2
    }
    Write-Host "  [WAIT] $name aun no responde (posiblemente lento al iniciar o error en binding)." -ForegroundColor Yellow
    return $false
}

# --- FASE 2: LEVANTADO DE SERVICIOS ---
$scriptsDir = $PSScriptRoot

Write-Host "[1/3] Iniciando backend..." -ForegroundColor Cyan
& "$scriptsDir\start_backend.ps1"

# Esperar a los microservicios críticos para el inicio
Wait-ForUrl "http://127.0.0.1:8000/openapi.json" "Pais"
Wait-ForUrl "http://127.0.0.1:8003/openapi.json" "Corporacion"

Write-Host "[2/3] Iniciando middleware..." -ForegroundColor Cyan
& "$scriptsDir\start_middleware.ps1"
Wait-ForUrl "http://127.0.0.1:9000/api/v1/config/backend-services" "Middleware"

Write-Host "[3/3] Iniciando frontend..." -ForegroundColor Cyan
& "$scriptsDir\start_frontend.ps1"

# El frontend tarda mas, damos tiempo extra
Write-Host "  El Frontend (Angular) esta compilando... esto demora ~60 segundos." -ForegroundColor Yellow
Write-Host "  Puedes ir abriendo http://127.0.0.1:4200 en tu navegador." -ForegroundColor Gray
Wait-ForUrl "http://127.0.0.1:4200" "Frontend"

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  ECOSISTEMA LISTO Y PERSISTENTE" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "Los servicios estan corriendo en segundo plano (ventanas ocultas)." -ForegroundColor Cyan
Write-Host "IMPORTANTE: Si el frontend no carga de inmediato, espera 1 minuto." -ForegroundColor Yellow
Write-Host "Puedes cerrar esta consola sin que se detengan los servicios." -ForegroundColor Cyan
Write-Host "Usa 'scripts\check_status.ps1' para monitorear." -ForegroundColor Yellow
Write-Host ""
