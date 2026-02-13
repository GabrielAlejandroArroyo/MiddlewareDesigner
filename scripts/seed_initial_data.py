"""
Script de seeds para datos iniciales del ecosistema.
Crea: Aplicación MIDDLEWARE, Rol Administrador, Usuario admin, y sus vínculos.
Ejecutar tras levantar los servicios (start_backend).
Compatible con Python 3.8+.
Usa cliente HTTP síncrono para evitar problemas de asyncio en Windows.
"""
import sys
import time
from pathlib import Path
from typing import Optional

# Agregar raíz al path para importar shared
root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root))

import httpx
from shared.id_generator import generate_entity_id

MAX_RETRIES = 8
RETRY_DELAY_SECONDS = 5
SERVICE_READY_MAX_ATTEMPTS = 30  # ~60 segundos total
SERVICE_READY_POLL_INTERVAL = 2.0
HTTP_TIMEOUT = 30.0  # timeout generoso para servicios lentos al arrancar

# URLs base para verificar que los servicios estén listos
SERVICE_HEALTH_URLS = [
    ("http://127.0.0.1:8005/", "Aplicacion"),
    ("http://127.0.0.1:8006/", "Roles"),
    ("http://127.0.0.1:8007/", "Usuario"),
    ("http://127.0.0.1:8008/", "Aplicacion-Role"),
    ("http://127.0.0.1:8009/", "Usuario-Rol"),
]

APLICACION_URL = "http://127.0.0.1:8005/api/v1/aplicaciones"
ROLES_URL = "http://127.0.0.1:8006/api/v1/roles"
APLICACION_ROLE_URL = "http://127.0.0.1:8008/api/v1/aplicacion-roles"
USUARIO_URL = "http://127.0.0.1:8007/api/v1/usuarios"
USUARIO_ROL_URL = "http://127.0.0.1:8009/api/v1/usuario-roles"

# Excepciones de red a capturar (httpx + httpcore subyacente)
NETWORK_ERRORS = (
    httpx.ReadError,
    httpx.ConnectError,
    httpx.ConnectTimeout,
    httpx.WriteError,
    httpx.ReadTimeout,
    httpx.WriteTimeout,
)
try:
    import httpcore
    NETWORK_ERRORS = NETWORK_ERRORS + (httpcore.ReadError,)
except ImportError:
    pass

# Sin keepalive para evitar conexiones reutilizadas en mal estado (fix ReadError en Windows)
HTTP_LIMITS = httpx.Limits(max_keepalive_connections=0)


def wait_for_services_ready(client: httpx.Client) -> bool:
    """
    Verifica que los 5 servicios necesarios para el seed estén listos.
    Hace GET ligero a cada uno hasta que todos respondan o se agote el timeout.
    Retorna True si todos están listos, False si tras el timeout alguno no responde.
    """
    pending = dict(SERVICE_HEALTH_URLS)
    for attempt in range(1, SERVICE_READY_MAX_ATTEMPTS + 1):
        if not pending:
            return True
        still_pending = {}
        for url, name in list(pending.items()):
            try:
                r = client.get(url)
                if r.status_code in (200, 307):  # 307 = redirect a /docs
                    continue
                still_pending[url] = name
            except NETWORK_ERRORS:
                still_pending[url] = name
        pending = still_pending
        if pending and attempt < SERVICE_READY_MAX_ATTEMPTS:
            print(f"  Esperando servicios: {', '.join(pending.values())}... ({attempt}/{SERVICE_READY_MAX_ATTEMPTS})")
            time.sleep(SERVICE_READY_POLL_INTERVAL)
    if pending:
        print(f"  [ERROR] Tras {SERVICE_READY_MAX_ATTEMPTS * SERVICE_READY_POLL_INTERVAL:.0f}s estos servicios no responden: {', '.join(pending.values())}")
        print("  Ejecuta manualmente cuando estén arriba: python scripts/seed_initial_data.py")
        return False
    return True


