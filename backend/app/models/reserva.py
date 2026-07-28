"""
Modelo: Reserva
Del diagrama de clases. Reserva de una cancha por un usuario.

Relaciones:
  Usuario "1" -- "0..*" Reserva      (realiza)
  Cancha "1" -- "0..*" Reserva       (es reservada en)
  Reserva "1" -- "1" Horario         (ocupa)
  Reserva "1" *-- "1" Pago           (genera - composicion)
  Reserva "1" -- "0..1" Calificacion (origina)
"""
from sqlalchemy import Column, Integer, DateTime, Numeric, String, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from app.models.enums import EstadoReserva


class Reserva(Base):
    __tablename__ = "reserva"

    id = Column(Integer, primary_key=True, index=True)
    fecha_creacion = Column(DateTime, server_default=func.now())
    monto_total = Column(Numeric(10, 2))
    estado = Column(String(15), default=EstadoReserva.PENDIENTE.value)

    # FKs de las relaciones
    usuario_id = Column(Integer, ForeignKey("usuario.id"), nullable=False)
    cancha_id = Column(Integer, ForeignKey("cancha.id"), nullable=False)
    horario_id = Column(Integer, ForeignKey("horario.id"))

    
    # --- Relaciones ---
    usuario = relationship("Usuario", back_populates="reservas")
    cancha = relationship("Cancha", back_populates="reservas")
    horario = relationship("Horario", back_populates="reserva")
    # composicion: la reserva genera un pago
    pago = relationship("Pago", back_populates="reserva",
                        uselist=False, cascade="all, delete-orphan")
    calificacion = relationship("Calificacion", back_populates="reserva",
                                uselist=False)
    

    # --- Metodos de dominio (del diagrama) ---

    def calcular_total(self) -> float:
        # TODO: calcular segun cancha y horas
        pass

    def confirmar(self) -> bool:
        # TODO: cambiar estado a CONFIRMADA si el pago esta ok
        pass

    def esta_pagada(self) -> bool:
        # TODO: revisar el estado del pago asociado
        pass
