from sqlalchemy.orm import Session
from app.models.cancha import Cancha

class CanchaRepository:

    def __init__(self, db: Session):
        self.db = db
    
    def listar_activas(self):
        return self.db.query(Cancha).filter(Cancha.activa == True).all()

    def buscar_por_admin(self, admin_id: int):
        """
        buscar_por_admin() - pasos 7 a 9 del diagrama.
        SELECT cancha WHERE administrador_id = admin_id
        """
        return (
            self.db.query(Cancha)
            .filter(Cancha.administrador_id == admin_id)
            .filter(Cancha.activa == True)
            .all()
        )
    def guardar(self, cancha: Cancha, horarios: list) -> Cancha:
        """
        guardar() - pasos 25 a 28 del diagrama.
        INSERT cancha + horarios en una sola transaccion.
        """
        cancha.horarios = horarios   # el cascade inserta los horarios, SQLAlchemy
        self.db.add(cancha)
        self.db.commit()             # 
        self.db.refresh(cancha)      # 
        return cancha