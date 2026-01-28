from supabase import create_client, Client
from dotenv import load_dotenv
import os
from timezonefinder import TimezoneFinder
from datetime import datetime, timezone
load_dotenv()


url=os.getenv("SUPABASE_URL")
key= os.getenv("SUPABASE_KEY")
 



Client = create_client(url, key)

tf = TimezoneFinder()

def get_timezone_from_latlon(lat: float, lon: float) -> str | None:
    return tf.timezone_at(lat=lat, lng=lon)

def insert_user(id,name,lat,lon):
    response = (
    Client.table("users")
    .insert({'id':id,'name':name,'lat':lat,'lon':lon})
    .execute())
    
    
    if not response.data:
        print("Error inserting user:", response.json())
        return None
    else:
        print("Success-Inserted user:", response.data)
        return 1
  
def insert_prayer_times(user_id,fajr,sunrise,dhuhr,asr,maghrib,isha):
    response_user = (
    Client.table("users")
    .select('lat','lon')
    .eq('id',user_id)
    .execute())
    
    timezone=get_timezone_from_latlon(response_user.data[0]['lat'],response_user.data[0]['lon'])
    print(timezone)
    
    response = (
    Client.table("prayer_times")
    .insert({"user_id":user_id,"fajr":fajr,"sunrise":sunrise,"dhuhr":dhuhr,"asr":asr,"maghrib":maghrib,"isha":isha,'timezone':timezone})
    .execute()) 
    if not response.data:
        print("Error inserting user:", response.json())
        return None
    else:
        print("Success-Inserted user:", response.data)
        return 1
 
def update_prayer_times(user_id,fajr,sunrise,dhuhr,asr,maghrib,isha):
    response_user = (
    Client.table("users")
    .select('lat','lon')
    .eq('id',user_id)
    .execute())
    
    timezone=get_timezone_from_latlon(response_user.data[0]['lat'],response_user.data[0]['lon'])
    print(timezone)
    
    
    response = (
    Client.table("prayer_times")
    .update({"fajr":fajr,"sunrise":sunrise,"dhuhr":dhuhr,"asr":asr,"maghrib":maghrib,"isha":isha,'timezone':timezone})
    .eq("user_id", user_id)
    .execute())
    return bool(response.data)

def update_user(id,name,lat,lon):
    response = (
    Client.table("users")
    .update({'name':name,'lat':lat,'lon':lon})
    .eq("id", id)
    .execute())
    return bool(response.data)
    
    
def is_user_exist(id):
    response = (
        Client.table("users")
        .select("id")
        .eq("id", id)  
        .execute()
    )
    if response.data:
        return True
    return False

def add_qaza(prayer, user_id, reason=None):
    response = Client.table('qazas').insert({
        'user_id': user_id,
        'prayer': prayer,
        'reason': reason
    }).execute()
    
    
    
    return 1

def update_qaza(prayer, user_id):
    
    response = (
        Client.table('qazas')
        .select('id')
        .eq('user_id', user_id)
        .eq('prayer', prayer)
        .order('time_created', desc=True)
        .limit(1)
        .execute()
    )

    if not response.data:
        return 0  

    prayer_id = response.data[0]['id']

    
    response = (
        Client.table('qazas')
        .update({
            'is_qaza': False,
            'time_prayed': 'now()'
        })
        .eq('id', prayer_id)
        .execute()
    )

    return 1
# add_qaza('fajr',1207972222,'sleep')
# update_qaza('fajr',1207972222)






    
    


 