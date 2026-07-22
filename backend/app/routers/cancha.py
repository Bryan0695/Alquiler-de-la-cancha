from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.cancha_service import CanchaService
router = APIRouter(prefix="/canchas", tags=["Canchas"])

@router.get("/")
def listar_canchas(db: Session = Depends(get_db)):
    service = CanchaService(db)
    return service.listar()