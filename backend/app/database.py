import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

url = os.getenv("DATABASE_URL", "sqlite:///./canchas.db")
url = url.replace("postgres://", "postgresql://", 1)

# connect_args solo aplica a SQLite
connect_args = {"check_same_thread": False} if url.startswith("sqlite") else {}

engine = create_engine(url, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# Funcion que entrega una sesion de BD por peticion
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()