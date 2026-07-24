import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Cargar las variables del archivo .env
load_dotenv()

def test_conexion_db():
    url = os.getenv("DATABASE_URL")
    
    # Validación para evitar el crash de 'NoneType'
    assert url is not None, "Error: DATABASE_URL no está definida en el archivo .env"

    # Corregir prefijo si es necesario
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    # Probar la conexión
    engine = create_engine(url)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version()"))
        version = result.scalar()
        print("\n Conexión exitosa a:", version)
        assert version is not None