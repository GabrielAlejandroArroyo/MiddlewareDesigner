# Script de arranque para el Middleware
$env:PYTHONPATH = "."
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Iniciando Middleware Designer" -ForegroundColor Cyan
Write-Host "  URL: http://127.0.0.1:9000" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

# Escuchamos en 0.0.0.0 para maxima compatibilidad, accesible via 127.0.0.1
python -m uvicorn main:app --host 0.0.0.0 --port 9000 --reload
