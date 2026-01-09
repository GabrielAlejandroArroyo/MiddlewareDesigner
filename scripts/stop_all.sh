#!/bin/bash

# Script para detener todos los servicios del ecosistema (Linux/macOS)
# Uso: ./scripts/stop_all.sh

echo "========================================"
echo "  Middleware Designer - Deteniendo Todo"
echo "========================================"
echo ""

# 1. Detener procesos de Python
echo "[1/2] Deteniendo procesos de Python..."
pkill -f "python"
if [ $? -eq 0 ]; then
    echo "  [OK] Procesos de Python detenidos."
else
    echo "  [INFO] No se encontraron procesos de Python activos."
fi

# 2. Detener procesos de Node
echo "[2/2] Deteniendo procesos de Node..."
pkill -f "node"
if [ $? -eq 0 ]; then
    echo "  [OK] Procesos de Node detenidos."
else
    echo "  [INFO] No se encontraron procesos de Node activos."
fi

echo ""
echo "========================================"
echo "  ECOSISTEMA DETENIDO"
echo "========================================"
echo ""
