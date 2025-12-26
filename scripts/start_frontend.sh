#!/bin/bash
# Script para levantar todos los microfrontends
# Uso: ./scripts/start_frontend.sh

set -e

echo "========================================"
echo "  Iniciando Microfrontends"
echo "========================================"
echo ""

# Obtener la ruta del directorio raíz del proyecto
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MICROFRONTENDS_DIR="$ROOT_DIR/microfrontends"

if [ ! -d "$MICROFRONTENDS_DIR" ]; then
    echo "Error: No se encontró la carpeta 'microfrontends'"
    echo "Creando estructura básica..."
    mkdir -p "$MICROFRONTENDS_DIR"
    echo "Carpeta 'microfrontends' creada. Por favor, configura los microfrontends."
    exit 1
fi

# Buscar todos los microfrontends con angular.json, project.json o package.json
MFE_DIRS=$(find "$MICROFRONTENDS_DIR" -mindepth 1 -maxdepth 1 -type d)

if [ -z "$MFE_DIRS" ]; then
    echo "No se encontraron microfrontends para iniciar"
    exit 0
fi

MFE_COUNT=$(echo "$MFE_DIRS" | wc -l)
echo "Microfrontends encontrados: $MFE_COUNT"
echo ""

# Puerto base para los microfrontends
BASE_PORT=4200
PORT_INDEX=0

# Array para almacenar PIDs
PIDS=()

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo "Deteniendo microfrontends..."
    for PID in "${PIDS[@]}"; do
        if kill -0 "$PID" 2>/dev/null; then
            echo "  Deteniendo proceso $PID..."
            kill "$PID" 2>/dev/null || true
        fi
    done
    wait
    echo "Microfrontends detenidos"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Iniciar cada microfrontend
while IFS= read -r MFE_PATH; do
    MFE_NAME=$(basename "$MFE_PATH")
    
    # Verificar si tiene angular.json, project.json o package.json
    if [ ! -f "$MFE_PATH/angular.json" ] && [ ! -f "$MFE_PATH/project.json" ] && [ ! -f "$MFE_PATH/package.json" ]; then
        continue
    fi
    
    PORT=$((BASE_PORT + PORT_INDEX))
    
    echo "Iniciando microfrontend: $MFE_NAME en puerto $PORT"
    
    # Verificar si existe package.json e instalar dependencias
    if [ -f "$MFE_PATH/package.json" ]; then
        echo "  Instalando dependencias..."
        if [ ! -d "$MFE_PATH/node_modules" ]; then
            (cd "$MFE_PATH" && npm install)
        fi
    fi
    
    # Iniciar el microfrontend en background
    (
        cd "$MFE_PATH"
        if command -v ng &> /dev/null; then
            ng serve --port "$PORT" --open false > /dev/null 2>&1 &
        elif [ -f "package.json" ]; then
            npm start -- --port "$PORT" > /dev/null 2>&1 &
        else
            echo "  Error: No se encontró ng o package.json con script start"
            continue
        fi
    ) &
    PID=$!
    PIDS+=($PID)
    
    echo "  ✓ Microfrontend $MFE_NAME iniciado (PID: $PID, Puerto: $PORT)"
    echo ""
    
    PORT_INDEX=$((PORT_INDEX + 1))
    sleep 3
done <<< "$MFE_DIRS"

echo "========================================"
echo "  Microfrontends Iniciados"
echo "========================================"
echo ""

PORT_INDEX=0
while IFS= read -r MFE_PATH; do
    MFE_NAME=$(basename "$MFE_PATH")
    if [ -f "$MFE_PATH/angular.json" ] || [ -f "$MFE_PATH/project.json" ] || [ -f "$MFE_PATH/package.json" ]; then
        PORT=$((BASE_PORT + PORT_INDEX))
        echo "  $MFE_NAME: http://localhost:$PORT"
        PORT_INDEX=$((PORT_INDEX + 1))
    fi
done <<< "$MFE_DIRS"

echo ""
echo "Presiona Ctrl+C para detener todos los microfrontends"
echo ""

# Esperar a que el usuario presione Ctrl+C
wait

