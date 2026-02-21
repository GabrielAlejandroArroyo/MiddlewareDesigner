from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from config.database import engine, Base
from routers.usuario_routes import router as usuario_router
from routers.auth_routes import router as auth_router

from scripts.migrate_add_password import migrate as migrate_add_password
from scripts.migrate_null_passwords_to_1234 import migrate as migrate_null_passwords_to_1234
from scripts.ensure_admin_password import ensure_admin_password_valid_async


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crear tablas al iniciar (primero para que migrate pueda alterar si es necesario)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # Migrar esquema y asegurar admin con contraseña válida (admin/admin)
    migrate_add_password()
    # Usuarios con password null → "1234" y debe cambiar en primer login
    migrate_null_passwords_to_1234()
    # Corrección: si el hash de admin no verifica (ej. BD corrupta), reasignar contraseña
    await ensure_admin_password_valid_async()
    yield
    # Limpieza al cerrar
    await engine.dispose()

app = FastAPI(
    title="Usuario Service",
    description="API para la gestión de usuarios con roles multivaluados",
    version="1.0.2",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(usuario_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")

@app.get("/", include_in_schema=False)
async def root():
    return {"status": "Usuario Service is running"}
