# Documentación del Proyecto: Middleware Designer

Bienvenido a la documentación técnica del monorepo **Middleware Designer**. Este sistema permite la orquestación dinámica de microservicios mediante la inspección de contratos OpenAPI y la generación automática de interfaces de usuario.

## 📂 Estructura de Documentación

### 🏛️ [Arquitectura General](arquitectura/general.md)
Descripción de la topología del sistema, diagramas C4 y componentes principales (Microservicios, Middleware y Frontend).

### 📊 [Modelos de Datos](arquitectura/modelos_datos.md)
Diagramas de Entidad-Relación (ERD) de los microservicios y de la base de datos central de configuración del Middleware.

### 🔌 [Catálogo de Servicios](servicios/catalogo.md)
Detalle de cada microservicio backend (`pais`, `provincia`, `localidad`, `corporacion`), sus responsabilidades y patrones de diseño (RORO, DTOs, Auditoría).

### ⚙️ [Middleware Designer](middleware/README.md)
Documentación del orquestador, lógica de parseo de contratos y API de configuración.

### 🎨 [Microfrontend Designer UI](frontend/README.md)
Guía sobre la aplicación Angular, funcionalidades del diseñador de acciones y previsualización.

---

## 🚀 Inicio Rápido

Para levantar el ecosistema completo, utiliza los scripts de la raíz:

- **Windows (PowerShell)**: `.\scripts\start_all.ps1`
- **Linux/macOS (Bash)**: `./scripts/start_all.sh`

Para verificar el estado de los servicios: `.\scripts\check_status.ps1`

---

## 🛠️ Tecnologías Principales
- **Backend**: Python 3.10+, FastAPI, SQLAlchemy 2.0, Pydantic v2.
- **Middleware**: Python, FastAPI, httpx (OpenAPI Parser).
- **Frontend**: Angular 17+, Bootstrap 5, RxJS.
- **Base de Datos**: SQLite (motores asíncronos `aiosqlite`).
