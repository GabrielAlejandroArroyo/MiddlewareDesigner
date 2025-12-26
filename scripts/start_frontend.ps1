# Script para levantar todos los microfrontends
# Uso: .\scripts\start_frontend.ps1

$ErrorActionPreference = "Continue" # Cambiado a Continue para no abortar todo si uno falla

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Iniciando Microfrontends" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Obtener la ruta del directorio raíz del proyecto
$rootDir = Split-Path -Parent $PSScriptRoot
$microfrontendsDir = Join-Path $rootDir "microfrontends"

if (-not (Test-Path $microfrontendsDir)) {
    Write-Host "Error: No se encontro la carpeta 'microfrontends'" -ForegroundColor Red
    exit 1
}

# Buscar todos los microfrontends con angular.json, project.json o package.json
$mfeDirs = Get-ChildItem -Path $microfrontendsDir -Directory | Where-Object {
    (Test-Path (Join-Path $_.FullName "angular.json")) -or 
    (Test-Path (Join-Path $_.FullName "project.json")) -or
    (Test-Path (Join-Path $_.FullName "package.json"))
}

if ($null -eq $mfeDirs -or $mfeDirs.Count -eq 0) {
    Write-Host "No se encontraron microfrontends para iniciar en $microfrontendsDir" -ForegroundColor Yellow
    exit 0
}

Write-Host "Microfrontends encontrados: $($mfeDirs.Count)" -ForegroundColor Green
Write-Host ""

# Puerto base para los microfrontends
$basePort = 4200
$portIndex = 0

$jobs = @()

foreach ($mfeDir in $mfeDirs) {
    $mfeName = $mfeDir.Name
    $mfePath = $mfeDir.FullName
    $port = $basePort + $portIndex
    
    Write-Host "Configurando microfrontend: $mfeName en puerto $port" -ForegroundColor Yellow
    
    # Verificar si existe package.json e instalar dependencias si falta node_modules
    $packageJsonPath = Join-Path $mfePath "package.json"
    if (Test-Path $packageJsonPath) {
        if (-not (Test-Path (Join-Path $mfePath "node_modules"))) {
            Write-Host "  Instalando dependencias (npm install)... esto puede tardar un momento." -ForegroundColor Gray
            Push-Location $mfePath
            # Usar cmd /c para llamar a npm de forma mas segura en subprocesos de Windows
            cmd /c "npm install --no-audit --no-fund"
            Pop-Location
        }
    }
    
    # Iniciar el microfrontend en background
    # Usamos npx para asegurar que usamos el cli local si existe
    $job = Start-Job -ScriptBlock {
        param($path, $name, $port)
        Set-Location $path
        
        # Verificar si existe angular.json para usar ng, sino npm start
        if (Test-Path "angular.json") {
            # Usar npx para ejecutar ng local
            cmd /c "npx ng serve --port $port --host 127.0.0.1 --open false"
        } else {
            cmd /c "npm start -- --port $port --host 127.0.0.1"
        }
    } -ArgumentList $mfePath, $mfeName, $port
    
    # Esperar un poco para ver si el proceso arranca
    Start-Sleep -Seconds 5
    
    $jobs += @{
        Name = $mfeName
        Job = $job
        Port = $port
    }
    
    Write-Host "  [OK] Microfrontend $mfeName iniciado (Job ID: $($job.Id), Puerto: $port)" -ForegroundColor Green
    Write-Host ""
    
    $portIndex++
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Microfrontends en ejecucion" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

foreach ($mfeInfo in $jobs) {
    Write-Host "  $($mfeInfo.Name): http://localhost:$($mfeInfo.Port)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Monitoreando microfrontends (Presiona Ctrl+C para salir)..." -ForegroundColor Yellow
Write-Host ""

# Esperar y monitorear
try {
    while ($true) {
        Start-Sleep -Seconds 5
        foreach ($mfeInfo in $jobs) {
            if ($mfeInfo.Job.State -ne "Running") {
                Write-Host "  [ALERTA] Microfrontend $($mfeInfo.Name) se ha detenido inesperadamente." -ForegroundColor Yellow
                $output = Receive-Job -Job $mfeInfo.Job
                if ($output) { Write-Output $output }
            }
        }
    }
} finally {
    Write-Host ""
    Write-Host "Deteniendo microfrontends..." -ForegroundColor Yellow
    
    foreach ($mfeInfo in $jobs) {
        Stop-Job -Job $mfeInfo.Job -ErrorAction SilentlyContinue
        Remove-Job -Job $mfeInfo.Job -ErrorAction SilentlyContinue
    }
    
    Write-Host "Microfrontends detenidos" -ForegroundColor Green
}
