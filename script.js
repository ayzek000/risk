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
        
        const tbody = document.getElementById('trades-tbody');
        tbody.innerHTML = '';
        
        // Сохраняем сделки в кэш для быстрого доступа
        allTrades = trades || [];
        
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
        
        // Обновляем аналитику после загрузки сделок
        updateAnalytics();
        
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
let profitChart = null; // Глобальная переменная для графика
let currentChartPeriod = '7d'; // Текущий период графика

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
    
    // Добавляем обработчик для пересчета лота при изменении стоп-лосса в модальном окне
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

// Функции для аналитики и графиков
function createProfitChart(trades, period) {
    const ctx = document.getElementById('profitChart').getContext('2d');
    
    // Уничтожаем старый график если существует
    if (profitChart) {
        profitChart.destroy();
    }
    
    // Фильтруем данные по периоду
    const filteredTrades = filterTradesByPeriod(trades, period);
    
    // Сортируем по дате
    const sortedTrades = filteredTrades.sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
    );
    
    // Создаем данные для графика (накопительная прибыль)
    let cumulativeProfit = 0;
    const chartData = [];
    const labels = [];
    
    sortedTrades.forEach(trade => {
        cumulativeProfit += trade.result || 0;
        chartData.push(cumulativeProfit);
        labels.push(new Date(trade.created_at).toLocaleDateString('ru-RU'));
    });
    
    // Добавляем начальную точку (0)
    if (chartData.length > 0) {
        chartData.unshift(0);
        labels.unshift('Начало');
    }
    
    profitChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Накопительная P&L ($)',
                data: chartData,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    },
                    ticks: {
                        maxTicksLimit: 8
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        }
                    }
                }
            },
            elements: {
                point: {
                    hoverBackgroundColor: '#667eea'
                }
            }
        }
    });
}

function filterTradesByPeriod(trades, period) {
    const now = new Date();
    let startDate = new Date();
    
    switch(period) {
        case '7d':
            startDate.setDate(now.getDate() - 7);
            break;
        case '1m':
            startDate.setMonth(now.getMonth() - 1);
            break;
        case '3m':
            startDate.setMonth(now.getMonth() - 3);
            break;
        case 'all':
        default:
            return trades;
    }
    
    return trades.filter(trade => new Date(trade.created_at) >= startDate);
}

