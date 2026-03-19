from fastapi import FastAPI
from app.api.routes import router

app = FastAPI(title="Risk Engine ML Service")

app.include_router(router)


@app.get("/")
def root():
    return {"message": "ML Risk Engine is running 🚀"}
