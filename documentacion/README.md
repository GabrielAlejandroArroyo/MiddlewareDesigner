# Documentación del Proyecto: Middleware Designer

Este monorepo es un ecosistema completo para el diseño de interfaces dinámicas basado en microservicios y contratos **OpenAPI**.

## 📊 Estado del Ecosistema
- **Estado**: ✅ OPERATIVO Y ESTABLE
- **Backend**: Python (FastAPI) + SQLAlchemy 2.0
- **Middleware**: Motor de Resolución Resiliente de OpenAPI
- **Frontend**: Angular 17+ (Diseño Basado en Metadatos)

## 📂 Guía de Navegación

### 📋 [Requisitos de producto (PRD)](PRD.md)
Documento de requisitos del producto: descripción, usuarios, funcionalidades (backend, middleware, frontend), flujos, API, modelo de datos y criterios de éxito.

### 🏛️ [Arquitectura General](arquitectura/general.md)
Diagramas C4 y de secuencia. Explica el flujo de datos desde el microservicio hasta la UI y el proceso de aplanamiento de herencia.

### 📊 [Modelos de Datos](arquitectura/modelos_datos.md)
Diagramas de Entidad-Relación (ERD) de los microservicios (`pais`, `provincia`, `localidad`, `corporacion`) y del orquestador central.

### 🔌 [Catálogo de Servicios](servicios/catalogo.md)
Detalle de endpoints, puertos y responsabilidades de cada microservicio. Incluye la guía de implementación del patrón RORO.

### ⚙️ [Middleware Designer](middleware/README.md)
Detalle técnico del orquestador, su motor de recursividad para DTOs y la lógica de limpieza de metadatos técnicos.

### 🎨 [Microfrontend Designer UI](frontend/README.md)
Guía de uso del diseñador de acciones, blindaje de renderizado y monitoreo de salud (Heartbeat).

---

## 🛠️ Características Principales
1.  **Aplanamiento de Herencia**: Fusión automática de campos base (`allOf`) en contratos OpenAPI.
2.  **Sanitización Automática**: Limpieza de ruidos de codificación en títulos y descripciones.
3.  **Monitoreo Real-time**: Panel de control integrado con chequeo de estado asíncrono.
4.  **Diseño Resiliente**: La interfaz es capaz de auto-repararse e inyectar fallbacks ante datos de contrato incompletos.
