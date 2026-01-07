# Script maestro para levantar todos los servicios (backend, middleware y frontend)
# Uso: .\scripts\start_all.ps1

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  Middleware Designer - Reiniciando Ecosistema" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

# --- FASE 1: BAJADA DE SERVICIOS EXISTENTES ---
Write-Host "[0/3] Bajando procesos existentes..." -ForegroundColor Yellow

$processes = Get-Process | Where-Object { $_.Name -match "python" -or $_.Name -match "node" }
if ($processes) {
    $processes | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "  Procesos detenidos." -ForegroundColor Green
} else {
    Write-Host "  No se encontraron procesos activos." -ForegroundColor Gray
}

Get-Job | Stop-Job -ErrorAction SilentlyContinue
Get-Job | Remove-Job -ErrorAction SilentlyContinue

Write-Host "  Esperando liberacion de puertos..." -ForegroundColor Gray
Start-Sleep -Seconds 2
Write-Host ""

# --- FUNCION DE ESPERA ---
function Wait-ForUrl($url, $name) {
    Write-Host "  Esperando a $name en $url..." -ForegroundColor Gray
    for ($i = 1; $i -le 20; $i++) {
        try {
            # Usar curl.exe para mayor confiabilidad en Windows
            $resp = curl.exe -s -o /dev/null -w "%{http_code}" $url
            if ($resp -eq "200") {
                Write-Host "  [OK] $name ONLINE." -ForegroundColor Green
                return $true
            }
        } catch { }
        Start-Sleep -Seconds 2
    }
    Write-Host "  [WAIT] $name aun no responde." -ForegroundColor Yellow
    return $false
}

# --- FASE 2: LEVANTADO DE SERVICIOS ---
$scriptsDir = $PSScriptRoot

Write-Host "[1/3] Iniciando backend..." -ForegroundColor Cyan
$backendJob = Start-Job -ScriptBlock {
    param($scriptPath)
    Set-Location (Split-Path $scriptPath)
    & ".\start_backend.ps1"
} -ArgumentList $scriptsDir

# Esperar a los microservicios principales
Wait-ForUrl "http://127.0.0.1:8000/openapi.json" "Pais"
Wait-ForUrl "http://127.0.0.1:8001/openapi.json" "Provincia"
Wait-ForUrl "http://127.0.0.1:8002/openapi.json" "Localidad"
Wait-ForUrl "http://127.0.0.1:8003/openapi.json" "Corporacion"
Wait-ForUrl "http://127.0.0.1:8004/openapi.json" "Empresa"
Wait-ForUrl "http://127.0.0.1:8005/openapi.json" "Aplicacion"
Wait-ForUrl "http://127.0.0.1:8006/openapi.json" "Roles"
Wait-ForUrl "http://127.0.0.1:8007/openapi.json" "Usuario"
Wait-ForUrl "http://127.0.0.1:8008/openapi.json" "Aplicacion-Role"
Wait-ForUrl "http://127.0.0.1:8009/openapi.json" "Usuario-Rol"

Write-Host "[2/3] Iniciando middleware..." -ForegroundColor Cyan
$middlewareJob = Start-Job -ScriptBlock {
    param($scriptPath)
    Set-Location (Split-Path $scriptPath)
    & ".\start_middleware.ps1"
} -ArgumentList $scriptsDir

Wait-ForUrl "http://127.0.0.1:9000/api/v1/config/backend-services" "Middleware"

Write-Host "[3/3] Iniciando frontend..." -ForegroundColor Cyan
$frontendJob = Start-Job -ScriptBlock {
    param($scriptPath)
    Set-Location (Split-Path $scriptPath)
    & ".\start_frontend.ps1"
} -ArgumentList $scriptsDir

Wait-ForUrl "http://127.0.0.1:4200" "Frontend"

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  ECOSISTEMA LISTO" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "BACKEND MICROSERVICIOS (127.0.0.1):" -ForegroundColor Cyan
Write-Host "  -> PAIS:             http://127.0.0.1:8000/docs" -ForegroundColor Green
Write-Host "  -> PROVINCIA:        http://127.0.0.1:8001/docs" -ForegroundColor Green
Write-Host "  -> LOCALIDAD:        http://127.0.0.1:8002/docs" -ForegroundColor Green
Write-Host "  -> CORPORACION:      http://127.0.0.1:8003/docs" -ForegroundColor Green
Write-Host "  -> EMPRESA:          http://127.0.0.1:8004/docs" -ForegroundColor Green
Write-Host "  -> APLICACION:       http://127.0.0.1:8005/docs" -ForegroundColor Green
Write-Host "  -> ROLES:            http://127.0.0.1:8006/docs" -ForegroundColor Green
Write-Host "  -> USUARIO:          http://127.0.0.1:8007/docs" -ForegroundColor Green
Write-Host "  -> APLICACION-ROLE:  http://127.0.0.1:8008/docs" -ForegroundColor Green
Write-Host "  -> USUARIO-ROL:      http://127.0.0.1:8009/docs" -ForegroundColor Green
Write-Host ""
Write-Host "MIDDLEWARE:" -ForegroundColor Cyan
Write-Host "  -> API:              http://127.0.0.1:9000/docs" -ForegroundColor Green
Write-Host ""
Write-Host "FRONTEND:" -ForegroundColor Cyan
Write-Host "  -> DESIGNER UI:      http://127.0.0.1:4200" -ForegroundColor Green
Write-Host ""

function Final-Cleanup {
    Write-Host "Deteniendo procesos..." -ForegroundColor Yellow
    Get-Job | Stop-Job -ErrorAction SilentlyContinue
    Get-Job | Remove-Job -ErrorAction SilentlyContinue
    Get-Process | Where-Object { $_.Name -match "python" -or $_.Name -match "node" } | Stop-Process -Force -ErrorAction SilentlyContinue
}

try {
    while ($true) {
        Start-Sleep -Seconds 5
        if ($backendJob.State -eq "Failed") { Write-Host "Backend Fallo"; break }
        if ($middlewareJob.State -eq "Failed") { Write-Host "Middleware Fallo"; break }
        if ($frontendJob.State -eq "Failed") { Write-Host "Frontend Fallo"; break }
    }
} finally {
    Final-Cleanup
}
