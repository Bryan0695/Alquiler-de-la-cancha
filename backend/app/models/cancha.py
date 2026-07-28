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
from app.models.enums import EstadoHorario


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

    def esta_disponible(self, fecha, hora) -> bool:
        """
        Indica si la cancha tiene una franja LIBRE que empiece
        en la fecha y hora pedidas.
        """
        return any(
            horario.fecha == fecha
            and horario.hora_inicio == hora
            and horario.estado == EstadoHorario.LIBRE.value
            for horario in self.horarios
        )

    def calcular_precio(self, horas) -> float:
        """
        Costo total de reservar la cancha durante 'horas' horas.
        """
        return float(self.precio_hora) * horas

    def recalcular_promedio(self) -> None:
        """
        Recalcula promedio_calificacion como la media de los puntajes
        recibidos. Sin calificaciones el promedio queda en 0.
        """
        if not self.calificaciones:
            self.promedio_calificacion = 0
            return

        total = sum(calificacion.puntaje for calificacion in self.calificaciones)
        self.promedio_calificacion = total / len(self.calificaciones)

    def desactivar(self) -> None:
        """
        Eliminacion LOGICA: la cancha no se borra de la BD,
        solo se marca inactiva para preservar el historico
        de reservas.
        """
        self.activa = False
