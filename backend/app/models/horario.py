"""
Modelo: Horario
Del diagrama de clases. Franja horaria de una cancha.

Relaciones:
  Cancha "1" *-- "1..*" Horario   (contiene)
  Reserva "1" -- "1" Horario      (ocupa)
"""
from sqlalchemy import Column, Integer, Date, Time, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.enums import EstadoHorario


class Horario(Base):
    __tablename__ = "horario"

    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(Date)
    hora_inicio = Column(Time)
    hora_fin = Column(Time)
    # el enum se guarda como texto; default LIBRE
    estado = Column(String(10), default=EstadoHorario.LIBRE.value)

    # FK hacia la cancha (de la composicion Cancha *-- Horario)
    cancha_id = Column(Integer, ForeignKey("cancha.id"), nullable=False)

    
    # --- Relaciones ORM ---
    cancha = relationship("Cancha", back_populates="horarios")
    reserva = relationship("Reserva", back_populates="horario", uselist=False)
    

    # --- Metodos de dominio (del diagrama) ---

    def generar_franjas(self, apertura, cierre) -> list:
        # TODO: generar franjas de 1h entre apertura y cierre
        pass

    def bloquear(self) -> None:
        # TODO: self.estado = EstadoHorario.OCUPADO.value
        pass

    def liberar(self) -> None:
        # TODO: self.estado = EstadoHorario.LIBRE.value
        pass

    def esta_libre(self) -> bool:
        # TODO: return self.estado == EstadoHorario.LIBRE.value
        pass
