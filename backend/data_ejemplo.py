from datetime import time
from app.database import SessionLocal
from app.models.cancha import Cancha

db = SessionLocal()

cancha = Cancha(
    nombre="Cancha El Estadio",
    tipo="futbol5",
    precio_hora=25.00,
    hora_apertura=time(8, 0),
    hora_cierre=time(22, 0),
    activa=True
)

db.add(cancha)
db.commit()
db.close()

print("Cancha de prueba insertada")
