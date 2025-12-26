# Script para levantar todos los servicios backend
# Uso: .\scripts\start_backend.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Iniciando Servicios Backend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Obtener la ruta del directorio raiz del proyecto
# PSScriptRoot es .../scripts, el root es el padre
$scriptsDir = $PSScriptRoot
$rootDir = Split-Path -Parent $scriptsDir
$servicesDir = Join-Path $rootDir "services"

if (-not (Test-Path $servicesDir)) {
    Write-Host "Error: No se encontro la carpeta 'services' en $servicesDir" -ForegroundColor Red
    exit 1
}

# Buscar todos los servicios (carpetas que tienen main.py)
$services = Get-ChildItem -Path $servicesDir -Directory | Where-Object {
    Test-Path (Join-Path $_.FullName "main.py")
}

if ($null -eq $services -or $services.Count -eq 0) {
    Write-Host "No se encontraron servicios para iniciar en $servicesDir" -ForegroundColor Yellow
    exit 0
}

Write-Host "Servicios encontrados: $($services.Count)" -ForegroundColor Green
Write-Host ""

# Puerto base para los servicios
$basePort = 8000
$portIndex = 0

$jobs = @()

foreach ($service in $services) {
    $serviceName = $service.Name
    $servicePath = $service.FullName
    $port = $basePort + $portIndex
    
    Write-Host "Iniciando servicio: $serviceName en puerto $port" -ForegroundColor Yellow
    
    # Verificar e instalar dependencias si existe requirements.txt
    $requirementsPath = Join-Path $servicePath "requirements.txt"
    if (Test-Path $requirementsPath) {
        Write-Host "  Instalando dependencias para $serviceName..." -ForegroundColor Gray
        pip install -q -r $requirementsPath
    }
    
    # Iniciar el servicio en background
    # Pasamos el rootDir al job para configurar el PYTHONPATH
    $job = Start-Job -ScriptBlock {
        param($servicesDir, $serviceName, $port)
        $ErrorActionPreference = "Continue"
        
        # Configurar PYTHONPATH para que incluya la carpeta services
        # Esto permite que los imports relativos funcionen correctamente
        $env:PYTHONPATH = $servicesDir
        
        Set-Location $servicesDir
        
        # Ejecutar uvicorn
        python -m uvicorn "$($serviceName).main:app" --host 0.0.0.0 --port $port --reload 2>&1
    } -ArgumentList $servicesDir, $serviceName, $port
    
    # Esperar un momento para ver si falla rapido
    Start-Sleep -Seconds 4
    
    $jobState = $job.State
    if ($jobState -eq "Failed" -or $jobState -eq "Completed") {
        Write-Host "  [ERROR] El servicio $serviceName no pudo iniciar o se detuvo." -ForegroundColor Red
        $output = Receive-Job -Job $job
        if ($output) { Write-Host "  Detalles: $output" -ForegroundColor Red }
    } else {
        $jobs += @{
            Name = $serviceName
            Job = $job
            Port = $port
        }
        Write-Host "  [OK] Servicio $serviceName iniciado en puerto $port" -ForegroundColor Green
    }
    
    $portIndex++
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Backend Monitoreando (Ctrl+C para salir)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

try {
    while ($true) {
        Start-Sleep -Seconds 5
        foreach ($serviceInfo in $jobs) {
            if ($serviceInfo.Job.State -ne "Running") {
                Write-Host "  [ALERTA] El servicio $($serviceInfo.Name) ya no esta en ejecucion." -ForegroundColor Yellow
            }
        }
    }
} finally {
    Write-Host "`nDeteniendo servicios..." -ForegroundColor Yellow
    foreach ($serviceInfo in $jobs) {
        Stop-Job -Job $serviceInfo.Job -ErrorAction SilentlyContinue
        Remove-Job -Job $serviceInfo.Job -ErrorAction SilentlyContinue
    }
    Write-Host "Todos los servicios backend se han detenido." -ForegroundColor Green
}
