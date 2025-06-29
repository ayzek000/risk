// Supabase client configuration
class SupabaseClient {
    constructor() {
        // В продакшене эти переменные должны быть в .env файле
        this.supabaseUrl = 'YOUR_SUPABASE_URL'; // Замените на ваш URL
        this.supabaseKey = 'YOUR_SUPABASE_ANON_KEY'; // Замените на ваш ключ
        
        // Инициализация клиента (будет загружена из CDN)
        this.client = null;
        this.user = null;
        
        this.initClient();
    }

    async initClient() {
        // Загружаем Supabase из CDN
        if (!window.supabase) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            document.head.appendChild(script);
            
            await new Promise(resolve => {
                script.onload = resolve;
            });
        }

        this.client = window.supabase.createClient(this.supabaseUrl, this.supabaseKey);
        
        // Проверяем текущую сессию
        const { data: { session } } = await this.client.auth.getSession();
        if (session) {
            this.user = session.user;
        }

        // Слушаем изменения аутентификации
        this.client.auth.onAuthStateChange((event, session) => {
            this.user = session?.user || null;
            this.onAuthChange(event, session);
        });
    }

    onAuthChange(event, session) {
        if (event === 'SIGNED_IN') {
            console.log('Пользователь вошел:', session.user.email);
            window.location.reload(); // Перезагружаем страницу
        } else if (event === 'SIGNED_OUT') {
            console.log('Пользователь вышел');
            window.location.reload();
        }
    }

    // Регистрация
    async signUp(email, password) {
        const { data, error } = await this.client.auth.signUp({
            email,
            password
        });
        return { data, error };
    }

    // Вход
    async signIn(email, password) {
        const { data, error } = await this.client.auth.signInWithPassword({
            email,
            password
        });
        return { data, error };
    }

    // Выход
    async signOut() {
        const { error } = await this.client.auth.signOut();
        return { error };
    }

    // Получение профилей пользователя
    async getProfiles() {
        if (!this.user) return { data: [], error: 'Не авторизован' };
        
        const { data, error } = await this.client
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: true });
        
        return { data, error };
    }

    // Создание нового профиля
    async createProfile(name, defaultRisk = 100) {
        if (!this.user) return { error: 'Не авторизован' };
        
        const { data, error } = await this.client
            .from('profiles')
            .insert([
                {
                    user_id: this.user.id,
                    name,
                    default_risk: defaultRisk
                }
            ])
            .select();
        
        return { data, error };
    }

    // Сохранение сделки
    async saveTrade(profileId, riskAmount, stopLoss, lotSize, notes = '') {
        if (!this.user) return { error: 'Не авторизован' };
        
        const { data, error } = await this.client
            .from('trades')
            .insert([
                {
                    user_id: this.user.id,
                    profile_id: profileId,
                    risk_amount: riskAmount,
                    stop_loss: stopLoss,
                    lot_size: lotSize,
                    notes
                }
            ])
            .select();
        
        return { data, error };
    }

    // Получение сделок
    async getTrades(limit = 50) {
        if (!this.user) return { data: [], error: 'Не авторизован' };
        
        const { data, error } = await this.client
            .from('trades')
            .select(`
                *,
                profiles (name)
            `)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        return { data, error };
    }

    // Получение статистики
    async getStatistics() {
        if (!this.user) return { data: null, error: 'Не авторизован' };
        
        const { data, error } = await this.client
            .from('trades')
            .select('risk_amount, lot_size, profit_loss, created_at')
            .order('created_at', { ascending: false });

        if (error) return { data: null, error };

        // Вычисляем статистику
        const stats = {
            totalTrades: data.length,
            totalRisk: data.reduce((sum, trade) => sum + parseFloat(trade.risk_amount), 0),
            averageLot: data.length > 0 ? data.reduce((sum, trade) => sum + parseFloat(trade.lot_size), 0) / data.length : 0,
            totalPnL: data.reduce((sum, trade) => sum + parseFloat(trade.profit_loss || 0), 0),
            tradesThisMonth: data.filter(trade => {
                const tradeDate = new Date(trade.created_at);
                const now = new Date();
                return tradeDate.getMonth() === now.getMonth() && tradeDate.getFullYear() === now.getFullYear();
            }).length
        };

        return { data: stats, error: null };
    }

    // Проверка авторизации
    isAuthenticated() {
        return !!this.user;
    }

    // Получение пользователя
    getCurrentUser() {
        return this.user;
    }
}

// Создаем глобальный экземпляр
window.supabaseManager = new SupabaseClient(); 