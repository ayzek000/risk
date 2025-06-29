from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

# Временно отключаем .env из-за проблем с кодировкой
# load_dotenv()

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Risk Management API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/config")
def get_config():
    """Возвращает конфигурацию Supabase для фронтенда"""
    # ВСТАВЬТЕ СЮДА ВАШИ РЕАЛЬНЫЕ ДАННЫЕ SUPABASE:
    return {
        "supabase_url": "https://dtznclhdvzkngrfxzwpi.supabase.co",
        "supabase_anon_key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0em5jbGhkdnprbmdyZnh6d3BpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMjczNTMsImV4cCI6MjA2NjcwMzM1M30.dyNxUHVpzMCO9NfA2oBnCwHOCwKl66LzmklXRjdHdiQ"
    }

@app.post("/calculate-lot")
def calculate_lot(risk: float, stop_loss: float):
    if risk <= 0 or stop_loss <= 0:
        return {"error": "Risk and stop loss must be greater than 0"}
    
    lot_size = risk / stop_loss / 10
    return {
        "risk": risk,
        "stop_loss": stop_loss,
        "lot_size": round(lot_size, 4)
    }

# API для работы с Supabase через бэкенд
@app.get("/portfolios")
async def get_portfolios():
    """Заглушка для портфелей - фронтенд работает напрямую с Supabase"""
    return []

@app.post("/portfolios")
async def create_portfolio(portfolio_data: dict):
    """Заглушка для создания портфеля - фронтенд работает напрямую с Supabase"""
    return {"message": "Portfolio created via Supabase client"}

@app.get("/portfolios/{portfolio_id}/risk-amount")
async def get_risk_amount(portfolio_id: str):
    """Заглушка для расчета риска - фронтенд работает напрямую с Supabase"""
    return {"risk_amount": 0}

@app.get("/trades")
async def get_trades():
    """Заглушка для сделок - фронтенд работает напрямую с Supabase"""
    return []

@app.post("/trades")
async def create_trade(trade_data: dict):
    """Заглушка для создания сделки - фронтенд работает напрямую с Supabase"""
    return {"message": "Trade created via Supabase client"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001) 