from fastapi import FastAPI
import asyncio
from backend.Telegram_handler.tg_bot import main  # your async bot main()

app = FastAPI(title="Qaza Tracker API")

# Start bot in background without threading
@app.on_event("startup")
async def startup_event():
    # schedule bot in same event loop
    asyncio.create_task(main())

@app.get("/")
async def root():
    return {"status": "Bot is running"}
