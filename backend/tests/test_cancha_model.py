from datetime import date, time
from decimal import Decimal

from app.models.cancha import Cancha
from app.models.calificacion import Calificacion
from app.models.enums import EstadoHorario
from app.models.horario import Horario


def test_crear_asigna_todos_los_campos():
    cancha = Cancha.crear(
        nombre="Cancha Norte",
        tipo="FUTBOL_5",
        precio_hora=Decimal("20.00"),
        hora_apertura=time(8, 0),
        hora_cierre=time(22, 0),
        administrador_id=1,
    )

    assert cancha.nombre == "Cancha Norte"
    assert cancha.tipo == "FUTBOL_5"
    assert cancha.precio_hora == Decimal("20.00")
    assert cancha.hora_apertura == time(8, 0)
    assert cancha.hora_cierre == time(22, 0)
    assert cancha.administrador_id == 1


def test_crear_nace_activa_y_sin_calificacion():
    cancha = Cancha.crear(
        nombre="Cancha Sur",
        tipo="FUTBOL_7",
        precio_hora=Decimal("30.00"),
        hora_apertura=time(9, 0),
        hora_cierre=time(21, 0),
        administrador_id=2,
    )

    assert cancha.activa is True
    assert cancha.promedio_calificacion == 0


def test_desactivar_marca_la_cancha_inactiva():
    cancha = Cancha.crear(
        nombre="Cancha Este",
        tipo="FUTBOL_5",
        precio_hora=Decimal("15.00"),
        hora_apertura=time(8, 0),
        hora_cierre=time(20, 0),
        administrador_id=1,
    )

    assert cancha.activa is True
    cancha.desactivar()
    assert cancha.activa is False


def _cancha_de_prueba(precio_hora=Decimal("20.00")):
    return Cancha.crear(
        nombre="Cancha Oeste",
        tipo="FUTBOL_5",
        precio_hora=precio_hora,
        hora_apertura=time(8, 0),
        hora_cierre=time(22, 0),
        administrador_id=1,
    )


def test_esta_disponible_segun_la_franja_encontrada():
    cancha = _cancha_de_prueba()
    hoy = date.today()
    cancha.horarios = [
        Horario(fecha=hoy, hora_inicio=time(8, 0), hora_fin=time(9, 0),
                estado=EstadoHorario.LIBRE.value),
        Horario(fecha=hoy, hora_inicio=time(9, 0), hora_fin=time(10, 0),
                estado=EstadoHorario.OCUPADO.value),
    ]

    # franja existente y libre
    assert cancha.esta_disponible(hoy, time(8, 0)) is True
    # franja existente pero ocupada
    assert cancha.esta_disponible(hoy, time(9, 0)) is False
    # hora sin franja
    assert cancha.esta_disponible(hoy, time(15, 0)) is False
    # franja libre pero de otra fecha
    assert cancha.esta_disponible(date(2030, 1, 1), time(8, 0)) is False


def test_calcular_precio_multiplica_precio_hora_por_horas():
    cancha = _cancha_de_prueba(precio_hora=Decimal("20.50"))

    assert cancha.calcular_precio(2) == 41.0
    assert cancha.calcular_precio(1) == 20.5
    assert cancha.calcular_precio(0) == 0.0


def test_recalcular_promedio_promedia_los_puntajes():
    cancha = _cancha_de_prueba()

    # sin calificaciones el promedio queda en 0
    cancha.recalcular_promedio()
    assert cancha.promedio_calificacion == 0

    cancha.calificaciones = [
        Calificacion(puntaje=5),
        Calificacion(puntaje=4),
        Calificacion(puntaje=3),
    ]
    cancha.recalcular_promedio()
    assert cancha.promedio_calificacion == 4
