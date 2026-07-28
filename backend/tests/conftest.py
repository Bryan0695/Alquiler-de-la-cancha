import os

# Usamos SQLite en memoria (incluido en Python, sin psycopg2) para que
# 'app.database' pueda construir el engine sin conectarse a nada real.
# Las pruebas unitarias no tocan la base de datos: simulan el repositorio.
# Forzamos el valor (no setdefault) para ignorar cualquier DATABASE_URL
# de Postgres del .env y no arriesgar la base de produccion.
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
