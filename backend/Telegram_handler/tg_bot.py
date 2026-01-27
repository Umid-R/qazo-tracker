import sys
import os
import asyncio
import logging
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from dotenv import load_dotenv

from aiogram import Bot, Dispatcher, F, html
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import CommandStart
from aiogram.types import (
    Message,
    KeyboardButton,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
    MenuButtonWebApp,
    WebAppInfo,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
)

from backend.Telegram_handler.prayer_times import get_by_cor, get_cor_city
from backend.Database.qaza_stats import get_prayer_times, get_all_users
from backend.Database.database import (
    insert_user,
    update_user,
    is_user_exist,
    insert_prayer_times,
    update_prayer_times,
)

# ======================
# ENV
# ======================
load_dotenv()
access_token = os.getenv("TELEGRAM_TOKEN")

# ======================
# DISPATCHER
# ======================
dp = Dispatcher()

# ======================
# GLOBALS
# ======================
sent_today = {}  # for prayer duplicates
scheduler_tasks = {}  # {user_id: {'prayer': task, 'pre': task}}
user_name = None
waiting_for_city = False
user_id = None

# ======================
# INLINE BUTTONS (10-MIN WARNING)
# ======================
prayed_keyboard = InlineKeyboardMarkup(
    inline_keyboard=[
        [
            InlineKeyboardButton(text="✅", callback_data="prayed_yes"),
            InlineKeyboardButton(text="❌", callback_data="prayed_no"),
        ]
    ]
)

# ======================
# PRAYER SCHEDULER
# ======================
async def prayer_scheduler(bot: Bot, user_id: int):
    while True:
        now = datetime.now().strftime("%H:%M")
        today = datetime.now().date()

        prayer_times = get_prayer_times(user_id)
        if user_id not in sent_today:
            sent_today[user_id] = {}

        for prayer, time_str in prayer_times.items():
            if prayer == "timezone":
                continue
            if now == time_str:
                if sent_today[user_id].get(prayer) == today:
                    continue
                await bot.send_message(
                    chat_id=user_id,
                    text=f"🕌 Time for {prayer.capitalize()} prayer\n({time_str})",
                )
                sent_today[user_id][prayer] = today

        await asyncio.sleep(30)


def start_prayer_scheduler(bot: Bot, user_id: int):
    if user_id not in scheduler_tasks:
        scheduler_tasks[user_id] = {}

    if "prayer" not in scheduler_tasks[user_id]:
        task = asyncio.create_task(prayer_scheduler(bot, user_id))
        scheduler_tasks[user_id]["prayer"] = task


# ======================
# PRE-PRAYER REMINDER (10 MIN)
# ======================
async def pre_prayer_scheduler(bot: Bot, user_id: int):
    sent_pre = set()
    while True:
        prayer_times = get_prayer_times(user_id)
        tz_name = prayer_times.get("timezone", "Asia/Seoul")
        tz = ZoneInfo(tz_name)
        now = datetime.now(tz)

        prayers = []
        for prayer, time_str in prayer_times.items():
            if prayer == "timezone":
                continue
            dt = datetime.strptime(time_str, "%H:%M").replace(
                year=now.year,
                month=now.month,
                day=now.day,
                tzinfo=tz,
            )
            prayers.append((prayer, dt))
        prayers.sort(key=lambda x: x[1])

        future = [(p, dt) for p, dt in prayers if dt > now]
        if not future:
            prayers = [(p, dt + timedelta(days=1)) for p, dt in prayers]
            prayers.sort(key=lambda x: x[1])
            future = prayers

        next_prayer, next_dt = future[0]
        idx = prayers.index((next_prayer, next_dt))
        current_prayer, current_dt = prayers[idx - 1]

        reminder_dt = next_dt - timedelta(minutes=10)
        key = (current_prayer, reminder_dt.date())

        if reminder_dt <= now < reminder_dt + timedelta(minutes=1):
            if key not in sent_pre:
                await bot.send_message(
                    user_id,
                    f"⚠️ {current_prayer.capitalize()} prayer will be MISSED in 10 minutes.\nHave you prayed it already?",
                    reply_markup=prayed_keyboard,
                )
                sent_pre.add(key)

        await asyncio.sleep(20)


def start_pre_prayer_scheduler(bot: Bot, user_id: int):
    if user_id not in scheduler_tasks:
        scheduler_tasks[user_id] = {}

    if "pre" not in scheduler_tasks[user_id]:
        task = asyncio.create_task(pre_prayer_scheduler(bot, user_id))
        scheduler_tasks[user_id]["pre"] = task


# ======================
# DAILY UPDATE
# ======================
async def daily_prayer_times_updater():
    while True:
        users = get_all_users()
        for user in users:
            prayer_times = get_by_cor(user["lat"], user["lon"])
            update_prayer_times(
                user["id"],
                prayer_times["Fajr"],
                prayer_times["Sunrise"],
                prayer_times["Dhuhr"],
                prayer_times["Asr"],
                prayer_times["Maghrib"],
                prayer_times["Isha"],
            )
        await asyncio.sleep(86400)


