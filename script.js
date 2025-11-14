// 全局变量
let events = [];
let workStartTime = localStorage.getItem('workStartTime') || '08:30';
let lunchStartTime = localStorage.getItem('lunchStartTime') || '11:30';
let lunchEndTime = localStorage.getItem('lunchEndTime') || '14:00';
let workEndTime = localStorage.getItem('workEndTime') || '17:30';
let holidays = JSON.parse(localStorage.getItem('holidays')) || {};
let workdaysOff = JSON.parse(localStorage.getItem('workdaysOff')) || {}; // 公休假期
let weekendsWork = JSON.parse(localStorage.getItem('weekendsWork')) || {}; // 串休上班日
let activeTab = 'countdown';
// 开发者设置
let developerMode = localStorage.getItem('developerMode') === 'true' || false;
let customTime = localStorage.getItem('customTime') || null;

// 工作时间配置
let workTimeConfig = {
    startHour: parseInt(workStartTime.split(':')[0]),
    startMinute: parseInt(workStartTime.split(':')[1]),
    lunchStartHour: parseInt(lunchStartTime.split(':')[0]),
    lunchStartMinute: parseInt(lunchStartTime.split(':')[1]),
    lunchEndHour: parseInt(lunchEndTime.split(':')[0]),
    lunchEndMinute: parseInt(lunchEndTime.split(':')[1]),
    endHour: parseInt(workEndTime.split(':')[0]),
    endMinute: parseInt(workEndTime.split(':')[1])
};

// 检查是否是周末
function isWeekend(date) {
    const dayOfWeek = date.getDay();
    // 周日(0)和周六(6)是周末
    return dayOfWeek === 0 || dayOfWeek === 6;
}

// 检查是否是假日（公休假期）
function isHoliday(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dateStr = `${year}-${month}-${day}`;
    return workdaysOff[dateStr] === true;
}

// 检查是否是串休上班日
function isWeekendWork(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dateStr = `${year}-${month}-${day}`;
    return weekendsWork[dateStr] === true;
}

// 获取当前时间（考虑开发者模式和自定义时间）
function getCurrentTime() {
    if (developerMode && customTime) {
        return new Date(customTime);
    }
    return new Date();
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检查是否首次使用
    if (!localStorage.getItem('hasVisited')) {
        showSetupModal();
    } else {
        initApp();
    }
    
    // 初始化标签页
    initTabs();
    
    // 设置按钮事件
    document.getElementById('add-event').addEventListener('click', addCustomEvent);
    document.getElementById('update-work-time').addEventListener('click', updateWorkTime);
    document.getElementById('clear-cache').addEventListener('click', function() {
        if (window.confirm('确定要删除所有设置并恢复为默认吗？此操作不可撤销。')) {
            // 清除所有相关本地存储
            localStorage.clear(); // 清除所有存储
            
            // 重置当前页面的设置表单
            document.getElementById('settings-work-start-time').value = '08:30';
            document.getElementById('settings-work-end-time').value = '17:30';
            document.getElementById('settings-salary-type').value = 'fixed';
            document.getElementById('settings-salary-day').value = getDefaultSalaryDay();

            showToast('缓存已清除，请刷新页面重新设置');
            
            // 延迟1秒后刷新页面，让用户看到提示
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    });
});

// 默认发薪日为每月15号（返回数字字符串以适配 number 输入）
function getDefaultSalaryDay() {
    return '15';
}

// 首次进入弹窗逻辑
function showSetupModal() {
    document.getElementById('setup-modal').classList.add('show');
}

// 检查是否需要显示首次设置弹窗
function checkFirstVisit() {
    // 检查是否已完成初始设置
    const hasInitialized = localStorage.getItem('hasInitialized');
    if (hasInitialized === 'true') {
        return;
    }

    // 显示首次设置弹窗
    document.getElementById('work-start-time').value = '08:30';
    document.getElementById('lunch-start-time').value = '11:30';
    document.getElementById('lunch-end-time').value = '14:00';
    document.getElementById('work-end-time').value = '17:30';
    document.getElementById('salary-type').value = 'fixed';
    document.getElementById('salary-day').value = '15';
    showSetupModal();
}

// 保存首次设置
document.getElementById('save-work-time').addEventListener('click', function() {
    const startTime = document.getElementById('work-start-time').value;
    const lunchStart = document.getElementById('lunch-start-time').value;
    const lunchEnd = document.getElementById('lunch-end-time').value;
    const endTime = document.getElementById('work-end-time').value;
    
    // 验证时间设置的合理性
    if (!validateTimeSettings(startTime, lunchStart, lunchEnd, endTime)) {
        return;
    }
    
    // 保存设置到 localStorage
    localStorage.setItem('workStartTime', startTime);
    localStorage.setItem('lunchStartTime', lunchStart);
    localStorage.setItem('lunchEndTime', lunchEnd);
    localStorage.setItem('workEndTime', endTime);
    localStorage.setItem('salaryType', document.getElementById('salary-type').value);
    localStorage.setItem('salaryDay', document.getElementById('salary-day').value);
    
    // 标记已完成初始设置
    localStorage.setItem('hasInitialized', 'true');
    localStorage.setItem('hasVisited', 'true');
    
    // 隐藏首次设置弹窗
    document.getElementById('setup-modal').classList.remove('show');
    
    // 显示保存成功提示
    showToast('设置已保存');
    
    // 重新初始化应用
    initApp();
});

// 页面加载时检查是否首次进入（没有缓存即首次进入）
window.addEventListener('DOMContentLoaded', function() {
    checkFirstVisit();
});

// 初始化标签页
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const footerTabs = document.querySelectorAll('.footer-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // 设置默认标签页
    switchTab('countdown');
    
    // 添加标签按钮点击事件
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // 添加底部标签点击事件
    footerTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
}

