# Script para verificar el estado de todos los servicios del monorepo
# Uso: .\scripts\check_status.ps1

$services = @(
    @{ name="País"; port=8000; url="http://localhost:8000/openapi.json" },
    @{ name="Provincia"; port=8001; url="http://localhost:8001/openapi.json" },
    @{ name="Localidad"; port=8002; url="http://localhost:8002/openapi.json" },
    @{ name="Corporación"; port=8003; url="http://localhost:8003/openapi.json" },
    @{ name="Empresa"; port=8004; url="http://localhost:8004/openapi.json" },
    @{ name="Middleware"; port=9000; url="http://localhost:9000/api/v1/config/backend-services" }
)

Write-Host "`n=== ESTADO DEL ECOSISTEMA MIDDLEWARE ===" -ForegroundColor Cyan
Write-Host ("{0,-15} {1,-10} {2,-10} {3,-30}" -f "SERVICIO", "PUERTO", "ESTADO", "ENDPOINT")
Write-Host ("-" * 65)

foreach ($svc in $services) {
    $status = "OFFLINE"
    $color = "Red"
    
    try {
        $response = Invoke-WebRequest -Uri $svc.url -Method Get -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $status = "ONLINE"
            $color = "Green"
        }
    } catch {
        # Sigue siendo offline
    }
    
    Write-Host ("{0,-15} {1,-10} " -f $svc.name, $svc.port) -NoNewline
    Write-Host ("{0,-10}" -f $status) -ForegroundColor $color -NoNewline
    Write-Host (" {0,-30}" -f $svc.url)
}

Write-Host "`nFrontend UI: http://localhost:4200" -ForegroundColor Yellow
Write-Host ""
