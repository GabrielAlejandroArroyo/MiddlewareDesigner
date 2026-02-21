# Limpia volúmenes y levanta todo desde cero.
# Uso: .\scripts\clean_and_start.ps1
# Resultado: admin/admin con cambio de contraseña obligatorio en primer login.

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "Deteniendo y eliminando contenedores y volúmenes..."
docker compose down -v 2>$null

Write-Host "Eliminando contenedores huérfanos (por si hay conflictos de nombre)..."
docker rm -f usuario-service usuario-init middleware-designer designer-ui 2>$null

Write-Host "Eliminando volúmenes del proyecto..."
$vols = docker volume ls -q | Where-Object { $_ -match "fullstackmiddle" }
foreach ($v in $vols) {
    docker volume rm $v 2>$null
}

Write-Host "Reconstruyendo imagen usuario (sin cache)..."
docker compose build usuario --no-cache 2>&1 | Out-Null

Write-Host "Levantando servicios..."
docker compose up -d

Write-Host "Esperando inicialización (admin creado o corregido) ~15 s..."
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "Listo. Prueba en http://localhost:4200"
Write-Host "  Usuario: admin"
Write-Host "  Contraseña: admin"
Write-Host "  Se pedirá cambiar la contraseña en el primer login."
