from datetime import time
from decimal import Decimal
from pydantic import BaseModel, Field


class CanchaListResponse(BaseModel):
    """Campos que necesita la pantalla de listado."""
    id: int
    nombre: str
    tipo: str | None
    precio_hora: Decimal | None
    activa: bool

    model_config = {"from_attributes": True}


class CanchaDetalleResponse(BaseModel):
    """Todos los campos, para el detalle de una cancha."""
    id: int
    nombre: str
    tipo: str | None
    precio_hora: Decimal | None
    hora_apertura: time | None
    hora_cierre: time | None
    promedio_calificacion: Decimal | None
    activa: bool

    model_config = {"from_attributes": True}

class CanchaCreate(BaseModel):
    """Lo que ENTRA en el POST /canchas (el body JSON del paso 15)."""
    nombre: str = Field(min_length=1, max_length=100)
    tipo: str
    precio_hora: Decimal = Field(gt=0)
    hora_apertura: time
    hora_cierre: time