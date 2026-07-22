from fastapi import FastAPI

app = FastAPI(title="API Canchas")

@app.get("/")
def root():
    return {"mensaje": "hola mundo"}