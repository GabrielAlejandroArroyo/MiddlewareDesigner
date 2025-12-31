# Migraciones del Middleware

Este directorio contiene scripts de migración para actualizar el esquema de la base de datos del middleware.

## Migraciones Disponibles

### `add_swagger_tracking_fields.py`

Agrega los siguientes campos a la tabla `backend_services`:
- `swagger_hash`: Hash MD5 del Swagger para detectar cambios
- `swagger_last_updated`: Fecha de última actualización del Swagger
- `swagger_spec_cached`: Caché del Swagger en formato JSON

## Cómo Ejecutar las Migraciones

### Opción 1: Usando el Script PowerShell (Recomendado)

Desde el directorio raíz del proyecto:

```powershell
.\scripts\migrate_middleware.ps1
```

### Opción 2: Ejecutar Directamente con Python

Desde el directorio raíz del proyecto:

```bash
cd middleware
python -m migrations.add_swagger_tracking_fields
```

### Opción 3: Ejecutar desde el Directorio del Middleware

```bash
cd middleware
python migrations/add_swagger_tracking_fields.py
```

## Notas Importantes

1. **Backup**: Aunque el script es seguro y solo agrega columnas (no modifica datos existentes), es recomendable hacer un backup de `middleware/middleware_config.db` antes de ejecutar migraciones en producción.

2. **Idempotencia**: El script es idempotente, lo que significa que puedes ejecutarlo múltiples veces sin problemas. Si las columnas ya existen, simplemente las omitirá.

3. **Requisitos**: Asegúrate de que:
   - El middleware no esté ejecutándose cuando ejecutes la migración
   - Tienes Python y las dependencias instaladas
   - La base de datos existe (si no existe, el middleware la creará automáticamente al iniciar)

## Verificación

Después de ejecutar la migración, puedes verificar que las columnas se agregaron correctamente:

```python
import sqlite3
conn = sqlite3.connect('middleware/middleware_config.db')
cursor = conn.cursor()
cursor.execute("PRAGMA table_info(backend_services)")
columns = cursor.fetchall()
for col in columns:
    print(col[1])  # Nombre de la columna
conn.close()
```

Las nuevas columnas deberían aparecer en la lista.
