import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

url = os.getenv("DATABASE_URL")
url = url.replace("postgres://", "postgresql://", 1)

engine = create_engine(url)

with engine.connect() as conn:
    result = conn.execute(text("SELECT version()"))
    print("CONECTADO A:")
    print(result.scalar())