"""
Migración: asigna contraseña "1234" a todos los usuarios con password_hash NULL o vacío.
Marca requiere_cambio_password=True para que deban cambiar la clave en el primer login.

Ejecutar desde services/usuario con: python scripts/migrate_null_passwords_to_1234.py
También se ejecuta automáticamente al arrancar el servicio Usuario.
"""
import sqlite3
import os

# Misma ruta que migrate_add_password (usuarios.db en el directorio del servicio)
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(_SCRIPT_DIR, "..", "usuarios.db")

DEFAULT_PASSWORD = "1234"


def migrate():
    if not os.path.exists(DB_PATH):
        return
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    try:
        cur.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='usuarios'"
        )
        if not cur.fetchone():
            conn.close()
            return

        cur.execute("PRAGMA table_info(usuarios)")
        columns = {row[1] for row in cur.fetchall()}
        if "password_hash" not in columns or "requiere_cambio_password" not in columns:
            conn.close()
            return

        from passlib.context import CryptContext
        ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
        pwd_hash = ctx.hash(DEFAULT_PASSWORD)

        cur.execute(
            """UPDATE usuarios
               SET password_hash = ?, requiere_cambio_password = 1
               WHERE password_hash IS NULL OR password_hash = ''""",
            (pwd_hash,)
        )
        updated = cur.rowcount
        conn.commit()
        if updated > 0:
            print(f"  Migración: {updated} usuario(s) con password null actualizado(s) a '{DEFAULT_PASSWORD}' (deben cambiar en primer login)")
    except Exception as e:
        conn.rollback()
        print(f"  [ERROR] Migración null→1234 falló: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
