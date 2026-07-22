from sqlalchemy import Column, Integer, String, Numeric, Time, Boolean
from app.database import Base

class Cancha(Base):
    __tablename__ = "cancha"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    tipo = Column(String(20))
    precio_hora = Column(Numeric(10, 2))
    hora_apertura = Column(Time)
    hora_cierre = Column(Time)
    promedio_calificacion = Column(Numeric(3, 2), default=0)
    activa = Column(Boolean, default=True)