# Настройка Supabase для проекта "Калькулятор лотов"

## 1. Создание проекта
1. Идите на https://supabase.com
2. Нажмите "Start your project" 
3. Войдите через GitHub/Google
4. Создайте новый проект:
   - Name: `lot-calculator`
   - Database Password: (сохраните пароль!)
   - Region: выберите ближайший к вам

## 2. Получение ключей
После создания проекта:
1. Идите в Settings → API
2. Скопируйте:
   - `Project URL` (anon public)
   - `Project API Key` (anon public)

## 3. Создание таблиц
Идите в SQL Editor и выполните следующий скрипт:

```sql
-- Включаем Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Таблица портфелей
CREATE TABLE portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  balance DECIMAL(15,2) NOT NULL,
  initial_balance DECIMAL(15,2) NOT NULL,
  risk_percentage DECIMAL(5,2) DEFAULT 0.50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица сделок
CREATE TABLE trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  trade_date DATE DEFAULT CURRENT_DATE,
  instrument TEXT,
  timeframe TEXT,
  risk_amount DECIMAL(10,2) NOT NULL,
  stop_loss_points DECIMAL(10,2) NOT NULL,
  lot_size DECIMAL(10,4) NOT NULL,
  account_type TEXT,
  direction TEXT CHECK (direction IN ('buy', 'sell')),
  result DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security политики для портфелей
CREATE POLICY "Users can view own portfolios" ON portfolios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own portfolios" ON portfolios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own portfolios" ON portfolios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own portfolios" ON portfolios FOR DELETE USING (auth.uid() = user_id);

-- Row Level Security политики для сделок
CREATE POLICY "Users can view own trades" ON trades FOR SELECT USING (
  portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert own trades" ON trades FOR INSERT WITH CHECK (
  portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update own trades" ON trades FOR UPDATE USING (
  portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid())
);
CREATE POLICY "Users can delete own trades" ON trades FOR DELETE USING (
  portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid())
);

-- Включаем RLS на таблицах
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Функция для обновления баланса портфеля при добавлении результата сделки
CREATE OR REPLACE FUNCTION update_portfolio_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Обновляем баланс портфеля при добавлении или изменении результата сделки
  IF NEW.result IS NOT NULL THEN
    UPDATE portfolios 
    SET balance = balance + (NEW.result - COALESCE(OLD.result, 0)),
        updated_at = NOW()
    WHERE id = NEW.portfolio_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления баланса
CREATE TRIGGER update_portfolio_balance_trigger
  AFTER INSERT OR UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION update_portfolio_balance();
```

## 4. Настройка аутентификации
1. Идите в Authentication → Settings
2. В "Site URL" добавьте: `http://localhost:3000` (для разработки)
3. Включите провайдеров входа (Email, Google, GitHub по желанию)

После выполнения этих шагов создайте файл `.env` в корне проекта с вашими ключами! 