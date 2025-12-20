from fastapi import FastAPI
from backend.api.qaza import router as qaza_router

app = FastAPI(title="Qaza Tracker API")

# register routes
app.include_router(qaza_router, prefix="/qaza", tags=["Qaza"])




@app.get("/")
def root():
    return {"status": "Qaza API running"}

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # React dev
        "http://localhost:5173",   # Vite
        "https://your-frontend.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)