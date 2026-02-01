#####
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
    CallbackQuery
)
from aiogram.fsm.state import StatesGroup, State
from aiogram.fsm.context import FSMContext
from aiogram.fsm.storage.memory import MemoryStorage

from backend.Telegram_handler.prayer_times import get_by_cor, get_cor_city
from backend.Database.qaza_stats import get_prayer_times, get_all_users, get_prayer_message, get_gif
from backend.Database.database import (
    insert_user,
    update_user,
    is_user_exist,
    insert_prayer_times,
    update_prayer_times,
    add_qaza
)

# ======================
# ENV
# ======================
load_dotenv()
access_token = os.getenv("TELEGRAM_TOKEN")

# ======================
# FSM STATES (ADDED TO FIX GLOBAL VARIABLE BUG)
# ======================
class UserRegistration(StatesGroup):
    waiting_for_name = State()
    waiting_for_city = State()

# ======================
# DISPATCHER (ADDED MemoryStorage FOR FSM)
# ======================
dp = Dispatcher(storage=MemoryStorage())

# ======================
# GLOBALS (KEPT EXACTLY AS YOU HAD THEM)
# ======================
sent_today = {}  # prevent duplicates
prayer_scheduler_tasks = {}  # per-user prayer scheduler
pre_prayer_scheduler_tasks = {}  # per-user pre-prayer scheduler
last_warned_prayer = {}


# ======================
# INLINE BUTTONS (10-MIN WARNING) - UNCHANGED
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
        prayer_times = get_prayer_times(user_id)
        tz = ZoneInfo(prayer_times["timezone"])
        now = datetime.now(tz).strftime("%H:%M")
        today = datetime.now(tz).date()

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
                    text=f"🕌 Time for {prayer.capitalize()}\n{get_prayer_message(prayer)}\n({time_str})",
                )
                sent_today[user_id][prayer] = today
        await asyncio.sleep(30)

def start_prayer_scheduler(bot: Bot, user_id: int):
    if user_id in prayer_scheduler_tasks:
        return
    task = asyncio.create_task(prayer_scheduler(bot, user_id))
    prayer_scheduler_tasks[user_id] = task


# ======================
# MESSAGE DELETER
# ======================
async def delete_message_after(bot: Bot, chat_id: int, message_id: int, seconds: int):
    """Delete a message after specified seconds"""
    await asyncio.sleep(seconds)
    try:
        await bot.delete_message(chat_id=chat_id, message_id=message_id)
    except Exception as e:
        # Message might already be deleted or user deleted it
        logging.error(f"Failed to delete message {message_id}: {e}")
        
# ======================
# PRE-PRAYER REMINDER (10 MIN)
# ======================
async def pre_prayer_scheduler(bot: Bot, user_id: int):
    sent_pre = set()
    while True:
        prayer_times = get_prayer_times(user_id)
        tz = ZoneInfo(prayer_times["timezone"])
        now = datetime.now(tz)

        prayers = []
        for prayer, time_str in prayer_times.items():
            if prayer in ("timezone", "isha"):
                continue
            dt = datetime.strptime(time_str, "%H:%M").replace(
                year=now.year, month=now.month, day=now.day, tzinfo=tz
            )
            prayers.append((prayer, dt))
        prayers.sort(key=lambda x: x[1])

        # Sunrise is the deadline for Fajr
        # Asr is the deadline for Dhuhr
        # Maghrib is the deadline for Asr
        deadline_to_prayer = {
            "Sunrise": "Fajr",
            "Dhuhr": None,
            "Asr": "Dhuhr",
            "Maghrib": "Asr",
        }

        for prayer, dt in prayers:
            target_prayer = deadline_to_prayer.get(prayer)

            if target_prayer is None:
                continue

            reminder_dt = dt - timedelta(minutes=10)
            key = (target_prayer, reminder_dt.date())

            if reminder_dt <= now < reminder_dt + timedelta(minutes=1):
                if key not in sent_pre:
                    sent_message = await bot.send_animation(
                        chat_id=user_id,
                        animation=get_gif(type='judging'),
                        caption=f"⚠️ {target_prayer.capitalize()} prayer will be MISSED in 10 minutes.\nHave you prayed it already?",
                        reply_markup=prayed_keyboard
                    )
                    sent_pre.add(key)

                    last_warned_prayer[user_id] = target_prayer

                    asyncio.create_task(
                        delete_message_after(bot, user_id, sent_message.message_id, 10)
                    )

        await asyncio.sleep(20)

def start_pre_prayer_scheduler(bot: Bot, user_id: int):
    if user_id in pre_prayer_scheduler_tasks:
        return
    task = asyncio.create_task(pre_prayer_scheduler(bot, user_id))
    pre_prayer_scheduler_tasks[user_id] = task

# ======================
# DAILY PRAYER TIMES UPDATER - UNCHANGED
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
        await asyncio.sleep(86400)  # 24 hours

# ======================
# COMMAND /START - FIXED TO USE FSM
# ======================
@dp.message(CommandStart())
async def command_start(message: Message, state: FSMContext):
    await state.set_state(UserRegistration.waiting_for_name)
    await message.answer(
        f"Hello, {html.bold(message.from_user.full_name)} 👋\nWhat is your name?"
    )

