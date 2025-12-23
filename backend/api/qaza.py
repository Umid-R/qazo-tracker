from fastapi import APIRouter, HTTPException
from backend.Database.qaza_stats import get_total_qazas, get_today_prayed_qazas,get_user_info,qazas_rating

router = APIRouter()

@router.get('/user_info/{userId}')
def get_user(userId: int):
    try:
        info=get_user_info(userId)
        return info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/total/{userId}")
def total_qazas(userId: int):
    try:
        total = get_total_qazas(userId)
        return {"total_qazas": total}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
@router.get("/today_prayed/{userId}")
def today_prayed(userId: int):
    try:
        total=get_today_prayed_qazas(userId)
        return {"today_prayed": total}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
@router.get('/breakdown/{userId}')
def get_qazas_stats(userId:int):
    try:
        stats=qazas_rating(userId)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    