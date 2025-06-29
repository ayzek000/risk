# 🚀 Инструкции по установке Trading Portfolio Manager

## 📋 Предварительные требования

- Python 3.9+ 
- Node.js 16+
- PostgreSQL 13+
- Git

## 🛠️ Установка и настройка

### 1. Клонирование проекта

```bash
git clone <repository-url>
cd trading-portfolio-manager
```

### 2. Настройка Backend (Python)

#### 2.1 Создание виртуального окружения

```bash
cd backend
python -m venv venv

# Активация (Windows)
venv\Scripts\activate

# Активация (Mac/Linux)
source venv/bin/activate
```

#### 2.2 Установка зависимостей

```bash
pip install -r requirements.txt
```

#### 2.3 Настройка базы данных PostgreSQL

```sql
-- Создание базы данных
CREATE DATABASE trading_portfolio;
CREATE USER trading_user WITH PASSWORD 'trading_password';
GRANT ALL PRIVILEGES ON DATABASE trading_portfolio TO trading_user;
```

#### 2.4 Настройка переменных окружения

Создайте файл `.env` на основе `env-example.txt`:

```bash
cp env-example.txt .env
```

Отредактируйте `.env`:

```env
DATABASE_URL=postgresql://trading_user:trading_password@localhost:5432/trading_portfolio
SECRET_KEY=ваш-супер-секретный-ключ-измените-в-продакшене
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DEBUG=true
```

#### 2.5 Запуск сервера

```bash
# Из директории backend/
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API будет доступно на `http://localhost:8000`

Документация Swagger: `http://localhost:8000/docs`

### 3. Настройка Frontend (React)

#### 3.1 Установка зависимостей

```bash
cd frontend
npm install
```

#### 3.2 Настройка переменных окружения

Создайте файл `.env`:

```env
REACT_APP_API_URL=http://localhost:8000
```

#### 3.3 Запуск разработческого сервера

```bash
npm start
```

Приложение будет доступно на `http://localhost:3000`

## 🐳 Docker (альтернативная установка)

### Создание docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: trading_portfolio
      POSTGRES_USER: trading_user
      POSTGRES_PASSWORD: trading_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://trading_user:trading_password@postgres:5432/trading_portfolio
    depends_on:
      - postgres
    volumes:
      - ./backend:/app

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      REACT_APP_API_URL: http://localhost:8000
    volumes:
      - ./frontend:/app

volumes:
  postgres_data:
```

### Запуск с Docker

```bash
docker-compose up -d
```

## 📊 Использование API

### Основные endpoints:

#### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Текущий пользователь

#### Портфели
- `GET /api/portfolios` - Список портфелей
- `POST /api/portfolios` - Создание портфеля
- `GET /api/portfolios/{id}` - Детали портфеля
- `PUT /api/portfolios/{id}` - Обновление портфеля

#### Сделки
- `GET /api/portfolios/{id}/trades` - Сделки портфеля
- `POST /api/portfolios/{id}/trades` - Добавление сделки
- `PUT /api/trades/{id}` - Обновление сделки
- `POST /api/trades/{id}/result` - Добавление результата

### Пример использования:

```python
import requests

# Регистрация
response = requests.post("http://localhost:8000/api/auth/register", json={
    "email": "trader@example.com",
    "password": "securepassword"
})

# Вход
response = requests.post("http://localhost:8000/api/auth/login", json={
    "email": "trader@example.com", 
    "password": "securepassword"
})
token = response.json()["access_token"]

# Создание портфеля
headers = {"Authorization": f"Bearer {token}"}
response = requests.post("http://localhost:8000/api/portfolios", 
    json={
        "name": "Мой первый портфель",
        "initial_balance": 10000.00,
        "risk_percentage": 0.5
    },
    headers=headers
)
portfolio_id = response.json()["id"]

# Добавление сделки
response = requests.post(f"http://localhost:8000/api/portfolios/{portfolio_id}/trades",
    json={
        "stop_loss_points": 15.0,
        "instrument": "XAUUSD",
        "timeframe": "M15",
        "direction": "buy"
    },
    headers=headers
)
```

## 🧪 Тестирование

```bash
# Backend тесты
cd backend
pytest

# Frontend тесты
cd frontend
npm test
```

## 🚀 Деплой

### Heroku

```bash
# Backend
heroku create trading-portfolio-api
git subtree push --prefix backend heroku main

# Frontend  
heroku create trading-portfolio-app
git subtree push --prefix frontend heroku main
```

### Vercel

```bash
# Frontend
cd frontend
vercel --prod
```

## 📝 Часто задаваемые вопросы

### Q: Как изменить формулу расчета лота?
A: Отредактируйте метод `calculate_lot_size` в `backend/app/services/calculator.py`

### Q: Как добавить новые поля в сделку?
A: 
1. Обновите модель в `backend/app/models/trade.py`
2. Создайте миграцию: `alembic revision --autogenerate -m "add new field"`
3. Примените миграцию: `alembic upgrade head`
4. Обновите схемы в `backend/app/schemas/trade.py`

### Q: Ошибка подключения к базе данных?
A: Убедитесь что PostgreSQL запущен и настройки в `.env` корректны

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `docker-compose logs backend`
2. Убедитесь что все сервисы запущены
3. Проверьте версии Python и Node.js

---

**🎯 Успешной разработки!** 📈 