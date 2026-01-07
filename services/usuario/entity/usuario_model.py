from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from typing import Optional
from config.database import Base

class UsuarioModel(Base):
    __tablename__ = "usuarios"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, unique=True)
    email: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    nombre_usuario: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    apellido: Mapped[str] = mapped_column(String(100), nullable=False)
    baja_logica: Mapped[bool] = mapped_column(Boolean, default=False)
    fecha_alta_creacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    fecha_alta_modificacion: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
