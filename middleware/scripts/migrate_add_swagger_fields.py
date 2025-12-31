"""
Script de migración para agregar campos de Swagger a la tabla backend_services.

Este script agrega las siguientes columnas:
- swagger_hash: Hash MD5 del Swagger para detectar cambios
- swagger_last_updated: Fecha de última actualización del Swagger
- swagger_spec_cached: Caché del Swagger en formato JSON

Uso:
    python -m middleware.scripts.migrate_add_swagger_fields
    o desde el directorio middleware:
    python scripts/migrate_add_swagger_fields.py
"""

import asyncio
import sys
from pathlib import Path

# Configurar codificación UTF-8 para Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Determinar el directorio del middleware (donde está este script)
script_dir = Path(__file__).parent
middleware_dir = script_dir.parent
root_dir = middleware_dir.parent

# Agregar el directorio del middleware al path para imports
sys.path.insert(0, str(middleware_dir))

# Cambiar al directorio del middleware para que los imports funcionen
import os
original_cwd = os.getcwd()
os.chdir(str(middleware_dir))

try:
    from sqlalchemy import text
    from config.database import engine
finally:
    # Restaurar el directorio original
    os.chdir(original_cwd)


async def check_column_exists(table_name: str, column_name: str) -> bool:
    """Verifica si una columna existe en una tabla"""
    async with engine.connect() as conn:
        # Para SQLite, consultamos sqlite_master
        result = await conn.execute(
            text("""
                SELECT COUNT(*) as count
                FROM pragma_table_info(:table_name)
                WHERE name = :column_name
            """),
            {"table_name": table_name, "column_name": column_name}
        )
        row = result.fetchone()
        return row[0] > 0 if row else False


async def add_column_if_not_exists(table_name: str, column_def: str, column_name: str):
    """Agrega una columna a una tabla si no existe"""
    exists = await check_column_exists(table_name, column_name)
    
    if exists:
        print(f"  [OK] Columna '{column_name}' ya existe, omitiendo...")
        return False
    else:
        async with engine.connect() as conn:
            await conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_def}"))
            await conn.commit()
        print(f"  [OK] Columna '{column_name}' agregada correctamente")
        return True


async def migrate():
    """Ejecuta la migración"""
    print("=" * 60)
    print("Migración: Agregar campos de Swagger a backend_services")
    print("=" * 60)
    print()
    
    try:
        # Verificar que la tabla existe
        async with engine.connect() as conn:
            result = await conn.execute(
                text("""
                    SELECT name FROM sqlite_master 
                    WHERE type='table' AND name='backend_services'
                """)
            )
            table_exists = result.fetchone() is not None
        
        if not table_exists:
            print("[WARN] ERROR: La tabla 'backend_services' no existe.")
            print("   La tabla se creara automaticamente al iniciar el middleware.")
            return
        
        print("[OK] Tabla 'backend_services' encontrada")
        print()
        print("Agregando columnas...")
        print()
        
        changes_made = False
        
        # Agregar swagger_hash
        changes_made |= await add_column_if_not_exists(
            "backend_services",
            "swagger_hash VARCHAR(64) DEFAULT NULL",
            "swagger_hash"
        )
        
        # Agregar swagger_last_updated
        changes_made |= await add_column_if_not_exists(
            "backend_services",
            "swagger_last_updated DATETIME DEFAULT NULL",
            "swagger_last_updated"
        )
        
        # Agregar swagger_spec_cached
        changes_made |= await add_column_if_not_exists(
            "backend_services",
            "swagger_spec_cached TEXT DEFAULT NULL",
            "swagger_spec_cached"
        )
        
        print()
        if changes_made:
            print("[OK] Migracion completada exitosamente")
            print()
            print("Las nuevas columnas estan disponibles:")
            print("  - swagger_hash: Hash MD5 del Swagger")
            print("  - swagger_last_updated: Fecha de ultima actualizacion")
            print("  - swagger_spec_cached: Cache del Swagger (JSON)")
        else:
            print("[OK] Todas las columnas ya existen. No se requieren cambios.")
        
        print()
        print("=" * 60)
        
    except Exception as e:
        print()
        print("[ERROR] ERROR durante la migracion:")
        print(f"   {str(e)}")
        print()
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(migrate())
