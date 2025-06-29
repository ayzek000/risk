# 🚀 Торговый портфель-менеджер (Python + React)

## 📁 Структура проекта

```
trading-portfolio-manager/
├── backend/                    # Python FastAPI бэкенд
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # Главный файл FastAPI
│   │   ├── config.py          # Конфигурация
│   │   ├── database.py        # Подключение к БД
│   │   ├── models/            # SQLAlchemy модели
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── portfolio.py
│   │   │   └── trade.py
│   │   ├── schemas/           # Pydantic схемы
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── portfolio.py
│   │   │   └── trade.py
│   │   ├── api/               # API роуты
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── portfolios.py
│   │   │   └── trades.py
│   │   ├── services/          # Бизнес логика
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py
│   │   │   ├── portfolio_service.py
│   │   │   ├── trade_service.py
│   │   │   └── calculator.py  # Торговые вычисления
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── auth.py        # JWT токены
│   │       └── validators.py
│   ├── requirements.txt
│   ├── .env.example
│   └── alembic/              # Миграции БД
│       ├── versions/
│       └── alembic.ini
├── frontend/                  # React фронтенд
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/        # React компоненты
│   │   │   ├── Auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   ├── Portfolio/
│   │   │   │   ├── PortfolioSelector.jsx
│   │   │   │   ├── CreatePortfolio.jsx
│   │   │   │   └── PortfolioCard.jsx
│   │   │   ├── Trading/
│   │   │   │   ├── TradingPanel.jsx
│   │   │   │   ├── TradeForm.jsx
│   │   │   │   ├── TradeTable.jsx
│   │   │   │   └── RiskCalculator.jsx
│   │   │   ├── Dashboard/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   └── Statistics.jsx
│   │   │   └── Common/
│   │   │       ├── Navbar.jsx
│   │   │       ├── Modal.jsx
│   │   │       └── LoadingSpinner.jsx
│   │   ├── services/          # API сервисы
│   │   │   ├── api.js
│   │   │   ├── auth.js
│   │   │   ├── portfolios.js
│   │   │   └── trades.js
│   │   ├── hooks/             # React хуки
│   │   │   ├── useAuth.js
│   │   │   ├── usePortfolio.js
│   │   │   └── useTrades.js
│   │   ├── context/           # React контекст
│   │   │   ├── AuthContext.js
│   │   │   └── PortfolioContext.js
│   │   ├── utils/
│   │   │   ├── constants.js
│   │   │   └── formatters.js
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   └── components/
│   │   ├── App.jsx
│   │   └── index.js
│   ├── package.json
│   └── .env.example
├── docker-compose.yml         # Для разработки
├── README.md
└── deployment/               # Деплой скрипты
    ├── Dockerfile.backend
    ├── Dockerfile.frontend
    └── nginx.conf
```

## 🛠️ Технологический стек

### Backend (Python)
- **FastAPI** - современный, быстрый веб-фреймворк
- **SQLAlchemy** - ORM для работы с базой данных
- **Alembic** - миграции базы данных
- **Pydantic** - валидация данных
- **JWT** - аутентификация
- **PostgreSQL** - база данных

### Frontend (React)
- **React 18** - современная библиотека UI
- **React Router** - маршрутизация
- **Axios** - HTTP клиент
- **React Hook Form** - работа с формами
- **Recharts** - графики и аналитика
- **Tailwind CSS** - стилизация

## 🗄️ Модели базы данных

### User (встроенная аутентификация)
```python
class User(Base):
    id: UUID
    email: str
    hashed_password: str
    is_active: bool
    created_at: datetime
```

### Portfolio
```python
class Portfolio(Base):
    id: UUID
    user_id: UUID
    name: str
    balance: Decimal
    initial_balance: Decimal
    risk_percentage: Decimal = 0.5
    created_at: datetime
    updated_at: datetime
```

### Trade
```python
class Trade(Base):
    id: UUID
    portfolio_id: UUID
    trade_date: date
    instrument: str
    timeframe: str
    risk_amount: Decimal
    stop_loss_points: Decimal
    lot_size: Decimal
    account_type: str
    direction: TradeDirection  # enum: buy/sell
    result: Optional[Decimal]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
```

## 🧮 Ключевые функции вычислений

### Calculator Service (Python)
```python
class TradingCalculator:
    @staticmethod
    def calculate_risk_amount(balance: Decimal, risk_percentage: Decimal) -> Decimal:
        return (balance * risk_percentage) / 100
    
    @staticmethod
    def calculate_lot_size(risk_amount: Decimal, stop_loss_points: Decimal) -> Decimal:
        return risk_amount / stop_loss_points / 10
    
    @staticmethod
    def update_balance_after_trade(current_balance: Decimal, trade_result: Decimal) -> Decimal:
        return current_balance + trade_result
```

## 🎯 API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/refresh` - Обновление токена
- `GET /api/auth/me` - Текущий пользователь

### Портфели
- `GET /api/portfolios` - Список портфелей
- `POST /api/portfolios` - Создание портфеля
- `GET /api/portfolios/{id}` - Детали портфеля
- `PUT /api/portfolios/{id}` - Обновление портфеля
- `DELETE /api/portfolios/{id}` - Удаление портфеля

### Сделки
- `GET /api/portfolios/{id}/trades` - Сделки портфеля
- `POST /api/portfolios/{id}/trades` - Добавление сделки
- `PUT /api/trades/{id}` - Обновление сделки
- `DELETE /api/trades/{id}` - Удаление сделки
- `POST /api/trades/{id}/result` - Добавление результата

### Аналитика
- `GET /api/portfolios/{id}/statistics` - Статистика портфеля
- `GET /api/portfolios/{id}/performance` - График доходности

## 🚀 Пошаговый план разработки

### Этап 1: Backend основа
- [x] Структура проекта
- [ ] Настройка FastAPI
- [ ] Модели SQLAlchemy
- [ ] Система аутентификации
- [ ] Базовые API endpoints

### Этап 2: Бизнес логика
- [ ] Сервис управления портфелями
- [ ] Торговый калькулятор
- [ ] Сервис сделок
- [ ] Автоматическое обновление баланса

### Этап 3: Frontend основа
- [ ] React приложение
- [ ] Система маршрутизации
- [ ] Компоненты аутентификации
- [ ] API интеграция

### Этап 4: Основной функционал
- [ ] Управление портфелями
- [ ] Торговая панель
- [ ] Таблица сделок
- [ ] Расчет рисков и лотов

### Этап 5: Продвинутые функции
- [ ] Аналитика и статистика
- [ ] Графики доходности
- [ ] Экспорт данных
- [ ] Мобильная адаптация

### Этап 6: Деплой и оптимизация
- [ ] Docker контейнеры
- [ ] CI/CD пайплайн
- [ ] Тестирование
- [ ] Продакшен деплой

## 💡 Преимущества Python бэкенда

1. **Мощные вычисления** - легко реализовать сложную торговую логику
2. **Pandas интеграция** - для аналитики и обработки данных
3. **Машинное обучение** - можно добавить AI для анализа торговли
4. **Надежность** - строгая типизация с Pydantic
5. **Производительность** - FastAPI один из самых быстрых фреймворков
6. **Масштабируемость** - легко добавлять новые функции

## 🏁 Начинаем!

Следующий шаг: создание основы Python бэкенда с FastAPI и моделями данных. 