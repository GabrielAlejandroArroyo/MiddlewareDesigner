# Cursor Project Rules (MDC)

Copiá la carpeta `.cursor/` en la raíz de tu monorepo para que Cursor detecte estas reglas.

Estructura esperada del monorepo (convención aplicada):
- `services/` → microservicios backend (Python)
- `middleware/` → middleware (Python) que lee OpenAPI/Swagger de `services/`
- `microfrontends/` → MFEs Angular

Ubicación de reglas:
- `.cursor/rules/*.mdc`

Notas:
- Las reglas están separadas por alcance (global / por globs / por descripción).
- Si agregás nuevas reglas, evitá mezclar `globs` y `description` en el mismo archivo.
