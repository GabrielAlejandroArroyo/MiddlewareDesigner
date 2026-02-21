"""
Migración: añade password_hash y requiere_cambio_password a la tabla usuarios.
Asigna contraseña por defecto a admin si password_hash es NULL.
Ejecutar desde services/usuario con: python scripts/migrate_add_password.py
"""
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
        # Verificar que la tabla usuarios existe
        cur.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='usuarios'"
        )
        if not cur.fetchone():
            print("  Tabla usuarios no existe aún. Migración omitida.")
            conn.close()
            return

        cur.execute("PRAGMA table_info(usuarios)")
        columns = {row[1] for row in cur.fetchall()}

        if "password_hash" not in columns:
            cur.execute("ALTER TABLE usuarios ADD COLUMN password_hash VARCHAR(255)")
            print("  Añadida columna password_hash")
        if "requiere_cambio_password" not in columns:
            cur.execute("ALTER TABLE usuarios ADD COLUMN requiere_cambio_password BOOLEAN DEFAULT 0")
            print("  Añadida columna requiere_cambio_password")
            cur.execute("UPDATE usuarios SET requiere_cambio_password = 1 WHERE nombre_usuario = 'admin'")
            if cur.rowcount > 0:
                print("  Admin existente marcado con requiere_cambio_password")

        from passlib.context import CryptContext
        _ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
        pwd_hash = _ctx.hash("admin")

        cur.execute("SELECT id FROM usuarios WHERE nombre_usuario = 'admin'")
        admin_row = cur.fetchone()
        if admin_row:
            # Admin existe: si password_hash NULL o vacío, asignar contraseña por defecto
            cur.execute(
                "SELECT id FROM usuarios WHERE nombre_usuario = 'admin' AND (password_hash IS NULL OR password_hash = '')"
            )
            if cur.fetchone():
                cur.execute(
                    "UPDATE usuarios SET password_hash = ?, requiere_cambio_password = 1 WHERE nombre_usuario = 'admin'",
                    (pwd_hash,)
                )
                print("  Admin: contraseña por defecto asignada (admin/admin, debe cambiarla en primer login)")
        else:
            # Admin no existe: crearlo (BD nueva, primera vez)
            from shared.id_generator import generate_entity_id
            from datetime import datetime
            admin_id = generate_entity_id("USUA")
            now = datetime.utcnow().isoformat()
            cur.execute(
                """INSERT INTO usuarios (id, email, nombre_usuario, nombre, apellido, password_hash, requiere_cambio_password, baja_logica, fecha_alta_creacion, fecha_alta_modificacion)
                   VALUES (?, ?, 'admin', 'Admin', 'Sistema', ?, 1, 0, ?, ?)""",
                (admin_id, "admin@example.com", pwd_hash, now, now)
            )
            print("  Admin creado (admin/admin, debe cambiarla en primer login)")

        conn.commit()
        print("Migración completada.")
    except Exception as e:
        conn.rollback()
        print(f"  [ERROR] Migración falló: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
