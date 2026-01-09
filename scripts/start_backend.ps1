# Script para levantar todos los servicios backend de forma persistente
# Uso: .\scripts\start_backend.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Iniciando Servicios Backend (Persistentes)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptsDir = $PSScriptRoot
$rootDir = Split-Path -Parent $scriptsDir
$servicesDir = Join-Path $rootDir "services"

if (-not (Test-Path $servicesDir)) {
    Write-Host "Error: No se encontro la carpeta 'services' en $servicesDir" -ForegroundColor Red
    exit 1
}

$services = Get-ChildItem -Path $servicesDir -Directory | Where-Object {
    Test-Path (Join-Path $_.FullName "main.py")
}

$servicePorts = @{
    "pais" = 8000
    "provincia" = 8001
    "localidad" = 8002
    "corporacion" = 8003
    "empresa" = 8004
    "aplicacion" = 8005
    "roles" = 8006
    "usuario" = 8007
    "aplicacion-role" = 8008
    "usuario-rol" = 8009
}

foreach ($service in $services) {
    $serviceName = $service.Name
    $servicePath = $service.FullName
    
    if ($servicePorts.ContainsKey($serviceName)) {
        $port = $servicePorts[$serviceName]
    } else {
        $port = 8004
        while ($servicePorts.ContainsValue($port)) { $port++ }
        $servicePorts[$serviceName] = $port
    }
    
    Write-Host "Iniciando servicio: $serviceName en puerto $port" -ForegroundColor Yellow
    
    # Usamos 0.0.0.0 para que escuche en todas las interfaces y evitar problemas con localhost/127.0.0.1
    $args = "-m uvicorn main:app --host 0.0.0.0 --port $port --reload"
    $process = Start-Process python -ArgumentList $args -WorkingDirectory $servicePath -PassThru -WindowStyle Hidden
    
    if ($process) {
        Write-Host "  [OK] $serviceName iniciado (PID: $($process.Id))" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] No se pudo iniciar $serviceName" -ForegroundColor Red
    }
}

Write-Host "`nServicios backend lanzados en segundo plano." -ForegroundColor Green
