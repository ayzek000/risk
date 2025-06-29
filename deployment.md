# 🚀 Deployment Guide

Инструкция по развертыванию системы управления рисками в продакшене.

## 🏗️ Архитектура деплоя

```
Frontend (Vercel/Netlify) → Backend (Railway/Heroku) → Database (Supabase)
```

## 📋 Предварительные требования

- [x] Аккаунт GitHub
- [x] Проект Supabase настроен
- [x] SQL схема выполнена
- [x] Локальная версия работает

## 🌐 Frontend Deployment

### Vercel (Рекомендуется)

1. **Подключение репозитория:**
   ```bash
   # Загрузите проект на GitHub
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Настройка Vercel:**
   - Зайдите на [vercel.com](https://vercel.com)
   - Подключите GitHub репозиторий
   - Выберите папку: `Root Directory`
   - Build Command: `none` (статические файлы)
   - Output Directory: `./`

3. **Environment Variables:**
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Деплой:**
   - Нажмите Deploy
   - Получите URL: `https://your-app.vercel.app`

### Netlify (Альтернатива)

1. **Подключение:**
   - Зайдите на [netlify.com](https://netlify.com)
   - Deploy from Git
   - Выберите GitHub репозиторий

2. **Build Settings:**
   - Build command: `none`
   - Publish directory: `./`

3. **Environment Variables:**
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   ```

## 🐍 Backend Deployment

### Railway (Рекомендуется)

1. **Подготовка файлов:**
   Создайте `Procfile` в корне проекта:
   ```
   web: cd backend && python test_server.py
   ```

2. **Настройка Railway:**
   - Зайдите на [railway.app](https://railway.app)
   - New Project → Deploy from GitHub
   - Выберите репозиторий

3. **Environment Variables:**
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-key
   PORT=8000
   ```

4. **Custom Build Command:**
   ```bash
   cd backend && pip install -r requirements.txt
   ```

5. **Custom Start Command:**
   ```bash
   cd backend && python test_server.py
   ```

### Heroku (Альтернатива)

1. **Создание приложения:**
   ```bash
   # Установите Heroku CLI
   heroku create your-app-name
   ```

2. **Настройка Python:**
   Создайте `runtime.txt`:
   ```
   python-3.12.1
   ```

3. **Procfile:**
   ```
   web: cd backend && uvicorn test_server:app --host 0.0.0.0 --port $PORT
   ```

4. **Deploy:**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

## 🔧 Конфигурация для продакшена

### 1. Обновите CORS в backend

Измените `backend/test_server.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend-domain.vercel.app",
        "https://your-custom-domain.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. Обновите API URL в frontend

В `script.js` измените:
```javascript
const API_BASE_URL = 'https://your-backend.railway.app';
```

### 3. Настройте Supabase для продакшена

В Supabase Dashboard → Settings → API:
- **Site URL:** `https://your-frontend-domain.vercel.app`
- **Redirect URLs:** Добавьте все домены

## 🔒 Безопасность

### 1. Environment Variables
```env
# Production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_KEY=eyJ...your-service-key

# Optional
SECRET_KEY=your-super-secret-production-key
DEBUG=false
```

### 2. Supabase RLS Policies
Убедитесь что все политики настроены:
```sql
-- Проверьте что RLS включен
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### 3. HTTPS
- Vercel/Netlify автоматически настраивают HTTPS
- Railway также поддерживает HTTPS

## 📊 Мониторинг

### 1. Логи Railway
```bash
# Просмотр логов
railway logs
```

### 2. Логи Vercel
- Dashboard → Functions → View Function Logs

### 3. Supabase Analytics
- Dashboard → Settings → Analytics

## 🔄 CI/CD Pipeline

### GitHub Actions (опционально)

Создайте `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🧪 Testing Production

### 1. Health Check
```bash
curl https://your-backend.railway.app/health
```

### 2. API Test
```bash
curl -X POST "https://your-backend.railway.app/calculate-lot?risk=50&stop_loss=100"
```

### 3. Frontend Test
1. Откройте `https://your-frontend.vercel.app`
2. Зарегистрируйтесь
3. Создайте портфель
4. Выполните расчет лота
5. Сохраните сделку

## 🚨 Troubleshooting

### Частые проблемы:

1. **CORS Errors:**
   - Проверьте настройки CORS в backend
   - Убедитесь что frontend URL правильный

2. **Environment Variables:**
   - Проверьте все переменные в деплое
   - Убедитесь что нет опечаток в ключах

3. **Database Connection:**
   - Проверьте Supabase URL
   - Убедитесь что RLS настроен правильно

4. **Build Errors:**
   - Проверьте `requirements.txt`
   - Убедитесь что Python версия поддерживается

### Логи и отладка:

```bash
# Railway logs
railway logs --tail

# Vercel logs
vercel logs

# Local testing
cd backend && python test_server.py
```

## 📈 Performance Optimization

1. **Caching:**
   - Настройте кеширование в Vercel/Netlify
   - Используйте CDN для статических файлов

2. **Database:**
   - Оптимизируйте SQL запросы
   - Добавьте индексы при необходимости

3. **Monitoring:**
   - Настройте мониторинг через Supabase
   - Используйте Railway/Heroku metrics

## ✅ Checklist деплоя

- [ ] GitHub репозиторий создан
- [ ] Frontend задеплоен на Vercel/Netlify
- [ ] Backend задеплоен на Railway/Heroku
- [ ] Environment variables настроены
- [ ] CORS настроен правильно
- [ ] Supabase URLs обновлены
- [ ] Health check проходит
- [ ] Тестирование пройдено
- [ ] Домен настроен (опционально)
- [ ] Мониторинг настроен

🎉 **Готово! Ваша система управления рисками в продакшене!** 