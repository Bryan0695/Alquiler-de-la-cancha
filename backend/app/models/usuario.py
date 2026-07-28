"""
Modelo: Usuario
Del diagrama de clases. Representa a jugadores y administradores.

Relaciones:
  Rol "1" -- "0..*" Usuario        (un usuario tiene un rol)
  Usuario "1" -- "0..*" Cancha     (administra, solo si es admin)
  Usuario "1" -- "0..*" Reserva    (realiza)
  Usuario "1" -- "0..*" Calificacion (emite)
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Usuario(Base):
    __tablename__ = "usuario"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    correo = Column(String(120), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    telefono = Column(String(20))
    fecha_registro = Column(DateTime, server_default=func.now())
    activo = Column(Boolean, default=True)

    # FK hacia rol (de la relacion Rol -- Usuario)
    rol_id = Column(Integer, ForeignKey("rol.id"))

    
    # --- Relaciones ORM ---
    rol = relationship("Rol", back_populates="usuarios")
    canchas = relationship("Cancha", back_populates="administrador")
    reservas = relationship("Reserva", back_populates="usuario")
    calificaciones = relationship("Calificacion", back_populates="usuario")
    

    # --- Metodos de dominio (del diagrama) ---

    def autenticar(self, correo, password) -> bool:
        # TODO: comparar password con password_hash
        pass

    def encriptar_password(self, password) -> str:
        # TODO: hashear con bcrypt/argon2
        pass

    def es_administrador(self) -> bool:
        # TODO: delegar en el rol -> self.rol.es_administrador()
        pass

    def actualizar_perfil(self, datos) -> None:
        # TODO: actualizar campos permitidos
        pass
