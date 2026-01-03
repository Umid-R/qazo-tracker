from supabase import create_client, Client
from dotenv import load_dotenv
import os
from pathlib import Path
from datetime import  datetime, timedelta, time, date


load_dotenv()


url=os.getenv("SUPABASE_URL")
key= os.getenv("SUPABASE_KEY")


Client = create_client(url, key)

def get_user_info(user_id: int):
    res = (
        Client
        .table("users")
        .select("id,name,lat,lon,joined,daily_goal", )
        .eq("id", user_id)
        .execute()
    )
    return res.data[0]
#print(get_user_info(1207972222))

def get_total_qazas(user_id):
    res = (
        Client
        .table("qazas")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .eq("is_qaza", True)
        .execute()
    )

    return res.count

#print(get_total_qazas(1207972222))


def qazas_rating(user_id):
    res = (
        Client
        .table("qaza_counts")
        .select("prayer, counts")
        .eq("user_id", user_id)
        .execute()
    )

    # Initialize all prayers with 0
    breakdown = {
        "fajr": 0,
        "dhuhr": 0,
        "asr": 0,
        "maghrib": 0,
        "isha": 0
    }

    # Overwrite only existing prayers
    if res.data:
        for row in res.data:
            breakdown[row["prayer"]] = row["counts"]

    return breakdown

# print((qazas_rating(1207972222)))


    

def get_prayers_stats(user_id: int):
    
    stats={}

    today = date.today()
    start = datetime.combine(today, time.min)
    end = datetime.combine(today, time.max)
    res = (
        Client
        .table("qazas")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .eq("is_qaza", False)  
        .gte("time_prayed", start.isoformat())
        .lte("time_prayed", end.isoformat())
        .execute())
    stats['completed_today']=res.count
    
    
    res = (
        Client
        .table("users")
        .select("daily_goal", count="exact")
        .eq("id", user_id)
        .execute())
    stats['daily_goal']=res.data[0]['daily_goal']
    
    
    today = date.today()
    start = datetime.combine(today - timedelta(days=6), time.min)
    end = datetime.combine(today, time.max)
    res = (
    Client
    .table("qazas")
    .select("id", count="exact")
    .eq("user_id", user_id)
    .eq("is_qaza", False)
    .gte("time_prayed", start.isoformat())
    .lte("time_prayed", end.isoformat())
    .execute())   
    stats["cleared_this_week"] = res.count
    
    
    res = (
    Client
    .table("qazas")
    .select("id", count="exact")
    .eq("user_id", user_id)
    .execute())
    stats["total_prayers_logged"] = res.count
    
    
    res = (
        Client
        .table("qazas")
        .select("time_prayed")
        .eq("user_id", user_id)
        .eq("is_qaza", False)
        .execute()
    )

    prayed_dates = {
        row["time_prayed"][:10]
        for row in res.data
        if row["time_prayed"]
    }

    streak = 0
    current_day = date.today()

    while current_day.isoformat() in prayed_dates:
        streak += 1
        current_day -= timedelta(days=1)
    
    stats['current_streak']=streak
    
    return stats

    

#print(get_prayers_stats(1207972222))


def get_weekly_activity(user_id: int):
    today = date.today()
    start_date = today - timedelta(days=6)

    res = (
        Client
        .table("qazas")
        .select("time_prayed")
        .eq("user_id", user_id)
        .eq("is_qaza", False)
        .gte("time_prayed", start_date.isoformat())
        .execute()
    )

    prayed_dates = {
        row["time_prayed"][:10]
        for row in res.data
        if row["time_prayed"]
    }

    days_map = ["M", "T", "W", "T", "F", "S", "S"]

    result = []
    for i in range(7):
        day = today - timedelta(days=6 - i)
        result.append({
            "day": days_map[day.weekday()],
            "active": day.isoformat() in prayed_dates
        })

    return result
# print(get_weekly_activity(1207972222))





