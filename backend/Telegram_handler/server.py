from fastapi import FastAPI
import threading
import asyncio
from backend.Telegram_handler.tg_bot import main

app = FastAPI()

# Run Telegram bot in a separate thread
def run_bot():
    asyncio.run(main())

threading.Thread(target=run_bot, daemon=True).start()

@app.get("/")
def root():
    return {"status": "Bot is running"}