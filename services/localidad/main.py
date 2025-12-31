import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from contextlib import asynccontextmanager
from config.database import engine, Base
from routers.localidad_routes import router as localidad_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crear tablas al iniciar
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()

app = FastAPI(
    title="Localidad Microservice",
    description="API para la gestión de localidades con validación de País y Provincia",
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

@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")

app.include_router(localidad_router, prefix="/api/v1")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)