function calculateStatistics(trades) {
    if (!trades || trades.length === 0) {
        // Сбрасываем статистику если нет сделок
        document.getElementById('total-pnl').textContent = '$0';
        document.getElementById('total-trades').textContent = '0';
        document.getElementById('winning-trades').textContent = '0';
        document.getElementById('win-rate').textContent = '0%';
        document.getElementById('avg-win').textContent = '$0';
        document.getElementById('avg-loss').textContent = '$0';
        return;
    }
    
    const totalPnL = trades.reduce((sum, trade) => sum + (trade.result || 0), 0);
    const totalTrades = trades.length;
    const winningTrades = trades.filter(trade => (trade.result || 0) > 0);
    const losingTrades = trades.filter(trade => (trade.result || 0) < 0);
    
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
    const avgWin = winningTrades.length > 0 ? 
        winningTrades.reduce((sum, trade) => sum + trade.result, 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? 
        losingTrades.reduce((sum, trade) => sum + trade.result, 0) / losingTrades.length : 0;
    
    // Обновляем статистику
    const totalPnLElement = document.getElementById('total-pnl');
    totalPnLElement.textContent = `$${totalPnL.toFixed(2)}`;
    totalPnLElement.parentElement.className = `stat-item ${totalPnL >= 0 ? 'stat-positive' : 'stat-negative'}`;
    
    document.getElementById('total-trades').textContent = totalTrades;
    document.getElementById('winning-trades').textContent = winningTrades.length;
    document.getElementById('win-rate').textContent = `${winRate.toFixed(1)}%`;
    document.getElementById('avg-win').textContent = `$${avgWin.toFixed(2)}`;
    document.getElementById('avg-loss').textContent = `$${avgLoss.toFixed(2)}`;
}

function calculateInstrumentStats(trades) {
    const instrumentsContainer = document.getElementById('instruments-stats');
    
    if (!trades || trades.length === 0) {
        instrumentsContainer.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">Нет данных</p>';
        return;
    }
    
    // Группируем сделки по инструментам
    const instrumentStats = {};
    
    trades.forEach(trade => {
        const instrument = trade.instrument || 'Неизвестный';
        if (!instrumentStats[instrument]) {
            instrumentStats[instrument] = {
                trades: 0,
                totalResult: 0,
                winningTrades: 0
            };
        }
        
        instrumentStats[instrument].trades++;
        instrumentStats[instrument].totalResult += trade.result || 0;
        if ((trade.result || 0) > 0) {
            instrumentStats[instrument].winningTrades++;
        }
    });
    
    // Сортируем по количеству сделок
    const sortedInstruments = Object.entries(instrumentStats)
        .sort(([,a], [,b]) => b.trades - a.trades);
    
    // Генерируем HTML
    let html = '';
    sortedInstruments.forEach(([instrument, stats]) => {
        const winRate = (stats.winningTrades / stats.trades * 100).toFixed(1);
        const resultClass = stats.totalResult >= 0 ? 'stat-positive' : 'stat-negative';
        
        html += `
            <div class="instrument-item">
                <div>
                    <div class="instrument-name">${instrument}</div>
                    <div class="instrument-trades">${stats.trades} сделок • ${winRate}% прибыльных</div>
                </div>
                <div class="instrument-result ${resultClass}">
                    $${stats.totalResult.toFixed(2)}
                </div>
            </div>
        `;
    });
    
    instrumentsContainer.innerHTML = html;
}

function changeChartPeriod(period) {
    currentChartPeriod = period;
    
    // Обновляем активную кнопку
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Перестраиваем график
    createProfitChart(allTrades, period);
}

function updateAnalytics() {
    if (!allTrades || allTrades.length === 0) {
        // Если нет сделок, показываем пустые данные
        calculateStatistics([]);
        calculateInstrumentStats([]);
        updateDashboard([]);
        if (profitChart) {
            profitChart.destroy();
            profitChart = null;
        }
        return;
    }
    
    // Обновляем все аналитические данные
    createProfitChart(allTrades, currentChartPeriod);
    calculateStatistics(allTrades);
    calculateInstrumentStats(allTrades);
    updateDashboard(allTrades);
}

// Функции для дашборда
function updateDashboard(trades) {
    if (!trades || trades.length === 0) {
        resetDashboard();
        return;
    }
    
    const metrics = calculateAdvancedMetrics(trades);
    updatePerformanceIndicators(metrics);
    updateSummaryCards(metrics);
}

function calculateAdvancedMetrics(trades) {
    const totalTrades = trades.length;
    const winningTrades = trades.filter(trade => (trade.result || 0) > 0);
    const losingTrades = trades.filter(trade => (trade.result || 0) < 0);
    
    const totalProfit = winningTrades.reduce((sum, trade) => sum + trade.result, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.result, 0));
    const totalPnL = trades.reduce((sum, trade) => sum + (trade.result || 0), 0);
    
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : 0;
    const avgTrade = totalTrades > 0 ? totalPnL / totalTrades : 0;
    const avgRisk = totalTrades > 0 ? trades.reduce((sum, trade) => sum + (trade.risk_amount || 0), 0) / totalTrades : 0;
    
    // Лучшая и худшая сделки
    const results = trades.map(trade => trade.result || 0);
    const bestTrade = results.length > 0 ? Math.max(...results) : 0;
    const worstTrade = results.length > 0 ? Math.min(...results) : 0;
    
    // Серии побед и поражений
    const streaks = calculateStreaks(trades);
    
    // Консистентность (обратная величина стандартного отклонения)
    const consistency = calculateConsistency(trades);
    
    // ROI (если есть данные о начальном балансе)
    const roi = currentPortfolio && currentPortfolio.initial_balance > 0 ? 
        (totalPnL / currentPortfolio.initial_balance) * 100 : 0;
    
    return {
        winRate,
        profitFactor,
        avgTrade,
        consistency,
        totalProfit,
        totalLoss,
        avgRisk,
        roi,
        bestTrade,
        worstTrade,
        maxWinningStreak: streaks.maxWinning,
        maxLosingStreak: streaks.maxLosing
    };
}

function calculateStreaks(trades) {
    let maxWinning = 0;
    let maxLosing = 0;
    let currentWinning = 0;
    let currentLosing = 0;
    
    // Сортируем по дате
    const sortedTrades = trades.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    sortedTrades.forEach(trade => {
        const result = trade.result || 0;
        
        if (result > 0) {
            currentWinning++;
            currentLosing = 0;
            maxWinning = Math.max(maxWinning, currentWinning);
        } else if (result < 0) {
            currentLosing++;
            currentWinning = 0;
            maxLosing = Math.max(maxLosing, currentLosing);
        } else {
            currentWinning = 0;
            currentLosing = 0;
        }
    });
    
    return { maxWinning, maxLosing };
}

function calculateConsistency(trades) {
    if (trades.length < 2) return 0;
    
    const results = trades.map(trade => trade.result || 0);
    const mean = results.reduce((sum, val) => sum + val, 0) / results.length;
    const variance = results.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / results.length;
    const stdDev = Math.sqrt(variance);
    
    // Консистентность как обратная величина коэффициента вариации
    if (mean === 0) return 0;
    const coefficientOfVariation = Math.abs(stdDev / mean);
    return Math.max(0, 100 - (coefficientOfVariation * 100));
}

