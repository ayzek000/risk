from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Создаем приложение
app = FastAPI(
    title="Trading Portfolio Manager",
    description="API для управления торговыми портфелями",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Корневая страница"""
    return {
        "message": "Trading Portfolio Manager API работает!",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    """Проверка здоровья"""
    return {
        "status": "healthy",
        "message": "Все системы работают!"
    }

# Простой калькулятор лотов
@app.post("/calculate-lot")
async def calculate_lot(risk: float, stop_loss: float):
    """
    Рассчитать размер лота
    
    Формула: lot = risk / stop_loss / 10
    """
    if risk <= 0 or stop_loss <= 0:
        return {"error": "Риск и стоп-лосс должны быть больше 0"}
    
    lot_size = risk / stop_loss / 10
    
    return {
        "risk": risk,
        "stop_loss": stop_loss,
        "lot_size": round(lot_size, 4),
        "formula": "lot = risk ÷ stop_loss ÷ 10"
    }

# Расчет риска от баланса
@app.post("/calculate-risk")
async def calculate_risk(balance: float, risk_percentage: float = 0.5):
    """
    Рассчитать сумму риска от баланса
    
    Формула: risk = balance * risk_percentage / 100
    """
    if balance <= 0 or risk_percentage <= 0:
        return {"error": "Баланс и процент риска должны быть больше 0"}
    
    risk_amount = (balance * risk_percentage) / 100
    
    return {
        "balance": balance,
        "risk_percentage": risk_percentage,
        "risk_amount": round(risk_amount, 2),
        "formula": f"risk = {balance} × {risk_percentage}% = {risk_amount:.2f}"
    }

# Полный расчет
@app.post("/full-calculation")
async def full_calculation(
    balance: float, 
    risk_percentage: float = 0.5, 
    stop_loss: float = 15.0
):
    """
    Полный расчет: баланс → риск → лот
    """
    if balance <= 0 or risk_percentage <= 0 or stop_loss <= 0:
        return {"error": "Все значения должны быть больше 0"}
    
    # Шаг 1: Рассчитываем риск
    risk_amount = (balance * risk_percentage) / 100
    
    # Шаг 2: Рассчитываем лот
    lot_size = risk_amount / stop_loss / 10
    
    return {
        "input": {
            "balance": balance,
            "risk_percentage": risk_percentage,
            "stop_loss": stop_loss
        },
        "calculation": {
            "risk_amount": round(risk_amount, 2),
            "lot_size": round(lot_size, 4)
        },
        "steps": [
            f"1. Риск = {balance} × {risk_percentage}% = {risk_amount:.2f} USD",
            f"2. Лот = {risk_amount:.2f} ÷ {stop_loss} ÷ 10 = {lot_size:.4f}"
        ]
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True) 