from fastapi import FastAPI
from app.routers import cancha

app = FastAPI(title="API Canchas")

app.include_router(cancha.router)

@app.get("/")
def root():
    return {"mensaje": "hola mundo"}