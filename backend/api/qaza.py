from fastapi import APIRouter, HTTPException
from backend.Database.qaza_stats import get_total_qazas, get_today_prayed_qazas,get_user_info,qazas_rating

router = APIRouter()

@router.get('/user_info/{user_id}')
def get_user(user_id: int):
    try:
        info=get_user_info(user_id)
        return info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/total/{user_id}")
def total_qazas(user_id: int):
    try:
        total = get_total_qazas(user_id)
        return {"total_qazas": total}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
@router.get("/today_prayed/{user_id}")
def today_prayed(user_id: int):
    try:
        total=get_today_prayed_qazas(user_id)
        return {"today_prayed": total}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
@router.get('qazas_stats/{user_id}')
def get_qazas_stats(user_id:int):
    try:
        stats=qazas_rating(user_id)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    