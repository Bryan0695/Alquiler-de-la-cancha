"""
Pruebas de integracion del router de canchas.

Se levanta la app real con TestClient y se sustituyen sus dependencias
(base de datos y autenticacion) para no tocar nada externo. Lo que se
verifica aqui es la TRADUCCION de excepciones del servicio a codigos HTTP.
"""
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.database import get_db
from app.exceptions import (
    IntegridadException,
    RecursoNoEncontradoException,
    AccesoDenegadoException,
)
from app.main import app
from app.security import validar_token_y_rol
import app.routers.cancha as router_cancha


ADMIN = {"id": 1, "rol": "ADMINISTRADOR"}


@pytest.fixture
def servicio_mock(monkeypatch):
    """
    Sustituye las dependencias de la app y el CanchaService del router.
    Devuelve el mock del servicio para configurar su comportamiento.
    """
    app.dependency_overrides[get_db] = lambda: MagicMock()
    app.dependency_overrides[validar_token_y_rol] = lambda: ADMIN

    servicio = MagicMock()
    monkeypatch.setattr(router_cancha, "CanchaService", lambda db: servicio)

    yield servicio

    app.dependency_overrides.clear()


@pytest.fixture
def cliente():
    return TestClient(app)


def test_eliminar_cancha_inexistente_devuelve_404(cliente, servicio_mock):
    servicio_mock.eliminar.side_effect = RecursoNoEncontradoException(
        "La cancha no existe"
    )

    respuesta = cliente.delete("/canchas/99")

    assert respuesta.status_code == 404
    assert respuesta.json()["detail"] == "La cancha no existe"


def test_eliminar_cancha_ajena_devuelve_403(cliente, servicio_mock):
    servicio_mock.eliminar.side_effect = AccesoDenegadoException(
        "La cancha no le pertenece"
    )

    respuesta = cliente.delete("/canchas/5")

    assert respuesta.status_code == 403
    assert respuesta.json()["detail"] == "La cancha no le pertenece"


def test_eliminar_cancha_con_reservas_activas_devuelve_409(cliente, servicio_mock):
    servicio_mock.eliminar.side_effect = IntegridadException(
        "La cancha tiene 3 reserva(s) activa(s) y no se puede eliminar"
    )

    respuesta = cliente.delete("/canchas/5")

    assert respuesta.status_code == 409


def test_eliminar_cancha_propia_devuelve_200(cliente, servicio_mock):
    servicio_mock.eliminar.return_value = None

    respuesta = cliente.delete("/canchas/5")

    assert respuesta.status_code == 200
    assert respuesta.json() == {"mensaje": "Cancha eliminada correctamente"}
    servicio_mock.eliminar.assert_called_once_with(5, ADMIN["id"])
