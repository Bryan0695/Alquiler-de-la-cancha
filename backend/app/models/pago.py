"""
Modelo: Pago
Del diagrama de clases. Pago asociado a una reserva.
NOTA: pago simulado, sin pasarela externa ni datos de tarjeta.

Relacion:
  Reserva "1" *-- "1" Pago   (genera - composicion)
"""
from sqlalchemy import Column, Integer, Numeric, DateTime, String, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from app.models.enums import EstadoPago


class Pago(Base):
    __tablename__ = "pago"

    id = Column(Integer, primary_key=True, index=True)
    monto = Column(Numeric(10, 2))
    fecha_pago = Column(DateTime, server_default=func.now())
    estado = Column(String(10), default=EstadoPago.PENDIENTE.value)
    metodo = Column(String(30))

    # FK hacia la reserva (composicion Reserva *-- Pago)
    reserva_id = Column(Integer, ForeignKey("reserva.id"), nullable=False)

    
    # --- Relaciones ORM ---
    reserva = relationship("Reserva", back_populates="pago")
    

    # --- Metodos de dominio (del diagrama) ---

    def procesar(self, monto) -> bool:
        # TODO: simular procesamiento del pago
        pass

    def _registrar_transaccion(self) -> None:
        # TODO: metodo privado, registrar la transaccion
        pass

    def generar_comprobante(self) -> str:
        # TODO: generar comprobante del pago
        pass
