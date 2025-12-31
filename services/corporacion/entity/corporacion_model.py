from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from config.database import Base

class Corporacion(Base):
    __tablename__ = "corporaciones"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    descripcion = Column(String, nullable=False)
    baja_logica = Column(Boolean, default=False)
    fecha_alta = Column(DateTime(timezone=True), server_default=func.now())
    fecha_modificacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
