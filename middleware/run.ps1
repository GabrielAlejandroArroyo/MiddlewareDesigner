# Script de arranque para el Middleware
$env:PYTHONPATH = "."
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Iniciando Middleware Designer" -ForegroundColor Cyan
Write-Host "  URL: http://127.0.0.1:9000" -ForegroundColor Green
Write-Host "  Docs: http://127.0.0.1:9000/docs" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan

# Usamos 127.0.0.1 para evitar problemas de resolucion de localhost en algunos sistemas
python -m uvicorn main:app --host 127.0.0.1 --port 9000 --reload
