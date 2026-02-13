"""
Migración: añade tipo a la tabla aplicaciones.
Ejecutar desde services/aplicacion con: python scripts/migrate_add_tipo.py
"""
import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "aplicaciones.db")


def migrate():
    if not os.path.exists(DB_PATH):
        print("No existe aplicaciones.db. No es necesario migrar.")
        return
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    try:
        cur.execute("PRAGMA table_info(aplicaciones)")
        columns = {row[1] for row in cur.fetchall()}
        if "tipo" not in columns:
            cur.execute("ALTER TABLE aplicaciones ADD COLUMN tipo VARCHAR(50) DEFAULT 'APLICACION'")
            print("  Añadida columna tipo")
        conn.commit()
        print("Migración completada.")
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
