# Script para levantar todos los microfrontends
# Uso: .\scripts\start_frontend.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Iniciando Microfrontends" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Obtener la ruta del directorio raíz del proyecto
$rootDir = Split-Path -Parent $PSScriptRoot
$microfrontendsDir = Join-Path $rootDir "microfrontends"

if (-not (Test-Path $microfrontendsDir)) {
    Write-Host "Error: No se encontró la carpeta 'microfrontends'" -ForegroundColor Red
    Write-Host "Creando estructura básica..." -ForegroundColor Yellow
    
    # Crear estructura básica si no existe
    New-Item -ItemType Directory -Path $microfrontendsDir -Force | Out-Null
    Write-Host "Carpeta 'microfrontends' creada. Por favor, configura los microfrontends." -ForegroundColor Yellow
    exit 1
}

# Buscar todos los microfrontends con angular.json o project.json
$mfeDirs = Get-ChildItem -Path $microfrontendsDir -Directory | Where-Object {
    (Test-Path (Join-Path $_.FullName "angular.json")) -or 
    (Test-Path (Join-Path $_.FullName "project.json")) -or
    (Test-Path (Join-Path $_.FullName "package.json"))
}

if ($mfeDirs.Count -eq 0) {
    Write-Host "No se encontraron microfrontends para iniciar" -ForegroundColor Yellow
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
    
    Write-Host "Iniciando microfrontend: $mfeName en puerto $port" -ForegroundColor Yellow
    
    # Verificar si existe package.json e instalar dependencias
    $packageJsonPath = Join-Path $mfePath "package.json"
    if (Test-Path $packageJsonPath) {
        Write-Host "  Instalando dependencias..." -ForegroundColor Gray
        Push-Location $mfePath
        
        # Verificar si node_modules existe
        if (-not (Test-Path (Join-Path $mfePath "node_modules"))) {
            npm install
        }
        
        Pop-Location
    }
    
    # Iniciar el microfrontend en background
    Push-Location $mfePath
    $job = Start-Job -ScriptBlock {
        param($path, $name, $port)
        Set-Location $path
        
        # Intentar con ng serve primero, luego con npm start
        if (Get-Command ng -ErrorAction SilentlyContinue) {
            ng serve --port $port --open false
        } elseif (Test-Path "package.json") {
            npm start -- --port $port
        } else {
            Write-Error "No se encontró ng o package.json con script start"
        }
    } -ArgumentList $mfePath, $mfeName, $port
    
    $jobs += @{
        Name = $mfeName
        Job = $job
        Port = $port
    }
    
    Write-Host "  [OK] Microfrontend $mfeName iniciado (PID: $($job.Id), Puerto: $port)" -ForegroundColor Green
    Write-Host ""
    
    $portIndex++
    Start-Sleep -Seconds 3
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Microfrontends Iniciados" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

foreach ($mfeInfo in $jobs) {
    Write-Host "  $($mfeInfo.Name): http://localhost:$($mfeInfo.Port)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Presiona Ctrl+C para detener todos los microfrontends" -ForegroundColor Yellow
Write-Host ""

# Esperar a que el usuario presione Ctrl+C
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host ""
    Write-Host "Deteniendo microfrontends..." -ForegroundColor Yellow
    
    foreach ($mfeInfo in $jobs) {
        Write-Host "  Deteniendo $($mfeInfo.Name)..." -ForegroundColor Gray
        Stop-Job -Job $mfeInfo.Job -ErrorAction SilentlyContinue
        Remove-Job -Job $mfeInfo.Job -ErrorAction SilentlyContinue
    }
    
    Write-Host "Microfrontends detenidos" -ForegroundColor Green
}

