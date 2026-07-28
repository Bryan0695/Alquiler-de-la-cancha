from datetime import time
from decimal import Decimal

from app.models.cancha import Cancha


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
