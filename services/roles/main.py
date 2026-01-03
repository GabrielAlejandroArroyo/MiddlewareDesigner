from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from contextlib import asynccontextmanager
from config.database import engine, Base
from routers.rol_routes import router as rol_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crear tablas al iniciar
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Limpieza al cerrar si es necesario
    await engine.dispose()

app = FastAPI(
    title="Roles Service",
    description="API para la gestión de roles asociados a aplicaciones",
    version="1.0.0",
    lifespan=lifespan
)

# Configuración de CORS robusta
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir cualquier origen para depuración
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rutas
app.include_router(rol_router, prefix="/api/v1")

@app.get("/", include_in_schema=False)
async def root():
    return {"status": "Roles Service is running"}
