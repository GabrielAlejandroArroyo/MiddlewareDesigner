"""
Script de init que crea el usuario admin en el servicio Usuario.
Para usar con docker-compose (solo Middleware + Usuario).
Idempotente: no hace nada si admin ya existe.
Solo requiere httpx. Compatible con Python 3.8+.
"""
import os
import sys
import time

import httpx

USUARIO_SERVICE_URL = os.environ.get("USUARIO_SERVICE_URL", "http://127.0.0.1:8007")
USUARIO_URL = f"{USUARIO_SERVICE_URL.rstrip('/')}/api/v1/usuarios"
MAX_ATTEMPTS = 30
POLL_INTERVAL = 2.0
HTTP_TIMEOUT = 10.0

ADMIN_PAYLOAD = {
    "nombre_usuario": "admin",
    "email": "admin@example.com",
    "nombre": "Admin",
    "apellido": "Sistema",
    "password": "admin",
    "requiere_cambio_password": True,
}


def wait_for_service() -> bool:
    """Espera a que el servicio Usuario esté disponible."""
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            r = httpx.get(f"{USUARIO_SERVICE_URL.rstrip('/')}/", timeout=5.0)
            if r.status_code in (200, 307):
                return True
        except (httpx.RequestError, httpx.HTTPError):
            pass
        if attempt < MAX_ATTEMPTS:
            print(f"  Esperando al servicio Usuario... ({attempt}/{MAX_ATTEMPTS})")
            time.sleep(POLL_INTERVAL)
    return False


def admin_exists(client: httpx.Client) -> bool:
    """Verifica si el usuario admin ya existe."""
    r = client.get(f"{USUARIO_URL}/?include_baja_logica=false")
    if r.status_code != 200:
        return False
    data = r.json()
    for u in data.get("usuarios", []):
        if u.get("nombre_usuario") == "admin":
            return True
    return False


def main() -> int:
    print("Iniciando seed de usuario admin...")
    if not wait_for_service():
        print("  [ERROR] El servicio Usuario no respondió a tiempo.")
        return 1

    with httpx.Client(timeout=HTTP_TIMEOUT) as client:
        # Siempre intentar crear; si ya existe (409) es correcto
        r = client.post(f"{USUARIO_URL}/", json=ADMIN_PAYLOAD)
        if r.status_code in (200, 201):
            print("  Usuario admin creado (password: admin, debe cambiarla en primer login).")
            return 0
        if r.status_code == 409:
            print("  Usuario admin ya existe.")
            return 0
        # Si falló el POST, verificar si admin existe (por si el 409 fue por otro motivo)
        if admin_exists(client):
            print("  Usuario admin ya existe.")
            return 0
        print(f"  [ERROR] No se pudo crear el usuario admin. Status: {r.status_code}, body: {r.text[:200]}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
