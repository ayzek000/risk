-- Создание таблицы портфелей
CREATE TABLE IF NOT EXISTS portfolios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    initial_balance DECIMAL(15,2) NOT NULL,
    risk_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы сделок
CREATE TABLE IF NOT EXISTS trades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    trade_date DATE DEFAULT CURRENT_DATE,
    instrument VARCHAR(50),
    timeframe VARCHAR(10),
    risk_amount DECIMAL(15,2) NOT NULL,
    stop_loss_points DECIMAL(10,2) NOT NULL,
    lot_size DECIMAL(10,4) NOT NULL,
    account_type VARCHAR(50),
    direction VARCHAR(10),
    result DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Функция для автоматического обновления баланса портфеля
CREATE OR REPLACE FUNCTION update_portfolio_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Обновляем баланс портфеля на основе результата сделки
    IF TG_OP = 'INSERT' THEN
        UPDATE portfolios 
        SET balance = balance + COALESCE(NEW.result, 0),
            updated_at = NOW()
        WHERE id = NEW.portfolio_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Если результат изменился, корректируем баланс
        UPDATE portfolios 
        SET balance = balance - COALESCE(OLD.result, 0) + COALESCE(NEW.result, 0),
            updated_at = NOW()
        WHERE id = NEW.portfolio_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Убираем результат удаленной сделки из баланса
        UPDATE portfolios 
        SET balance = balance - COALESCE(OLD.result, 0),
            updated_at = NOW()
        WHERE id = OLD.portfolio_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Создание триггера для автоматического обновления баланса
DROP TRIGGER IF EXISTS trigger_update_portfolio_balance ON trades;
CREATE TRIGGER trigger_update_portfolio_balance
    AFTER INSERT OR UPDATE OR DELETE ON trades
    FOR EACH ROW
    EXECUTE FUNCTION update_portfolio_balance();

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_portfolios_updated_at 
    BEFORE UPDATE ON portfolios
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trades_updated_at 
    BEFORE UPDATE ON trades
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Настройка Row Level Security (RLS)
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Политики безопасности для portfolios
CREATE POLICY "Пользователи могут видеть только свои портфели" ON portfolios
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут создавать свои портфели" ON portfolios
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Пользователи могут обновлять свои портфели" ON portfolios
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут удалять свои портфели" ON portfolios
    FOR DELETE USING (auth.uid() = user_id);

-- Политики безопасности для trades
CREATE POLICY "Пользователи могут видеть только свои сделки" ON trades
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут создавать свои сделки" ON trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Пользователи могут обновлять свои сделки" ON trades
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут удалять свои сделки" ON trades
    FOR DELETE USING (auth.uid() = user_id);

-- Индексы для улучшения производительности
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_portfolio_id ON trades(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_trade_date ON trades(trade_date);

-- Вставка примерных данных (опционально)
-- INSERT INTO portfolios (user_id, name, balance, initial_balance, risk_percentage) 
-- VALUES (auth.uid(), 'Основной счет', 10000.00, 10000.00, 0.5);

COMMENT ON TABLE portfolios IS 'Таблица торговых портфелей пользователей';
COMMENT ON TABLE trades IS 'Таблица торговых сделок';
COMMENT ON FUNCTION update_portfolio_balance() IS 'Автоматическое обновление баланса портфеля при изменении сделок'; 