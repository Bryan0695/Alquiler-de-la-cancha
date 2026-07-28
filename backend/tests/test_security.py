from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.security import (
    AutenticacionSimulada,
    obtener_usuario_actual,
    validar_token_y_rol,
)


def _credenciales(token):
    """Imita el objeto HTTPAuthorizationCredentials de FastAPI."""
    return SimpleNamespace(scheme="Bearer", credentials=token)


# ---------------------- AutenticacionSimulada ------------------------

def test_validar_token_devuelve_el_usuario_si_el_token_existe():
    auth = AutenticacionSimulada()
    assert auth.validar_token("token-admin") == {"id": 1, "rol": "ADMINISTRADOR"}


def test_validar_token_devuelve_none_si_el_token_no_existe():
    auth = AutenticacionSimulada()
    assert auth.validar_token("token-falso") is None


# ----------------------- obtener_usuario_actual ----------------------

def test_token_admin_valido_devuelve_usuario():
    usuario = obtener_usuario_actual(_credenciales("token-admin"))
    assert usuario == {"id": 1, "rol": "ADMINISTRADOR"}


def test_token_jugador_valido_devuelve_usuario():
    usuario = obtener_usuario_actual(_credenciales("token-jugador"))
    assert usuario["rol"] == "JUGADOR"


def test_sin_credenciales_lanza_401():
    with pytest.raises(HTTPException) as exc:
        obtener_usuario_actual(None)
    assert exc.value.status_code == 401


def test_token_inexistente_lanza_401():
    with pytest.raises(HTTPException) as exc:
        obtener_usuario_actual(_credenciales("token-falso"))
    assert exc.value.status_code == 401


# ------------------------ validar_token_y_rol ------------------------

def test_administrador_pasa_la_validacion_de_rol():
    admin = {"id": 1, "rol": "ADMINISTRADOR"}
    assert validar_token_y_rol(admin) == admin


def test_jugador_no_puede_gestionar_canchas():
    jugador = {"id": 2, "rol": "JUGADOR"}
    with pytest.raises(HTTPException) as exc:
        validar_token_y_rol(jugador)
    assert exc.value.status_code == 403
