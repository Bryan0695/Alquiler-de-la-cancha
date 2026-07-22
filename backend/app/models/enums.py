"""
Enumeraciones del dominio.
Basado en el diagrama de clases: EstadoReserva, EstadoPago, EstadoHorario.

"""
import enum


class EstadoReserva(str, enum.Enum):
    PENDIENTE = "PENDIENTE"
    CONFIRMADA = "CONFIRMADA"
    COMPLETADA = "COMPLETADA"


class EstadoPago(str, enum.Enum):
    PENDIENTE = "PENDIENTE"
    PAGADO = "PAGADO"
    RECHAZADO = "RECHAZADO"


class EstadoHorario(str, enum.Enum):
    LIBRE = "LIBRE"
    OCUPADO = "OCUPADO"
