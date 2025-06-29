// Конфигурация
const API_BASE_URL = window.location.origin;
let supabase = null;
let currentUser = null;
let currentPortfolio = null;
let lastCalculation = null;

// Инициализация Supabase
async function initSupabase() {
    console.log('Initializing Supabase...');
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('window.supabase available:', !!window.supabase);
    
    try {
        // Получаем конфигурацию Supabase из backend API
        const configResponse = await fetch(`${API_BASE_URL}/config`);
        console.log('Config response status:', configResponse.status);
        
        const config = await configResponse.json();
        console.log('Config received:', config);
        
        const supabaseUrl = config.supabase_url;
        const supabaseKey = config.supabase_anon_key;
        
        console.log('Supabase URL:', supabaseUrl);
        console.log('Supabase Key present:', !!supabaseKey);
        
        if (window.supabase && supabaseUrl && supabaseKey) {
            supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
            console.log('Supabase client created successfully');
            
            // Проверяем текущую сессию
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                currentUser = session.user;
                showMainApp();
            }
            
            // Слушаем изменения аутентификации
            supabase.auth.onAuthStateChange((event, session) => {
                currentUser = session?.user || null;
                if (event === 'SIGNED_IN') {
                    showMainApp();
                } else if (event === 'SIGNED_OUT') {
                    showAuth();
                }
            });
        } else {
            console.log('Missing requirements:', {
                windowSupabase: !!window.supabase,
                supabaseUrl: !!supabaseUrl,
                supabaseKey: !!supabaseKey
            });
        }
    } catch (error) {
        console.error('Ошибка инициализации Supabase:', error);
        // Если не удалось получить конфигурацию, работаем без Supabase
    }
}

// Функции аутентификации
async function signIn() {
    console.log('signIn() called');
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    console.log('Email:', email, 'Password length:', password.length);
    
    if (!email || !password) {
        showError('Введите email и пароль');
        return;
    }
    
    if (supabase) {
        console.log('Attempting to sign in with Supabase...');
        const { data, error } = await supabase.auth.signInWithPassword({
            email, password
        });
        
        if (error) {
            console.error('Sign in error:', error);
            showError('Ошибка входа: ' + error.message);
        } else {
            console.log('Sign in successful:', data);
        }
    } else {
        console.log('Supabase not initialized');
        showError('Supabase не настроен. Сначала настройте базу данных.');
        return;
    }
}

async function signUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showError('Введите email и пароль');
        return;
    }
    
    if (password.length < 6) {
        showError('Пароль должен содержать минимум 6 символов');
        return;
    }
    
    if (supabase) {
        const { data, error } = await supabase.auth.signUp({
            email, password
        });
        
        if (error) {
            showError('Ошибка регистрации: ' + error.message);
        } else {
            showSuccess('Проверьте email для подтверждения регистрации');
        }
    } else {
        showError('Supabase не настроен');
    }
}

async function signOut() {
    if (supabase) {
        await supabase.auth.signOut();
    } else {
        currentUser = null;
        showAuth();
    }
}

// Функции интерфейса
function showAuth() {
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('main-app').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('user-info').style.display = 'none';
}

function showMainApp() {
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('main-app').style.display = 'block';
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('user-info').style.display = 'block';
    
    if (currentUser && currentUser.email) {
        document.getElementById('user-email').textContent = currentUser.email;
    }
    
    loadPortfolios();
}

// API функции
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.detail || 'API Error');
        }
        
        return result;
    } catch (error) {
        console.error('API Call failed:', error);
        throw error;
    }
}

// Функции работы с портфелями
async function createPortfolio() {
    const name = document.getElementById('portfolio-name').value;
    const balance = parseFloat(document.getElementById('initial-balance').value);
    const riskPercentage = parseFloat(document.getElementById('risk-percentage').value);
    
    if (!name || !balance || !riskPercentage) {
        showError('Заполните все поля');
        return;
    }
    
    if (!supabase || !currentUser) {
        showError('Необходима авторизация');
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('portfolios')
            .insert([{
                user_id: currentUser.id,
                name: name,
                balance: balance,
                initial_balance: balance,
                risk_percentage: riskPercentage
            }])
            .select();
        
        if (error) {
            throw new Error(error.message);
        }
        
        showSuccess('Портфель создан успешно');
        document.getElementById('portfolio-name').value = '';
        document.getElementById('initial-balance').value = '';
        document.getElementById('risk-percentage').value = '0.5';
        
        loadPortfolios();
    } catch (error) {
        showError('Ошибка создания портфеля: ' + error.message);
    }
}

