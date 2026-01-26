from fastapi import APIRouter, HTTPException
from backend.Database.qaza_stats import get_total_qazas, get_prayers_stats,get_user_info,qazas_rating,get_weekly_activity, get_profile_quote

router = APIRouter()

@router.get("/total/{userId}")
def total_qazas(userId: int):
    try:
        total = get_total_qazas(userId)
        return {"total_qazas": total}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get('/breakdown/{userId}')
def get_qazas_stats(userId:int):
    try:
        stats=qazas_rating(userId)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/stats/{userId}")
def get_stats(userId: int):
    try:
        stats=get_prayers_stats (userId)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    

    
    

@router.get('/user_info/{userId}')
def get_user(userId: int):
    try:
        info=get_user_info(userId)
        return info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


    
    
@router.get("/activity/weekly/{userId}")
def get_weekly_stats(userId: int):
    try:
        weekly=get_weekly_activity(userId)
        return weekly
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
@router.get("/quotes")
def get_quotes():
    try:
        quote=get_profile_quotes()
        return quote
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))