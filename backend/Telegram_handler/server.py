from fastapi import FastAPI
import asyncio
from backend.Telegram_handler.tg_bot import main  # make sure this points to your main bot function

app = FastAPI(title="Qaza Tracker API")

@app.on_event("startup")
async def startup_event():
    """
    Start the Telegram bot as a background task when FastAPI starts.
    """
    asyncio.create_task(run_bot())

@app.on_event("shutdown")
async def shutdown_event():
    """
    Optional: Handle any cleanup if needed on shutdown.
    """
    print("Application shutdown...")

async def run_bot():
    """
    Run the Telegram bot in the same event loop as FastAPI.
    """
    try:
        # Run your aiogram bot
        await main()
    except Exception as e:
        print(f"Bot crashed: {e}")

@app.get("/")
async def root():
    return {"status": "Bot is running"}
