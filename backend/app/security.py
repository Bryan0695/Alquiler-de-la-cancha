from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# auto_error=False para poder devolver 401 (por defecto daria 403)
security = HTTPBearer(auto_error=False)

# TODO: reemplazar por jwt.decode() cuando exista el login
TOKENS_SIMULADOS = {
    "token-admin":   {"id": 1, "rol": "ADMINISTRADOR"},
    "token-admin2":  {"id": 3, "rol": "ADMINISTRADOR"},
    "token-jugador": {"id": 2, "rol": "JUGADOR"},
}


class AutenticacionSimulada:
    """
    Encapsula el mecanismo de autenticacion.

    Hoy resuelve el token contra un diccionario en memoria. Cuando exista
    el login real, basta con cambiar validar_token() por jwt.decode():
    quien la usa no se entera del cambio.
    """

    def __init__(self, tokens=TOKENS_SIMULADOS):
        self._tokens = tokens

    def validar_token(self, token) -> dict | None:
        """Devuelve los datos del usuario, o None si el token no es valido."""
        return self._tokens.get(token)


# instancia unica que usan las dependencias de FastAPI
autenticacion = AutenticacionSimulada()


def obtener_usuario_actual(
    credenciales: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Lee el token del header Authorization: Bearer <token>.
    SIMULADO: cuando exista el login, aqui se verifica
    la firma del JWT real.
    """
    if credenciales is None:
        raise HTTPException(status_code=401, detail="Token ausente o invalido")

    token = credenciales.credentials   # ya viene sin el "Bearer "

    usuario = autenticacion.validar_token(token)
    if usuario is None:
        raise HTTPException(status_code=401, detail="Token ausente o invalido")

    return usuario


def validar_token_y_rol(usuario=Depends(obtener_usuario_actual)):
    """
    validar_token_y_rol() del diagrama de secuencia UC7.
    Solo el rol ADMINISTRADOR puede gestionar canchas.
    """
    if usuario["rol"] != "ADMINISTRADOR":
        raise HTTPException(status_code=403, detail="El usuario no tiene rol de administrador")
    return usuario