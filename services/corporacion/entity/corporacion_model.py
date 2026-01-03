from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from typing import Optional
from config.database import Base

class CorporacionModel(Base):
    __tablename__ = "corporaciones"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, unique=True)
    descripcion: Mapped[str] = mapped_column(String(255), nullable=False)
    baja_logica: Mapped[bool] = mapped_column(Boolean, default=False)
    fecha_alta_creacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    fecha_alta_modificacion: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