async function loadPortfolios() {
    if (!supabase || !currentUser) {
        return;
    }
    
    try {
        const { data: portfolios, error } = await supabase
            .from('portfolios')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) {
            throw new Error(error.message);
        }
        
        const select = document.getElementById('portfolio-select');
        select.innerHTML = '<option value="">Выберите портфель</option>';
        
        portfolios.forEach(portfolio => {
            const option = document.createElement('option');
            option.value = portfolio.id;
            option.textContent = `${portfolio.name} (${portfolio.balance} ₽)`;
            select.appendChild(option);
        });
    } catch (error) {
        showError('Ошибка загрузки портфелей: ' + error.message);
    }
}

async function selectPortfolio() {
    const portfolioId = document.getElementById('portfolio-select').value;
    
    if (!portfolioId) {
        document.getElementById('portfolio-info').classList.add('hidden');
        currentPortfolio = null;
        document.getElementById('save-trade-btn').disabled = true;
        return;
    }
    
    if (!supabase || !currentUser) {
        showError('Необходима авторизация');
        return;
    }
    
    try {
        const { data: portfolios, error } = await supabase
            .from('portfolios')
            .select('*')
            .eq('id', portfolioId)
            .eq('user_id', currentUser.id)
            .single();
        
        if (error) {
            throw new Error(error.message);
        }
        
        const riskAmount = (portfolios.balance * portfolios.risk_percentage) / 100;
        
        currentPortfolio = {
            id: portfolioId,
            balance: portfolios.balance,
            riskPercentage: portfolios.risk_percentage,
            riskAmount: riskAmount
        };
        
        document.getElementById('current-balance').textContent = portfolios.balance;
        document.getElementById('risk-percent').textContent = portfolios.risk_percentage;
        document.getElementById('risk-amount').textContent = riskAmount.toFixed(2);
        document.getElementById('portfolio-info').classList.remove('hidden');
        
        loadTrades();
    } catch (error) {
        showError('Ошибка загрузки портфеля: ' + error.message);
    }
}

