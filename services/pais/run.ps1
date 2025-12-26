# Script de arranque directo para el microservicio Pais
$env:PYTHONPATH = "."
Write-Host "Iniciando Microservicio Pais en http://localhost:8000" -ForegroundColor Cyan
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload


