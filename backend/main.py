# backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.qaza import router as qaza_router

app = FastAPI(title="Qaza Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://jsur.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(qaza_router, prefix="/qaza", tags=["Qaza"])

@app.get("/")
def root():
    return {"status": "Qaza API running"}
