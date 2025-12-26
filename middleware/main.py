from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from config.database import engine, Base
from routers import config_routes

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crear tablas de configuración
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()

app = FastAPI(
    title="Middleware Designer",
    description="Middleware orquestador para lectura de contratos y generación de UI",
    version="0.1.0",
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

app.include_router(config_routes.router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Middleware Designer is running"}
