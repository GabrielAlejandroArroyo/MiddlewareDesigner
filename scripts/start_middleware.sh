#!/bin/bash
# Script para levantar el middleware
# Uso: ./scripts/start_middleware.sh [--port PORT]

set -e

PORT=9000

# Parsear argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --port)
            PORT="$2"
            shift 2
            ;;
        *)
            echo "Uso: $0 [--port PORT]"
            exit 1
            ;;
    esac
done

echo "========================================"
echo "  Iniciando Middleware"
echo "========================================"
echo ""

# Obtener la ruta del directorio raíz del proyecto
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MIDDLEWARE_DIR="$ROOT_DIR/middleware"

if [ ! -d "$MIDDLEWARE_DIR" ]; then
    echo "Error: No se encontró la carpeta 'middleware'"
    echo "Creando estructura básica..."
    mkdir -p "$MIDDLEWARE_DIR"
    echo "Carpeta 'middleware' creada. Por favor, configura el middleware."
    exit 1
fi

# Buscar main.py o app.py en el middleware
MAIN_FILE=""
if [ -f "$MIDDLEWARE_DIR/main.py" ]; then
    MAIN_FILE="main.py"
elif [ -f "$MIDDLEWARE_DIR/app.py" ]; then
    MAIN_FILE="app.py"
else
    echo "Error: No se encontró main.py o app.py en el middleware"
    exit 1
fi

echo "Iniciando middleware en puerto $PORT"

# Verificar si existe requirements.txt e instalar dependencias
if [ -f "$MIDDLEWARE_DIR/requirements.txt" ]; then
    echo "Instalando dependencias..."
    (cd "$MIDDLEWARE_DIR" && pip install -q -r requirements.txt)
fi

# Verificar si existe pyproject.toml
if [ -f "$MIDDLEWARE_DIR/pyproject.toml" ]; then
    echo "Instalando dependencias desde pyproject.toml..."
    (cd "$MIDDLEWARE_DIR" && pip install -q -e .)
fi

echo "✓ Middleware iniciado en http://localhost:$PORT"
echo ""
echo "Presiona Ctrl+C para detener el middleware"
echo ""

# Iniciar el middleware
cd "$MIDDLEWARE_DIR"
uvicorn "${MAIN_FILE}:app" --host 0.0.0.0 --port "$PORT" --reload

