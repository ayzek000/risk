from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List
import os
from .database import supabase

app = FastAPI(title="Risk Management System")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене ограничить конкретными доменами
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic модели
class Portfolio(BaseModel):
    name: str
    balance: float
    initial_balance: float
    risk_percentage: float = 0.5

class Trade(BaseModel):
    portfolio_id: str
    trade_date: Optional[str] = None
    instrument: Optional[str] = None
    timeframe: Optional[str] = None
    risk_amount: float
    stop_loss_points: float
    lot_size: float
    account_type: Optional[str] = None
    direction: Optional[str] = None
    result: Optional[float] = None
    notes: Optional[str] = None

class LotCalculation(BaseModel):
    risk_amount: float
    stop_loss_points: float

@app.get("/")
async def root():
    return {"message": "Risk Management System API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "supabase_connected": supabase is not None}

@app.post("/calculate-lot")
async def calculate_lot(calculation: LotCalculation):
    """Расчет размера лота: лот = риск / стоп-лосс / 10"""
    if calculation.stop_loss_points <= 0:
        raise HTTPException(status_code=400, detail="Стоп-лосс должен быть больше 0")
    
    lot_size = calculation.risk_amount / calculation.stop_loss_points / 10
    
    return {
        "risk_amount": calculation.risk_amount,
        "stop_loss_points": calculation.stop_loss_points,
        "lot_size": round(lot_size, 4)
    }

@app.get("/portfolios")
async def get_portfolios():
    """Получить все портфели"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase не настроен")
    
    result = supabase.select('portfolios')
    if result['error']:
        raise HTTPException(status_code=500, detail=result['error'])
    
    return result['data']

@app.post("/portfolios")
async def create_portfolio(portfolio: Portfolio):
    """Создать новый портфель"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase не настроен")
    
    portfolio_data = {
        "name": portfolio.name,
        "balance": portfolio.balance,
        "initial_balance": portfolio.initial_balance,
        "risk_percentage": portfolio.risk_percentage
    }
    
    result = supabase.insert('portfolios', portfolio_data)
    if result['error']:
        raise HTTPException(status_code=500, detail=result['error'])
    
    return result['data']

@app.get("/portfolios/{portfolio_id}/risk-amount")
async def calculate_risk_amount(portfolio_id: str):
    """Рассчитать сумму риска для портфеля"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase не настроен")
    
    # Получаем портфель
    result = supabase.select('portfolios', filters={'id': portfolio_id})
    if result['error'] or not result['data']:
        raise HTTPException(status_code=404, detail="Портфель не найден")
    
    portfolio = result['data'][0]
    risk_amount = (portfolio['balance'] * portfolio['risk_percentage']) / 100
    
    return {
        "portfolio_id": portfolio_id,
        "balance": portfolio['balance'],
        "risk_percentage": portfolio['risk_percentage'],
        "risk_amount": round(risk_amount, 2)
    }

@app.get("/trades")
async def get_trades(portfolio_id: Optional[str] = None, limit: int = 50):
    """Получить сделки"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase не настроен")
    
    filters = {'portfolio_id': portfolio_id} if portfolio_id else None
    result = supabase.select('trades', filters=filters)
    
    if result['error']:
        raise HTTPException(status_code=500, detail=result['error'])
    
    return result['data'][:limit]

@app.post("/trades")
async def create_trade(trade: Trade):
    """Создать новую сделку"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase не настроен")
    
    trade_data = trade.dict()
    
    result = supabase.insert('trades', trade_data)
    if result['error']:
        raise HTTPException(status_code=500, detail=result['error'])
    
    return result['data']

class TradeUpdate(BaseModel):
    instrument: Optional[str] = None
    timeframe: Optional[str] = None
    direction: Optional[str] = None
    stop_loss_points: Optional[float] = None
    lot_size: Optional[float] = None
    result: Optional[float] = None
    notes: Optional[str] = None

@app.put("/trades/{trade_id}")
async def update_trade(trade_id: int, trade_update: TradeUpdate):
    """Обновить сделку"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase не настроен")
    
    # Получаем только непустые поля для обновления
    update_data = {k: v for k, v in trade_update.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Нет данных для обновления")
    
    result = supabase.update('trades', update_data, filters={'id': trade_id})
    if result['error']:
        raise HTTPException(status_code=500, detail=result['error'])
    
    if not result['data']:
        raise HTTPException(status_code=404, detail="Сделка не найдена")
    
    return result['data']

@app.delete("/trades/{trade_id}")
async def delete_trade(trade_id: int):
    """Удалить сделку"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase не настроен")
    
    # Сначала проверяем существование сделки
    result = supabase.select('trades', filters={'id': trade_id})
    if result['error']:
        raise HTTPException(status_code=500, detail=result['error'])
    
    if not result['data']:
        raise HTTPException(status_code=404, detail="Сделка не найдена")
    
    # Удаляем сделку
    result = supabase.delete('trades', filters={'id': trade_id})
    if result['error']:
        raise HTTPException(status_code=500, detail=result['error'])
    
    return {"message": "Сделка успешно удалена", "trade_id": trade_id}

# Статические файлы (фронтенд)
if os.path.exists("../"):
    app.mount("/", StaticFiles(directory="../", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 