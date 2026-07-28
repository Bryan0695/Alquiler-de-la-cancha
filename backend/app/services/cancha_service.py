from app.repositories.cancha_repo import CanchaRepository
from app.models.cancha import Cancha
from app.models.horario import Horario
from app.exceptions import (
    ValidacionException,
    IntegridadException,
    RecursoNoEncontradoException,
    AccesoDenegadoException,
)

class CanchaService:

    def __init__(self, db):
        self.repo = CanchaRepository(db)

    def listar_todo(self):
        # aqui irian reglas de negocio si las hubiera
        return self.repo.listar_activas()

    def listar(self, admin_id: int):
        """Devuelve las canchas activas del administrador indicado."""
        return self.repo.buscar_por_admin(admin_id)


    def registrar(self, admin_id: int, datos):
        """
        Orquesta: validar -> crear entidad -> generar horarios -> guardar.
        """
        self.validar_datos(datos)

        cancha = Cancha.crear(
            nombre=datos.nombre,
            tipo=datos.tipo,
            precio_hora=datos.precio_hora,
            hora_apertura=datos.hora_apertura,
            hora_cierre=datos.hora_cierre,
            administrador_id=admin_id,
        )

        horarios = Horario.generar_franjas(
            datos.hora_apertura,
            datos.hora_cierre,
        )

        return self.repo.guardar(cancha, horarios)

    def validar_datos(self, datos):
        """Lanza ValidacionException si algo no cumple las reglas."""
        if datos.hora_cierre <= datos.hora_apertura:
            raise ValidacionException(
                "La hora de cierre debe ser posterior a la de apertura"
            )

        if datos.precio_hora <= 0:
            raise ValidacionException(
                "El precio por hora debe ser mayor a cero"
            )

    def eliminar(self, cancha_id: int, admin_id: int):
        """
        Eliminacion logica, previa validacion de reservas activas.
        """
        cancha = self.repo.buscar_por_id(cancha_id)

        if cancha is None:
            raise RecursoNoEncontradoException("La cancha no existe")

        # Un admin solo puede eliminar SUS canchas
        if cancha.administrador_id != admin_id:
            raise AccesoDenegadoException("La cancha no le pertenece")

        total = self.repo.contar_reservas_activas(cancha_id)

        if total > 0:
            raise IntegridadException(
                f"La cancha tiene {total} reserva(s) activa(s) "
                "y no se puede eliminar"
            )

        cancha.desactivar()
        return self.repo.actualizar(cancha)