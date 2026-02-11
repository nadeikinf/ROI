/**
 * Модуль калькулятора ROI для ИИ-агентов
 * Содержит все константы и формулы расчёта
 */

const Calculator = (function() {
    'use strict';

    // ========================================
    // Константы
    // ========================================
    
    const WORKING_DAYS_PER_MONTH = 22;
    const WORKING_HOURS_PER_DAY = 8;
    const WORKING_HOURS_PER_MONTH = WORKING_DAYS_PER_MONTH * WORKING_HOURS_PER_DAY; // 176

    // Стоимость внедрения (разовые затраты)
    const IMPLEMENTATION_COST = {
        low: 1000000,      // Низкая сложность
        medium: 2000000,   // Средняя сложность
        high: 3000000      // Высокая сложность
    };

    // Ежемесячные затраты на ИИ по провайдерам и сложности
    const MONTHLY_AI_COST = {
        yandex: {
            low: 50000,
            medium: 100000,
            high: 200000
        },
        gigachat: {
            low: 40000,
            medium: 80000,
            high: 160000
        },
        onprem: {
            low: 30000,
            medium: 60000,
            high: 120000
        }
    };

    // ========================================
    // Вспомогательные функции
    // ========================================

    /**
     * Форматирование числа с разделителями разрядов
     * @param {number} num - Число для форматирования
     * @param {number} decimals - Количество знаков после запятой
     * @returns {string} Отформатированная строка
     */
    function formatNumber(num, decimals = 0) {
        return num.toLocaleString('ru-RU', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    /**
     * Форматирование валюты
     * @param {number} num - Сумма
     * @returns {string} Отформатированная строка с символом валюты
     */
    function formatCurrency(num) {
        return formatNumber(num) + ' ₽';
    }

    /**
     * Расчёт часовой ставки из месячной ЗП
     * @param {number} monthlySalary - Месячная зарплата
     * @returns {number} Часовая ставка
     */
    function calculateHourlyRate(monthlySalary) {
        return monthlySalary / WORKING_HOURS_PER_MONTH;
    }

    // ========================================
    // Основные функции расчёта
    // ========================================

    /**
     * Получение стоимости внедрения
     * @param {string} complexity - Уровень сложности (low/medium/high)
     * @returns {number} Стоимость внедрения
     */
    function getImplementationCost(complexity) {
        return IMPLEMENTATION_COST[complexity] || IMPLEMENTATION_COST.medium;
    }

    /**
     * Получение ежемесячных затрат на ИИ
     * @param {string} provider - Провайдер (yandex/gigachat/onprem)
     * @param {string} complexity - Уровень сложности (low/medium/high)
     * @returns {number} Ежемесячные затраты
     */
    function getMonthlyAICost(provider, complexity) {
        const providerCosts = MONTHLY_AI_COST[provider] || MONTHLY_AI_COST.yandex;
        return providerCosts[complexity] || providerCosts.medium;
    }

    /**
     * Расчёт экономии времени в часах за месяц
     * @param {number} requestsPerMonth - Количество запросов в месяц
     * @param {number} processingTimeMinutes - Время обработки в минутах
     * @returns {number} Экономия времени в часах
     */
    function calculateTimeSaved(requestsPerMonth, processingTimeMinutes) {
        const timePerRequestHours = processingTimeMinutes / 60;
        return requestsPerMonth * timePerRequestHours;
    }

    /**
     * Расчёт экономии денег в месяц (до вычета затрат на ИИ)
     * @param {number} timeSavedHours - Экономия времени в часах
     * @param {number} hourlyRate - Часовая ставка
     * @returns {number} Экономия денег
     */
    function calculateMoneySaved(timeSavedHours, hourlyRate) {
        return timeSavedHours * hourlyRate;
    }

    /**
     * Расчёт чистой экономии в месяц
     * @param {number} moneySaved - Экономия денег
     * @param {number} monthlyAICost - Ежемесячные затраты на ИИ
     * @returns {number} Чистая экономия
     */
    function calculateNetSaved(moneySaved, monthlyAICost) {
        return moneySaved - monthlyAICost;
    }

    /**
     * Расчёт срока окупаемости в месяцах
     * @param {number} implementationCost - Стоимость внедрения
     * @param {number} netSaved - Чистая экономия в месяц
     * @returns {number} Срок окупаемости в месяцах (или Infinity если экономия <= 0)
     */
    function calculatePaybackPeriod(implementationCost, netSaved) {
        if (netSaved <= 0) {
            return Infinity;
        }
        return implementationCost / netSaved;
    }

    /**
     * Расчёт ROI за первый год
     * @param {number} moneySaved - Экономия денег в месяц
     * @param {number} monthlyAICost - Ежемесячные затраты на ИИ
     * @param {number} implementationCost - Стоимость внедрения
     * @returns {number} ROI в процентах
     */
    function calculateROI(moneySaved, monthlyAICost, implementationCost) {
        const yearlySavings = moneySaved * 12;
        const yearlyAICost = monthlyAICost * 12;
        const totalCost = implementationCost + yearlyAICost;
        
        if (totalCost === 0) {
            return 0;
        }
        
        const netProfit = yearlySavings - yearlyAICost - implementationCost;
        return (netProfit / totalCost) * 100;
    }

    /**
     * Генерация данных для графика окупаемости
     * @param {number} implementationCost - Стоимость внедрения
     * @param {number} netSaved - Чистая экономия в месяц
     * @param {number} months - Количество месяцев для графика
     * @returns {Object} Данные для графика
     */
    function generateChartData(implementationCost, netSaved, months = 24) {
        const labels = [];
        const data = [];
        let breakevenMonth = null;

        for (let month = 0; month <= months; month++) {
            labels.push(`Месяц ${month}`);
            
            // Накопленная прибыль = -Стоимость внедрения + (Чистая экономия × месяц)
            const cumulativeProfit = -implementationCost + (netSaved * month);
            data.push(cumulativeProfit);
            
            // Определяем точку безубыточности
            if (breakevenMonth === null && cumulativeProfit >= 0) {
                breakevenMonth = month;
            }
        }

        return {
            labels,
            data,
            breakevenMonth
        };
    }

    // ========================================
    // Главная функция расчёта
    // ========================================

    /**
     * Полный расчёт ROI
     * @param {Object} params - Параметры расчёта
     * @param {number} params.requestsPerMonth - Запросов в месяц
     * @param {number} params.processingTimeMinutes - Время обработки в минутах
     * @param {number} params.monthlySalary - Месячная ЗП
     * @param {string} params.complexity - Сложность агента
     * @param {string} params.provider - Провайдер ИИ
     * @returns {Object} Результаты расчёта
     */
    function calculate(params) {
        const {
            requestsPerMonth,
            processingTimeMinutes,
            monthlySalary,
            complexity,
            provider
        } = params;

        // Базовые расчёты
        const hourlyRate = calculateHourlyRate(monthlySalary);
        const implementationCost = getImplementationCost(complexity);
        const monthlyAICost = getMonthlyAICost(provider, complexity);
        
        // Экономия
        const timeSaved = calculateTimeSaved(requestsPerMonth, processingTimeMinutes);
        const moneySaved = calculateMoneySaved(timeSaved, hourlyRate);
        const netSaved = calculateNetSaved(moneySaved, monthlyAICost);
        
        // Окупаемость
        const paybackPeriod = calculatePaybackPeriod(implementationCost, netSaved);
        const roi = calculateROI(moneySaved, monthlyAICost, implementationCost);
        
        // Данные для графика
        const chartData = generateChartData(implementationCost, netSaved);

        return {
            // Сырые значения
            hourlyRate,
            implementationCost,
            monthlyAICost,
            timeSaved,
            moneySaved,
            netSaved,
            paybackPeriod,
            roi,
            chartData,
            
            // Отформатированные значения
            formatted: {
                hourlyRate: formatCurrency(hourlyRate) + '/час',
                implementationCost: formatCurrency(implementationCost),
                monthlyAICost: formatCurrency(monthlyAICost),
                timeSaved: formatNumber(Math.round(timeSaved)) + ' ч/мес',
                moneySaved: formatCurrency(Math.round(moneySaved)) + '/мес',
                netSaved: formatCurrency(Math.round(netSaved)) + '/мес',
                paybackPeriod: paybackPeriod === Infinity ? '∞' : formatNumber(paybackPeriod, 1) + ' мес',
                roi: formatNumber(roi, 1) + '%'
            }
        };
    }

    // ========================================
    // Публичный API
    // ========================================

    return {
        calculate,
        formatNumber,
        formatCurrency,
        calculateHourlyRate,
        calculateTimeSaved,
        calculateMoneySaved,
        calculateNetSaved,
        calculatePaybackPeriod,
        calculateROI,
        getImplementationCost,
        getMonthlyAICost,
        generateChartData,
        WORKING_HOURS_PER_MONTH,
        IMPLEMENTATION_COST,
        MONTHLY_AI_COST
    };
})();

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Calculator;
}
