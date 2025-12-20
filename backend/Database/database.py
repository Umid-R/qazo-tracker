from supabase import create_client, Client
from dotenv import load_dotenv
import os
from pathlib import Path
load_dotenv()


url=os.getenv("SUPABASE_URL")
key= os.getenv("SUPABASE_KEY")
 



Client = create_client(url, key)


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
    response = (
    Client.table("prayer_times")
    .insert({"user_id":user_id,"fajr":fajr,"sunrise":sunrise,"dhuhr":dhuhr,"asr":asr,"maghrib":maghrib,"isha":isha})
    .execute()) 
    if not response.data:
        print("Error inserting user:", response.json())
        return None
    else:
        print("Success-Inserted user:", response.data)
        return 1
 
def update_prayer_times(user_id,fajr,sunrise,dhuhr,asr,maghrib,isha):
    response = (
    Client.table("prayer_times")
    .update({"fajr":fajr,"sunrise":sunrise,"dhuhr":dhuhr,"asr":asr,"maghrib":maghrib,"isha":isha})
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




    
    


 