function updatePerformanceIndicators(metrics) {
    // Win Rate
    updateIndicator('winrate', metrics.winRate, '%', 
        metrics.winRate >= 60 ? 'excellent' : 
        metrics.winRate >= 50 ? 'good' : 
        metrics.winRate >= 40 ? 'warning' : 'danger');
    
    // Profit Factor
    updateIndicator('profit-factor', metrics.profitFactor, '', 
        metrics.profitFactor >= 2 ? 'excellent' : 
        metrics.profitFactor >= 1.5 ? 'good' : 
        metrics.profitFactor >= 1 ? 'warning' : 'danger');
    
    // Average Trade
    updateIndicator('avg-trade', metrics.avgTrade, '$', 
        metrics.avgTrade >= 50 ? 'excellent' : 
        metrics.avgTrade >= 10 ? 'good' : 
        metrics.avgTrade >= 0 ? 'warning' : 'danger');
    
    // Consistency
    updateIndicator('consistency', metrics.consistency, '%', 
        metrics.consistency >= 80 ? 'excellent' : 
        metrics.consistency >= 60 ? 'good' : 
        metrics.consistency >= 40 ? 'warning' : 'danger');
}

function updateIndicator(type, value, suffix, level) {
    const valueElement = document.getElementById(`dashboard-${type}`);
    const progressElement = document.getElementById(`${type}-progress`);
    const cardElement = document.getElementById(`${type}-indicator`);
    
    if (valueElement) {
        if (suffix === '$') {
            valueElement.textContent = `$${value.toFixed(2)}`;
        } else if (suffix === '%') {
            valueElement.textContent = `${value.toFixed(1)}%`;
        } else {
            valueElement.textContent = value.toFixed(2);
        }
    }
    
    if (progressElement) {
        let progressValue = 0;
        if (type === 'winrate' || type === 'consistency') {
            progressValue = Math.min(100, value);
        } else if (type === 'profit-factor') {
            progressValue = Math.min(100, (value / 3) * 100);
        } else if (type === 'avg-trade') {
            progressValue = Math.min(100, Math.max(0, (value + 100) / 2));
        }
        
        progressElement.style.width = `${progressValue}%`;
        progressElement.className = `progress-fill ${level}`;
    }
    
    if (cardElement) {
        cardElement.className = `indicator-card ${level}`;
    }
}

function updateSummaryCards(metrics) {
    // Торговая статистика
    document.getElementById('best-trade').textContent = `$${metrics.bestTrade.toFixed(2)}`;
    document.getElementById('worst-trade').textContent = `$${metrics.worstTrade.toFixed(2)}`;
    document.getElementById('max-winning-streak').textContent = metrics.maxWinningStreak;
    document.getElementById('max-losing-streak').textContent = metrics.maxLosingStreak;
    
    // Финансовые показатели
    document.getElementById('total-profit').textContent = `$${metrics.totalProfit.toFixed(2)}`;
    document.getElementById('total-loss').textContent = `$${metrics.totalLoss.toFixed(2)}`;
    document.getElementById('avg-risk').textContent = `$${metrics.avgRisk.toFixed(2)}`;
    document.getElementById('roi-metric').textContent = `${metrics.roi.toFixed(1)}%`;
    
    // Цветовая индикация
    const bestTradeEl = document.getElementById('best-trade');
    const worstTradeEl = document.getElementById('worst-trade');
    const roiEl = document.getElementById('roi-metric');
    
    bestTradeEl.style.color = metrics.bestTrade > 0 ? '#28a745' : '#dc3545';
    worstTradeEl.style.color = metrics.worstTrade < 0 ? '#dc3545' : '#28a745';
    roiEl.style.color = metrics.roi > 0 ? '#28a745' : metrics.roi < 0 ? '#dc3545' : '#6c757d';
}

function resetDashboard() {
    // Сброс индикаторов
    ['winrate', 'profit-factor', 'avg-trade', 'consistency'].forEach(type => {
        const valueElement = document.getElementById(`dashboard-${type}`);
        const progressElement = document.getElementById(`${type}-progress`);
        const cardElement = document.getElementById(`${type}-indicator`);
        
        if (valueElement) valueElement.textContent = type.includes('factor') ? '0.00' : '0%';
        if (progressElement) {
            progressElement.style.width = '0%';
            progressElement.className = 'progress-fill';
        }
        if (cardElement) cardElement.className = 'indicator-card';
    });
    
    // Сброс сводных карточек
    const summaryElements = [
        'best-trade', 'worst-trade', 'max-winning-streak', 'max-losing-streak',
        'total-profit', 'total-loss', 'avg-risk', 'roi-metric'
    ];
    
    summaryElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (id.includes('streak')) {
                element.textContent = '0';
            } else if (id.includes('roi')) {
                element.textContent = '0%';
            } else {
                element.textContent = '$0';
            }
            element.style.color = '';
        }
    });
} 