def find_aplicacion_middleware(client: httpx.Client) -> Optional[str]:
    """Devuelve el id de la aplicación tipo MIDDLEWARE si existe."""
    r = client.get(f"{APLICACION_URL}/?include_baja_logica=false")
    if r.status_code != 200:
        return None
    data = r.json()
    for app in data.get("aplicacion", []):
        if app.get("tipo") == "MIDDLEWARE":
            return app["id"]
    return None


def create_aplicacion_middleware(client: httpx.Client) -> str:
    """Crea la aplicación MIDDLEWARE. Retorna el id."""
    app_id = generate_entity_id("APLI")
    r = client.post(APLICACION_URL + "/", json={
        "id": app_id,
        "descripcion": "Middleware Designer",
        "tipo": "MIDDLEWARE",
    })
    if r.status_code in (200, 201):
        return r.json()["id"]
    raise RuntimeError(f"Error creando aplicación: {r.status_code} {r.text}")


def find_rol_administrador(client: httpx.Client, id_aplicacion: str) -> Optional[str]:
    """Devuelve el id del rol Administrador de la app si existe."""
    r = client.get(f"{ROLES_URL}/?include_baja_logica=false")
    if r.status_code != 200:
        return None
    data = r.json()
    for rol in data.get("roles", []):
        if rol.get("id_aplicacion") == id_aplicacion and rol.get("descripcion") == "Administrador":
            return rol["id"]
    return None


def create_rol_administrador(client: httpx.Client, id_aplicacion: str) -> str:
    """Crea el rol Administrador. Retorna el id."""
    rol_id = generate_entity_id("ROLE")
    r = client.post(ROLES_URL + "/", json={
        "id": rol_id,
        "descripcion": "Administrador",
        "id_aplicacion": id_aplicacion,
    })
    if r.status_code in (200, 201):
        return r.json()["id"]
    raise RuntimeError(f"Error creando rol: {r.status_code} {r.text}")


def find_aplicacion_role_link(client: httpx.Client, id_app: str, id_rol: str) -> bool:
    """Verifica si existe el vínculo aplicacion-rol."""
    r = client.get(f"{APLICACION_ROLE_URL}/?include_baja=false")
    if r.status_code != 200:
        return False
    data = r.json()
    for link in data.get("aplicacion_roles", []):
        if link.get("id_aplicacion") == id_app and link.get("id_role") == id_rol:
            return True
    return False


def create_aplicacion_role(client: httpx.Client, id_app: str, id_rol: str) -> None:
    """Crea el vínculo aplicacion-rol."""
    link_id = generate_entity_id("APRL")
    r = client.post(APLICACION_ROLE_URL + "/", json={
        "id": link_id,
        "id_aplicacion": id_app,
        "id_role": id_rol,
    })
    if r.status_code in (200, 201):
        return
    if r.status_code == 409:
        return  # Ya existe
    raise RuntimeError(f"Error creando aplicacion-rol: {r.status_code} {r.text}")


def find_usuario_admin(client: httpx.Client) -> Optional[str]:
    """Devuelve el id del usuario admin si existe."""
    r = client.get(f"{USUARIO_URL}/?include_baja_logica=false")
    if r.status_code != 200:
        return None
    data = r.json()
    for u in data.get("usuarios", []):
        if u.get("nombre_usuario") == "admin":
            return u["id"]
    return None


def create_usuario_admin(client: httpx.Client) -> str:
    """Crea el usuario admin. Retorna el id."""
    user_id = generate_entity_id("USUA")
    # El servicio hashea la contraseña; enviamos "admin" en texto
    r = client.post(USUARIO_URL + "/", json={
        "id": user_id,
        "nombre_usuario": "admin",
        "email": "admin@example.com",
        "nombre": "Admin",
        "apellido": "Sistema",
        "password": "admin",
        "requiere_cambio_password": True,
    })
    if r.status_code in (200, 201):
        return r.json()["id"]
    raise RuntimeError(f"Error creando usuario: {r.status_code} {r.text}")


