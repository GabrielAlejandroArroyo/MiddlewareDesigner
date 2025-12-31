from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Table, func
from config.database import Base

# Tabla intermedia para Relación Muchos a Muchos con Corporaciones
# Guardamos los IDs de las corporaciones (referencia externa)
empresa_corporacion = Table(
    'empresa_corporacion',
    Base.metadata,
    Column('id_empresa', Integer, ForeignKey('empresas.id'), primary_key=True),
    Column('id_corporacion', Integer, primary_key=True) 
)

class Empresa(Base):
    __tablename__ = "empresas"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    descripcion = Column(String, nullable=False)
    baja_logica = Column(Boolean, default=False)
    fecha_alta = Column(DateTime(timezone=True), server_default=func.now())
    fecha_modificacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
