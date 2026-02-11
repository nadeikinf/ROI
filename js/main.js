/**
 * Главный модуль приложения
 * Инициализация и связывание компонентов
 */

(function() {
    'use strict';

    // ========================================
    // Переменные
    // ========================================

    let debounceTimer = null;
    const DEBOUNCE_DELAY = 50; // мс

    // ========================================
    // Функции
    // ========================================

    /**
     * Выполнение расчёта и обновление UI
     */
    function performCalculation() {
        const values = UI.getInputValues();
        const results = Calculator.calculate(values);
        
        UI.updateResults(results);
        UI.updateChart(results.chartData);
    }

    /**
     * Debounce функция для оптимизации частых обновлений
     * @param {Function} func - Функция для выполнения
     * @param {number} delay - Задержка в мс
     */
    function debounce(func, delay) {
        return function() {
            const context = this;
            const args = arguments;
            
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function() {
                func.apply(context, args);
            }, delay);
        };
    }

    /**
     * Обработчик изменения ползунка
     * @param {Event} event - Событие input
     */
    function handleSliderChange(event) {
        const target = event.target;
        const value = parseInt(target.value);
        const valueElementId = target.id + 'Value';
        
        UI.updateSliderDisplay(valueElementId, value);
        performCalculation();
    }

    /**
     * Обработчик клика по плитке выбора
     * @param {Event} event - Событие click
     */
    function handleTileSelectClick(event) {
        const option = event.target.closest('.tile-select__option');
        if (!option) return;
        
        const container = option.closest('.tile-select');
        if (!container) return;
        
        // Убираем активный класс со всех опций в контейнере
        container.querySelectorAll('.tile-select__option').forEach(opt => {
            opt.classList.remove('tile-select__option--active');
        });
        
        // Добавляем активный класс выбранной опции
        option.classList.add('tile-select__option--active');
        
        // Выполняем перерасчёт
        performCalculation();
    }

    /**
     * Инициализация обработчиков событий
     */
    function initEventListeners() {
        const debouncedCalculation = debounce(performCalculation, DEBOUNCE_DELAY);

        // Ползунки
        const sliders = ['requests', 'time', 'salary'];
        sliders.forEach(function(id) {
            const element = UI.elements[id];
            if (element) {
                element.addEventListener('input', function(event) {
                    handleSliderChange(event);
                });
                
                // Для touch устройств оптимизируем обновление
                element.addEventListener('input', debouncedCalculation);
            }
        });

        // Плитки выбора (complexity, provider)
        const tileSelects = ['complexity', 'provider'];
        tileSelects.forEach(function(id) {
            const container = document.getElementById(id);
            if (container) {
                container.addEventListener('click', handleTileSelectClick);
            }
        });

        // Кнопка отправки в Telegram
        const telegramBtn = UI.elements.sendToTelegramBtn;
        if (telegramBtn) {
            telegramBtn.addEventListener('click', handleTelegramSend);
        }
    }

    /**
     * Инициализация начальных значений
     */
    function initValues() {
        // Устанавливаем отображение начальных значений ползунков
        if (UI.elements.requests) {
            UI.updateSliderDisplay('requestsValue', parseInt(UI.elements.requests.value));
        }
        if (UI.elements.time) {
            UI.updateSliderDisplay('timeValue', parseInt(UI.elements.time.value));
        }
        if (UI.elements.salary) {
            UI.updateSliderDisplay('salaryValue', parseInt(UI.elements.salary.value));
        }
    }

    // ========================================
    // Telegram Integration
    // ========================================

    /**
     * Создание модального окна для ввода данных Telegram
     */
    function createTelegramModal() {
        const modal = document.createElement('div');
        modal.className = 'telegram-modal';
        modal.id = 'telegramModal';
        modal.innerHTML = `
            <div class="telegram-modal__content">
                <h3 class="telegram-modal__title">Отправить результаты в Telegram</h3>
                <div class="telegram-modal__tabs">
                    <button class="telegram-modal__tab telegram-modal__tab--active" data-tab="phone">
                        📱 По номеру телефона
                    </button>
                    <button class="telegram-modal__tab" data-tab="bot">
                        🤴 Через бота
                    </button>
                </div>
                
                <div class="telegram-modal__tab-content telegram-modal__tab-content--active" id="tab-phone">
                    <input 
                        type="tel" 
                        class="telegram-modal__input" 
                        id="telegramPhone" 
                        placeholder="Введите номер телефона"
                    >
                    <p class="telegram-modal__hint">Сообщение будет скопировано. Откроется Telegram - вставьте в чат.</p>
                </div>
                
                <div class="telegram-modal__tab-content" id="tab-bot">
                    <p class="telegram-modal__hint" style="color: var(--warning); margin-bottom: 12px;">
                        ⚠️ Сначала напишите боту /start!
                    </p>
                    <a href="tg://resolve?domain=roi_calc_bot" target="_blank" class="telegram-modal__link">
                        Открыть бота в Telegram
                    </a>
                    <input 
                        type="text" 
                        class="telegram-modal__input" 
                        id="telegramChatId" 
                        placeholder="Chat ID (число)"
                        style="margin-top: 12px;"
                    >
                    <p class="telegram-modal__hint">Узнать Chat ID: <a href="https://t.me/userinfobot" target="_blank">@userinfobot</a></p>
                </div>
                
                <div class="telegram-modal__actions">
                    <button class="telegram-modal__btn telegram-modal__btn--cancel" id="telegramCancel">
                        Отмена
                    </button>
                    <button class="telegram-modal__btn telegram-modal__btn--send" id="telegramConfirm">
                        Отправить
                    </button>
                </div>
                <div class="telegram-modal__status" id="telegramStatus" style="display: none;"></div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Обработчики переключения вкладок
        modal.querySelectorAll('.telegram-modal__tab').forEach(tab => {
            tab.addEventListener('click', function() {
                // Переключаем активную вкладку
                modal.querySelectorAll('.telegram-modal__tab').forEach(t => t.classList.remove('telegram-modal__tab--active'));
                this.classList.add('telegram-modal__tab--active');
                
                // Показываем нужный контент
                const tabName = this.dataset.tab;
                modal.querySelectorAll('.telegram-modal__tab-content').forEach(c => c.classList.remove('telegram-modal__tab-content--active'));
                document.getElementById('tab-' + tabName).classList.add('telegram-modal__tab-content--active');
            });
        });
        
        return modal;
    }

    /**
     * Показ модального окна Telegram
     */
    function showTelegramModal() {
        let modal = document.getElementById('telegramModal');
        if (!modal) {
            modal = createTelegramModal();
            
            // Обработчики для модального окна
            document.getElementById('telegramCancel').addEventListener('click', hideTelegramModal);
            document.getElementById('telegramConfirm').addEventListener('click', sendToTelegram);
            
            // Закрытие по клику на фон
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    hideTelegramModal();
                }
            });
        }
        
        modal.classList.add('telegram-modal--active');
        document.getElementById('telegramPhone')?.focus();
    }

    /**
     * Скрытие модального окна Telegram
     */
    function hideTelegramModal() {
        const modal = document.getElementById('telegramModal');
        if (modal) {
            modal.classList.remove('telegram-modal--active');
        }
    }

    /**
     * Обработчик отправки в Telegram
     */
    function handleTelegramSend() {
        showTelegramModal();
    }

    /**
     * Формирование сообщения для Telegram
     * @param {Object} results - Результаты расчёта
     * @param {Object} inputs - Входные параметры
     * @returns {string} Текст сообщения
     */
    function formatTelegramMessage(results, inputs) {
        const complexityLabels = {
            low: 'Низкая',
            medium: 'Средняя',
            high: 'Высокая'
        };
        
        const providerLabels = {
            yandex: 'YandexGPT',
            gigachat: 'GigaChat',
            onprem: 'On-Premise'
        };

        // Простое сообщение без Markdown для надёжности
        return `📊 Результаты расчёта ROI ИИ-агента

Входные параметры:
• Запросов в месяц: ${Calculator.formatNumber(inputs.requestsPerMonth)}
• Время обработки: ${inputs.processingTimeMinutes} мин
• ЗП сотрудника: ${Calculator.formatCurrency(inputs.monthlySalary)}
• Сложность: ${complexityLabels[inputs.complexity]}
• Провайдер: ${providerLabels[inputs.provider]}

Результаты:
⏱ Экономия времени: ${results.formatted.timeSaved}
💰 Экономия денег: ${results.formatted.moneySaved}
📈 Чистая экономия: ${results.formatted.netSaved}
📅 Срок окупаемости: ${results.formatted.paybackPeriod}
🎯 ROI за год: ${results.formatted.roi}

Рассчитано в калькуляторе ROI ИИ-агентов`;
    }

    /**
     * Отправка сообщения в Telegram
     */
    async function sendToTelegram() {
        const statusDiv = document.getElementById('telegramStatus');
        const confirmBtn = document.getElementById('telegramConfirm');
        
        // Определяем активную вкладку
        const activeTab = document.querySelector('.telegram-modal__tab--active');
        const isPhoneTab = activeTab?.dataset?.tab === 'phone';
        
        // Получаем данные
        const inputs = UI.getInputValues();
        const results = UI.getCurrentResults();
        
        if (!results) {
            showStatus('error', 'Ошибка: нет данных для отправки');
            return;
        }
        
        // Формируем сообщение
        const message = formatTelegramMessage(results, inputs);
        
        // Блокируем кнопку
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Отправка...';
        
        try {
            if (isPhoneTab) {
                // Режим по номеру телефона - копируем и открываем Telegram
                const phoneInput = document.getElementById('telegramPhone');
                const phone = phoneInput.value.trim();
                
                // Копируем сообщение в буфер обмена
                await navigator.clipboard.writeText(message);
                
                if (phone) {
                    // Нормализуем номер телефона
                    const normalizedPhone = phone.replace(/[^\d]/g, '');
                    
                    // Пробуем открыть чат по номеру
                    const deepLink = `tg://resolve?phone=${encodeURIComponent(normalizedPhone)}`;
                    
                    // Создаём iframe для попытки открытия
                    const iframe = document.createElement('iframe');
                    iframe.style.display = 'none';
                    iframe.src = deepLink;
                    document.body.appendChild(iframe);
                    
                    setTimeout(() => {
                        document.body.removeChild(iframe);
                    }, 1000);
                }
                
                showStatus('success', '✓ Сообщение скопировано! Откройте Telegram и вставьте (Ctrl+V)');
                
            } else {
                // Режим через бота
                const chatIdInput = document.getElementById('telegramChatId');
                const chatId = chatIdInput.value.trim();
                
                if (!chatId) {
                    showStatus('error', 'Введите Chat ID или @username');
                    chatIdInput.focus();
                    confirmBtn.disabled = false;
                    confirmBtn.textContent = 'Отправить';
                    return;
                }
                
                // BOT_TOKEN должен быть настроен
                const BOT_TOKEN = '8591358515:AAEv6JVfmf-dET1UY_YjL2vS8yxxYh89q9E';
                
                try {
                    // Реальная отправка
                    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: chatId,
                            text: message
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.ok) {
                        showStatus('success', '✓ Успешно отправлено!');
                    } else {
                        showStatus('error', `Ошибка: ${data.description}`);
                        console.error('Telegram API error:', data);
                    }
                } catch (fetchError) {
                    console.error('Fetch error:', fetchError);
                    showStatus('error', `Ошибка сети: ${fetchError.message}`);
                }
            }
            
            // Закрываем модалку через 2-3 секунды
            setTimeout(() => {
                hideTelegramModal();
            }, 2500);
            
        } catch (error) {
            // Fallback - просто копируем
            try {
                await navigator.clipboard.writeText(message);
                showStatus('success', '✓ Сообщение скопировано! Откройте Telegram и вставьте.');
            } catch (e) {
                showStatus('error', 'Ошибка. Попробуйте скопировать вручную.');
            }
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Отправить';
        }
        
        function showStatus(type, text) {
            statusDiv.style.display = 'block';
            statusDiv.className = `telegram-modal__status telegram-modal__status--${type}`;
            statusDiv.textContent = text;
        }
    }

    // ========================================
    // Запуск
    // ========================================

    /**
     * Главная функция инициализации
     */
    function init() {
        // Проверяем готовность DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        // Инициализируем начальные значения
        initValues();
        
        // Навешиваем обработчики
        initEventListeners();
        
        // Выполняем первый расчёт
        performCalculation();

        console.log('ROI Calculator initialized');
    }

    // Запуск
    init();
})();