# ======================
# START
# ======================
@dp.message(CommandStart())
async def command_start(message: Message):
    global user_name, waiting_for_city, user_id
    user_name = None
    waiting_for_city = False
    user_id = message.from_user.id
    await message.answer(
        f"Hello, {html.bold(message.from_user.full_name)} 👋\nWhat is your name?"
    )


# ======================
# ENTER CITY MANUALLY CLICK
# ======================
@dp.message(F.text == "🏙️ Enter City Manually")
async def manual_city(message: Message):
    global waiting_for_city
    waiting_for_city = True
    await message.answer(
        "Okay! Please type your city name (e.g., Seoul, Busan, Osh):",
        reply_markup=ReplyKeyboardRemove()
    )


# ======================
# HANDLE LOCATION
# ======================
@dp.message(F.location)
async def handle_location(message: Message):
    global user_name, user_id
    lat = message.location.latitude
    lon = message.location.longitude
    prayer_times = get_by_cor(lat=lat, lon=lon)

    if not is_user_exist(user_id) and user_name:
        insert_user(id=user_id, name=user_name, lat=lat, lon=lon)
        insert_prayer_times(
            user_id,
            prayer_times['Fajr'],
            prayer_times['Sunrise'],
            prayer_times['Dhuhr'],
            prayer_times['Asr'],
            prayer_times['Maghrib'],
            prayer_times['Isha']
        )
    else:
        update_user(id=user_id, name=user_name, lat=lat, lon=lon)
        update_prayer_times(
            user_id,
            prayer_times['Fajr'],
            prayer_times['Sunrise'],
            prayer_times['Dhuhr'],
            prayer_times['Asr'],
            prayer_times['Maghrib'],
            prayer_times['Isha']
        )

    await message.answer(
        f"Here are the prayer times for your location 🕌\n"
        f"Fajr:{prayer_times['Fajr']}\n"
        f"Sunrise:{prayer_times['Sunrise']}\n"
        f"Dhuhr:{prayer_times['Dhuhr']}\n"
        f"Asr:{prayer_times['Asr']}\n"
        f"Maghrib:{prayer_times['Maghrib']}\n"
        f"Isha:{prayer_times['Isha']}",
        reply_markup=ReplyKeyboardRemove()
    )

    start_prayer_scheduler(message.bot, user_id)
    start_pre_prayer_scheduler(message.bot, user_id)


# ======================
# HANDLE TEXT (NAME OR CITY)
# ======================
@dp.message(F.text)
async def handle_text(message: Message):
    global user_name, waiting_for_city, user_id
    if message.text == "🏙️ Enter City Manually":
        return  # handled elsewhere

    # STEP 1: get user name
    if user_name is None:
        user_name = message.text.strip()
        waiting_for_city = False
        keyboard = ReplyKeyboardMarkup(
            keyboard=[
                [KeyboardButton(text="📍 Send Location", request_location=True)],
                [KeyboardButton(text="🏙️ Enter City Manually")],
            ],
            resize_keyboard=True
        )
        await message.answer(
            f"Nice to meet you, {user_name} 😊\nChoose an option:",
            reply_markup=keyboard
        )
        return

    # STEP 2: handle manual city
    if waiting_for_city:
        city = message.text.strip()
        cors = get_cor_city(city.capitalize())
        if cors is None:
            await message.answer("Oops — city not found. Try again 😊")
            waiting_for_city = True
            return

        prayer_times = get_by_cor(float(cors[0]), float(cors[1]))

        if not is_user_exist(user_id) and user_name:
            insert_user(id=user_id, name=user_name, lat=float(cors[0]), lon=float(cors[1]))
            insert_prayer_times(
                user_id,
                prayer_times['Fajr'],
                prayer_times['Sunrise'],
                prayer_times['Dhuhr'],
                prayer_times['Asr'],
                prayer_times['Maghrib'],
                prayer_times['Isha']
            )
        else:
            update_user(id=user_id, name=user_name, lat=float(cors[0]), lon=float(cors[1]))
            update_prayer_times(
                user_id,
                prayer_times['Fajr'],
                prayer_times['Sunrise'],
                prayer_times['Dhuhr'],
                prayer_times['Asr'],
                prayer_times['Maghrib'],
                prayer_times['Isha']
            )

        await message.answer(
            f"Here are the prayer times for your location 🕌\n"
            f"Fajr:{prayer_times['Fajr']}\n"
            f"Sunrise:{prayer_times['Sunrise']}\n"
            f"Dhuhr:{prayer_times['Dhuhr']}\n"
            f"Asr:{prayer_times['Asr']}\n"
            f"Maghrib:{prayer_times['Maghrib']}\n"
            f"Isha:{prayer_times['Isha']}",
            reply_markup=ReplyKeyboardRemove()
        )

        waiting_for_city = False
        start_prayer_scheduler(message.bot, user_id)
        start_pre_prayer_scheduler(message.bot, user_id)
        return


# ======================
# MAIN
# ======================
async def main():
    bot = Bot(token=access_token, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    await bot.set_chat_menu_button(
        menu_button=MenuButtonWebApp(
            text="🕌 Qaza Tracker",
            web_app=WebAppInfo(url="https://jsur.vercel.app")
        )
    )
    asyncio.create_task(daily_prayer_times_updater())
    await dp.start_polling(bot, drop_pending_updates=True)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, stream=sys.stdout)
    asyncio.run(main())
