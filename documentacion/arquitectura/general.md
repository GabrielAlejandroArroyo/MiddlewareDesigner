# Arquitectura del Monorepo - Middleware Designer

Este documento describe la arquitectura general del sistema, flujos de datos y componentes principales.

## 1. Visión General (C4 Model - Nivel 1)

```mermaid
graph TD
    User((Usuario Final))
    MFE[Microfrontend Designer UI]
    MW[Middleware Designer]
    DB_MW[(Middleware Config DB)]
    
    subgraph Microservicios Backend
        SVC_P[Servicio País]
        SVC_PR[Servicio Provincia]
        SVC_L[Servicio Localidad]
        SVC_C[Servicio Corporación]
    end

    User --> MFE
    MFE --> MW
    MW --> DB_MW
    MW -.->|Inspecciona OpenAPI| SVC_P
    MW -.->|Inspecciona OpenAPI| SVC_PR
    MW -.->|Inspecciona OpenAPI| SVC_L
    MW -.->|Inspecciona OpenAPI| SVC_C
```

## 2. Componentes

### 2.1 Microservicios (Capa de Datos)
Cada microservicio es independiente, desarrollado en **FastAPI** y expone su propio contrato **OpenAPI**.
- **País**: Gestión de países.
- **Provincia**: Gestión de provincias (depende de País).
- **Localidad**: Gestión de localidades (depende de Provincia y País).
- **Corporación**: Gestión de corporaciones.

### 2.2 Middleware (Capa de Orquestación)
Actúa como un puente inteligente. Sus funciones son:
1. **Registro**: Almacena las URLs de los microservicios activos.
2. **Inspección**: Lee y parsea los archivos `openapi.json` de los servicios.
3. **Mapeo**: Permite configurar qué atributos técnicos se muestran, su orden y labels visuales.
4. **Caché**: Almacena versiones locales de los contratos para evitar latencia.

### 2.3 Microfrontend (Capa de Presentación)
Desarrollado en **Angular**, proporciona la interfaz para que los administradores diseñen sus pantallas a partir de los contratos técnicos.

## 3. Flujo de Configuración de UI

```mermaid
sequenceDiagram
    participant Admin as Administrador
    participant MFE as Designer UI
    participant MW as Middleware
    participant SVC as Microservicio

    Admin->>MFE: Registra URL de Microservicio
    MFE->>MW: POST /backend-services
    MW->>SVC: GET /openapi.json
    SVC-->>MW: Contrato OpenAPI
    MW-->>MFE: Confirmación y Análisis
    Admin->>MFE: Selecciona Endpoint a Habilitar
    Admin->>MFE: Configura Labels, Orden y Referencias
    MFE->>MW: POST /mappings/toggle
    MW->>MW: Guarda en backend_mappings
    Admin->>MFE: Visualiza Preview
```
