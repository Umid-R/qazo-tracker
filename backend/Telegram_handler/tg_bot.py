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
pre_prayer_tasks: dict[int, asyncio.Task] = {}

# ======================
# PRE-PRAYER SCHEDULER (CORRECT)
# ======================
async def pre_prayer_scheduler(bot: Bot, user_id: int):
    while True:
        prayer_times = get_prayer_times(user_id)
        tz = ZoneInfo(prayer_times["timezone"])
        now = datetime.now(tz)

        prayer_datetimes = []

        for prayer, time_str in prayer_times.items():
            if prayer == "timezone":
                continue

            prayer_time = datetime.strptime(time_str, "%H:%M").time()
            prayer_dt = datetime.combine(now.date(), prayer_time, tzinfo=tz)
            prayer_datetimes.append((prayer, prayer_dt))

        # get next prayer (today or tomorrow)
        future_prayers = [(p, dt) for p, dt in prayer_datetimes if dt > now]
        if not future_prayers:
            future_prayers = [(p, dt + timedelta(days=1)) for p, dt in prayer_datetimes]

        next_prayer, next_prayer_dt = min(future_prayers, key=lambda x: x[1])
        reminder_time = next_prayer_dt - timedelta(minutes=10)

        logging.info(
            f"[PRE] user={user_id} next={next_prayer} "
            f"reminder={reminder_time.time()} now={now.time()}"
        )

        # If reminder already passed, retry shortly
        if reminder_time <= now:
            await asyncio.sleep(30)
            continue

        await asyncio.sleep((reminder_time - now).total_seconds())

        await bot.send_message(
            user_id,
            f"⏰ {next_prayer.capitalize()} prayer in 10 minutes.\nDid you pray already?"
        )

        # buffer so it never resends
        await asyncio.sleep(60)

def start_pre_prayer_scheduler(bot: Bot, user_id: int):
    if user_id in pre_prayer_tasks:
        return
    pre_prayer_tasks[user_id] = asyncio.create_task(
        pre_prayer_scheduler(bot, user_id)
    )

# ======================
# DAILY PRAYER UPDATE
# ======================
async def sleep_until_next_day():
    now = datetime.now(timezone.utc)
    next_run = (now + timedelta(days=1)).replace(
        hour=0, minute=5, second=0, microsecond=0
    )
    await asyncio.sleep((next_run - now).total_seconds())

async def daily_prayer_times_updater():
    while True:
        users = get_all_users()
        for user in users:
            try:
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
            except Exception as e:
                logging.error(f"[DAILY] Failed for {user['id']}: {e}")

        await sleep_until_next_day()

# ======================
# START COMMAND
# ======================
@dp.message(CommandStart())
async def command_start(message: Message, state: FSMContext):
    await state.set_state(Onboarding.waiting_for_name)
    await message.answer(
        f"Hello, {html.bold(message.from_user.full_name)} 👋\nWhat is your name?"
    )

# ======================
# NAME HANDLER
# ======================
@dp.message(Onboarding.waiting_for_name, F.text)
async def handle_name(message: Message, state: FSMContext):
    await state.update_data(user_name=message.text.strip())

    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📍 Send Location", request_location=True)],
            [KeyboardButton(text="🏙️ Enter City Manually")],
        ],
        resize_keyboard=True,
    )

    await message.answer(
        f"Nice to meet you, {message.text.strip()} 😊\nChoose an option:",
        reply_markup=keyboard,
    )

# ======================
# MANUAL CITY BUTTON
# ======================
@dp.message(F.text == "🏙️ Enter City Manually")
async def manual_city(message: Message, state: FSMContext):
    await state.set_state(Onboarding.waiting_for_city)
    await message.answer(
        "Okay! Please type your city name:",
        reply_markup=ReplyKeyboardRemove(),
    )

# ======================
# LOCATION HANDLER
# ======================
@dp.message(F.location)
async def handle_location(message: Message, state: FSMContext):
    data = await state.get_data()
    user_name = data.get("user_name")
    user_id = message.from_user.id

    lat = message.location.latitude
    lon = message.location.longitude
    prayer_times = get_by_cor(lat, lon)

    if not is_user_exist(user_id):
        insert_user(user_id, user_name, lat, lon)
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
        update_user(user_id, user_name, lat, lon)
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
        f"🕌 Prayer times:\n"
        f"Fajr: {prayer_times['Fajr']}\n"
        f"Sunrise: {prayer_times['Sunrise']}\n"
        f"Dhuhr: {prayer_times['Dhuhr']}\n"
        f"Asr: {prayer_times['Asr']}\n"
        f"Maghrib: {prayer_times['Maghrib']}\n"
        f"Isha: {prayer_times['Isha']}",
        reply_markup=ReplyKeyboardRemove(),
    )

    start_pre_prayer_scheduler(message.bot, user_id)
    await state.clear()

# ======================
# CITY TEXT HANDLER
# ======================
@dp.message(Onboarding.waiting_for_city)
async def handle_city(message: Message, state: FSMContext):
    data = await state.get_data()
    user_name = data.get("user_name")
    user_id = message.from_user.id

    cors = get_cor_city(message.text.strip().capitalize())
    if cors is None:
        await message.answer("City not found 😅 Try again.")
        return

    prayer_times = get_by_cor(float(cors[0]), float(cors[1]))

    if not is_user_exist(user_id):
        insert_user(user_id, user_name, float(cors[0]), float(cors[1]))
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
        update_user(user_id, user_name, float(cors[0]), float(cors[1]))
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
        f"🕌 Prayer times:\n"
        f"Fajr: {prayer_times['Fajr']}\n"
        f"Sunrise: {prayer_times['Sunrise']}\n"
        f"Dhuhr: {prayer_times['Dhuhr']}\n"
        f"Asr: {prayer_times['Asr']}\n"
        f"Maghrib: {prayer_times['Maghrib']}\n"
        f"Isha: {prayer_times['Isha']}",
        reply_markup=ReplyKeyboardRemove(),
    )

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
    await dp.start_polling(bot, drop_pending_updates=True)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, stream=sys.stdout)
    asyncio.run(main())
