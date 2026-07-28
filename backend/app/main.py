from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import cancha

app = FastAPI(title="API Canchas")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",              # Angular en local
        # "https://tu-front.onrender.com",    # cuando tu compa despliegue
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cancha.router)


@app.get("/")
def root():
    return {"mensaje": "API Canchas activa"}