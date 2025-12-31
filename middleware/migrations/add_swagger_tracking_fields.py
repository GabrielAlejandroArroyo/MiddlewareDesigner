"""
Script de migración para agregar campos de seguimiento de Swagger
a la tabla backend_services.

Ejecutar con: 
  - Desde el directorio raíz: python -m middleware.migrations.add_swagger_tracking_fields
  - Desde el directorio middleware: python migrations/add_swagger_tracking_fields.py
  - Usando el script PowerShell: .\scripts\migrate_middleware.ps1
"""
import asyncio
import sys
from pathlib import Path

# Agregar el directorio raíz al path para imports
script_dir = Path(__file__).parent
middleware_dir = script_dir.parent
root_dir = middleware_dir.parent

# Agregar tanto el root como el middleware al path
sys.path.insert(0, str(root_dir))
sys.path.insert(0, str(middleware_dir))

from sqlalchemy import text
from config.database import engine


async def check_column_exists(conn, table_name: str, column_name: str) -> bool:
    """Verifica si una columna existe en una tabla"""
    # Para SQLite, podemos usar una consulta pragma
    result = await conn.execute(
        text(f"PRAGMA table_info({table_name})")
    )
    columns = result.fetchall()
    # Las columnas de pragma table_info son: cid, name, type, notnull, dflt_value, pk
    column_names = [row[1] for row in columns]
    return column_name in column_names


async def migrate():
    """Ejecuta la migración para agregar los campos de seguimiento de Swagger"""
    print("=" * 60)
    print("Migración: Agregar campos de seguimiento de Swagger")
    print("=" * 60)
    print()

    async with engine.begin() as conn:
        # Verificar si la tabla existe usando pragma
        result = await conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='backend_services'"))
        table_exists = result.fetchone() is not None
        
        if not table_exists:
            print("[ERROR] La tabla 'backend_services' no existe.")
            print("   La base de datos puede estar vacia o corrupta.")
            print("   Ejecuta el middleware primero para crear las tablas.")
            return False
        
        print("[OK] Tabla 'backend_services' encontrada")
        print()

        # Lista de columnas a agregar
        columns_to_add = [
            {
                'name': 'swagger_hash',
                'type': 'VARCHAR(64)',
                'nullable': True,
                'default': None
            },
            {
                'name': 'swagger_last_updated',
                'type': 'DATETIME',
                'nullable': True,
                'default': None
            },
            {
                'name': 'swagger_spec_cached',
                'type': 'JSON',
                'nullable': True,
                'default': None
            }
        ]

        added_count = 0
        skipped_count = 0

        for col_def in columns_to_add:
            col_name = col_def['name']
            exists = await check_column_exists(conn, 'backend_services', col_name)
            
            if exists:
                print(f"[SKIP] Columna '{col_name}' ya existe. Omitiendo...")
                skipped_count += 1
            else:
                try:
                    # Construir el comando ALTER TABLE
                    if col_def['type'] == 'JSON':
                        # SQLite no tiene tipo JSON nativo, usar TEXT
                        alter_sql = f"ALTER TABLE backend_services ADD COLUMN {col_name} TEXT"
                    else:
                        alter_sql = f"ALTER TABLE backend_services ADD COLUMN {col_name} {col_def['type']}"
                    
                    if col_def['nullable']:
                        alter_sql += " NULL"
                    else:
                        alter_sql += " NOT NULL"
                    
                    if col_def['default'] is not None:
                        alter_sql += f" DEFAULT {col_def['default']}"
                    
                    await conn.execute(text(alter_sql))
                    print(f"[OK] Columna '{col_name}' agregada correctamente")
                    added_count += 1
                except Exception as e:
                    print(f"[ERROR] Error al agregar columna '{col_name}': {str(e)}")
                    return False
        
        print()
        print("=" * 60)
        print("Resumen de la migración:")
        print(f"  • Columnas agregadas: {added_count}")
        print(f"  • Columnas omitidas (ya existían): {skipped_count}")
        print("=" * 60)
        
        if added_count > 0:
            print()
            print("[SUCCESS] Migracion completada exitosamente!")
        else:
            print()
            print("[INFO] No se requirieron cambios. La base de datos ya esta actualizada.")
        
        return True


async def main():
    """Función principal"""
    try:
        success = await migrate()
        if success:
            print()
            print("Puedes reiniciar el middleware ahora.")
            sys.exit(0)
        else:
            print()
            print("[ERROR] La migracion fallo. Revisa los errores arriba.")
            sys.exit(1)
    except Exception as e:
        print()
        print(f"[ERROR CRITICO] {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
