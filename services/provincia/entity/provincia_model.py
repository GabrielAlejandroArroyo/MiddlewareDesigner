from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from typing import Optional
from config.database import Base

class ProvinciaModel(Base):
    __tablename__ = "provincias"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, unique=True)
    descripcion: Mapped[str] = mapped_column(String(255), nullable=False)
    id_pais: Mapped[str] = mapped_column(String(50), nullable=False) # Referencia al microservicio Pais
    baja_logica: Mapped[bool] = mapped_column(Boolean, default=False)
    fecha_alta_creacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    fecha_alta_modificacion: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
