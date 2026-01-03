# Designer UI - Microfrontend Angular

La interfaz administrativa que permite "dibujar" las aplicaciones finales a partir de los microservicios.

## Características
- **Arquitectura Standalone**: Utiliza componentes independientes sin módulos pesados.
- **Routing Dinámico**: Basado en el ID del servicio para inspección.
- **Bootstrap 5 + Icons**: Para un diseño limpio y profesional.

## Funcionalidades Principales

### 1. Dashboard
Visualización rápida del estado del ecosistema (servicios online/offline).

### 2. Gestión de Backends
CRUD para el registro de nuevos microservicios mediante su URL de OpenAPI.

### 3. Inspector de Endpoints
Permite navegar por todos los métodos (GET, POST, etc.) que expone un servicio y habilitarlos mediante un switch.

### 4. Definición de Acción (El Diseñador)
Pantalla crítica donde se configuran los metadatos de la UI:
- **Pestaña Parámetros**: Configura filtros de URL.
- **Pestaña Request/Response**: Permite cambiar nombres técnicos por visuales, ocultar campos y establecer relaciones entre servicios (ej: que un ID de país abra un buscador del servicio País).
- **Preview**: Renderiza en tiempo real cómo se vería la grilla o el formulario generado.

## Servicios Core
- `MiddlewareService`: Centraliza todas las llamadas HTTP al middleware.
