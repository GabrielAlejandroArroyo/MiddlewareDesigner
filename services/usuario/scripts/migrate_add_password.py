"""
Migración: añade password_hash y requiere_cambio_password a la tabla usuarios.
Ejecutar desde services/usuario con: python scripts/migrate_add_password.py
"""
import asyncio
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "usuarios.db")


def migrate():
    if not os.path.exists(DB_PATH):
        print("No existe usuarios.db. No es necesario migrar.")
        return
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    try:
        cur.execute("PRAGMA table_info(usuarios)")
        columns = {row[1] for row in cur.fetchall()}
        if "password_hash" not in columns:
            cur.execute("ALTER TABLE usuarios ADD COLUMN password_hash VARCHAR(255)")
            print("  Añadida columna password_hash (los usuarios existentes tendrán NULL; crear nuevos con seeds)")
        if "requiere_cambio_password" not in columns:
            cur.execute("ALTER TABLE usuarios ADD COLUMN requiere_cambio_password BOOLEAN DEFAULT 0")
            print("  Añadida columna requiere_cambio_password")
            # Marcar admin existente para que deba cambiar la contraseña al próximo login
            cur.execute("UPDATE usuarios SET requiere_cambio_password = 1 WHERE nombre_usuario = 'admin'")
            if cur.rowcount > 0:
                print("  Admin existente marcado con requiere_cambio_password")
        conn.commit()
        print("Migración completada.")
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
