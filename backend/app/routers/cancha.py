from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import validar_token_y_rol
from app.services.cancha_service import CanchaService
from app.schemas.cancha_schema import (
    CanchaCreate,
    CanchaListResponse,
    CanchaDetalleResponse,
)
from app.exceptions import (
    ValidacionException,
    IntegridadException,
    RecursoNoEncontradoException,
    AccesoDenegadoException,
)

router = APIRouter(prefix="/canchas", tags=["Canchas"])


@router.get("/", response_model=list[CanchaListResponse])
def listar_canchas(db: Session = Depends(get_db),
                   usuario=Depends(validar_token_y_rol)):
    """
    GET /canchas
    Lista las canchas registradas por el administrador autenticado.
    Requiere token con rol ADMINISTRADOR.
    """
    service = CanchaService(db)
    return service.listar(usuario["id"])

@router.post("/",
             response_model=CanchaDetalleResponse,
             status_code=status.HTTP_201_CREATED,
             response_description="Cancha registrada",
             responses={
                 400: {"description": "Datos invalidos"},
                 401: {"description": "Token ausente o invalido"},
                 403: {"description": "El usuario no tiene rol de administrador"},
             })
def crear_cancha(datos: CanchaCreate,
                 db: Session = Depends(get_db),
                 usuario=Depends(validar_token_y_rol)):
    """
    POST /canchas
    Registra una nueva cancha y genera sus franjas horarias.
    """
    service = CanchaService(db)
    try:
        return service.registrar(usuario["id"], datos)
    except ValidacionException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{cancha_id}",
               response_description="Cancha eliminada",
               responses={
                   401: {"description": "Token ausente o invalido"},
                   403: {"description": "El usuario no tiene rol de administrador "
                                        "o la cancha no le pertenece"},
                   404: {"description": "La cancha no existe"},
                   409: {"description": "La cancha tiene reservas activas"},
               })
def eliminar_cancha(cancha_id: int,
                    db: Session = Depends(get_db),
                    usuario=Depends(validar_token_y_rol)):
    """
    DELETE /canchas/{id}
    Elimina logicamente la cancha (activa = false).
    No se puede eliminar si tiene reservas activas.

    Devuelve 404 si la cancha no existe y 403 si existe pero
    pertenece a otro administrador.
    """
    service = CanchaService(db)
    try:
        service.eliminar(cancha_id, usuario["id"])
        return {"mensaje": "Cancha eliminada correctamente"}
    except RecursoNoEncontradoException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except AccesoDenegadoException as e:
        raise HTTPException(status_code=403, detail=str(e))
    except IntegridadException as e:
        raise HTTPException(status_code=409, detail=str(e))