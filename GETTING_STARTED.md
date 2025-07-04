# Система управления рисками - Быстрый старт

## 🚀 Простой калькулятор (готов к использованию)

Откройте файл `simple-calculator.html` в браузере для немедленного использования:

1. **Откройте** `simple-calculator.html` в любом браузере
2. **Введите** баланс счета (например, 10000 ₽)
3. **Укажите** процент риска (например, 0.5%)
4. **Введите** стоп-лосс в пунктах (например, 100)
5. **Нажмите** "Рассчитать размер лота"

### 📊 Формула расчета:
```
Риск = Баланс × Процент риска / 100
Лот = Риск ÷ Стоп-лосс ÷ 10
```

## 🔧 Полная система с базой данных

### Шаг 1: Установка зависимостей
```bash
cd backend
pip install -r requirements.txt
```

### Шаг 2: Запуск сервера
**Вариант A:** Через batch файл (рекомендуется для Windows)
```
start_server.bat
```

**Вариант B:** Через командную строку
```bash
cd backend
python test_server.py
```

### Шаг 3: Открытие интерфейса
Откройте `index.html` в браузере после запуска сервера.

## 📁 Структура проекта

- `simple-calculator.html` - Автономный калькулятор (работает без сервера)
- `index.html` - Полный интерфейс с базой данных
- `backend/` - API сервер на Python FastAPI
- `start_server.bat` - Быстрый запуск сервера

## 🎯 Функции

### Простой калькулятор:
- ✅ Расчет размера лота
- ✅ Показ пошаговых вычислений
- ✅ Работает оффлайн
- ✅ Адаптивный дизайн

### Полная система:
- 📊 Управление портфелями
- 📝 История сделок
- 📈 Автоматическое обновление баланса
- 🔐 Аутентификация пользователей
- 💾 Сохранение данных

## 🛠️ Технологии

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Python, FastAPI
- **База данных:** Supabase (опционально)

## 📞 Поддержка

Если возникли проблемы:
1. Начните с `simple-calculator.html` - он всегда работает
2. Убедитесь, что Python установлен (`python --version`)
3. Проверьте установку зависимостей (`pip list`)

---

**Совет:** Для быстрого начала используйте `simple-calculator.html` - это полнофункциональный калькулятор лотов! 