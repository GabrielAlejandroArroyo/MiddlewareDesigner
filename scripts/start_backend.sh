#!/bin/bash
# Script para levantar todos los servicios backend
# Uso: ./scripts/start_backend.sh

set -e

echo "========================================"
echo "  Iniciando Servicios Backend"
echo "========================================"
echo ""

# Obtener la ruta del directorio raíz del proyecto
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SERVICES_DIR="$ROOT_DIR/services"

if [ ! -d "$SERVICES_DIR" ]; then
    echo "Error: No se encontró la carpeta 'services'"
    exit 1
fi

# Buscar todos los servicios con main.py
SERVICES=$(find "$SERVICES_DIR" -mindepth 2 -maxdepth 2 -name "main.py" -type f | xargs -I {} dirname {})

if [ -z "$SERVICES" ]; then
    echo "No se encontraron servicios para iniciar"
    exit 0
fi

SERVICE_COUNT=$(echo "$SERVICES" | wc -l)
echo "Servicios encontrados: $SERVICE_COUNT"
echo ""

# Puerto base para los servicios
BASE_PORT=8000
PORT_INDEX=0

# Array para almacenar PIDs
PIDS=()

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo "Deteniendo servicios..."
    for PID in "${PIDS[@]}"; do
        if kill -0 "$PID" 2>/dev/null; then
            echo "  Deteniendo proceso $PID..."
            kill "$PID" 2>/dev/null || true
        fi
    done
    wait
    echo "Servicios detenidos"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Iniciar cada servicio
while IFS= read -r SERVICE_PATH; do
    SERVICE_NAME=$(basename "$SERVICE_PATH")
    PORT=$((BASE_PORT + PORT_INDEX))
    
    echo "Iniciando servicio: $SERVICE_NAME en puerto $PORT"
    
    # Verificar si existe requirements.txt e instalar dependencias
    if [ -f "$SERVICE_PATH/requirements.txt" ]; then
        echo "  Instalando dependencias..."
        (cd "$SERVICE_PATH" && pip install -q -r requirements.txt)
    fi
    
    # Iniciar el servicio en background
    (cd "$SERVICE_PATH" && uvicorn main:app --host 0.0.0.0 --port "$PORT" --reload > /dev/null 2>&1) &
    PID=$!
    PIDS+=($PID)
    
    echo "  ✓ Servicio $SERVICE_NAME iniciado (PID: $PID, Puerto: $PORT)"
    echo ""
    
    PORT_INDEX=$((PORT_INDEX + 1))
    sleep 2
done <<< "$SERVICES"

echo "========================================"
echo "  Servicios Backend Iniciados"
echo "========================================"
echo ""

PORT_INDEX=0
while IFS= read -r SERVICE_PATH; do
    SERVICE_NAME=$(basename "$SERVICE_PATH")
    PORT=$((BASE_PORT + PORT_INDEX))
    echo "  $SERVICE_NAME: http://localhost:$PORT"
    echo "    Docs: http://localhost:$PORT/docs"
    PORT_INDEX=$((PORT_INDEX + 1))
done <<< "$SERVICES"

echo ""
echo "Presiona Ctrl+C para detener todos los servicios"
echo ""

# Esperar a que el usuario presione Ctrl+C
wait

