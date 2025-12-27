from sqlalchemy import Column, String, Boolean, DateTime
from datetime import datetime
from config.database import Base

class LocalidadModel(Base):
    __tablename__ = "localidades"

    id = Column(String, primary_key=True, index=True)
    descripcion = Column(String, nullable=False)
    id_pais = Column(String, nullable=False)
    id_provincia = Column(String, nullable=False)
    baja_logica = Column(Boolean, default=False)
    fecha_alta_creacion = Column(DateTime, default=datetime.utcnow)
    fecha_alta_modificacion = Column(DateTime, default=datetime.utcnow)
