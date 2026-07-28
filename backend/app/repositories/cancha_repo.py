from sqlalchemy.orm import Session
from app.models.cancha import Cancha
from app.models.reserva import Reserva
from app.models.enums import EstadoReserva

class CanchaRepository:

    def __init__(self, db: Session):
        self.db = db
    
    def listar_activas(self):
        return self.db.query(Cancha).filter(Cancha.activa == True).all()

    def buscar_por_admin(self, admin_id: int):
        """SELECT de las canchas activas de un administrador."""
        return (
            self.db.query(Cancha)
            .filter(Cancha.administrador_id == admin_id)
            .filter(Cancha.activa == True)
            .all()
        )
    def guardar(self, cancha: Cancha, horarios: list) -> Cancha:
        """INSERT de la cancha y sus horarios en una sola transaccion."""
        cancha.horarios = horarios   # el cascade inserta los horarios, SQLAlchemy
        self.db.add(cancha)
        self.db.commit()
        self.db.refresh(cancha)
        return cancha


    def buscar_por_id(self, cancha_id: int):
        """
        Recupera una cancha por su id. Devuelve None si no existe.
        Necesario para poder llamar desactivar() sobre la entidad.
        """
        return (
            self.db.query(Cancha)
            .filter(Cancha.id == cancha_id)
            .first()
        )

    def contar_reservas_activas(self, cancha_id: int) -> int:
        """
        SELECT COUNT de reservas PENDIENTE o CONFIRMADA.
        Las COMPLETADA no cuentan: ya ocurrieron.
        """
        return (
            self.db.query(Reserva)
            .filter(Reserva.cancha_id == cancha_id)
            .filter(Reserva.estado.in_([
                EstadoReserva.PENDIENTE.value,
                EstadoReserva.CONFIRMADA.value,
            ]))
            .count()
        )

    def actualizar(self, cancha: Cancha) -> Cancha:
        """Persiste los cambios pendientes de la cancha en la BD."""
        self.db.commit()
        self.db.refresh(cancha)
        return cancha