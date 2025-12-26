from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from config.database import engine, Base
from entity.provincia_model import ProvinciaModel
from routers import provincia_routes

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()

app = FastAPI(
    title="Microservicio de Provincia",
    description="Microservicio para gestión de provincias con validación de país",
    version="1.0.0",
    lifespan=lifespan
)

# Configuración de CORS robusta
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="http://(127\.0\.0\.1|localhost):[0-9]+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(provincia_routes.router, prefix="/api/v1")

@app.get("/", tags=["health"])
async def root():
    return {
        "service": "Microservicio de Provincia",
        "version": "1.0.0",
        "status": "running"
    }
