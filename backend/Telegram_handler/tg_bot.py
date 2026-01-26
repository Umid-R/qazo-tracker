import os
import sys
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

# -------------------- INIT --------------------

load_dotenv()

access_token = os.getenv("TELEGRAM_TOKEN")

dp = Dispatcher()

sent_today = {}          # {user_id: {prayer: date}}
scheduler_tasks = {}     # {user_id: asyncio.Task}

# user flow globals (kept as-is)
user_name = None
waiting_for_city = False

# -------------------- SCHEDULER --------------------

async def prayer_scheduler(bot: Bot, user_id: int):
    while True:
        try:
            prayer_times = get_prayer_times(user_id)
            if not prayer_times or "timezone" not in prayer_times:
                await asyncio.sleep(60)
                continue

            tz = ZoneInfo(prayer_times["timezone"])
            now = datetime.now(tz).replace(second=0, microsecond=0)
            today = now.date()

            sent_today.setdefault(user_id, {})

            for prayer, time_str in prayer_times.items():
                if prayer == "timezone":
                    continue

                prayer_dt = datetime.strptime(time_str, "%H:%M").replace(
                    year=now.year,
                    month=now.month,
                    day=now.day,
                    tzinfo=tz,
                )

                # safe 60s window
                if abs((now - prayer_dt).total_seconds()) < 60:
                    if sent_today[user_id].get(prayer) == today:
                        continue

                    message = get_prayer_message(prayer)
                    await bot.send_message(
                        chat_id=user_id,
                        text=f"🕌 Time for {prayer.capitalize()} prayer\n{message}\n({time_str})",
                    )
                    sent_today[user_id][prayer] = today

            sleep_seconds = 60 - datetime.now(tz).second
            await asyncio.sleep(max(sleep_seconds, 1))

        except Exception as e:
            print(f"[SCHEDULER ERROR] user {user_id}: {e}")
            await asyncio.sleep(60)


def start_prayer_scheduler(bot: Bot, user_id: int):
    if user_id in scheduler_tasks and not scheduler_tasks[user_id].done():
        return

    scheduler_tasks[user_id] = asyncio.create_task(
        prayer_scheduler(bot, user_id)
    )

# -------------------- DAILY UPDATE --------------------

async def sleep_until_next_day():
    now = datetime.now(timezone.utc)
    next_run = (now + timedelta(days=1)).replace(
        hour=0, minute=5, second=0, microsecond=0
    )
    await asyncio.sleep(max((next_run - now).total_seconds(), 60))


async def daily_prayer_times_updater():
    while True:
        print("[DAILY] Updating prayer times for all users")

        try:
            users = get_all_users()
        except Exception as e:
            print(f"[DAILY] failed to fetch users: {e}")
            await sleep_until_next_day()
            continue

        for user in users:
            try:
                prayer_times = get_by_cor(lat=user["lat"], lon=user["lon"])
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
                print(f"[DAILY] Failed for user {user['id']}: {e}")

        await sleep_until_next_day()

# -------------------- HANDLERS --------------------

@dp.message(CommandStart())
async def command_start(message: Message):
    global user_name, waiting_for_city
    user_name = None
    waiting_for_city = False

    await message.answer(
        f"Hello, {html.bold(message.from_user.full_name)} 👋\nWhat is your name?"
    )


@dp.message(F.text == "🏙️ Enter City Manually")
async def manual_city(message: Message):
    global waiting_for_city
    waiting_for_city = True

    await message.answer(
        "Okay! Please type your city name (e.g., Seoul, Busan, Osh):",
        reply_markup=ReplyKeyboardRemove(),
    )


@dp.message(F.location)
async def handle_location(message: Message):
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
        f"Here are the prayer times 🕌\n"
        f"Fajr: {prayer_times['Fajr']}\n"
        f"Sunrise: {prayer_times['Sunrise']}\n"
        f"Dhuhr: {prayer_times['Dhuhr']}\n"
        f"Asr: {prayer_times['Asr']}\n"
        f"Maghrib: {prayer_times['Maghrib']}\n"
        f"Isha: {prayer_times['Isha']}",
        reply_markup=ReplyKeyboardRemove(),
    )

    start_prayer_scheduler(message.bot, user_id)


@dp.message(F.text)
async def handle_text(message: Message):
    global user_name, waiting_for_city
    user_id = message.from_user.id

    if message.text == "🏙️ Enter City Manually":
        return

    if user_name is None:
        user_name = message.text.strip()
        waiting_for_city = False

        keyboard = ReplyKeyboardMarkup(
            keyboard=[
                [KeyboardButton(text="📍 Send Location", request_location=True)],
                [KeyboardButton(text="🏙️ Enter City Manually")],
            ],
            resize_keyboard=True,
        )

        await message.answer(
            f"Nice to meet you, {user_name} 😊\nChoose an option:",
            reply_markup=keyboard,
        )
        return

    if waiting_for_city:
        city = message.text.strip()
        waiting_for_city = False

        cors = get_cor_city(city.capitalize())
        if not cors:
            await message.answer("Oops — city not found. Try again 😊")
            return

        prayer_times = get_by_cor(float(cors[0]), float(cors[1]))

        if not is_user_exist(user_id):
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
            f"Here are the prayer times 🕌\n"
            f"Fajr: {prayer_times['Fajr']}\n"
            f"Sunrise: {prayer_times['Sunrise']}\n"
            f"Dhuhr: {prayer_times['Dhuhr']}\n"
            f"Asr: {prayer_times['Asr']}\n"
            f"Maghrib: {prayer_times['Maghrib']}\n"
            f"Isha: {prayer_times['Isha']}",
            reply_markup=ReplyKeyboardRemove(),
        )

        start_prayer_scheduler(message.bot, user_id)

# -------------------- MAIN --------------------

async def main():
    bot = Bot(
        token=access_token,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )

    await bot.set_chat_menu_button(
        MenuButtonWebApp(
            text="🕌 Qaza Tracker",
            web_app=WebAppInfo(url="https://jsur.vercel.app"),
        )
    )

    asyncio.create_task(daily_prayer_times_updater())
    await dp.start_polling(bot, drop_pending_updates=True)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, stream=sys.stdout)
    asyncio.run(main())
