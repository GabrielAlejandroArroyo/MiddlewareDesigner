# Scripts de Inicio

Esta carpeta contiene scripts para levantar todos los servicios del monorepo.

## Scripts Disponibles

### Windows (PowerShell)

- **`start_all.ps1`**: Levanta todos los servicios (backend, middleware y frontend) de forma persistente.
- **`stop_all.ps1`**: Detiene todos los procesos de Python y Node relacionados con el proyecto.
- **`check_status.ps1`**: Verifica el estado de salud de todos los servicios.
- **`start_backend.ps1`**: Levanta solo los servicios backend.
- **`start_middleware.ps1`**: Levanta solo el middleware.
- **`start_frontend.ps1`**: Levanta solo los microfrontends.

### Linux/Mac (Bash)

- **`start_all.sh`**: Levanta todos los servicios.
- **`stop_all.sh`**: Detiene todos los servicios.
- **`start_backend.sh`**: Levanta solo los servicios backend.
- **`start_middleware.sh`**: Levanta solo el middleware.
- **`start_frontend.sh`**: Levanta solo los microfrontends.

## Uso

### Windows

```powershell
# Levantar todos los servicios
.\scripts\start_all.ps1

# Detener todos los servicios
.\scripts\stop_all.ps1

# Verificar estado
.\scripts\check_status.ps1
```

### Linux/Mac

```bash
# Dar permisos de ejecución (solo la primera vez)
chmod +x scripts/*.sh

# Levantar todos los servicios
./scripts/start_all.sh

# O levantar servicios individuales
./scripts/start_backend.sh
./scripts/start_middleware.sh
./scripts/start_frontend.sh
```

## Puertos por Defecto

- **Servicios Backend**: 8000, 8001, 8002, ... (uno por cada servicio)
- **Middleware**: 9000
- **Microfrontends**: 4200, 4201, 4202, ... (uno por cada microfrontend)

## Características

### Scripts de Backend
- Detecta automáticamente todos los servicios en `services/` que tengan `main.py`
- Instala dependencias automáticamente desde `requirements.txt`
- Asigna puertos incrementales automáticamente
- Muestra URLs de documentación (Swagger) para cada servicio

### Scripts de Middleware
- Busca `main.py` o `app.py` en la carpeta `middleware/`
- Instala dependencias desde `requirements.txt` o `pyproject.toml`
- Puerto configurable (default: 9000)

### Scripts de Frontend
- Detecta automáticamente todos los microfrontends en `microfrontends/`
- Busca proyectos Angular (con `angular.json`, `project.json` o `package.json`)
- Instala dependencias de npm automáticamente
- Asigna puertos incrementales automáticamente

### Script Maestro (start_all)
- Levanta todos los servicios en paralelo
- Maneja correctamente la detención con Ctrl+C
- Muestra resumen de todos los servicios iniciados

## Notas

- Los scripts detectan automáticamente la estructura del proyecto
- Si alguna carpeta no existe (`middleware` o `microfrontends`), los scripts intentarán crearla
- Los scripts instalan dependencias automáticamente si es necesario
- Para detener los servicios, presiona `Ctrl+C`

## Requisitos

- **Python 3.8+** con `uvicorn` instalado
- **Node.js y npm** (para microfrontends)
- **Angular CLI** (opcional, para microfrontends Angular)

## Troubleshooting

### Error: "No se encontró la carpeta 'services'"
- Asegúrate de ejecutar los scripts desde la raíz del proyecto
- Verifica que la estructura de carpetas sea correcta

### Error: "uvicorn no se encuentra"
- Instala uvicorn: `pip install uvicorn[standard]`
- O instala las dependencias del servicio: `pip install -r services/<servicio>/requirements.txt`

### Error: "ng no se encuentra"
- Instala Angular CLI: `npm install -g @angular/cli`
- O usa `npm start` directamente desde el directorio del microfrontend

