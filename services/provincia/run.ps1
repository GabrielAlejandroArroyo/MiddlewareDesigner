# Script de arranque directo para el microservicio Provincia
$env:PYTHONPATH = "."
Write-Host "Iniciando Microservicio Provincia en http://localhost:8001" -ForegroundColor Cyan
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload

