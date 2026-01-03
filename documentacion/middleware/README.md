# Middleware Designer - Orquestador Inteligente

El Middleware actúa como un proxy de metadatos y orquestador del ecosistema, transformando contratos técnicos crudos en definiciones amigables para el usuario.

## Tecnologías y Seguridad
- **Framework**: FastAPI (Asíncrono).
- **Resolución de Modelos**: Motor personalizado de recursividad para esquemas OpenAPI 3.1.
- **Sanitización**: Procesamiento de strings para eliminar ruidos de codificación (No-ASCII).

## Lógica de Resolución de DTOs (Resiliencia)
El servicio `OpenApiService` implementa un motor de resolución de esquemas avanzado:

1.  **Aplanamiento de Herencia (`allOf`)**: Pydantic utiliza `allOf` para la herencia de clases. El middleware fusiona recursivamente las propiedades de todas las ramas, garantizando que campos como `id` o `descripcion` de las clases base siempre estén presentes en el DTO final.
2.  **Manejo de Opcionales (`anyOf` / `oneOf`)**: Detecta automáticamente el tipo principal en uniones (como `String | null`) para presentar el tipo de dato correcto al diseñador.
3.  **Recursividad Segura**: Soporta modelos anidados y arrays de objetos con un límite de profundidad de 20 niveles para evitar ciclos infinitos.
4.  **Limpieza de Metadatos**: Todos los títulos (`title`) y descripciones (`description`) son limpiados de caracteres especiales que podrían romper el renderizado en el navegador.

## Gestión de Caché y Estado
- **Invalidez de Caché**: Implementa una política de limpieza total (`UPDATE backend_services SET swagger_spec_cached = NULL`) para forzar re-inspecciones ante errores críticos.
- **Hash de Integridad**: Compara el hash del Swagger remoto contra la versión local para alertar sobre cambios pendientes de aplicar.

## Endpoints de Configuración
- `GET /inspect`: Devuelve la estructura plana de todos los endpoints, diferenciando entre DTOs de Request y Response.
- `POST /refresh-swagger`: Descarta la copia local y realiza una nueva inspección profunda del microservicio.