# ======================
# ENTER CITY MANUALLY CLICK - FIXED TO USE FSM
# ======================
@dp.message(F.text == "🏙️ Enter City Manually")
async def manual_city(message: Message, state: FSMContext):
    await state.set_state(UserRegistration.waiting_for_city)
    await message.answer(
        "Okay! Please type your city name (e.g., Seoul, Busan, Osh):",
        reply_markup=ReplyKeyboardRemove()
    )

# ======================
# HANDLE LOCATION - FIXED TO USE FSM
# ======================
@dp.message(F.location)
async def handle_location(message: Message, state: FSMContext):
    data = await state.get_data()
    user_name = data.get("user_name")
    user_id = message.from_user.id
    
    lat = message.location.latitude
    lon = message.location.longitude
    prayer_times = get_by_cor(lat=lat, lon=lon)

    if not is_user_exist(user_id) and user_name:
        insert_user(id=user_id, name=user_name, lat=lat, lon=lon)
        insert_prayer_times(
            user_id,
            prayer_times["Fajr"],
            prayer_times["Sunrise"],
            prayer_times["Dhuhr"],
            prayer_times["Asr"],
            prayer_times["Maghrib"],
            prayer_times["Isha"],
        )
    else:
        update_user(id=user_id, name=user_name, lat=lat, lon=lon)
        update_prayer_times(
            user_id,
            prayer_times["Fajr"],
            prayer_times["Sunrise"],
            prayer_times["Dhuhr"],
            prayer_times["Asr"],
            prayer_times["Maghrib"],
            prayer_times["Isha"],
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

    # start schedulers
    start_prayer_scheduler(message.bot, user_id)
    start_pre_prayer_scheduler(message.bot, user_id)
    
    await state.clear()

# ======================
# HANDLE TEXT (NAME OR CITY) - FIXED TO USE FSM
# ======================
@dp.message(F.text)
async def handle_text(message: Message, state: FSMContext):
    current_state = await state.get_state()
    
    if message.text == "🏙️ Enter City Manually":
        return

    # STEP 1: Get name
    if current_state == UserRegistration.waiting_for_name:
        user_name = message.text.strip()
        await state.update_data(user_name=user_name)
        
        keyboard = ReplyKeyboardMarkup(
            keyboard=[
                [KeyboardButton(text="📍 Send Location", request_location=True)],
                [KeyboardButton(text="🏙️ Enter City Manually")],
            ],
            resize_keyboard=True,
        )
        await message.answer(
            f"Nice to meet you, {user_name} 😊\nChoose an option:",
            reply_markup=keyboard
        )
        return

    # STEP 2: Handle manual city input
    if current_state == UserRegistration.waiting_for_city:
        data = await state.get_data()
        user_name = data.get("user_name")
        user_id = message.from_user.id
        
        city = message.text.strip()
        cors = get_cor_city(city.capitalize())
        if cors is None:
            await message.answer("Oops — city not found. Try again 😊")
            return

        prayer_times = get_by_cor(float(cors[0]), float(cors[1]))

        if not is_user_exist(user_id) and user_name:
            insert_user(id=user_id, name=user_name, lat=float(cors[0]), lon=float(cors[1]))
            insert_prayer_times(
                user_id,
                prayer_times["Fajr"],
                prayer_times["Sunrise"],
                prayer_times["Dhuhr"],
                prayer_times["Asr"],
                prayer_times["Maghrib"],
                prayer_times["Isha"],
            )
        else:
            update_user(id=user_id, name=user_name, lat=float(cors[0]), lon=float(cors[1]))
            update_prayer_times(
                user_id,
                prayer_times["Fajr"],
                prayer_times["Sunrise"],
                prayer_times["Dhuhr"],
                prayer_times["Asr"],
                prayer_times["Maghrib"],
                prayer_times["Isha"],
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

        # start schedulers
        start_prayer_scheduler(message.bot, user_id)
        start_pre_prayer_scheduler(message.bot, user_id)
        
        await state.clear()
        return


# ======================
# CALLBACK HANDLERS - UNCHANGED
# ======================


@dp.callback_query(F.data == "prayed_yes")
async def handle_prayed_yes(query: CallbackQuery):
    sent_message = await query.bot.send_animation(
        chat_id=query.from_user.id,       
        animation=get_gif(type='yes')       
    )
    await query.answer() 
    
    
    asyncio.create_task(
        delete_message_after(query.bot, query.from_user.id, sent_message.message_id, 10)
    )             

@dp.callback_query(F.data == "prayed_no")
async def handle_prayed_no(query: CallbackQuery):
    user_id = query.from_user.id
    
    
    prayer_name = last_warned_prayer.get(user_id, "unknown")
    
    if prayer_name != "unknown":
        add_qaza(prayer_name, user_id)
    
    if user_id in last_warned_prayer:
        del last_warned_prayer[user_id]
    
    sent_message = await query.bot.send_animation(
        chat_id=user_id,
        animation=get_gif(type='no')
    )
    await query.answer()
    
    asyncio.create_task(
        delete_message_after(query.bot, user_id, sent_message.message_id, 10)
    )
    
    
    

    
# ======================
# MAIN - UNCHANGED
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