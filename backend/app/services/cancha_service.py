from app.repositories.cancha_repo import CanchaRepository

class CanchaService:
    def __init__(self, db):
        self.repo = CanchaRepository(db)
    def listar(self):
        # aqui irian reglas de negocio si las hubiera
        return self.repo.listar_activas()