// 切换标签页
function switchTab(tabId) {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const footerTabs = document.querySelectorAll('.footer-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // 更新当前活动标签
    activeTab = tabId;
    
    // 更新标签按钮状态
    tabBtns.forEach(btn => {
        if (btn.getAttribute('data-tab') === tabId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // 更新底部标签状态
    footerTabs.forEach(tab => {
        if (tab.getAttribute('data-tab') === tabId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // 更新内容区域
    tabContents.forEach(content => {
        if (content.getAttribute('id') === tabId) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
    
    // 如果切换到日历标签，初始化日历
    if (tabId === 'calendar') {
        initCalendar();
    }
}

// 初始化应用
function initApp() {
    // 从本地存储重新加载全局变量，确保使用最新值
    workStartTime = localStorage.getItem('workStartTime') || '08:30';
    lunchStartTime = localStorage.getItem('lunchStartTime') || '11:30';
    lunchEndTime = localStorage.getItem('lunchEndTime') || '14:00';
    workEndTime = localStorage.getItem('workEndTime') || '17:30';
    
    // 更新工作时间配置
    workTimeConfig = {
        startHour: parseInt(workStartTime.split(':')[0]),
        startMinute: parseInt(workStartTime.split(':')[1]),
        lunchStartHour: parseInt(lunchStartTime.split(':')[0]),
        lunchStartMinute: parseInt(lunchStartTime.split(':')[1]),
        lunchEndHour: parseInt(lunchEndTime.split(':')[0]),
        lunchEndMinute: parseInt(lunchEndTime.split(':')[1]),
        endHour: parseInt(workEndTime.split(':')[0]),
        endMinute: parseInt(workEndTime.split(':')[1])
    };
    
    // 从本地存储加载自定义事件
    loadEventsFromLocalStorage();

    // 添加预设事件
    addDefaultEvents();

    // 渲染所有事件
    renderEvents();
    bindMainCardEvents();

    // 初始化存钱罐
    updatePiggyBank();

    // 设置定时器，每秒更新倒计时
    setInterval(() => {
        updateCountdowns();
        bindMainCardEvents();
    }, 1000);
    
    // 设置工作时间输入框的值
    document.getElementById('settings-work-start-time').value = workStartTime;
    document.getElementById('settings-lunch-start-time').value = lunchStartTime;
    document.getElementById('settings-lunch-end-time').value = lunchEndTime;
    document.getElementById('settings-work-end-time').value = workEndTime;
    const savedSalaryType = localStorage.getItem('salaryType') || 'fixed';
    const savedSalaryDay = localStorage.getItem('salaryDay') || '1';
    const settingsSalaryTypeEl = document.getElementById('settings-salary-type');
    const settingsSalaryDayEl = document.getElementById('settings-salary-day');
    if (settingsSalaryTypeEl) settingsSalaryTypeEl.value = savedSalaryType;
    if (settingsSalaryDayEl) settingsSalaryDayEl.value = savedSalaryDay;

    const holidaysTextEl = document.getElementById('official-holidays-json');
    if (holidaysTextEl) {
        const stored = localStorage.getItem('officialHolidays');
        holidaysTextEl.value = stored ? stored : '';
    }
    const weekendWorkTextEl = document.getElementById('official-weekendwork-json');
    if (weekendWorkTextEl) {
        const storedW = localStorage.getItem('officialWeekendWorkdays');
        weekendWorkTextEl.value = storedW ? storedW : '';
    }

    // 初始化开发者设置
    const developerModeCheckbox = document.getElementById('developer-mode');
    const customTimeContainer = document.getElementById('custom-time-container');
    const customTimeInput = document.getElementById('custom-time');
    
    // 设置初始状态
    if (developerModeCheckbox) {
        developerModeCheckbox.checked = developerMode;
        customTimeContainer.style.display = developerMode ? 'block' : 'none';
        if (customTime) {
            // 转换为localStorage中的ISO字符串到datetime-local格式
            const date = new Date(customTime);
            const formattedDateTime = date.toISOString().slice(0, 16);
            customTimeInput.value = formattedDateTime;
        }
        
        // 添加事件监听
        developerModeCheckbox.addEventListener('change', function() {
            developerMode = this.checked;
            localStorage.setItem('developerMode', developerMode);
            customTimeContainer.style.display = developerMode ? 'block' : 'none';
            updateCountdowns();
        });
        
        customTimeInput.addEventListener('change', function() {
            customTime = this.value ? new Date(this.value).toISOString() : null;
            localStorage.setItem('customTime', customTime);
            updateCountdowns();
        });
    }
}

// 显示设置模态框
function showSetupModal() {
    const modal = document.getElementById('setup-modal');
    modal.style.display = 'flex';
}

// 更新工作时间
// 计算两个日期之间的天数
function daysBetween(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000; // 一天的毫秒数
    return Math.round(Math.abs((date1 - date2) / oneDay));
}

function updateWorkTime() {
    const startTime = document.getElementById('settings-work-start-time').value;
    const lunchStart = document.getElementById('settings-lunch-start-time').value;
    const lunchEnd = document.getElementById('settings-lunch-end-time').value;
    const endTime = document.getElementById('settings-work-end-time').value;

    // 验证时间设置的合理性
    if (!validateTimeSettings(startTime, lunchStart, lunchEnd, endTime)) {
        return;
    }

    workStartTime = startTime;
    lunchStartTime = lunchStart;
    lunchEndTime = lunchEnd;
    workEndTime = endTime;

    // 更新工作时间配置
    workTimeConfig = {
        startHour: parseInt(workStartTime.split(':')[0]),
        startMinute: parseInt(workStartTime.split(':')[1]),
        lunchStartHour: parseInt(lunchStartTime.split(':')[0]),
        lunchStartMinute: parseInt(lunchStartTime.split(':')[1]),
        lunchEndHour: parseInt(lunchEndTime.split(':')[0]),
        lunchEndMinute: parseInt(lunchEndTime.split(':')[1]),
        endHour: parseInt(workEndTime.split(':')[0]),
        endMinute: parseInt(workEndTime.split(':')[1])
    };

    // 保存到本地存储
    localStorage.setItem('workStartTime', workStartTime);
    localStorage.setItem('lunchStartTime', lunchStartTime);
    localStorage.setItem('lunchEndTime', lunchEndTime);
    localStorage.setItem('workEndTime', workEndTime);

    const salaryType = document.getElementById('settings-salary-type').value;
    localStorage.setItem('salaryType', salaryType);
    if (salaryType === 'fixed') {
        localStorage.setItem('salaryDay', document.getElementById('settings-salary-day').value);
    } else {
        localStorage.removeItem('salaryDay');
    }

    // 重新加载事件
    addDefaultEvents();
    renderEvents();
    
    // 保存成功后弹出 Toast
    showToast('设置已更新');
}

let defaultOfficialHolidays = {};

function ensureOfficialHolidaysInitialized() {
    fetch('config/holidays.json')
        .then(r => r.json())
        .then(cfg => {
            defaultOfficialHolidays = cfg.officialHolidays || {};
            const defaultWeekendWork = cfg.weekendWorkdays || {};
            if (!localStorage.getItem('officialHolidays')) {
                localStorage.setItem('officialHolidays', JSON.stringify(defaultOfficialHolidays));
            }
            if (!localStorage.getItem('officialWeekendWorkdays')) {
                localStorage.setItem('officialWeekendWorkdays', JSON.stringify(defaultWeekendWork));
            }
        })
        .catch(() => {
            if (!localStorage.getItem('officialHolidays')) {
                localStorage.setItem('officialHolidays', JSON.stringify({}));
            }
            if (!localStorage.getItem('officialWeekendWorkdays')) {
                localStorage.setItem('officialWeekendWorkdays', JSON.stringify({}));
            }
        });
}

function mergeOfficialHolidaysIntoCalendar(year, month) {
    const holidays = JSON.parse(localStorage.getItem('officialHolidays') || '{}');
    const weekendWork = JSON.parse(localStorage.getItem('officialWeekendWorkdays') || '{}');
    Object.keys(holidays).forEach(k => {
        const parts = k.split('-').map(Number);
        if (parts.length === 3) {
            const y = parts[0], m = parts[1], d = parts[2];
            if (y === year && m === month + 1) {
                const key = `${y}-${m}-${d}`;
                workdaysOff[key] = true;
            }
        }
    });
    Object.keys(weekendWork).forEach(k => {
        const parts = k.split('-').map(Number);
        if (parts.length === 3) {
            const y = parts[0], m = parts[1], d = parts[2];
            if (y === year && m === month + 1) {
                const key = `${y}-${m}-${d}`;
                weekendsWork[key] = true;
            }
        }
    });
    localStorage.setItem('workdaysOff', JSON.stringify(workdaysOff));
    localStorage.setItem('weekendsWork', JSON.stringify(weekendsWork));
}

// 从本地存储加载事件
function loadEventsFromLocalStorage() {
    const savedEvents = localStorage.getItem('customEvents');
    if (savedEvents) {
        const parsedEvents = JSON.parse(savedEvents);
        // 确保日期对象正确恢复
        parsedEvents.forEach(event => {
            if (event.date) {
                event.date = new Date(event.date);
            }
        });
        // 只加载自定义事件，预设事件会重新添加
        events = parsedEvents.filter(event => event.type === 'custom');
    }
}

// 保存事件到本地存储
function saveEventsToLocalStorage() {
    // 只保存自定义事件
    const customEvents = events.filter(event => event.type === 'custom');
    localStorage.setItem('customEvents', JSON.stringify(customEvents));
}

// 添加预设事件
function addDefaultEvents() {
    // 清除之前的预设事件
    events = events.filter(event => event.type === 'custom');
    
    // 添加下班时间 - 每工作日
    events.push({
        id: 'workday-end',
        name: '下班时间',
        type: 'preset',
        category: 'workday',
        repeat: 'workdays',
        time: workEndTime
    });
    
    // 添加午饭时间 - 每天
    events.push({
        id: 'lunch-time',
        name: '午饭时间',
        type: 'preset',
        category: 'workday',
        repeat: 'daily',
        time: lunchStartTime
    });
    
    // 添加发工资日 - 根据用户设置
    const salaryType = localStorage.getItem('salaryType') || 'fixed';
    events.push({
        id: 'salary-day',
        name: '发工资日',
        type: 'preset',
        category: 'payday',
        repeat: 'monthly',
        day: salaryType === 'last' ? 'last' : (parseInt(localStorage.getItem('salaryDay')) || 1)
    });
    
    // 添加周末 - 最近的周六
    events.push({
        id: 'weekend',
        name: '周末',
        type: 'preset',
        category: 'weekend',
        repeat: 'weekly',
        dayOfWeek: 6
    });
    
    // 添加法定节假日
    addHolidays();
}

// 添加中国法定节假日
function addHolidays() {
    const currentYear = new Date().getFullYear();
    
    // 使用Set来避免重复添加相同日期的节假日
    const addedDates = new Set();
    
    // 定义固定公历节日
    const fixedHolidays = [
        { id: 'new-year', name: '元旦', month: 1, day: 1 },
        { id: 'labor-day', name: '劳动节', month: 5, day: 1 },
        { id: 'national-day', name: '国庆节', month: 10, day: 1 }
    ];
    
    // 定义清明节 (通常在4月4日或5日)
    // 计算清明节日期的简单方法：4月4日或5日
    const qingmingDay = new Date(currentYear, 3, 4);
    if (qingmingDay.getDay() === 5) qingmingDay.setDate(5); // 如果4月4日是周五，清明节在5日
    
    // 定义农历节日的近似公历日期
    // 注意：实际应用中应使用农历转换库来获取准确日期
    let lunarHolidays = [];
    if (currentYear === 2024) {
        lunarHolidays = [
            { id: 'spring-festival', name: '春节', month: 2, day: 10 },
            { id: 'dragon-boat', name: '端午节', month: 6, day: 10 },
            { id: 'mid-autumn', name: '中秋节', month: 9, day: 17 }
        ];
    } else if (currentYear === 2025) {
        lunarHolidays = [
            { id: 'spring-festival', name: '春节', month: 1, day: 29 },
            { id: 'dragon-boat', name: '端午节', month: 5, day: 31 },
            { id: 'mid-autumn', name: '中秋节', month: 10, day: 6 }
        ];
    } else {
        // 默认使用2024年的日期作为近似值
        lunarHolidays = [
            { id: 'spring-festival', name: '春节', month: 2, day: 10 },
            { id: 'dragon-boat', name: '端午节', month: 6, day: 10 },
            { id: 'mid-autumn', name: '中秋节', month: 9, day: 17 }
        ];
    }
    
    // 合并所有节日
    const holidays = [
        ...fixedHolidays.map(holiday => ({ ...holiday, year: currentYear })),
        { id: 'qingming', name: '清明节', month: qingmingDay.getMonth() + 1, day: qingmingDay.getDate(), year: currentYear },
        ...lunarHolidays.map(holiday => ({ ...holiday, year: currentYear }))
    ];
    
    holidays.forEach(holiday => {
        const dateKey = `${holiday.month}-${holiday.day}-${holiday.year}`;
        
        // 避免重复添加
        if (!addedDates.has(dateKey)) {
            const date = new Date(holiday.year, holiday.month - 1, holiday.day);
            events.push({
                id: `holiday-${holiday.id}-${holiday.year}`,
                name: holiday.name,
                type: 'preset',
                category: 'holiday',
                date: date,
                repeat: 'yearly'
            });
            addedDates.add(dateKey);
        }
    });

    // 清明节特殊处理：如果是周六或周日，可能会补休
    const qingmingHoliday = holidays.find(h => h.id === 'qingming');
    if (qingmingHoliday) {
        const qingmingDate = new Date(qingmingHoliday.year, qingmingHoliday.month - 1, qingmingHoliday.day);
        const dayOfWeek = qingmingDate.getDay();
        
        // 如果清明节在周六或周日，添加补休日
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            let makeUpDay;
            if (dayOfWeek === 0) {
                makeUpDay = new Date(qingmingDate);
                makeUpDay.setDate(qingmingDate.getDate() + 1); // 周日补周一
            } else {
                makeUpDay = new Date(qingmingDate);
                makeUpDay.setDate(qingmingDate.getDate() - 1); // 周六补周五
            }
            
            const makeUpDateKey = `${makeUpDay.getMonth() + 1}-${makeUpDay.getDate()}-${makeUpDay.getFullYear()}`;
            if (!addedDates.has(makeUpDateKey)) {
                events.push({
                    id: `holiday-qingming-makeup-${makeUpDay.getFullYear()}`,
                    name: '清明节补休',
                    type: 'preset',
                    category: 'holiday',
                    date: makeUpDay,
                    repeat: 'yearly'
                });
                addedDates.add(makeUpDateKey);
            }
        }
    }
    
    // 添加自定义节假日 (如果存在全局holidays对象)
    if (window.holidays && typeof window.holidays === 'object') {
        for (const dateStr in window.holidays) {
            if (window.holidays.hasOwnProperty(dateStr)) {
                const [year, month, day] = dateStr.split('-').map(Number);
                const dateKey = `${month}-${day}-${year}`;
                
                // 避免重复添加
                if (!addedDates.has(dateKey)) {
                    const holidayName = window.holidays[dateStr] || '自定义假日';
                    events.push({
                        id: `custom-holiday-${dateStr}`,
                        name: holidayName,
                        type: 'custom',
                        category: 'custom-holiday',
                        date: new Date(year, month - 1, day),
                        repeat: 'none'
                    });
                    addedDates.add(dateKey);
                }
            }
        }
    }
}
// 添加自定义事件
function addCustomEvent() {
    const eventName = document.getElementById('event-name').value.trim();
    const eventTime = document.getElementById('event-time').value;
    const eventRepeat = document.getElementById('event-repeat').value;
    
    if (!eventName || !eventTime) {
        alert('请填写事件名称和时间！');
        return;
    }
    
    const date = new Date(eventTime);
    const id = 'custom-' + Date.now();
    
    events.push({
        id: id,
        name: eventName,
        type: 'custom',
        category: 'custom',
        date: date,
        repeat: eventRepeat
    });
    
    // 保存到本地存储
    saveEventsToLocalStorage();
    
    // 清空输入框
    document.getElementById('event-name').value = '';
    document.getElementById('event-time').value = '';
    
    // 重新渲染事件
    renderEvents();
}

// 删除自定义事件
function deleteCustomEvent(id) {
    events = events.filter(event => event.id !== id);
    saveEventsToLocalStorage();
    renderEvents();
}

// 渲染所有事件
function renderEvents() {
    // 计算每个事件的下一次发生时间和剩余时间
    const eventsWithNextOccurrence = events.map(event => {
        const nextOccurrence = getNextOccurrence(event);
        const timeRemaining = getTimeRemaining(nextOccurrence, event);
        
        return {
            ...event,
            nextOccurrence,
            timeRemaining
        };
    });
    
    // 按剩余时间排序
    const sortedEvents = eventsWithNextOccurrence.sort((a, b) => 
        a.nextOccurrence.getTime() - b.nextOccurrence.getTime()
    );
    window.lastSortedEvents = sortedEvents;
    
    // 渲染主要倒计时
    renderMainCountdowns(sortedEvents);
    
    // 渲染其他假期
    renderOtherHolidays(sortedEvents);
    
    // 渲染自定义事件列表
    renderCustomEventsList(sortedEvents.filter(event => event.type === 'custom'));
}

// 渲染主要倒计时
function renderMainCountdowns(sortedEvents) {
    // 获取主要倒计时元素
    const workdayEndCard = document.getElementById('workday-end-card');
    const weekendCard = document.getElementById('weekend-card');
    const salaryDayCard = document.getElementById('salary-day-card');
    const nextHolidayCard = document.getElementById('next-holiday-card');

    
    // 找到下班时间事件
    const workdayEndEvent = sortedEvents.find(e => e.id === 'workday-end');
    if (workdayEndEvent) {
        document.getElementById('time-workday-end').textContent = formatTimeRemaining(workdayEndEvent.timeRemaining, 'seconds');
        document.getElementById('date-workday-end').style.display = 'none'; // 精确到秒，不显示日期
        const cardEl = document.getElementById('workday-end-card');
        const tt = buildCalculationTooltip(workdayEndEvent);
        if (cardEl) cardEl.setAttribute('title', tt);
    }
    
    // 找到周末事件
    const weekendEvent = sortedEvents.find(e => e.id === 'weekend');
    if (weekendEvent) {
        // 对于本周剩余工作时间，我们希望显示更精确的格式（小时和分钟）
        const hours = weekendEvent.timeRemaining.hours;
        const minutes = weekendEvent.timeRemaining.minutes;
        document.getElementById('time-weekend').textContent = `${hours}小时${minutes}分钟`;
        document.getElementById('date-weekend').textContent = formatDate(weekendEvent.nextOccurrence, false); // 只显示日期
        const cardEl = document.getElementById('weekend-card');
        const tt = buildCalculationTooltip(weekendEvent);
        if (cardEl) cardEl.setAttribute('title', tt);
    }
    
    // 找到发薪日事件
    const salaryDayEvent = sortedEvents.find(e => e.id === 'salary-day');
    if (salaryDayEvent) {
        document.getElementById('time-salary-day').textContent = formatTimeRemaining(salaryDayEvent.timeRemaining, 'days');
        document.getElementById('date-salary-day').textContent = formatDate(salaryDayEvent.nextOccurrence, false); // 只显示日期
        const cardEl = document.getElementById('salary-day-card');
        const tt = buildCalculationTooltip(salaryDayEvent);
        if (cardEl) cardEl.setAttribute('title', tt);
}
    
    // 确定期待时间（午饭或最近的假期）
    const now = new Date();
    const lunchEvent = sortedEvents.find(e => e.id === 'lunch-time');
    let expectationEvent;
    
    // 如果现在是上午且还没到午饭时间，显示午饭时间
    if (lunchEvent && 
        (now.getHours() < 11 || (now.getHours() === 11 && now.getMinutes() < 30)) && 
        now.getDay() >= 1 && now.getDay() <= 5) { // 工作日
        expectationEvent = lunchEvent;
    } else {
        // 否则显示最近的假期
        expectationEvent = sortedEvents.find(e => 
            (e.category === 'holiday' || e.category === 'custom-holiday') && 
            e.id !== 'workday-end' && e.id !== 'weekend' && e.id !== 'salary-day'
        );
    }
    
    // 渲染期待时间
    if (expectationEvent) {
        // 设置标题
        const nextHolidayTitle = document.querySelector('#next-holiday-card h3');
        if (nextHolidayTitle) {
            if (expectationEvent.id === 'lunch-time') {
                nextHolidayTitle.textContent = '午休倒计时';
            } else {
                nextHolidayTitle.textContent = expectationEvent.name;
            }
        }
        
        document.getElementById('time-next-holiday').textContent = 
            expectationEvent.id === 'lunch-time' 
                ? formatTimeRemaining(expectationEvent.timeRemaining, 'seconds')
                : formatTimeRemaining(expectationEvent.timeRemaining, 'days');
        
        if (expectationEvent.id === 'lunch-time') {
            document.getElementById('date-next-holiday').style.display = 'none'; // 精确到秒，不显示日期
        } else {
            document.getElementById('date-next-holiday').textContent = formatDate(expectationEvent.nextOccurrence, false); // 只显示日期
        }
    }
}
function buildCalculationTooltip(event) {
    const now = getCurrentTime();
    if (event.id === 'workday-end') {
        return `下班倒计时\n现在: ${padZero(now.getHours())}:${padZero(now.getMinutes())}`+
               `\n上班: ${workStartTime} 午休: ${lunchStartTime}-${lunchEndTime} 下班: ${workEndTime}`+
               `\n剩余: ${padZero(event.timeRemaining.hours)}:${padZero(event.timeRemaining.minutes)}:${padZero(event.timeRemaining.seconds)}`;
    }
    if (event.id === 'weekend') {
        return `本周剩余工作时间\n至本周五下班的累计工作时长`+
               `\n上班: ${workStartTime} 午休: ${lunchStartTime}-${lunchEndTime} 下班: ${workEndTime}`+
               `\n累计: ${event.timeRemaining.hours}小时 ${event.timeRemaining.minutes}分钟`;
    }
    if (event.id === 'salary-day') {
        const st = localStorage.getItem('salaryType') || 'fixed';
        const sd = localStorage.getItem('salaryDay') || '1';
        return `发薪倒计时\n类型: ${st==='fixed'?'固定日期':'每月最后一天'}${st==='fixed'?` | 日期: ${sd}号`:''}`+
               `\n剩余: ${event.timeRemaining.days}天`;
    }
    return '';
}

let tooltipEl;
function ensureTooltip() {
    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.className = 'tooltip-card';
        document.body.appendChild(tooltipEl);
    }
}

function showTooltipAtElement(el, text) {
    ensureTooltip();
    tooltipEl.textContent = text;
    const rect = el.getBoundingClientRect();
    const padding = 8;
    const top = Math.max(8, rect.top + window.scrollY + padding);
    const left = Math.min(window.innerWidth - 20, rect.left + window.scrollX + rect.width + padding);
    tooltipEl.style.top = `${top}px`;
    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.display = 'block';
}

function hideTooltip() {
    if (tooltipEl) tooltipEl.style.display = 'none';
}

// 将调试信息通过请求发送到本地服务器，以在终端可见
function emitTerminalDebug(message) {
    try {
        const url = `/__hover_debug__?t=${Date.now()}&msg=${encodeURIComponent(message)}`;
        const img = new Image();
        img.src = url;
    } catch (e) {
        // 忽略错误以避免影响交互
    }
}

// 渲染其他假期
function renderOtherHolidays(sortedEvents) {
    const container = document.querySelector('.other-holidays');
    if (!container) return; // 防止容器不存在导致报错
    container.innerHTML = '';

    // 获取已经在主要倒计时中显示的事件ID
    const mainEventIds = ['workday-end', 'weekend', 'salary-day'];
    const expectationEvent = document.getElementById('time-next-holiday').textContent !== '--'
        ? sortedEvents.find(e =>
            formatTimeRemaining(e.timeRemaining, e.id === 'lunch-time' ? 'seconds' : 'days') ===
            document.getElementById('time-next-holiday').textContent)
        : null;
    
    if (expectationEvent) {
        mainEventIds.push(expectationEvent.id);
    }
    
    // 筛选出其他假期（不在主要倒计时中显示的假期）
    const otherHolidays = sortedEvents.filter(event =>
        (event.category === 'holiday' || event.category === 'custom-holiday') &&
        !mainEventIds.includes(event.id)
    );
    
    // 渲染其他假期
    otherHolidays.forEach(event => {
        const card = document.createElement('div');
        card.className = 'countdown-card';
        
        card.innerHTML = `
            <h3>${event.name}</h3>
            <div class="countdown-time">${formatTimeRemaining(event.timeRemaining, 'days')}</div>
            <div class="countdown-date">${formatDate(event.nextOccurrence, false)}</div>
        `;
        
        // 添加点击事件
        card.addEventListener('click', () => {
            showToast('马上下班啦，加油！！');
        });
        
        container.appendChild(card);
    });
}

// 渲染自定义事件列表
function renderCustomEventsList(customEvents) {
    const container = document.querySelector('.custom-events-list');
    container.innerHTML = '';
    
    customEvents.forEach(event => {
        const item = document.createElement('div');
        item.className = 'custom-event-item';
        
        item.innerHTML = `
            <div class="event-info">
                <div class="event-name">${event.name}</div>
                <div class="event-time">${formatDate(event.nextOccurrence, true)} (${event.repeat === 'none' ? '不重复' : getRepeatText(event.repeat)})</div>
            </div>
            <div class="event-actions">
                <button class="delete-btn" data-id="${event.id}">删除</button>
            </div>
        `;
        
        container.appendChild(item);
        
        // 添加删除按钮事件
        item.querySelector('.delete-btn').addEventListener('click', function() {
            deleteCustomEvent(this.getAttribute('data-id'));
        });
    });
}

// 更新所有倒计时
function updateCountdowns() {
    // 更新右上角当前时间
    const now = getCurrentTime();
    const currentTimeElement = document.getElementById('current-time');
    if (currentTimeElement) {
        currentTimeElement.textContent = `${padZero(now.getHours())}:${padZero(now.getMinutes())}:${padZero(now.getSeconds())}`;
    }

    // 更新存钱罐
    updatePiggyBank();
    
    // 重新计算每个事件的下一次发生时间和剩余时间
    const eventsWithNextOccurrence = events.map(event => {
        const nextOccurrence = getNextOccurrence(event);
        const timeRemaining = getTimeRemaining(nextOccurrence, event);
        
        return {
            ...event,
            nextOccurrence,
            timeRemaining
        };
    });
    
    // 按剩余时间排序
    const sortedEvents = eventsWithNextOccurrence.sort((a, b) => 
        a.nextOccurrence.getTime() - b.nextOccurrence.getTime()
    );
    
    // 更新主要倒计时
    renderMainCountdowns(sortedEvents);
}

// 获取事件的下一次发生时间
function getNextOccurrence(event) {
    const now = getCurrentTime();
    let nextDate;
    
    switch (event.repeat) {
        case 'none':
            // 不重复的事件
            return event.date;
            
        case 'daily':
            // 每天重复的事件
            nextDate = new Date(now);
            nextDate.setHours(parseInt(event.time.split(':')[0]));
            nextDate.setMinutes(parseInt(event.time.split(':')[1]));
            nextDate.setSeconds(0);
            
            // 如果今天的时间已经过了，设置为明天
            if (nextDate <= now) {
                nextDate.setDate(nextDate.getDate() + 1);
            }
            return nextDate;
            
        case 'workdays':
            // 工作日重复的事件
            nextDate = new Date(now);
            nextDate.setHours(parseInt(event.time.split(':')[0]));
            nextDate.setMinutes(parseInt(event.time.split(':')[1]));
            nextDate.setSeconds(0);
            
            // 检查是否是有效的工作日（非周末、非假日，或者是串休上班日）
            function isEffectiveWorkday(date) {
                const dayOfWeek = date.getDay();
                // 周末但串休上班
                if ((dayOfWeek === 0 || dayOfWeek === 6) && isWeekendWork(date)) {
                    return true;
                }
                // 工作日且不是公休假期
                if (dayOfWeek !== 0 && dayOfWeek !== 6 && !isHoliday(date)) {
                    return true;
                }
                return false;
            }
            
            // 如果今天的时间已经过了，或者今天不是有效工作日，找下一个有效工作日
            if (nextDate <= now || !isEffectiveWorkday(nextDate)) {
                // 找到下一个有效工作日
                do {
                    nextDate.setDate(nextDate.getDate() + 1);
                } while (!isEffectiveWorkday(nextDate));
            }
            return nextDate;
            
        case 'weekly':
            // 每周重复的事件
            nextDate = new Date(now);
            const targetDay = event.dayOfWeek; // 0是周日，6是周六
            const currentDay = now.getDay();
            
            // 计算到下一个目标日期的天数
            let daysUntilTarget = targetDay - currentDay;
            if (daysUntilTarget <= 0) {
                daysUntilTarget += 7; // 如果目标日已过，等到下周
            }
            
            nextDate.setDate(nextDate.getDate() + daysUntilTarget);
            
            // 如果有指定时间
            if (event.time) {
                nextDate.setHours(parseInt(event.time.split(':')[0]));
                nextDate.setMinutes(parseInt(event.time.split(':')[1]));
            } else {
                nextDate.setHours(0);
                nextDate.setMinutes(0);
            }
            nextDate.setSeconds(0);
            
            return nextDate;
            
        case 'monthly':
            // 每月重复的事件
            nextDate = new Date(now.getFullYear(), now.getMonth(), event.day);
            
            // 如果本月的日期已过，设置为下个月
            if (nextDate <= now) {
                nextDate = new Date(now.getFullYear(), now.getMonth() + 1, event.day);
            }
            
            // 如果有指定时间
            if (event.time) {
                nextDate.setHours(parseInt(event.time.split(':')[0]));
                nextDate.setMinutes(parseInt(event.time.split(':')[1]));
            } else {
                nextDate.setHours(0);
                nextDate.setMinutes(0);
            }
            nextDate.setSeconds(0);
            
            return nextDate;
            
        case 'yearly':
            // 每年重复的事件
            if (event.date) {
                // 如果有完整日期
                const month = event.date.getMonth();
                const day = event.date.getDate();
                
                nextDate = new Date(now.getFullYear(), month, day);
                
                // 如果今年的日期已过，设置为明年
                if (nextDate <= now) {
                    nextDate = new Date(now.getFullYear() + 1, month, day);
                }
                
                return nextDate;
            } else if (event.month && event.day) {
                // 如果有月和日
                nextDate = new Date(now.getFullYear(), event.month - 1, event.day);
                
                // 如果今年的日期已过，设置为明年
                if (nextDate <= now) {
                    nextDate = new Date(now.getFullYear() + 1, event.month - 1, event.day);
                }
                
                return nextDate;
            }
            break;
            
        default:
            // 默认返回事件日期
            return event.date || now;
    }
}

// 计算剩余时间
function getTimeRemaining(targetDate, event) {
    const now = getCurrentTime();
    let difference = targetDate.getTime() - now.getTime();
    
    // 如果目标日期已过，返回0
    if (difference < 0) {
        return {
            total: 0,
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0
        };
    }
    
    // 如果是午饭时间事件
    if (event && event.id === 'lunch-time') {
        // 计算当前时间
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentSecond = now.getSeconds();
        
        // 午饭开始时间
        const [lunchStartHour, lunchStartMinute] = lunchStartTime.split(':').map(Number);
        
        // 如果当前时间在午饭开始时间之前
        if (currentHour < lunchStartHour || (currentHour === lunchStartHour && currentMinute < lunchStartMinute)) {
            // 计算到午饭开始时间的剩余时间（精确到秒）
            const remainingSeconds = (lunchStartHour * 3600 + lunchStartMinute * 60) - (currentHour * 3600 + currentMinute * 60 + currentSecond);
            return {
                total: remainingSeconds * 1000,
                days: 0,
                hours: Math.floor(remainingSeconds / 3600),
                minutes: Math.floor((remainingSeconds % 3600) / 60),
                seconds: remainingSeconds % 60,
                isWorkTime: true
            };
        }
    }
    
    // 如果是下班时间事件
    if (event && event.id === 'workday-end') {
        // 获取工作开始和结束时间
        const [startHour, startMinute] = workStartTime.split(':').map(Number);
        const [lunchStartHour, lunchStartMinute] = lunchStartTime.split(':').map(Number);
        const [lunchEndHour, lunchEndMinute] = lunchEndTime.split(':').map(Number);
        const [endHour, endMinute] = workEndTime.split(':').map(Number);
        
        // 计算当前时间
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentSecond = now.getSeconds();
        
        // 计算午休时长（分钟）
        const lunchDurationMinutes = (lunchEndHour * 60 + lunchEndMinute) - (lunchStartHour * 60 + lunchStartMinute);
        
        // 如果当前时间在工作开始时间之前
        if (currentHour < startHour || (currentHour === startHour && currentMinute < startMinute)) {
            // 返回全天工作时间（减去午休时间）
            const workTotalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute) - lunchDurationMinutes;
            return {
                total: workTotalMinutes * 60 * 1000,
                days: 0,
                hours: Math.floor(workTotalMinutes / 60),
                minutes: workTotalMinutes % 60,
                seconds: 0,
                isWorkTime: true
            };
        } 
        // 如果当前时间在上午工作时间内（上班时间到午休开始时间之前）
        else if ((currentHour < lunchStartHour || (currentHour === lunchStartHour && currentMinute < lunchStartMinute)) &&
                 (currentHour > startHour || (currentHour === startHour && currentMinute >= startMinute))) {
            // 计算剩余工作时间（上午工作时间 + 下午工作时间）
            const remainingSeconds = (lunchStartHour * 3600 + lunchStartMinute * 60) - (currentHour * 3600 + currentMinute * 60 + currentSecond) +
                                     (endHour * 3600 + endMinute * 60) - (lunchEndHour * 3600 + lunchEndMinute * 60);
            return {
                total: remainingSeconds * 1000,
                days: 0,
                hours: Math.floor(remainingSeconds / 3600),
                minutes: Math.floor((remainingSeconds % 3600) / 60),
                seconds: remainingSeconds % 60,
                isWorkTime: true
            };
        }
        // 如果当前时间在午休时间内
        else if ((currentHour > lunchStartHour || (currentHour === lunchStartHour && currentMinute >= lunchStartMinute)) &&
                 (currentHour < lunchEndHour || (currentHour === lunchEndHour && currentMinute < lunchEndMinute))) {
            // 计算剩余工作时间（下午工作时间）
            const remainingSeconds = (endHour * 3600 + endMinute * 60) - (lunchEndHour * 3600 + lunchEndMinute * 60) - 
                                     ((currentHour * 3600 + currentMinute * 60 + currentSecond) - (lunchStartHour * 3600 + lunchStartMinute * 60));
            return {
                total: remainingSeconds * 1000,
                days: 0,
                hours: Math.floor(remainingSeconds / 3600),
                minutes: Math.floor((remainingSeconds % 3600) / 60),
                seconds: remainingSeconds % 60,
                isWorkTime: true
            };
        }
        // 如果当前时间在下午工作时间内
        else if ((currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) &&
                 (currentHour > lunchEndHour || (currentHour === lunchEndHour && currentMinute >= lunchEndMinute))) {
            // 计算剩余工作时间（精确到秒）
            const remainingSeconds = (endHour * 3600 + endMinute * 60) - (currentHour * 3600 + currentMinute * 60 + currentSecond);
            return {
                total: remainingSeconds * 1000,
                days: 0,
                hours: Math.floor(remainingSeconds / 3600),
                minutes: Math.floor((remainingSeconds % 3600) / 60),
                seconds: remainingSeconds % 60,
                isWorkTime: true
            };
        }
    }
    
    // 如果是周末事件，计算到本周五下班时间的剩余工作时间
    if (workTimeConfig && event && event.id === 'weekend') {
        // 计算本周五的日期
        const nextFriday = new Date(now);
        const daysToFriday = 5 - now.getDay(); // 5是周五
        // 如果今天已经超过周五，则计算到本周五（可能是过去的周五）
        if (daysToFriday < 0) {
            nextFriday.setDate(nextFriday.getDate() + daysToFriday);
        } else if (daysToFriday > 0) {
            nextFriday.setDate(nextFriday.getDate() + daysToFriday);
        }
        // 设置为周五下班时间
        nextFriday.setHours(workTimeConfig.endHour, workTimeConfig.endMinute || 0, 0, 0);

        // 如果当前时间已经超过本周五下班时间，则计算到本周五下班时间的剩余时间为0
        if (now >= nextFriday) {
            return {
                total: 0,
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
                isWorkTime: true
            };
        }

        // 计算从现在到本周五下班时间的剩余工作时间总和（毫秒）
        let totalWorkTime = 0;
        const currentDate = new Date(now);
        
        // 计算每天的工作时长（减去午休时间）
        const workDayDuration = ((workTimeConfig.endHour * 60 + workTimeConfig.endMinute) - 
                                (workTimeConfig.startHour * 60 + workTimeConfig.startMinute) - 
                                ((workTimeConfig.lunchEndHour * 60 + workTimeConfig.lunchEndMinute) - 
                                (workTimeConfig.lunchStartHour * 60 + workTimeConfig.lunchStartMinute))) * 60 * 1000;

        while (currentDate < nextFriday) {
            // 如果是工作日且不是假日且不是周五之后的日期
            const currentDay = currentDate.getDay();
            if (currentDay >= 1 && currentDay <= 5 && !isHoliday(currentDate)) { // 周一到周五
                const workStart = new Date(currentDate);
                workStart.setHours(workTimeConfig.startHour, workTimeConfig.startMinute || 0, 0, 0);

                const lunchStart = new Date(currentDate);
                lunchStart.setHours(workTimeConfig.lunchStartHour, workTimeConfig.lunchStartMinute || 0, 0, 0);
                
                const lunchEnd = new Date(currentDate);
                lunchEnd.setHours(workTimeConfig.lunchEndHour, workTimeConfig.lunchEndMinute || 0, 0, 0);

                const workEnd = new Date(currentDate);
                workEnd.setHours(workTimeConfig.endHour, workTimeConfig.endMinute || 0, 0, 0);

                // 检查是否是今天
                const isToday = currentDate.toDateString() === now.toDateString();
                
                if (isToday) {
                    // 今天需要特殊处理，计算当前时间到下班时间的剩余工作时间
                    if (now < workStart) {
                        // 当前时间在工作开始前，增加全天工作时间
                        totalWorkTime += workDayDuration;
                    } else if (now < lunchStart) {
                        // 当前时间在上午工作时间内
                        totalWorkTime += (lunchStart - now) + (workEnd - lunchEnd);
                } else if (now < lunchEnd) {
                    // 当前时间在午休时间内
                    totalWorkTime += workEnd - lunchEnd;
                } else if (now < workEnd) {
                    // 当前时间在下午工作时间内
                    totalWorkTime += workEnd - now;
                }
                    // 如果当前时间在工作结束后，不增加时间
                } else {
                    // 不是今天，增加全天工作时间
                    totalWorkTime += workDayDuration;
                }
            }

            // 移动到下一天
            currentDate.setDate(currentDate.getDate() + 1);
            currentDate.setHours(0, 0, 0, 0);
        }

        // 基于工作时间计算剩余时间
        const days = Math.floor(totalWorkTime / (1000 * 60 * 60 * 24));
        const hours = Math.floor((totalWorkTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((totalWorkTime % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((totalWorkTime % (1000 * 60)) / 1000);

        return {
            total: totalWorkTime,
            days: days,
            hours: hours,
            minutes: minutes,
            seconds: seconds,
            isWorkTime: true
        };
    }

    // 计算天、小时、分钟和秒
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return {
        total: difference,
        days: days,
        hours: hours,
        minutes: minutes,
        seconds: seconds
    };
}

// 格式化剩余时间显示
function formatTimeRemaining(timeRemaining, precision = 'auto') {
    if (timeRemaining.total === 0) {
        return '已到时间！';
    }
    
    // 根据精度格式化
    switch (precision) {
        case 'seconds':
            // 精确到秒
            return `${padZero(timeRemaining.hours)}:${padZero(timeRemaining.minutes)}:${padZero(timeRemaining.seconds)}`;
            
        case 'minutes':
            // 精确到分钟
            if (timeRemaining.days > 0) {
                return `${timeRemaining.days}天 ${padZero(timeRemaining.hours)}:${padZero(timeRemaining.minutes)}`;
            } else {
                return `${padZero(timeRemaining.hours)}:${padZero(timeRemaining.minutes)}`;
            }
            
        case 'hours':
            // 精确到小时
            if (timeRemaining.days > 0) {
                return `${timeRemaining.days}天 ${timeRemaining.hours}小时`;
            } else {
                return `${timeRemaining.hours}小时 ${timeRemaining.minutes}分钟`;
            }
            
        case 'days':
            // 精确到天
            return `${timeRemaining.days}天`;
            
        case 'auto':
        default:
            // 自动判断精度
            if (timeRemaining.days > 0) {
                return `${timeRemaining.days}天 ${timeRemaining.hours}小时`;
            } else if (timeRemaining.hours > 0) {
                return `${timeRemaining.hours}小时 ${timeRemaining.minutes}分钟`;
            } else {
                return `${timeRemaining.minutes}分钟 ${timeRemaining.seconds}秒`;
            }
    }
}

// 格式化日期显示
function formatDate(date, showTime = true) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
    
    if (showTime) {
        return `${year}年${month}月${day}日 ${weekday} ${padZero(hours)}:${padZero(minutes)}`;
    } else {
        return `${year}年${month}月${day}日 ${weekday}`;
    }
}

// 数字补零
function padZero(num) {
    return num < 10 ? `0${num}` : num;
}

// 验证时间设置的合理性
function validateTimeSettings(startTime, lunchStart, lunchEnd, endTime) {
    // 将时间字符串转换为分钟数进行比较
    function timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }
    
    const startMinutes = timeToMinutes(startTime);
    const lunchStartMinutes = timeToMinutes(lunchStart);
    const lunchEndMinutes = timeToMinutes(lunchEnd);
    const endMinutes = timeToMinutes(endTime);
    
    // 检查时间顺序是否合理
    if (startMinutes >= lunchStartMinutes) {
        alert('上班时间必须早于午休开始时间');
        return false;
    }
    
    if (lunchStartMinutes >= lunchEndMinutes) {
        alert('午休开始时间必须早于午休结束时间');
        return false;
    }
    
    if (lunchEndMinutes >= endMinutes) {
        alert('午休结束时间必须早于下班时间');
        return false;
    }
    
    return true;
}

// 获取重复类型文本
function getRepeatText(repeat) {
    switch (repeat) {
        case 'daily': return '每天';
        case 'workdays': return '工作日';
        case 'weekly': return '每周';
        case 'monthly': return '每月';
        case 'yearly': return '每年';
        default: return '';
    }
}

// 初始化标签页
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const footerTabs = document.querySelectorAll('.footer-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // 标签按钮点击事件
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            setActiveTab(tabId);
        });
    });
    
    // 底部标签点击事件
    footerTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            setActiveTab(tabId);
        });
    });
    
    // 设置活动标签
    function setActiveTab(tabId) {
        activeTab = tabId;
        
        // 更新标签按钮状态
        tabBtns.forEach(btn => {
            if (btn.getAttribute('data-tab') === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // 更新底部标签状态
        footerTabs.forEach(tab => {
            if (tab.getAttribute('data-tab') === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // 更新内容区域
        tabContents.forEach(content => {
            if (content.getAttribute('id') === tabId) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
        
        // 如果切换到日历标签，初始化日历
        if (tabId === 'calendar') {
            initCalendar();
        }
    }
}

// 更新存钱罐显示
function updatePiggyBank() {
    // 找到发薪日事件
    const salaryDayEvent = events.find(e => e.id === 'salary-day');
    if (!salaryDayEvent) return;

    const now = getCurrentTime();
    const nextSalaryDay = getNextOccurrence(salaryDayEvent);
    const prevSalaryDay = new Date(nextSalaryDay);
    prevSalaryDay.setMonth(prevSalaryDay.getMonth() - 1);

    // 计算上一次发薪日到下一次发薪日的总天数
    const totalDays = Math.ceil((nextSalaryDay - prevSalaryDay) / (1000 * 60 * 60 * 24));

    // 计算当前到下一次发薪日的剩余天数
    const remainingDays = Math.ceil((nextSalaryDay - now) / (1000 * 60 * 60 * 24));

    // 计算进度百分比
    const progressPercentage = Math.max(0, Math.min(100, ((totalDays - remainingDays) / totalDays) * 100));

    // 更新进度条
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');

    if (progressFill && progressText) {
        progressFill.style.width = `${progressPercentage}%`;
        progressText.textContent = `本月工资进度：${Math.round(progressPercentage)}%`;
    }
}

// 显示彩色toast提示
function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// 日历全局变量
let currentMonth;
let currentYear;

// 初始化日历
function initCalendar() {
    const today = new Date();
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();
    
    // 渲染日历
    renderCalendar(currentMonth, currentYear);
    
    // 上个月按钮
    const prevBtn = document.getElementById('prev-month');
    const newPrevBtn = prevBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    newPrevBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar(currentMonth, currentYear);
    });
    
    // 下个月按钮
    const nextBtn = document.getElementById('next-month');
    const newNextBtn = nextBtn.cloneNode(true);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
    newNextBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar(currentMonth, currentYear);
    });
}

// 渲染日历
function renderCalendar(month, year) {
    const calendarDays = document.querySelector('.calendar-days');
    const monthYearText = document.getElementById('current-month');
    
    // 月份名称
    const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
    
    // 设置月份和年份标题
    monthYearText.textContent = `${year}年${monthNames[month]}`;
    
    ensureOfficialHolidaysInitialized();
    mergeOfficialHolidaysIntoCalendar(year, month);
    
    calendarDays.innerHTML = '';
    
    // 获取当月第一天
    const firstDay = new Date(year, month, 1);
    
    // 获取当月天数
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // 获取第一天是星期几（0是星期日，6是星期六）
    let firstDayOfWeek = firstDay.getDay();
    // 添加空白格子
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarDays.appendChild(emptyDay);
    }
    // 添加日期
        const today = getCurrentTime();
    for (let i = 1; i <= daysInMonth; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = i;
        // 检查是否是今天
        if (year === today.getFullYear() && month === today.getMonth() && i === today.getDate()) {
            dayElement.classList.add('today');
        }
        // 检查是否是周末
        const currentDate = new Date(year, month, i);
        const dayOfWeek = currentDate.getDay();
        const dateStr = `${year}-${month + 1}-${i}`;
        
        // 初始化状态
        if (dayOfWeek === 6 || dayOfWeek === 0) {
            // 周末
            dayElement.classList.add('weekend');
            // 检查是否是串休上班日
            if (weekendsWork[dateStr]) {
                dayElement.classList.remove('weekend');
                dayElement.classList.add('weekend-work');
            }
        } else {
            // 工作日
            dayElement.classList.add('workday');
            // 检查是否是公休假期
            if (workdaysOff[dateStr]) {
                dayElement.classList.remove('workday');
                dayElement.classList.add('workday-off');
            }
        }
        const officialData = JSON.parse(localStorage.getItem('officialHolidays') || '{}');
        if (officialData[dateStr]) {
            const label = document.createElement('div');
            label.className = 'holiday-label';
            label.textContent = officialData[dateStr];
            dayElement.appendChild(label);
            dayElement.classList.add('workday-off');
            dayElement.classList.remove('workday');
        }
        // 点击事件 - 切换假日/串休状态
        dayElement.addEventListener('click', () => {
            const dateStr = `${year}-${month + 1}-${i}`;
            
            if (dayOfWeek === 6 || dayOfWeek === 0) {
                // 周末：在正常周末和串休上班日之间切换
                if (dayElement.classList.contains('weekend-work')) {
                    dayElement.classList.remove('weekend-work');
                    dayElement.classList.add('weekend');
                    delete weekendsWork[dateStr];
                } else {
                    dayElement.classList.remove('weekend');
                    dayElement.classList.add('weekend-work');
                    weekendsWork[dateStr] = true;
                }
                localStorage.setItem('weekendsWork', JSON.stringify(weekendsWork));
            } else {
                // 工作日：在正常工作日和公休假期之间切换
                if (dayElement.classList.contains('workday-off')) {
                    dayElement.classList.remove('workday-off');
                    dayElement.classList.add('workday');
                    delete workdaysOff[dateStr];
                } else {
                    dayElement.classList.remove('workday');
                    dayElement.classList.add('workday-off');
                    workdaysOff[dateStr] = true;
                }
                localStorage.setItem('workdaysOff', JSON.stringify(workdaysOff));
            }
            
            // 重新加载事件
            addDefaultEvents();
            renderEvents();
        });
        calendarDays.appendChild(dayElement);
    }
    
    
}

// 首次设置弹窗发薪日类型切换
document.getElementById('salary-type').addEventListener('change', function() {
    document.getElementById('salary-fixed-group').style.display =
        this.value === 'fixed' ? 'block' : 'none';
});

// 设置页发薪日类型切换
document.getElementById('settings-salary-type').addEventListener('change', function() {
    document.getElementById('settings-salary-fixed-group').style.display =
        this.value === 'fixed' ? 'block' : 'none';
});

document.getElementById('import-official-holidays').addEventListener('click', function() {
    const el = document.getElementById('official-holidays-json');
    try {
        const obj = JSON.parse(el.value || '{}');
        localStorage.setItem('officialHolidays', JSON.stringify(obj));
        showToast('节假日数据已导入');
        addDefaultEvents();
        renderEvents();
        if (document.getElementById('calendar').classList.contains('active')) {
            renderCalendar(currentMonth, currentYear);
        }
    } catch (e) {
        alert('JSON 格式错误');
    }
});

document.getElementById('reset-official-holidays').addEventListener('click', function() {
    localStorage.setItem('officialHolidays', JSON.stringify(defaultOfficialHolidays));
    document.getElementById('official-holidays-json').value = JSON.stringify(defaultOfficialHolidays, null, 2);
    showToast('已重置为默认节假日');
    addDefaultEvents();
    renderEvents();
    if (document.getElementById('calendar').classList.contains('active')) {
        renderCalendar(currentMonth, currentYear);
    }
});

 
// 计算发薪倒计时时，判断类型
function getNextSalaryDay() {
    const now = getCurrentTime();
    const salaryType = localStorage.getItem('salaryType') || 'fixed';
    let nextSalaryDate;

    if (salaryType === 'last') {
        // 获取当月最后一天
        nextSalaryDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        // 如果当前日期已过本月最后一天，则计算下个月最后一天
        if (now > nextSalaryDate) {
            nextSalaryDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);
        }
    } else {
        // 获取用户设置的发薪日（默认为1号）
        const salaryDayOfMonth = parseInt(localStorage.getItem('salaryDay')) || 1;
        
        // 设置本月发薪日
        nextSalaryDate = new Date(now.getFullYear(), now.getMonth(), salaryDayOfMonth);
        
        // 如果当前日期已过本月发薪日，则计算下个月发薪日
        if (now > nextSalaryDate) {
            nextSalaryDate = new Date(now.getFullYear(), now.getMonth() + 1, salaryDayOfMonth);
        }
    }

    // 统一设置时间为当天00:00:00
    nextSalaryDate.setHours(0, 0, 0, 0);
    return nextSalaryDate;
}

function updateSalaryCountdown() {
    const nextSalaryDate = getNextSalaryDay();
    const now = getCurrentTime();
    
    // 创建新的日期对象，只保留年月日信息
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = new Date(nextSalaryDate.getFullYear(), nextSalaryDate.getMonth(), nextSalaryDate.getDate());
    
    // 计算天数差（使用UTC时间戳来避免时区影响）
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    // 更新显示
    document.getElementById('time-salary-day').textContent = `${diffDays}天`;
    document.getElementById('date-salary-day').textContent = formatDate(nextSalaryDate, false);
}

// 在页面加载和设置保存时都需要更新倒计时
window.addEventListener('DOMContentLoaded', function() {
    // ...existing code...
    updateSalaryCountdown();
});

// 确保设置更新后重新计算
document.getElementById('update-work-time').addEventListener('click', function() {
    // ...existing code...
    updateSalaryCountdown();
});
function bindMainCardEvents() {
    const cards = [
        document.getElementById('workday-end-card'),
        document.getElementById('weekend-card'),
        document.getElementById('salary-day-card'),
        document.getElementById('next-holiday-card')
    ];
    cards.forEach(card => {
        if (!card || card.dataset.bound === 'true') return;
        card.addEventListener('click', () => {
            showToast('马上下班啦，加油！！');
        });
        card.addEventListener('mouseenter', () => {
            console.log('[HoverDebug] mouseenter card=' + card.id);
            emitTerminalDebug('[HoverDebug] mouseenter card=' + card.id);
            const id = card.id;
            let event;
            if (id === 'workday-end-card') event = (window.lastSortedEvents || []).find(e => e.id === 'workday-end');
            if (id === 'weekend-card') event = (window.lastSortedEvents || []).find(e => e.id === 'weekend');
            if (id === 'salary-day-card') event = (window.lastSortedEvents || []).find(e => e.id === 'salary-day');
            if (!event) {
                console.log('[HoverDebug] no event for card=' + card.id);
                emitTerminalDebug('[HoverDebug] no event for card=' + card.id);
                return;
            }
            const tt = buildCalculationTooltip(event);
            console.log('[HoverDebug] tooltip for card=' + card.id + '\n' + tt);
            emitTerminalDebug('[HoverDebug] tooltip for card=' + card.id + '\n' + tt);
            showTooltipAtElement(card, tt);
        });
        card.addEventListener('mouseleave', () => {
            console.log('[HoverDebug] mouseleave card=' + card.id);
            emitTerminalDebug('[HoverDebug] mouseleave card=' + card.id);
            hideTooltip();
        });
        card.dataset.bound = 'true';
    });
}