def find_usuario_rol_link(client: httpx.Client, id_u: str, id_app: str, id_rol: str) -> bool:
    """Verifica si existe el vínculo usuario-rol."""
    r = client.get(f"{USUARIO_ROL_URL}/?include_baja=false")  # usuario-rol usa include_baja
    if r.status_code != 200:
        return False
    data = r.json()
    for link in data.get("usuario_roles", []):
        if (link.get("id_usuario") == id_u and link.get("id_aplicacion") == id_app
                and link.get("id_rol") == id_rol):
            return True
    return False


def create_usuario_rol(client: httpx.Client, id_u: str, id_app: str, id_rol: str) -> None:
    """Crea el vínculo usuario-rol."""
    link_id = generate_entity_id("USRO")
    r = client.post(USUARIO_ROL_URL + "/", json={
        "id": link_id,
        "id_usuario": id_u,
        "id_aplicacion": id_app,
        "id_rol": id_rol,
    })
    if r.status_code in (200, 201):
        return
    if r.status_code == 409:
        return  # Ya existe
    raise RuntimeError(f"Error creando usuario-rol: {r.status_code} {r.text}")


def _run_seeds(client: httpx.Client) -> None:
    """Lógica principal de seeds (sin reintentos)."""
    # 1. Aplicación MIDDLEWARE
    id_app = find_aplicacion_middleware(client)
    if not id_app:
        id_app = create_aplicacion_middleware(client)
        print(f"  Aplicación MIDDLEWARE creada: {id_app}")
    else:
        print(f"  Aplicación MIDDLEWARE ya existe: {id_app}")

    # 2. Rol Administrador
    id_rol = find_rol_administrador(client, id_app)
    if not id_rol:
        id_rol = create_rol_administrador(client, id_app)
        print(f"  Rol Administrador creado: {id_rol}")
    else:
        print(f"  Rol Administrador ya existe: {id_rol}")

    # 3. AplicacionRole
    if not find_aplicacion_role_link(client, id_app, id_rol):
        create_aplicacion_role(client, id_app, id_rol)
        print("  Vínculo Aplicacion-Rol creado")
    else:
        print("  Vínculo Aplicacion-Rol ya existe")

    # 4. Usuario admin
    id_usuario = find_usuario_admin(client)
    if not id_usuario:
        id_usuario = create_usuario_admin(client)
        print(f"  Usuario admin creado: {id_usuario} (password inicial: admin)")
    else:
        print(f"  Usuario admin ya existe: {id_usuario}")

    # 5. UsuarioRol
    if not find_usuario_rol_link(client, id_usuario, id_app, id_rol):
        create_usuario_rol(client, id_usuario, id_app, id_rol)
        print("  Vínculo Usuario-Rol creado")
    else:
        print("  Vínculo Usuario-Rol ya existe")


def main():
    print("Ejecutando seeds...")
    print("  Verificando que los 5 servicios estén listos...")

    with httpx.Client(timeout=HTTP_TIMEOUT, limits=HTTP_LIMITS) as client:
        if not wait_for_services_ready(client):
            sys.exit(1)

    print("  Servicios listos. Ejecutando creación de datos...")
    time.sleep(2)  # Breve pausa para que los servicios terminen de inicializar

    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            with httpx.Client(timeout=HTTP_TIMEOUT, limits=HTTP_LIMITS) as client:
                _run_seeds(client)
            print("Seeds completados.")
            return
        except NETWORK_ERRORS as e:
            last_error = e
            err_msg = f"{type(e).__name__}: {e}" if str(e) else type(e).__name__
            if attempt < MAX_RETRIES:
                print(f"  [Reintento {attempt}/{MAX_RETRIES}] Error de red ({err_msg}). Esperando {RETRY_DELAY_SECONDS}s...")
                time.sleep(RETRY_DELAY_SECONDS)
            else:
                print(f"  [ERROR] Falló tras {MAX_RETRIES} intentos. Último error: {err_msg}")
                raise last_error


if __name__ == "__main__":
    main()
