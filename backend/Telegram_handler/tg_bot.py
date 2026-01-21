

import sys
import os
import asyncio
import logging
import sys
from aiogram import Bot, Dispatcher, F, html
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import CommandStart
from aiogram.types import  Message, KeyboardButton, ReplyKeyboardMarkup, ReplyKeyboardRemove
from Telegram_handler.prayer_times import get_by_cor, get_cor_city
from dotenv import load_dotenv
from aiogram.types import MenuButtonWebApp, WebAppInfo
from pathlib import Path



load_dotenv()




from backend.Database.database import  insert_user, update_user, is_user_exist, insert_prayer_times, update_prayer_times



access_token=os.getenv("TELEGRAM_TOKEN")

dp = Dispatcher()



# -------- START --------
@dp.message(CommandStart())
async def command_start(message: Message):
    global user_name, waiting_for_city,user_id
    user_name = None
    waiting_for_city = False
    user_id=message.from_user.id
    
    await message.answer(
        f"Hello, {html.bold(message.from_user.full_name)} 👋\nWhat is your name?"
    )


# -------- USER CLICKS "ENTER CITY MANUALLY" --------
@dp.message(F.text == "🏙️ Enter City Manually")
async def manual_city(message: Message):
    global waiting_for_city
    waiting_for_city = True

    await message.answer(
        "Okay! Please type your city name (e.g., Seoul, Busan, Osh):",
        reply_markup=ReplyKeyboardRemove()
    )


# -------- USER SENDS LOCATION (MOBILE) --------
@dp.message(F.location)
async def handle_location(message: Message):
    lat = message.location.latitude
    lon = message.location.longitude
    prayer_times=get_by_cor(lat=lat,lon=lon)
    if not is_user_exist(user_id) and user_name!=None and lat!=None and lon!=None:
        insert_user(id=user_id,name=user_name,lat=lat,lon=lon)
        insert_prayer_times(user_id,prayer_times['Fajr'],prayer_times['Sunrise'],prayer_times['Dhuhr'],prayer_times['Asr'],prayer_times['Maghrib'],prayer_times['Isha'])
    else:
        update_user(id=user_id,name=user_name,lat=lat,lon=lon)
        update_prayer_times(user_id,prayer_times['Fajr'],prayer_times['Sunrise'],prayer_times['Dhuhr'],prayer_times['Asr'],prayer_times['Maghrib'],prayer_times['Isha'])
    await message.answer(
        f"Here are the prayer times for your location 🕌\nFajr:{prayer_times['Fajr']}\nSunrise:{prayer_times['Sunrise']}\nDhuhr:{prayer_times['Dhuhr']}\nAsr:{prayer_times['Asr']}\nMaghrib:{prayer_times['Maghrib']}\nIsha:{prayer_times['Isha']}",
        reply_markup=ReplyKeyboardRemove()
    )


# -------- TEXT HANDLER (NAME OR CITY) --------
@dp.message(F.text)
async def handle_text(message: Message):
    global user_name, waiting_for_city
    if message.text == "🏙️ Enter City Manually":
        return
    # STEP 1 — getting name
    if user_name is None:
        user_name = message.text.strip()
        waiting_for_city = False

        keyboard = ReplyKeyboardMarkup(
            keyboard=[
                [KeyboardButton(text="📍 Send Location", request_location=True)],
                [KeyboardButton(text="🏙️ Enter City Manually")]
            ],
            resize_keyboard=True
        )

        await message.answer(
            f"Nice to meet you, {user_name} 😊\nChoose an option:",
            reply_markup=keyboard
        )
        return

    # STEP 2 — user typed city manually
    if waiting_for_city:
        city = message.text.strip()
        waiting_for_city = False
        cors=get_cor_city(city.capitalize())
        if cors==None:
            await message.answer(
                'Oops — city not found. Try again 😊'
            )
            return
        prayer_times=get_by_cor(float(cors[0]),float(cors[1]))
        if not is_user_exist(user_id) and user_name!=None and cors[0]!=None and cors[0]!=None:
            insert_user(id=user_id,name=user_name,lat=float(cors[0]),lon=float(cors[1]))
            insert_prayer_times(user_id,prayer_times['Fajr'],prayer_times['Sunrise'],prayer_times['Dhuhr'],prayer_times['Asr'],prayer_times['Maghrib'],prayer_times['Isha'])
        else:
            update_user(id=user_id,name=user_name,lat=float(cors[0]),lon=float(cors[1]))
            update_prayer_times(user_id,prayer_times['Fajr'],prayer_times['Sunrise'],prayer_times['Dhuhr'],prayer_times['Asr'],prayer_times['Maghrib'],prayer_times['Isha'])   
        await message.answer(
            f"Here are the prayer times for your location 🕌\nFajr:{prayer_times['Fajr']}\nSunrise:{prayer_times['Sunrise']}\nDhuhr:{prayer_times['Dhuhr']}\nAsr:{prayer_times['Asr']}\nMaghrib:{prayer_times['Maghrib']}\nIsha:{prayer_times['Isha']}",
            reply_markup=ReplyKeyboardRemove()
        )
        return


async def main():
    bot = Bot(token=access_token, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    
    await bot.set_chat_menu_button(
    menu_button=MenuButtonWebApp(
        text="🕌 Qaza Tracker",
        web_app=WebAppInfo(url="https://jsur.vercel.app")
    )
    )
    
    await dp.start_polling(bot,drop_pending_updates=True)
    


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, stream=sys.stdout)
    asyncio.run(main())


