from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from config.database import engine, Base
from entity.pais_model import PaisModel # Importado para que SQLAlchemy lo detecte
from routers import pais_routes

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crear tablas al iniciar
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Limpieza al cerrar si fuera necesario
    await engine.dispose()

app = FastAPI(
    title="Microservicio de País",
    description="Microservicio para gestión de países con persistencia SQLite",
    version="1.1.0",
    lifespan=lifespan
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(pais_routes.router, prefix="/api/v1")


@app.get("/", tags=["health"])
async def root():
    """
    Endpoint de salud del microservicio
    """
    return {
        "service": "Microservicio de País",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health", tags=["health"])
async def health_check():
    """
    Endpoint de verificación de salud
    """
    return {"status": "healthy"}


