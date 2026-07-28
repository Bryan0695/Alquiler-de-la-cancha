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
        """
        listar(admin_id) - paso 6 del diagrama.
        Delega la consulta al repositorio.
        """
        return self.repo.buscar_por_admin(admin_id)   


    def registrar(self, admin_id: int, datos):
        """
        registrar(admin_id, datos) - paso 16 del diagrama.
        Orquesta: validar -> crear entidad -> generar horarios -> guardar.
        """
        self.validar_datos(datos)                       # paso 17

        cancha = Cancha.crear(                          # paso 21
            nombre=datos.nombre,
            tipo=datos.tipo,
            precio_hora=datos.precio_hora,
            hora_apertura=datos.hora_apertura,
            hora_cierre=datos.hora_cierre,
            administrador_id=admin_id,
        )

        horarios = Horario.generar_franjas(             # paso 23
            datos.hora_apertura,
            datos.hora_cierre,
        )

        return self.repo.guardar(cancha, horarios)      # paso 25

    def validar_datos(self, datos):
        """
        validar_datos(datos) - paso 17 del diagrama.
        Lanza ValidacionException si algo no cumple las reglas.
        """
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
        eliminar(cancha_id) - paso 34 del diagrama.
        Eliminacion logica, previa validacion de reservas activas.
        """
        cancha = self.repo.buscar_por_id(cancha_id)

        if cancha is None:
            raise RecursoNoEncontradoException("La cancha no existe")

        # Un admin solo puede eliminar SUS canchas
        if cancha.administrador_id != admin_id:
            raise AccesoDenegadoException("La cancha no le pertenece")

        total = self.repo.contar_reservas_activas(cancha_id)   # paso 35

        if total > 0:                                          # paso 39
            raise IntegridadException(
                f"La cancha tiene {total} reserva(s) activa(s) "
                "y no se puede eliminar"
            )

        cancha.desactivar()                                    # paso 42
        return self.repo.actualizar(cancha)                    # paso 44