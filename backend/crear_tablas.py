from app.database import Base, engine
from app.models.cancha import Cancha

Base.metadata.create_all(engine)
print("Tablas creadas")