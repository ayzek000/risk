FROM python:3.10-slim

WORKDIR /app

# Копируем requirements.txt
COPY backend/requirements.txt backend/requirements.txt

# Устанавливаем зависимости
RUN pip install --no-cache-dir -r backend/requirements.txt

# Копируем весь проект
COPY . .

# Открываем порт
EXPOSE 8000

# Запускаем приложение
WORKDIR /app/backend
CMD ["python", "test_server.py"] 