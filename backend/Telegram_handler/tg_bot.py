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
# TASK REGISTRIES
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
                    f"🕌 Time for {prayer.capitalize()} prayer\n{msg}\n({time_str})",
                )
                sent_today.add(prayer)

        if now.hour == 0 and now.minute == 0:
            sent_today.clear()

        await asyncio.sleep(30)

def start_prayer_scheduler(bot: Bot, user_id: int):
    if user_id not in prayer_tasks:
        prayer_tasks[user_id] = asyncio.create_task(
            prayer_scheduler(bot, user_id)
        )

# ======================
# PRE-PRAYER REMINDER (10 MIN)
# ======================
async def pre_prayer_scheduler(bot: Bot, user_id: int):
    sent_today = set()  # prevent duplicates per prayer per day

    while True:
        prayer_times = get_prayer_times(user_id)
        tz = ZoneInfo(prayer_times["timezone"])
        now = datetime.now(tz)

        prayers = []

        # build prayer datetime list
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

        # sort prayers by time
        prayers.sort(key=lambda x: x[1])

        # find next prayer
        future = [(p, dt) for p, dt in prayers if dt > now]

        if not future:
            # all prayers passed → tomorrow
            prayers = [(p, dt + timedelta(days=1)) for p, dt in prayers]
            prayers.sort(key=lambda x: x[1])
            future = prayers

        next_prayer, next_dt = future[0]

        # current prayer = one before next prayer
        idx = prayers.index((next_prayer, next_dt))
        current_prayer, current_dt = prayers[idx - 1]

        reminder_dt = next_dt - timedelta(minutes=10)

        logging.info(
            f"[PRE] user={user_id} "
            f"current={current_prayer} "
            f"reminder={reminder_dt.time()} "
            f"now={now.time()}"
        )

        # 🔔 reminder window (1 minute tolerance)
        key = (current_prayer, reminder_dt.date())

        if reminder_dt <= now < reminder_dt + timedelta(minutes=1):
            if key not in sent_today:
                await bot.send_message(
                    user_id,
                    f"⚠️ {current_prayer.capitalize()} prayer will be MISSED in 10 minutes.\n"
                    f"Have you prayed it already?"
                )
                sent_today.add(key)

        # reset daily memory after midnight
        if now.hour == 0 and now.minute == 0:
            sent_today.clear()

        await asyncio.sleep(20)

def start_pre_prayer_scheduler(bot: Bot, user_id: int):
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
# START
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
            [KeyboardButton(text="🏙️ Enter City Manually")],
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
    name = data.get("user_name", message.from_user.full_name)

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
    else:
        update_user(user_id, name, lat, lon)
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
        f"🕌 Today’s prayer times:\n"
        f"Fajr: {prayer_times['Fajr']}\n"
        f"Dhuhr: {prayer_times['Dhuhr']}\n"
        f"Asr: {prayer_times['Asr']}\n"
        f"Maghrib: {prayer_times['Maghrib']}\n"
        f"Isha: {prayer_times['Isha']}",
        reply_markup=ReplyKeyboardRemove(),
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
