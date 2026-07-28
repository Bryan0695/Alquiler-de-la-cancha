"""
Modelo: Horario
Del diagrama de clases. Franja horaria de una cancha.

Relaciones:
  Cancha "1" *-- "1..*" Horario   (contiene)
  Reserva "1" -- "1" Horario      (ocupa)
"""
from datetime import date, time, timedelta
from sqlalchemy import Column, Integer, Date, Time, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.enums import EstadoHorario

DIAS_A_GENERAR = 1 # para generar las franjas horarias disponibles x los pròximos 1 días


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

    @classmethod  #cls -> Cancha
    def generar_franjas(cls, apertura: time, cierre: time,
                        dias: int = DIAS_A_GENERAR) -> list:
        """
        generar_franjas() - paso 23 del diagrama.
        Crea franjas de 1 hora entre apertura y cierre,
        para los proximos 'dias' dias.
        """
        franjas = []
        hoy = date.today()

        # Se trabaja en minutos para evitar errores de suma con time
        inicio_min = apertura.hour * 60 + apertura.minute
        cierre_min = cierre.hour * 60 + cierre.minute

        for d in range(dias):
            fecha_franja = hoy + timedelta(days=d)
            actual = inicio_min

            while actual + 60 <= cierre_min:
                franjas.append(cls(
                    fecha=fecha_franja,
                    hora_inicio=time(actual // 60, actual % 60),
                    hora_fin=time((actual + 60) // 60, (actual + 60) % 60),
                    estado=EstadoHorario.LIBRE.value,
                ))
                actual += 60

        return franjas

    def bloquear(self) -> None:
        # TODO: self.estado = EstadoHorario.OCUPADO.value
        pass

    def liberar(self) -> None:
        # TODO: self.estado = EstadoHorario.LIBRE.value
        pass

    def esta_libre(self) -> bool:
        # TODO: return self.estado == EstadoHorario.LIBRE.value
        pass
