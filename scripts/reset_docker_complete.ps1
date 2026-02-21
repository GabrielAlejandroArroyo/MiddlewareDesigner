# =============================================================================
# Script: reset_docker_complete.ps1
# Limpia por completo el proyecto fullstackmiddle y lo recrea desde cero.
# Uso: .\scripts\reset_docker_complete.ps1
#
# Regla aplicada al arrancar: usuarios con password null reciben "1234" y deben
# cambiar la contraseña en el primer login (migrate_null_passwords_to_1234).
# Admin se crea con admin/admin (seed), también con cambio obligatorio.
# =============================================================================

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

$ProjectName = "fullstackmiddle"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Reset completo Docker - $ProjectName" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Detener y eliminar contenedores del proyecto
Write-Host "[1/8] Deteniendo docker-compose..." -ForegroundColor Yellow
$ErrorActionPreferenceBackup = $ErrorActionPreference
$ErrorActionPreference = "Continue"
docker compose down -v 2>&1 | Out-Null
$ErrorActionPreference = $ErrorActionPreferenceBackup
Write-Host "      OK" -ForegroundColor Green

# 2. Eliminar contenedores huérfanos por nombre (por si hay conflictos)
# Nota: Tras "compose down" pueden no existir; no fallar si falta alguno
Write-Host "[2/8] Eliminando contenedores huérfanos..." -ForegroundColor Yellow
$containers = @("usuario-service", "usuario-init", "middleware-designer", "designer-ui")
foreach ($c in $containers) {
    $id = docker ps -a -q -f "name=$c" 2>$null
    if ($id) { docker rm -f $c 2>&1 | Out-Null }
}
Write-Host "      OK" -ForegroundColor Green

# 3. Eliminar volúmenes del proyecto
Write-Host "[3/8] Eliminando volúmenes..." -ForegroundColor Yellow
$vols = docker volume ls -q 2>$null | Where-Object { $_ -match $ProjectName }
foreach ($v in $vols) {
    docker volume rm $v 2>$null
}
Write-Host "      OK" -ForegroundColor Green

# 4. Eliminar imágenes del proyecto
Write-Host "[4/8] Eliminando imágenes..." -ForegroundColor Yellow
$images = docker images --format "{{.Repository}}:{{.Tag}}" 2>$null | Where-Object { $_ -match $ProjectName }
foreach ($img in $images) {
    docker rmi -f $img 2>$null
}
Write-Host "      OK" -ForegroundColor Green

# 5. Eliminar redes huérfanas del proyecto
Write-Host "[5/8] Eliminando redes..." -ForegroundColor Yellow
$networks = docker network ls -q 2>$null
$projectNetworks = docker network ls --format "{{.Name}}" 2>$null | Where-Object { $_ -match $ProjectName }
foreach ($net in $projectNetworks) {
    docker network rm $net 2>$null
}
Write-Host "      OK" -ForegroundColor Green

# 6. Limpiar build cache (opcional - puede ser lento)
Write-Host "[6/8] Limpiando build cache..." -ForegroundColor Yellow
docker builder prune -f 2>$null
Write-Host "      OK" -ForegroundColor Green

# 7. Reconstruir todas las imágenes sin cache
# Docker escribe progreso en stderr; evitar que PowerShell lo trate como error
Write-Host "[7/8] Reconstruyendo imágenes (sin cache)..." -ForegroundColor Yellow
$ErrorActionPreferenceBackup = $ErrorActionPreference
$ErrorActionPreference = "Continue"
docker compose build --no-cache 2>&1 | Out-Host
$ErrorActionPreference = $ErrorActionPreferenceBackup
if ($LASTEXITCODE -ne 0) {
    Write-Host "      ERROR al reconstruir" -ForegroundColor Red
    exit 1
}
Write-Host "      OK" -ForegroundColor Green

# 8. Levantar servicios
Write-Host "[8/8] Levantando servicios..." -ForegroundColor Yellow
$ErrorActionPreference = "Continue"
docker compose up -d 2>&1 | Out-Host
$ErrorActionPreference = $ErrorActionPreferenceBackup
if ($LASTEXITCODE -ne 0) {
    Write-Host "      ERROR al levantar" -ForegroundColor Red
    exit 1
}
Write-Host "      OK" -ForegroundColor Green

Write-Host ""
Write-Host "Esperando inicialización (admin + migración null→1234) ~18 segundos..." -ForegroundColor Cyan
Start-Sleep -Seconds 18

# Verificar que la regla está aplicada: login admin/admin con requires_password_change
Write-Host "Verificando login y regla de cambio de contraseña..." -ForegroundColor Cyan
try {
    $body = @{username="admin"; password="admin"} | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "http://localhost:9000/api/v1/auth/login" -Method Post -ContentType "application/json" -Body $body -TimeoutSec 10
    if ($r.success -and $r.requires_password_change) {
        Write-Host "  OK - Regla aplicada: login correcto, cambio de contraseña requerido" -ForegroundColor Green
    } elseif ($r.success) {
        Write-Host "  OK - Login correcto" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Verificación incompleta" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [WARN] No se pudo verificar login (middleware puede estar iniciando)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Listo. Servicios disponibles:" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Designer UI:  http://localhost:4200" -ForegroundColor White
Write-Host "  Middleware:   http://localhost:9000" -ForegroundColor White
Write-Host "  Usuario API:  http://localhost:8007" -ForegroundColor White
Write-Host ""
Write-Host "  Login: admin / admin" -ForegroundColor White
Write-Host "  Usuarios con password null: 1234 (deben cambiar en primer login)" -ForegroundColor White
Write-Host ""
