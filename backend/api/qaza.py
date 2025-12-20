from fastapi import APIRouter, HTTPException
from backend.Database.qaza_stats import get_total_qazas

router = APIRouter()

@router.get("/total/{user_id}")
def total_qazas(user_id: int):
    try:
        total = get_total_qazas(user_id)
        return {"total_qazas": total}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))