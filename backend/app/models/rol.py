"""
Modelo: Rol
Del diagrama de clases. Un rol clasifica a los usuarios
(JUGADOR o ADMINISTRADOR) y determina sus permisos.

Relacion: Rol "1" -- "0..*" Usuario (clasifica)
"""
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class Rol(Base):
    __tablename__ = "rol"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(20), nullable=False, unique=True)
    descripcion = Column(String(200))

    # --- Relaciones ORM ---
    # Un rol puede estar en muchos usuarios
    usuarios = relationship("Usuario", back_populates="rol")

    # --- Metodos de dominio (del diagrama) ---

    def es_administrador(self) -> bool:
        # TODO: implementar
        # return self.nombre == "ADMINISTRADOR"
        pass

    def tiene_permiso(self, accion) -> bool:
        # TODO: implementar logica de permisos por accion
        pass
