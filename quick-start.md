# 🚀 Быстрый запуск системы управления рисками

## 📋 Описание проекта
Полнофункциональная система для трейдеров:
- **Расчет размера позиций** по формуле: `Лот = Риск ÷ Стоп-лосс ÷ 10`
- **Управление портфелями** с автоматическим расчетом риска
- **Отслеживание сделок** с обновлением баланса
- **Интеграция с Supabase** для хранения данных
- **FastAPI бэкенд** + современный веб-интерфейс

## 🛠 Технологический стек
- **Backend**: Python + FastAPI + Supabase
- **Frontend**: Vanilla JavaScript + HTML/CSS
- **База данных**: PostgreSQL (через Supabase)
- **Аутентификация**: Supabase Auth

## ⚡ Быстрый запуск

### 1. Настройка Supabase
1. Создайте проект на [supabase.com](https://supabase.com)
2. Выполните SQL из файла `supabase-setup.md` в SQL Editor
3. Получите URL и API ключи в Settings → API

### 2. Настройка проекта
```bash
# Клонируйте и перейдите в папку проекта
cd "risk management"

# Установите Python зависимости
cd backend
pip install -r requirements.txt

# Создайте файл конфигурации
copy env-example.txt .env
```

### 3. Настройка переменных окружения
Отредактируйте файл `.env`:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
DEBUG=true
```

### 4. Запуск сервера
```bash
# Из папки backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 5. Настройка фронтенда
Отредактируйте в `script.js`:
```javascript
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';
```

### 6. Открытие приложения
Откройте `index.html` в браузере или запустите локальный сервер:
```bash
# Python 3
python -m http.server 3000

# Или откройте файл напрямую
start index.html
```

## 🎯 Использование

### 1. Аутентификация
- Зарегистрируйтесь или войдите в систему
- Подтвердите email (при регистрации)

### 2. Создание портфеля
- Укажите название (например, "Основной счет")
- Введите начальный баланс
- Установите процент риска (например, 0.5%)

### 3. Расчет позиции
- Выберите портфель
- Укажите стоп-лосс в пунктах
- Выберите инструмент и таймфрейм
- Нажмите "Рассчитать лот"

### 4. Сохранение сделки
- После расчета можете сохранить сделку
- Укажите результат (прибыль/убыток)
- Добавьте заметки
- Баланс портфеля обновится автоматически

## 📊 Функции системы

### Расчет риска
- **Автоматический**: `Риск = Баланс × Процент риска / 100`
- **Обновление**: При изменении баланса риск пересчитывается

### Управление портфелями
- Множественные портфели на одного пользователя
- Отслеживание P&L каждого портфеля
- История всех изменений баланса

### Отслеживание сделок
- Полная история с фильтрацией
- Цветовая индикация прибыли/убытка
- Экспорт данных (планируется)

## 🔧 API Endpoints

### Здоровье сервиса
- `GET /health` - статус API и подключения к Supabase

### Портфели
- `GET /portfolios` - список портфелей
- `POST /portfolios` - создание портфеля
- `GET /portfolios/{id}/risk-amount` - расчет риска

### Сделки
- `GET /trades?portfolio_id={id}` - история сделок
- `POST /trades` - сохранение сделки

### Калькулятор
- `POST /calculate-lot` - расчет размера лота

## 🚨 Решение проблем

### Ошибка "Supabase не настроен"
1. Проверьте URL и ключи в `.env`
2. Убедитесь, что проект Supabase активен
3. Проверьте права доступа к API

### Ошибка подключения к API
1. Убедитесь, что сервер запущен на порту 8000
2. Проверьте CORS настройки
3. Откройте http://localhost:8000/health

### Проблемы с аутентификацией
1. Проверьте настройки Supabase Auth
2. Добавьте домен в разрешенные URL
3. Включите нужных провайдеров входа

## 🎨 Демо-режим
Если Supabase не настроен, система работает в демо-режиме:
- Без сохранения данных
- Только расчеты лотов
- Локальное состояние интерфейса

## 📱 Мобильная версия
Интерфейс адаптивный и работает на мобильных устройствах.

---

**Готово! Ваша система управления рисками запущена!** 🎉 