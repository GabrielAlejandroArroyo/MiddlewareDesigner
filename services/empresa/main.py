from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from config.database import engine, Base
from routers.empresa_routes import router as empresa_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crear tablas al iniciar
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Limpieza al cerrar
    await engine.dispose()

app = FastAPI(
    title="Empresa Microservice",
    description="Microservicio para la gestión de empresas con validación de corporación",
    version="1.0.0",
    lifespan=lifespan
)

# Configuración de CORS ultra-permisiva
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rutas
app.include_router(empresa_router, prefix="/api/v1")

@app.get("/", include_in_schema=False)
async def root():
    return {"status": "ok", "service": "Empresa Service"}
