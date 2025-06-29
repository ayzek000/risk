# 📊 Risk Management System

Профессиональная система управления рисками для трейдеров с расчетом размера позиций и управлением портфелем.

## 🚀 Демо

- **Простой калькулятор:** Откройте `simple-calculator.html` в браузере
- **Полная система:** Требует настройки Supabase (см. инструкции ниже)

## ✨ Возможности

### 🧮 Калькулятор лотов
- Автоматический расчет размера позиции по формуле: `Лот = Риск ÷ Стоп-лосс ÷ 10`
- Расчет риска от баланса портфеля
- Пошаговое отображение вычислений

### 📁 Управление портфелями
- Создание и управление торговыми счетами
- Автоматический расчет размера риска (% от баланса)
- Отслеживание изменений баланса

### 📝 История сделок
- Запись всех торговых операций
- Автоматическое обновление баланса
- Статистика по инструментам и таймфреймам

### 🔐 Безопасность
- Аутентификация пользователей через Supabase
- Row Level Security (RLS)
- Персональные данные для каждого пользователя

## 🛠️ Технологии

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** Python, FastAPI
- **Database:** PostgreSQL (Supabase)
- **Authentication:** Supabase Auth

## 📦 Установка и запуск

### Вариант 1: Простой калькулятор (без настройки)
1. Скачайте проект
2. Откройте `simple-calculator.html` в браузере
3. Готово! Калькулятор работает офлайн

### Вариант 2: Полная система

#### 1. Клонирование репозитория
```bash
git clone https://github.com/yourusername/risk-management.git
cd risk-management
```

#### 2. Установка зависимостей Python
```bash
cd backend
pip install -r requirements.txt
```

#### 3. Настройка Supabase
1. Создайте проект на [supabase.com](https://supabase.com)
2. Выполните SQL из файла `supabase_setup.sql` в SQL Editor
3. Замените ключи в `backend/test_server.py`:
   ```python
   "supabase_url": "https://your-project.supabase.co",
   "supabase_anon_key": "your-anon-key"
   ```

#### 4. Запуск
**Windows:**
```bash
start_server.bat
```

**Linux/Mac:**
```bash
cd backend
python test_server.py
```

5. Откройте `index.html` в браузере

## 🏗️ Структура проекта

```
risk-management/
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── main.py         # Основное приложение
│   │   ├── database.py     # Подключение к Supabase
│   │   ├── models/         # Модели данных
│   │   └── schemas/        # Pydantic схемы
│   ├── test_server.py      # Упрощенный сервер
│   └── requirements.txt    # Python зависимости
├── frontend/               # Веб-интерфейс
│   ├── index.html         # Основной интерфейс
│   ├── simple-calculator.html  # Автономный калькулятор
│   ├── script.js          # JavaScript логика
│   └── style.css          # Стили
├── database/
│   └── supabase_setup.sql # SQL для настройки БД
└── docs/                  # Документация
    ├── GETTING_STARTED.md
    └── deployment.md
```

## 🔧 Переменные окружения

Создайте файл `backend/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

## 🚀 Деплой

### Vercel (Frontend)
1. Подключите GitHub репозиторий к Vercel
2. Настройте переменные окружения
3. Деплойте

### Railway/Heroku (Backend)
1. Подключите репозиторий
2. Настройте переменные окружения
3. Деплойте Python приложение

### Netlify (Альтернатива)
1. Деплойте статические файлы
2. Настройте serverless функции для API

## 📖 API Документация

После запуска сервера:
- Swagger UI: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc`

### Основные эндпоинты:
- `GET /health` - Проверка состояния
- `GET /config` - Конфигурация Supabase
- `POST /calculate-lot` - Расчет размера лота

## 🧪 Тестирование

```bash
# Тест калькулятора
curl -X POST "http://localhost:8001/calculate-lot?risk=50&stop_loss=100"

# Проверка здоровья
curl http://localhost:8001/health
```

## 📋 TODO

- [ ] Добавить графики статистики
- [ ] Экспорт данных в Excel/CSV
- [ ] Мобильное приложение
- [ ] Интеграция с MT4/MT5
- [ ] Уведомления и алерты

## 🤝 Участие в разработке

1. Fork проекта
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект распространяется под лицензией MIT. См. файл `LICENSE` для подробностей.

## 📞 Поддержка

- 📧 Email: support@example.com
- 💬 Telegram: @yourusername
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/risk-management/issues)

## 🙏 Благодарности

- [FastAPI](https://fastapi.tiangolo.com/) за отличный Python framework
- [Supabase](https://supabase.com/) за backend-as-a-service
- Сообщество трейдеров за обратную связь

---

⭐ **Если проект полезен, поставьте звездочку на GitHub!** 