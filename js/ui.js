/**
 * Модуль управления UI
 * Отвечает за обновление элементов интерфейса
 */

const UI = (function() {
    'use strict';

    // ========================================
    // DOM элементы
    // ========================================

    const elements = {
        // Inputs
        requests: document.getElementById('requests'),
        time: document.getElementById('time'),
        salary: document.getElementById('salary'),
        complexity: document.getElementById('complexity'),
        provider: document.getElementById('provider'),
        
        // Input value displays
        requestsValue: document.getElementById('requestsValue'),
        timeValue: document.getElementById('timeValue'),
        salaryValue: document.getElementById('salaryValue'),
        
        // Results
        timeSaved: document.getElementById('timeSaved'),
        moneySaved: document.getElementById('moneySaved'),
        netSaved: document.getElementById('netSaved'),
        paybackPeriod: document.getElementById('paybackPeriod'),
        roiValue: document.getElementById('roiValue'),
        
        // Chart
        chartCanvas: document.getElementById('paybackChart'),
        
        // Telegram
        sendToTelegramBtn: document.getElementById('sendToTelegram')
    };

    // ========================================
    // Переменные
    // ========================================

    let chart = null;
    let currentResults = null;

    // ========================================
    // Форматирование
    // ========================================

    /**
     * Форматирование числа для отображения в ползунке
     * @param {number} value - Значение
     * @returns {string} Отформатированная строка
     */
    function formatSliderValue(value) {
        return value.toLocaleString('ru-RU');
    }

    // ========================================
    // Обновление UI
    // ========================================

    /**
     * Обновление отображения значения ползунка
     * @param {string} elementId - ID элемента отображения
     * @param {number} value - Значение
     */
    function updateSliderDisplay(elementId, value) {
        const element = elements[elementId];
        if (element) {
            element.textContent = formatSliderValue(value);
        }
    }

    /**
     * Обновление результатов расчёта
     * @param {Object} results - Результаты из Calculator.calculate()
     */
    function updateResults(results) {
        currentResults = results;
        
        if (elements.timeSaved) {
            elements.timeSaved.textContent = results.formatted.timeSaved;
        }
        if (elements.moneySaved) {
            elements.moneySaved.textContent = results.formatted.moneySaved;
        }
        if (elements.netSaved) {
            elements.netSaved.textContent = results.formatted.netSaved;
            
            // Добавляем класс для визуальной индикации
            const card = elements.netSaved.closest('.result-card');
            if (card) {
                if (results.netSaved < 0) {
                    card.classList.add('result-card--negative');
                    elements.netSaved.classList.add('text-danger');
                } else {
                    card.classList.remove('result-card--negative');
                    elements.netSaved.classList.remove('text-danger');
                }
            }
        }
        if (elements.paybackPeriod) {
            elements.paybackPeriod.textContent = results.formatted.paybackPeriod;
        }
        if (elements.roiValue) {
            elements.roiValue.textContent = results.formatted.roi;
            
            // Визуальная индикация ROI
            const card = elements.roiValue.closest('.result-card');
            if (card) {
                if (results.roi < 0) {
                    elements.roiValue.classList.add('text-danger');
                    elements.roiValue.classList.remove('text-success');
                } else if (results.roi > 50) {
                    elements.roiValue.classList.add('text-success');
                    elements.roiValue.classList.remove('text-danger');
                } else {
                    elements.roiValue.classList.remove('text-success', 'text-danger');
                }
            }
        }
    }

    // ========================================
    // График
    // ========================================

    /**
     * Создание или обновление графика окупаемости
     * @param {Object} chartData - Данные из Calculator.generateChartData()
     */
    function updateChart(chartData) {
        if (!elements.chartCanvas) return;

        const ctx = elements.chartCanvas.getContext('2d');
        
        // Определяем цвета для зон
        const profitColor = 'rgba(16, 185, 129, 0.2)';
        const lossColor = 'rgba(239, 68, 68, 0.2)';
        const lineColor = '#667eea';

        // Создаем градиент для заливки
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(102, 126, 234, 0.3)');
        gradient.addColorStop(1, 'rgba(102, 126, 234, 0.05)');

        // Генерируем метки только с номерами месяцев
        const labels = [];
        for (let i = 0; i <= 24; i++) {
            labels.push(i);
        }

        // Данные для графика
        const data = {
            labels: labels,
            datasets: [{
                label: 'Накопленная прибыль',
                data: chartData.data,
                borderColor: lineColor,
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: lineColor,
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
            }]
        };

        // Настройки графика
        const config = {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(30, 41, 59, 0.95)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(102, 126, 234, 0.5)',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            title: function(context) {
                                return 'Месяц ' + context[0].label;
                            },
                            label: function(context) {
                                const value = context.parsed.y;
                                const formatted = Calculator.formatCurrency(Math.round(value));
                                return value >= 0 ? `+${formatted}` : formatted;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Месяцы',
                            color: '#64748b',
                            font: {
                                size: 12,
                                weight: 500
                            }
                        },
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxTicksLimit: 13,
                            color: '#64748b',
                            font: {
                                size: 11
                            }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Накопленная прибыль (₽)',
                            color: '#64748b',
                            font: {
                                size: 12,
                                weight: 500
                            }
                        },
                        grid: {
                            color: 'rgba(226, 232, 240, 0.5)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#64748b',
                            font: {
                                size: 11
                            },
                            callback: function(value) {
                                if (value >= 1000000) {
                                    return (value / 1000000).toFixed(1) + 'М';
                                } else if (value >= 1000) {
                                    return (value / 1000).toFixed(0) + 'К';
                                }
                                return value;
                            }
                        }
                    }
                },
                // Линия безубыточности
                plugins: [{
                    id: 'breakevenLine',
                    afterDraw: function(chart) {
                        const ctx = chart.ctx;
                        const yAxis = chart.scales.y;
                        const xAxis = chart.scales.x;
                        
                        // Рисуем линию y=0
                        if (yAxis.min < 0 && yAxis.max > 0) {
                            const y0 = yAxis.getPixelForValue(0);
                            
                            ctx.save();
                            ctx.beginPath();
                            ctx.moveTo(xAxis.left, y0);
                            ctx.lineTo(xAxis.right, y0);
                            ctx.lineWidth = 2;
                            ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
                            ctx.setLineDash([5, 5]);
                            ctx.stroke();
                            ctx.restore();
                        }
                        
                        // Отмечаем точку безубыточности
                        if (chartData.breakevenMonth !== null && chartData.breakevenMonth <= chart.data.labels.length) {
                            const x = xAxis.getPixelForValue(chartData.breakevenMonth);
                            const y = yAxis.getPixelForValue(0);
                            
                            ctx.save();
                            ctx.beginPath();
                            ctx.arc(x, y, 8, 0, 2 * Math.PI);
                            ctx.fillStyle = '#f59e0b';
                            ctx.fill();
                            ctx.strokeStyle = '#fff';
                            ctx.lineWidth = 2;
                            ctx.stroke();
                            ctx.restore();
                        }
                    }
                }]
            }
        };

        // Уничтожаем старый график если есть
        if (chart) {
            chart.destroy();
        }

        // Создаем новый график
        chart = new Chart(ctx, config);
    }

    // ========================================
    // Получение значений
    // ========================================

    /**
     * Получение текущих значений из формы
     * @returns {Object} Значения полей формы
     */
    function getInputValues() {
        // Получаем значения из плиток
        const complexityValue = getTileSelectValue('complexity');
        const providerValue = getTileSelectValue('provider');
        
        return {
            requestsPerMonth: parseInt(elements.requests?.value || 5000),
            processingTimeMinutes: parseInt(elements.time?.value || 10),
            monthlySalary: parseInt(elements.salary?.value || 100000),
            complexity: complexityValue || 'medium',
            provider: providerValue || 'yandex'
        };
    }

    /**
     * Получение выбранного значения из плиток
     * @param {string} id - ID контейнера плиток
     * @returns {string|null} Выбранное значение
     */
    function getTileSelectValue(id) {
        const container = document.getElementById(id);
        if (!container) return null;
        
        const activeOption = container.querySelector('.tile-select__option--active');
        return activeOption?.dataset?.value || null;
    }

    /**
     * Установка выбранного значения в плитках
     * @param {string} id - ID контейнера плиток
     * @param {string} value - Значение для выбора
     */
    function setTileSelectValue(id, value) {
        const container = document.getElementById(id);
        if (!container) return;
        
        // Убираем активный класс со всех опций
        container.querySelectorAll('.tile-select__option').forEach(option => {
            option.classList.remove('tile-select__option--active');
        });
        
        // Добавляем активный класс выбранной опции
        const selectedOption = container.querySelector(`[data-value="${value}"]`);
        if (selectedOption) {
            selectedOption.classList.add('tile-select__option--active');
        }
    }

    /**
     * Получение текущих результатов расчёта
     * @returns {Object|null} Результаты расчёта
     */
    function getCurrentResults() {
        return currentResults;
    }

    // ========================================
    // Публичный API
    // ========================================

    return {
        elements,
        updateSliderDisplay,
        updateResults,
        updateChart,
        getInputValues,
        getTileSelectValue,
        setTileSelectValue,
        getCurrentResults,
        formatSliderValue
    };
})();

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UI;
}
