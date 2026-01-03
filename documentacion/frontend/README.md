# Designer UI - Microfrontend Angular

La interfaz administrativa diseñada para la resiliencia y el diseño dinámico de aplicaciones.

## Características de Diseño Robusto
- **Blindaje de Renderizado**: Los componentes de configuración inyectan automáticamente valores por defecto si un metadato técnico está ausente o corrupto, asegurando que el administrador siempre pueda ver y editar los campos.
- **Visualización Detallada**: Muestra el nombre técnico, el tipo de dato (con formato) y la descripción original del Swagger para facilitar la personalización.

## Funcionalidades de Gestión

### 1. Panel de Control del Ecosistema (Dashboard)
Monitoreo en tiempo real del estado de salud de todos los microservicios.
- **Heartbeat**: Realiza peticiones asíncronas a cada servicio. Requiere que los servicios tengan CORS habilitado y respondan con un estado válido.

### 2. Definición de Acción (Action Designer)
La pantalla más crítica del sistema, donde se transforman datos técnicos en experiencia de usuario:
- **Pestaña Request/Response**: Permite ver la jerarquía completa de DTOs.
- **Botón "Limpiar Caché Swagger"**: Permite al administrador forzar una re-lectura del contrato desde el microservicio sin salir de la pantalla de configuración.
- **Preview UI**: Renderiza formularios y grillas en tiempo real según la configuración de visibilidad y orden definida.

## Servicios Core
- `MiddlewareService`: Centraliza la comunicación con el orquestador. Utiliza RxJS para el manejo de flujos de datos complejos y concurrencia en los chequeos de salud.
