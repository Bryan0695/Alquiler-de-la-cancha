import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

url = os.getenv("DATABASE_URL")
url = url.replace("postgres://", "postgresql://", 1)

engine = create_engine(url)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# Entrega una sesión de BD por petición y la cierra al terminar
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()