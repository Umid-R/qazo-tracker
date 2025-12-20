from supabase import create_client, Client
from dotenv import load_dotenv
import os
from pathlib import Path
from datetime import date, datetime, time


load_dotenv()


url=os.getenv("SUPABASE_URL")
key= os.getenv("SUPABASE_KEY")


Client = create_client(url, key)

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

print(get_total_qazas(1207972222))



def get_today_prayed_qazas(user_id: int):
    today = date.today()

    start = datetime.combine(today, time.min)
    end = datetime.combine(today, time.max)

    res = (
        Client
        .table("qazas")
        .select("id", count="exact")
        .eq("id", user_id)
        .eq("is_qaza", False)  
        .gte("time_prayed", start.isoformat())
        .lte("time_prayed", end.isoformat())
        .execute()
    )

    return res.count

# print(get_today_prayed_qazas(1207972222))


def member_since(user_id):
    res = (
        Client
        .table("users")
        .select("joined")
        .eq('id',user_id)
        .execute()
    )

    return res.data[0]['joined']

# print((member_since(1207972222)))


def qazas_rating(user_id):
    res = (
        Client
        .table("qaza_counts")
        .select("prayer, counts")
        .eq("user_id", user_id)
        .order("counts", desc=True)
        .execute()
    )

    if not res.data:
        return None

    return res.data

# print((qazas_rating(1207972222)))