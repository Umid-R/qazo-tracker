import sys
import os
import asyncio
import logging
from datetime import datetime, timedelta, timezone
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
)

from aiogram.fsm.state import StatesGroup, State
from aiogram.fsm.context import FSMContext
from aiogram.fsm.storage.memory import MemoryStorage

from backend.Telegram_handler.prayer_times import get_by_cor, get_cor_city
from backend.Database.qaza_stats import (
    get_prayer_times,
    get_prayer_message,
    get_all_users,
)
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
# FSM STATES
# ======================
class Onboarding(StatesGroup):
    waiting_for_name = State()
    waiting_for_city = State()

# ======================
# DISPATCHER
# ======================
dp = Dispatcher(storage=MemoryStorage())

# ======================
# GLOBAL TASK REGISTRY
# ======================
prayer_tasks = {}
pre_prayer_tasks = {}

# ======================
# PRAYER TIME MESSAGE
# ======================
async def prayer_scheduler(bot: Bot, user_id: int):
    sent_today = set()

    while True:
        prayer_times = get_prayer_times(user_id)
        tz = ZoneInfo(prayer_times["timezone"])
        now = datetime.now(tz).replace(second=0, microsecond=0)

        for prayer, time_str in prayer_times.items():
            if prayer == "timezone":
                continue

            prayer_dt = datetime.strptime(time_str, "%H:%M").replace(
                year=now.year,
                month=now.month,
                day=now.day,
                tzinfo=tz,
            )

            if prayer_dt == now and prayer not in sent_today:
                msg = get_prayer_message(prayer)
                await bot.send_message(
                    user_id,
                    f"🕌 Time for {prayer.capitalize()} prayer\n{msg}\n({time_str})"
                )
                sent_today.add(prayer)

        if now.hour == 0 and now.minute == 0:
            sent_today.clear()

        await asyncio.sleep(30)

def start_prayer_scheduler(bot, user_id: int):
    if user_id not in prayer_tasks:
        prayer_tasks[user_id] = asyncio.create_task(
            prayer_scheduler(bot, user_id)
        )

# ======================
# PRE-PRAYER REMINDER (10 MIN)
# ======================
async def pre_prayer_scheduler(bot: Bot, user_id: int):
    while True:
        prayer_times = get_prayer_times(user_id)
        tz = ZoneInfo(prayer_times["timezone"])
        now = datetime.now(tz)

        prayer_list = []

        for prayer, time_str in prayer_times.items():
            if prayer == "timezone":
                continue

            dt = datetime.strptime(time_str, "%H:%M").replace(
                year=now.year,
                month=now.month,
                day=now.day,
                tzinfo=tz,
            )
            prayer_list.append((prayer, dt))

        future = [(p, dt) for p, dt in prayer_list if dt > now]
        if not future:
            future = [(p, dt + timedelta(days=1)) for p, dt in prayer_list]

        next_prayer, next_prayer_dt = min(future, key=lambda x: x[1])
        reminder_dt = next_prayer_dt - timedelta(minutes=10)

        logging.info(
            f"[PRE] user={user_id} next={next_prayer} "
            f"reminder={reminder_dt.time()} now={now.time()}"
        )

        # 🔑 WINDOW CHECK (this is what was missing)
        if reminder_dt <= now < reminder_dt + timedelta(minutes=1):
            await bot.send_message(
                user_id,
                f"⏰ {next_prayer.capitalize()} in 10 minutes.\nDid you pray already?"
            )
            await asyncio.sleep(70)
            continue

        await asyncio.sleep(20)

def start_pre_prayer_scheduler(bot, user_id: int):
    if user_id not in pre_prayer_tasks:
        pre_prayer_tasks[user_id] = asyncio.create_task(
            pre_prayer_scheduler(bot, user_id)
        )

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
# START COMMAND
# ======================
@dp.message(CommandStart())
async def start_cmd(message: Message, state: FSMContext):
    await state.set_state(Onboarding.waiting_for_name)
    await message.answer(
        f"Hello {html.bold(message.from_user.full_name)} 👋\nWhat is your name?"
    )

# ======================
# NAME
# ======================
@dp.message(Onboarding.waiting_for_name, F.text)
async def handle_name(message: Message, state: FSMContext):
    await state.update_data(user_name=message.text.strip())
    kb = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📍 Send Location", request_location=True)],
            [KeyboardButton(text="🏙️ Enter City Manually")]
        ],
        resize_keyboard=True,
    )
    await message.answer("Choose an option:", reply_markup=kb)

# ======================
# LOCATION
# ======================
@dp.message(F.location)
async def handle_location(message: Message, state: FSMContext):
    data = await state.get_data()
    user_id = message.from_user.id
    name = data["user_name"]

    lat, lon = message.location.latitude, message.location.longitude
    prayer_times = get_by_cor(lat, lon)

    if not is_user_exist(user_id):
        insert_user(user_id, name, lat, lon)
        insert_prayer_times(
            user_id,
            prayer_times["Fajr"],
            prayer_times["Sunrise"],
            prayer_times["Dhuhr"],
            prayer_times["Asr"],
            prayer_times["Maghrib"],
            prayer_times["Isha"],
        )

    start_prayer_scheduler(message.bot, user_id)
    start_pre_prayer_scheduler(message.bot, user_id)
    await state.clear()

# ======================
# MAIN
# ======================
async def main():
    bot = Bot(
        token=access_token,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )

    await bot.set_chat_menu_button(
        chat_id=None,
        menu_button=MenuButtonWebApp(
            text="🕌 Qaza Tracker",
            web_app=WebAppInfo(url="https://jsur.vercel.app"),
        ),
    )

    asyncio.create_task(daily_prayer_times_updater())
    await dp.start_polling(bot)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, stream=sys.stdout)
    asyncio.run(main())
