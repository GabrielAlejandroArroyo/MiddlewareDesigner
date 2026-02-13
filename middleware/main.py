from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from config.database import engine, Base
from routers import config_routes, auth_routes
# Importar modelos para que SQLAlchemy los registre en Base.metadata
from entity.config_models import BackendService, FrontendService, BackendMapping

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crear tablas de configuración
    # Esto creará las tablas si no existen, pero no modificará las existentes
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()

app = FastAPI(
    title="Middleware Designer",
    description="Middleware orquestador para lectura de contratos y generación de UI",
    version="0.1.0",
    lifespan=lifespan,
    swagger_ui_init_oauth=None,
)

# Esquema de seguridad para OpenAPI (Basic Auth; Bearer cuando se use OIDC)
from fastapi.openapi.utils import get_openapi

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "BasicAuth": {
            "type": "http",
            "scheme": "basic",
            "description": "Usuario y contraseña configurados en MIDDLEWARE_AUTH_USER / MIDDLEWARE_AUTH_PASSWORD",
        },
    }
    # Aplicar seguridad a rutas bajo /api/v1/config
    for path, methods in openapi_schema.get("paths", {}).items():
        if path.startswith("/api/v1/config"):
            for _method, spec in methods.items():
                if isinstance(spec, dict) and "summary" in spec:
                    spec["security"] = [{"BasicAuth": []}]
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Configuración de CORS robusta
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "http://localhost:*",
        "http://127.0.0.1:*"
    ],
    allow_origin_regex="http://(127\.0\.0\.1|localhost):[0-9]+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(config_routes.router, prefix="/api/v1")
app.include_router(auth_routes.router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Middleware Designer is running"}