// Калькулятор лотов
async function calculateLot() {
    if (!currentPortfolio) {
        showError('Сначала выберите портфель');
        return;
    }
    
    const stopLoss = parseFloat(document.getElementById('stop-loss').value);
    const instrument = document.getElementById('instrument').value;
    const timeframe = document.getElementById('timeframe').value;
    const direction = document.getElementById('direction').value;
    
    if (!stopLoss || stopLoss <= 0) {
        showError('Введите корректный стоп-лосс');
        return;
    }
    
    try {
        // Отправляем данные как query параметры для простоты
        const response = await fetch(`${API_BASE_URL}/calculate-lot?risk=${currentPortfolio.riskAmount}&stop_loss=${stopLoss}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error);
        }
        
        lastCalculation = {
            riskAmount: result.risk,
            stopLoss: result.stop_loss,
            lotSize: result.lot_size,
            instrument: instrument,
            timeframe: timeframe,
            direction: direction
        };
        
        document.getElementById('calculation-result').innerHTML = `
            <div class="result">
                <h4>Результат расчета:</h4>
                <p><strong>Риск:</strong> ${result.risk} $</p>
                <p><strong>Стоп-лосс:</strong> ${result.stop_loss} пунктов</p>
                <p><strong>Размер лота:</strong> ${result.lot_size}</p>
                <p><em>Формула: Лот = Риск ÷ Стоп-лосс ÷ 10</em></p>
            </div>
        `;
        
        document.getElementById('save-trade-btn').disabled = false;
    } catch (error) {
        showError('Ошибка расчета: ' + error.message);
    }
}

// Сохранение сделки
async function saveTrade() {
    if (!currentPortfolio || !lastCalculation) {
        showError('Сначала рассчитайте лот');
        return;
    }
    
    if (!supabase || !currentUser) {
        showError('Необходима авторизация');
        return;
    }
    
    const result = parseFloat(document.getElementById('trade-result').value) || 0;
    const notes = document.getElementById('trade-notes').value;
    
    try {
        // Сохраняем сделку в Supabase
        const { data, error } = await supabase
            .from('trades')
            .insert([{
                portfolio_id: currentPortfolio.id,
                user_id: currentUser.id,
                instrument: lastCalculation.instrument || null,
                timeframe: lastCalculation.timeframe || null,
                risk_amount: lastCalculation.riskAmount,
                stop_loss_points: lastCalculation.stopLoss,
                lot_size: lastCalculation.lotSize,
                direction: lastCalculation.direction || null,
                result: result,
                notes: notes || null
            }])
            .select();
        
        if (error) {
            throw new Error(error.message);
        }
        
        showSuccess('Сделка сохранена успешно');
        document.getElementById('trade-result').value = '';
        document.getElementById('trade-notes').value = '';
        
        // Баланс автоматически обновится через триггер в базе
        // Обновляем информацию о портфеле
        await selectPortfolio();
        
        loadTrades();
    } catch (error) {
        showError('Ошибка сохранения сделки: ' + error.message);
    }
}

// Загрузка сделок
async function loadTrades() {
    if (!currentPortfolio || !supabase || !currentUser) return;
    
    try {
        const { data: trades, error } = await supabase
            .from('trades')
            .select('*')
            .eq('portfolio_id', currentPortfolio.id)
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) {
            throw new Error(error.message);
        }
        
        // Сохраняем сделки в кэш для быстрого доступа
        allTrades = trades || [];
        
        const tbody = document.getElementById('trades-tbody');
        tbody.innerHTML = '';
        
        trades.forEach(trade => {
            const row = document.createElement('tr');
            const tradeDate = trade.trade_date || new Date(trade.created_at).toLocaleDateString('ru-RU');
            
            row.innerHTML = `
                <td>${tradeDate}</td>
                <td>${trade.instrument || '-'}</td>
                <td>${trade.timeframe || '-'}</td>
                <td>${trade.direction || '-'}</td>
                <td>${trade.risk_amount}</td>
                <td>${trade.stop_loss_points}</td>
                <td>${trade.lot_size}</td>
                <td style="color: ${trade.result > 0 ? 'green' : trade.result < 0 ? 'red' : 'black'}">${trade.result || '0'}</td>
                <td>${trade.notes || '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-small btn-edit" onclick="openEditModal(${trade.id})">
                            ✏️ Изменить
                        </button>
                        <button class="btn-small btn-delete" onclick="deleteTrade(${trade.id})">
                            🗑️ Удалить
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        showError('Ошибка загрузки сделок: ' + error.message);
    }
}

// Утилиты для уведомлений
function showToast(message, type = 'info', title = null, duration = 5000) {
    const container = document.getElementById('toast-container');
    
    // Определяем иконки для разных типов
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    // Определяем заголовки по умолчанию
    const defaultTitles = {
        success: 'Успешно',
        error: 'Ошибка',
        warning: 'Внимание',
        info: 'Информация'
    };
    
    // Создаем элемент toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.info}</div>
        <div class="toast-content">
            ${title ? `<div class="toast-title">${title}</div>` : `<div class="toast-title">${defaultTitles[type] || defaultTitles.info}</div>`}
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="closeToast(this.parentElement)">×</button>
    `;
    
    // Добавляем в контейнер
    container.appendChild(toast);
    
    // Показываем с анимацией
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Автоматически скрываем через заданное время
    if (duration > 0) {
        setTimeout(() => {
            closeToast(toast);
        }, duration);
    }
    
    return toast;
}

function closeToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
        if (toast.parentElement) {
            toast.parentElement.removeChild(toast);
        }
    }, 300);
}

function showError(message, title = null) {
    showToast(message, 'error', title);
}

function showSuccess(message, title = null) {
    showToast(message, 'success', title);
}

function showWarning(message, title = null) {
    showToast(message, 'warning', title);
}

function showInfo(message, title = null) {
    showToast(message, 'info', title);
}

// Функции редактирования и удаления сделок
let editingTradeId = null;
let allTrades = []; // Кэш всех сделок для быстрого поиска

async function openEditModal(tradeId) {
    console.log('Opening edit modal for trade:', tradeId);
    
    // Находим сделку в кэше
    const trade = allTrades.find(t => t.id === tradeId);
    if (!trade) {
        showError('Сделка не найдена');
        return;
    }
    
    editingTradeId = tradeId;
    
    // Заполняем форму данными сделки
    document.getElementById('edit-trade-id').value = trade.id;
    document.getElementById('edit-instrument').value = trade.instrument || '';
    document.getElementById('edit-timeframe').value = trade.timeframe || 'H1';
    document.getElementById('edit-direction').value = trade.direction || 'buy';
    document.getElementById('edit-risk-amount').value = trade.risk_amount || '';
    document.getElementById('edit-stop-loss').value = trade.stop_loss_points || '';
    document.getElementById('edit-lot-size').value = trade.lot_size || '';
    document.getElementById('edit-result').value = trade.result || '';
    document.getElementById('edit-notes').value = trade.notes || '';
    
    // Показываем модальное окно
    const modal = document.getElementById('edit-trade-modal');
    modal.classList.add('show');
    
    // Добавляем обработчик для закрытия по клику вне модального окна
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeEditModal();
        }
    };
}

function closeEditModal() {
    const modal = document.getElementById('edit-trade-modal');
    modal.classList.remove('show');
    editingTradeId = null;
    
    // Очищаем форму
    document.getElementById('edit-trade-form').reset();
}

async function saveEditedTrade() {
    if (!editingTradeId || !supabase || !currentUser) {
        showError('Ошибка: нет данных для сохранения');
        return;
    }
    
    const updatedData = {
        instrument: document.getElementById('edit-instrument').value,
        timeframe: document.getElementById('edit-timeframe').value,
        direction: document.getElementById('edit-direction').value,
        stop_loss_points: parseFloat(document.getElementById('edit-stop-loss').value) || 0,
        result: parseFloat(document.getElementById('edit-result').value) || 0,
        notes: document.getElementById('edit-notes').value
    };
    
    // Пересчитываем размер лота если изменился стоп-лосс
    const riskAmount = parseFloat(document.getElementById('edit-risk-amount').value) || 0;
    if (updatedData.stop_loss_points > 0) {
        updatedData.lot_size = riskAmount / updatedData.stop_loss_points / 10;
    }
    
    try {
        const { error } = await supabase
            .from('trades')
            .update(updatedData)
            .eq('id', editingTradeId)
            .eq('user_id', currentUser.id);
        
        if (error) {
            throw new Error(error.message);
        }
        
        showSuccess('Сделка успешно обновлена');
        closeEditModal();
        
        // Обновляем список сделок и информацию о портфеле
        await loadTrades();
        await selectPortfolio(); // Обновляем баланс портфеля
        
    } catch (error) {
        showError('Ошибка обновления сделки: ' + error.message);
    }
}

async function deleteTrade(tradeId) {
    if (!confirm('Вы уверены, что хотите удалить эту сделку? Это действие нельзя отменить.')) {
        return;
    }
    
    if (!supabase || !currentUser) {
        showError('Необходима авторизация');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('trades')
            .delete()
            .eq('id', tradeId)
            .eq('user_id', currentUser.id);
        
        if (error) {
            throw new Error(error.message);
        }
        
        showSuccess('Сделка успешно удалена');
        
        // Обновляем список сделок и информацию о портфеле
        await loadTrades();
        await selectPortfolio(); // Обновляем баланс портфеля
        
    } catch (error) {
        showError('Ошибка удаления сделки: ' + error.message);
    }
}

// Добавляем обработчик для пересчета лота при изменении стоп-лосса в модальном окне
document.addEventListener('DOMContentLoaded', () => {
    const editStopLoss = document.getElementById('edit-stop-loss');
    const editLotSize = document.getElementById('edit-lot-size');
    const editRiskAmount = document.getElementById('edit-risk-amount');
    
    if (editStopLoss) {
        editStopLoss.addEventListener('input', () => {
            const stopLoss = parseFloat(editStopLoss.value) || 0;
            const riskAmount = parseFloat(editRiskAmount.value) || 0;
            
            if (stopLoss > 0 && riskAmount > 0) {
                const lotSize = riskAmount / stopLoss / 10;
                editLotSize.value = lotSize.toFixed(4);
            }
        });
    }
    
    // Закрытие модального окна по Escape
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeEditModal();
        }
    });
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    await initSupabase();
    
    // Проверяем работу API
    try {
        const health = await apiCall('/health');
        console.log('API Health:', health);
    } catch (error) {
        console.warn('API недоступен:', error.message);
    }
}); 