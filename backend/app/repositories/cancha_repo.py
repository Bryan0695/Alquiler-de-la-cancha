from sqlalchemy.orm import Session
from app.models.cancha import Cancha

class CanchaRepository:
    def __init__(self, db: Session):
        self.db = db
    def listar_activas(self):
        return self.db.query(Cancha).filter(Cancha.activa == True).all()