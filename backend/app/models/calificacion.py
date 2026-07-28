"""
Modelo: Calificacion
Del diagrama de clases. Puntaje y comentario que un usuario
deja a una cancha, originado por una reserva.

Relaciones:
  Usuario "1" -- "0..*" Calificacion  (emite)
  Cancha "1" -- "0..*" Calificacion   (recibe)
  Reserva "1" -- "0..1" Calificacion  (origina)
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Calificacion(Base):
    __tablename__ = "calificacion"

    id = Column(Integer, primary_key=True, index=True)
    puntaje = Column(Integer)
    comentario = Column(String(500))
    fecha = Column(DateTime, server_default=func.now())

    # FKs de las relaciones
    usuario_id = Column(Integer, ForeignKey("usuario.id"), nullable=False)
    cancha_id = Column(Integer, ForeignKey("cancha.id"), nullable=False)
    reserva_id = Column(Integer, ForeignKey("reserva.id"))

    # regla: el puntaje va de 1 a 5
    __table_args__ = (
        CheckConstraint("puntaje >= 1 AND puntaje <= 5", name="check_puntaje_rango"),
    )

    
    # --- Relaciones ORM ---
    usuario = relationship("Usuario", back_populates="calificaciones")
    cancha = relationship("Cancha", back_populates="calificaciones")
    reserva = relationship("Reserva", back_populates="calificacion")
    
    # --- Metodos de dominio (del diagrama) ---

    def validar_puntaje(self) -> bool:
        # TODO: return 1 <= self.puntaje <= 5
        pass

    def editar(self, puntaje, comentario) -> None:
        # TODO: actualizar puntaje y comentario
        pass
