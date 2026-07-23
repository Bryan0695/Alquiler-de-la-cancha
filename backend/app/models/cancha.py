"""
Modelo: Cancha
Del diagrama de clases. Cancha de futbol administrada por un usuario.

Relaciones:
  Usuario "1" -- "0..*" Cancha       (administra)
  Cancha "1" *-- "1..*" Horario      (contiene - composicion)
  Cancha "1" -- "0..*" Reserva       (es reservada en)
  Cancha "1" -- "0..*" Calificacion  (recibe)
"""
from sqlalchemy import Column, Integer, String, Numeric, Time, Boolean, ForeignKey
from sqlalchemy.orm import relationship
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

    # FK hacia el administrador (de la relacion Usuario -- Cancha)
    administrador_id = Column(Integer, ForeignKey("usuario.id"))


    # --- Relaciones ORM---
    administrador = relationship("Usuario", back_populates="canchas")
    # composicion: si se borra la cancha, se borran sus horarios
    horarios = relationship("Horario", back_populates="cancha",
                            cascade="all, delete-orphan")
    reservas = relationship("Reserva", back_populates="cancha")
    calificaciones = relationship("Calificacion", back_populates="cancha")


    # --- Metodos de dominio (del diagrama) ---

    @classmethod
    def crear(cls, nombre, tipo, precio_hora,
              hora_apertura, hora_cierre, administrador_id):
        """
        crear() - paso 21 del diagrama.
        Construye una cancha nueva con sus valores por defecto.
        cls(...) es lo mismo que Cancha(...)
        """
        return cls(
            nombre=nombre,
            tipo=tipo,
            precio_hora=precio_hora,
            hora_apertura=hora_apertura,
            hora_cierre=hora_cierre,
            administrador_id=administrador_id,
            promedio_calificacion=0,
            activa=True,
        )

    """
     solo se dejan definidos métodos de otros Casos de Uso ---
    def esta_disponible(self, fecha, hora) -> bool:
        # TODO: revisar horarios libres
        pass

    def calcular_precio(self, horas) -> float:
        # TODO: precio_hora * horas
        pass

    def recalcular_promedio(self) -> None:
        # TODO: promediar las calificaciones
        pass
    """

    def desactivar(self) -> None:
        # TODO: self.activa = False  (baja logica)
        pass
