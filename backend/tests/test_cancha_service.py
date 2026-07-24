from datetime import time
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from app.services.cancha_service import CanchaService
from app.models.cancha import Cancha
from app.exceptions import ValidacionException, IntegridadException


def _datos_validos(**overrides):
    """Objeto simple que imita el schema CanchaCreate."""
    base = dict(
        nombre="Cancha Central",
        tipo="FUTBOL_5",
        precio_hora=Decimal("20.00"),
        hora_apertura=time(8, 0),
        hora_cierre=time(22, 0),
    )
    base.update(overrides)
    return SimpleNamespace(**base)


def _servicio_con_repo_mock():
    """Crea el servicio y reemplaza su repositorio por un Mock."""
    service = CanchaService(db=MagicMock())
    service.repo = MagicMock()
    return service


# --------------------------- validar_datos ---------------------------

def test_validar_datos_acepta_datos_correctos():
    service = _servicio_con_repo_mock()
    # No debe lanzar ninguna excepcion.
    service.validar_datos(_datos_validos())


def test_validar_datos_rechaza_cierre_anterior_a_apertura():
    service = _servicio_con_repo_mock()
    datos = _datos_validos(hora_apertura=time(22, 0), hora_cierre=time(8, 0))

    with pytest.raises(ValidacionException):
        service.validar_datos(datos)


def test_validar_datos_rechaza_cierre_igual_a_apertura():
    service = _servicio_con_repo_mock()
    datos = _datos_validos(hora_apertura=time(10, 0), hora_cierre=time(10, 0))

    with pytest.raises(ValidacionException):
        service.validar_datos(datos)


def test_validar_datos_rechaza_precio_cero_o_negativo():
    service = _servicio_con_repo_mock()

    with pytest.raises(ValidacionException):
        service.validar_datos(_datos_validos(precio_hora=Decimal("0")))

    with pytest.raises(ValidacionException):
        service.validar_datos(_datos_validos(precio_hora=Decimal("-5")))


# ----------------------------- registrar -----------------------------

def test_registrar_guarda_cancha_y_horarios():
    service = _servicio_con_repo_mock()
    # guardar() devuelve lo que reciba, para poder inspeccionarlo.
    service.repo.guardar.side_effect = lambda cancha, horarios: cancha

    resultado = service.registrar(admin_id=1, datos=_datos_validos())

    # Se llamo a guardar exactamente una vez.
    service.repo.guardar.assert_called_once()
    cancha_guardada, horarios = service.repo.guardar.call_args.args

    assert isinstance(cancha_guardada, Cancha)
    assert cancha_guardada.nombre == "Cancha Central"
    assert cancha_guardada.administrador_id == 1
    # De 08:00 a 22:00 se generan 14 franjas de una hora.
    assert len(horarios) == 14
    assert resultado is cancha_guardada


def test_registrar_no_guarda_si_los_datos_son_invalidos():
    service = _servicio_con_repo_mock()
    datos = _datos_validos(precio_hora=Decimal("0"))

    with pytest.raises(ValidacionException):
        service.registrar(admin_id=1, datos=datos)

    # Al fallar la validacion, nunca se debe llegar a persistir.
    service.repo.guardar.assert_not_called()


# ------------------------------ eliminar -----------------------------

def test_eliminar_desactiva_cancha_sin_reservas():
    service = _servicio_con_repo_mock()
    cancha = Cancha.crear(
        nombre="Cancha X", tipo="FUTBOL_5", precio_hora=Decimal("10"),
        hora_apertura=time(8, 0), hora_cierre=time(20, 0), administrador_id=1,
    )
    service.repo.buscar_por_id.return_value = cancha
    service.repo.contar_reservas_activas.return_value = 0
    service.repo.actualizar.side_effect = lambda c: c

    service.eliminar(cancha_id=5, admin_id=1)

    assert cancha.activa is False
    service.repo.actualizar.assert_called_once_with(cancha)


def test_eliminar_falla_si_la_cancha_no_existe():
    service = _servicio_con_repo_mock()
    service.repo.buscar_por_id.return_value = None

    with pytest.raises(ValidacionException):
        service.eliminar(cancha_id=99, admin_id=1)

    service.repo.actualizar.assert_not_called()


def test_eliminar_falla_si_la_cancha_no_le_pertenece():
    service = _servicio_con_repo_mock()
    cancha = Cancha.crear(
        nombre="Ajena", tipo="FUTBOL_5", precio_hora=Decimal("10"),
        hora_apertura=time(8, 0), hora_cierre=time(20, 0), administrador_id=99,
    )
    service.repo.buscar_por_id.return_value = cancha

    with pytest.raises(ValidacionException):
        service.eliminar(cancha_id=5, admin_id=1)  # admin distinto al dueno

    service.repo.actualizar.assert_not_called()


def test_eliminar_falla_si_tiene_reservas_activas():
    service = _servicio_con_repo_mock()
    cancha = Cancha.crear(
        nombre="Ocupada", tipo="FUTBOL_5", precio_hora=Decimal("10"),
        hora_apertura=time(8, 0), hora_cierre=time(20, 0), administrador_id=1,
    )
    service.repo.buscar_por_id.return_value = cancha
    service.repo.contar_reservas_activas.return_value = 3

    with pytest.raises(IntegridadException):
        service.eliminar(cancha_id=5, admin_id=1)

    # No se desactiva ni se persiste si hay reservas activas.
    assert cancha.activa is True
    service.repo.actualizar.assert_not_called()


# ------------------------- listar / listar_todo ----------------------

def test_listar_delega_en_el_repositorio():
    service = _servicio_con_repo_mock()
    service.repo.buscar_por_admin.return_value = ["cancha1", "cancha2"]

    resultado = service.listar(admin_id=7)

    service.repo.buscar_por_admin.assert_called_once_with(7)
    assert resultado == ["cancha1", "cancha2"]


def test_listar_todo_devuelve_las_canchas_activas():
    service = _servicio_con_repo_mock()
    service.repo.listar_activas.return_value = ["activa1"]

    resultado = service.listar_todo()

    service.repo.listar_activas.assert_called_once()
    assert resultado == ["activa1"]
