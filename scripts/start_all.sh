#!/bin/bash
# Script maestro para levantar todos los servicios (backend, middleware y frontend)
# Uso: ./scripts/start_all.sh

set -e

echo "========================================"
echo "  Iniciando Todos los Servicios"
echo "========================================"
echo ""

# Obtener la ruta del directorio de scripts
SCRIPTS_DIR="$(cd "$(dirname "$0")" && pwd)"

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo "Deteniendo todos los servicios..."
    kill 0 2>/dev/null || true
    wait
    echo "Todos los servicios detenidos"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Iniciar servicios backend en background
echo "Iniciando servicios backend..."
"$SCRIPTS_DIR/start_backend.sh" &
BACKEND_PID=$!

sleep 3

# Iniciar middleware en background
echo "Iniciando middleware..."
"$SCRIPTS_DIR/start_middleware.sh" &
MIDDLEWARE_PID=$!

sleep 2

# Iniciar microfrontends en background
echo "Iniciando microfrontends..."
"$SCRIPTS_DIR/start_frontend.sh" &
FRONTEND_PID=$!

sleep 3

echo ""
echo "========================================"
echo "  Todos los Servicios Iniciados"
echo "========================================"
echo ""
echo "Servicios Backend: http://localhost:8000+"
echo "Middleware: http://localhost:9000"
echo "Microfrontends: http://localhost:4200+"
echo ""
echo "Presiona Ctrl+C para detener todos los servicios"
echo ""

# Esperar a que el usuario presione Ctrl+C
wait

