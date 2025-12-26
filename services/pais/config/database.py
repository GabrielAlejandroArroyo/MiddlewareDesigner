from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

# URL de la base de datos SQLite (archivo local)
DATABASE_URL = "sqlite+aiosqlite:///./paises.db"

# Crear el motor asíncrono
engine = create_async_engine(DATABASE_URL, echo=False)

# Creador de sesiones asíncronas
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Clase base para los modelos
class Base(DeclarativeBase):
    pass

# Dependencia para obtener la sesión de BD en los routers si fuera necesario
# (Aunque lo usaremos directamente en el service por ahora)
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

