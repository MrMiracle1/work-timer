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

// 时间轴数据结构
let todayTimeline = [];

// 加载今日时间轴
function loadTodayTimeline() {
    const today = new Date().toDateString();
    const savedTimeline = localStorage.getItem(`timeline_${today}`);
    if (savedTimeline) {
        todayTimeline = JSON.parse(savedTimeline);
    } else {
        todayTimeline = [];
    }
}

// 保存今日时间轴
function saveTodayTimeline() {
    const today = new Date().toDateString();
    localStorage.setItem(`timeline_${today}`, JSON.stringify(todayTimeline));
}

// 添加时间轴事件
function addTimelineEvent(type, content, extraData = {}) {
    const event = {
        id: Date.now(),
        time: new Date(),
        type: type, // 'clock-in', 'clock-out', 'relax', 'pomodoro', etc.
        content: content,
        ...extraData
    };
    todayTimeline.push(event);
    saveTodayTimeline();
    return event;
}

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
    // 加载今日时间轴
    loadTodayTimeline();
    
    // 检查是否首次使用
    if (!localStorage.getItem('hasVisited')) {
        showSetupModal();
    } else {
        initApp();
    }
    
    // 初始化标签页
    initTabs();
    
    // 初始化侧边栏
    initSidebar();
    
    // 初始化番茄钟
    initPomodoro();
    
    // 初始化 AI 设置
    initAISettings();
    
    // 初始化打卡功能
    initClockIn();
    
    // 初始化时间轴
    initTimeline();
    
    // 初始化AI指令控制
    initCommandControl();
    
    // 初始化快捷功能
    initShortcuts();
    
    // 初始化日历事件功能
    initCalendarEvents();
    
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
    document.body.style.overflow = 'hidden'; // 禁止页面滚动
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
    const monthlySalary = document.getElementById('monthly-salary').value;
    
    // 验证时间设置的合理性
    if (!validateTimeSettings(startTime, lunchStart, lunchEnd, endTime)) {
        return;
    }
    
    // 保存设置到 localStorage
    localStorage.setItem('workStartTime', startTime);
    localStorage.setItem('lunchStartTime', lunchStart);
    localStorage.setItem('lunchEndTime', lunchEnd);
    localStorage.setItem('workEndTime', endTime);
    localStorage.setItem('monthlySalary', monthlySalary || '8000');
    localStorage.setItem('salaryType', document.getElementById('salary-type').value);
    localStorage.setItem('salaryDay', document.getElementById('salary-day').value);
    
    // 标记已完成初始设置
    localStorage.setItem('hasInitialized', 'true');
    localStorage.setItem('hasVisited', 'true');
    
    // 隐藏首次设置弹窗
    const setupModal = document.getElementById('setup-modal');
    setupModal.classList.remove('show');
    setupModal.style.display = 'none'; // 确保弹窗完全隐藏
    document.body.style.overflow = ''; // 恢复页面滚动
    
    // 显示保存成功提示
    showToast('设置已保存');
    
    // 重新初始化应用
    initApp();
});

// 页面加载时检查是否首次进入（没有缓存即首次进入）
window.addEventListener('DOMContentLoaded', function() {
    checkFirstVisit();
});


// 初始化侧边栏
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const menuToggle = document.getElementById('menu-toggle');
    const closeSidebar = document.getElementById('close-sidebar');
    const navItems = document.querySelectorAll('.nav-item');
    
    // 打开侧边栏
    menuToggle.addEventListener('click', () => {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('show');
    });
    
    // 关闭侧边栏
    const closeSidebarFn = () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('show');
    };
    
    closeSidebar.addEventListener('click', closeSidebarFn);
    sidebarOverlay.addEventListener('click', closeSidebarFn);
    
    // 导航项点击事件
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');
            
            // 更新活动状态
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // 切换标签页
            switchTab(tabId);
            
            // 关闭侧边栏
            closeSidebarFn();
        });
    });
}

// 番茄钟相关变量
let pomodoroTimer = null;
let pomodoroSeconds = 0;
let pomodoroTotalSeconds = 0;

// 初始化番茄钟
function initPomodoro() {
    const openBtn = document.getElementById('open-pomodoro');
    const closeBtn = document.getElementById('close-pomodoro');
    const modal = document.getElementById('pomodoro-modal');
    const startBtn = document.getElementById('start-pomodoro');
    const cancelBtn = document.getElementById('cancel-pomodoro');
    const restartBtn = document.getElementById('restart-pomodoro');
    const quickBtns = document.querySelectorAll('.quick-btn');
    
    // 打开番茄钟
    openBtn.addEventListener('click', () => {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    });
    
    // 关闭番茄钟
    const closePomodoroModal = () => {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        if (pomodoroTimer) {
            clearInterval(pomodoroTimer);
            pomodoroTimer = null;
        }
        resetPomodoroUI();
    };
    
    closeBtn.addEventListener('click', closePomodoroModal);
    
    // 快捷按钮
    quickBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const minutes = parseInt(btn.getAttribute('data-minutes'));
            document.getElementById('custom-minutes').value = minutes;
        });
    });
    
    // 开始专注
    startBtn.addEventListener('click', () => {
        const minutes = parseInt(document.getElementById('custom-minutes').value);
        if (minutes > 0 && minutes <= 120) {
            startPomodoro(minutes);
        } else {
            showToast('请输入1-120分钟的时长');
        }
    });
    
    // 取消专注
    cancelBtn.addEventListener('click', () => {
        if (confirm('确定要取消当前的专注吗？')) {
            clearInterval(pomodoroTimer);
            pomodoroTimer = null;
            resetPomodoroUI();
        }
    });
    
    // 再来一次
    restartBtn.addEventListener('click', () => {
        resetPomodoroUI();
    });
}

// 开始番茄钟
function startPomodoro(minutes) {
    pomodoroTotalSeconds = minutes * 60;
    pomodoroSeconds = pomodoroTotalSeconds;
    
    // 隐藏设置，显示运行中
    document.getElementById('pomodoro-setup').style.display = 'none';
    document.getElementById('pomodoro-running').style.display = 'block';
    
    // 开始倒计时
    pomodoroTimer = setInterval(() => {
        pomodoroSeconds--;
        updatePomodoroDisplay();
        
        if (pomodoroSeconds <= 0) {
            clearInterval(pomodoroTimer);
            pomodoroTimer = null;
            completePomodoro();
        }
    }, 1000);
    
    updatePomodoroDisplay();
}

// 更新番茄钟显示
function updatePomodoroDisplay() {
    const minutes = Math.floor(pomodoroSeconds / 60);
    const seconds = pomodoroSeconds % 60;
    document.getElementById('pomodoro-timer').textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// 完成番茄钟
function completePomodoro() {
    const totalMinutes = Math.floor(pomodoroTotalSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    let message = '恭喜完成，本次专注了';
    let duration = '';
    if (hours > 0) {
        message += `${hours}小时`;
        duration += `${hours}小时`;
    }
    if (minutes > 0) {
        message += `${minutes}分钟`;
        duration += `${minutes}分钟`;
    }
    
    document.getElementById('complete-message').textContent = message;
    document.getElementById('pomodoro-running').style.display = 'none';
    document.getElementById('pomodoro-complete').style.display = 'block';
    
    // 添加时间轴事件
    addTimelineEvent('pomodoro', `完成了 ${duration} 的番茄钟`, { duration: totalMinutes });
    
    showToast(message);
}

// 重置番茄钟UI
function resetPomodoroUI() {
    document.getElementById('pomodoro-setup').style.display = 'block';
    document.getElementById('pomodoro-running').style.display = 'none';
    document.getElementById('pomodoro-complete').style.display = 'none';
    document.getElementById('pomodoro-timer').textContent = '25:00';
    document.getElementById('custom-minutes').value = 25;
}

// 初始化 AI 设置
function initAISettings() {
    const apiKeyInput = document.getElementById('ai-api-key');
    const toggleBtn = document.getElementById('toggle-api-key');
    const saveBtn = document.getElementById('save-api-key');
    const testBtn = document.getElementById('test-api-key');
    const statusDiv = document.getElementById('api-status');
    
    // 加载保存的 API Key
    const savedKey = localStorage.getItem('deepseekApiKey');
    if (savedKey) {
        apiKeyInput.value = savedKey;
    }
    
    // 切换密钥显示/隐藏
    toggleBtn.addEventListener('click', () => {
        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            toggleBtn.textContent = '👁️';
        } else {
            apiKeyInput.type = 'password';
            toggleBtn.textContent = '👁️';
        }
    });
    
    // 保存 API Key
    saveBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            statusDiv.innerHTML = '<span style="color: red;">请输入 API 密钥</span>';
            return;
        }
        localStorage.setItem('deepseekApiKey', apiKey);
        statusDiv.innerHTML = '<span style="color: green;">✅ API 密钥已保存</span>';
        showToast('API 密钥已保存');
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 3000);
    });
    
    // 测试 API 连接
    testBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            statusDiv.innerHTML = '<span style="color: red;">请先输入 API 密钥</span>';
            return;
        }
        
        // 临时保存用于测试
        localStorage.setItem('deepseekApiKey', apiKey);
        statusDiv.innerHTML = '<span style="color: blue;">⏳ 正在测试连接...</span>';
        
        try {
            const result = await window.AIModule.getAIGreeting('CLOCK_IN');
            if (result.success) {
                statusDiv.innerHTML = '<span style="color: green;">✅ 连接成功！AI 回复: ' + result.message + '</span>';
            } else {
                statusDiv.innerHTML = '<span style="color: orange;">⚠️ 连接失败: ' + result.error + '</span>';
            }
        } catch (error) {
            statusDiv.innerHTML = '<span style="color: red;">❌ 测试失败: ' + error.message + '</span>';
        }
        
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 8000);
    });
}

// 初始化打卡功能
function initClockIn() {
    const clockInBtn = document.getElementById('clock-in-btn');
    const greetingModal = document.getElementById('greeting-modal');
    const closeGreetingBtn = document.getElementById('close-greeting-modal');
    
    // 更新按钮状态
    function updateClockInButton() {
        const today = new Date().toDateString();
        const lastClockInType = localStorage.getItem('lastClockInType') || null;
        const lastClockInDate = localStorage.getItem('lastClockInDate') || null;
        
        // 如果不是同一天，重置为上班打卡
        if (lastClockInDate !== today) {
            clockInBtn.textContent = '👋 上班打卡';
            clockInBtn.dataset.type = 'CLOCK_IN';
            clockInBtn.disabled = false;
            clockInBtn.style.opacity = '1';
            clockInBtn.style.cursor = 'pointer';
            return;
        }
        
        // 同一天的逻辑
        if (lastClockInType === 'CLOCK_IN') {
            // 已经上班打卡，显示下班打卡
            clockInBtn.textContent = '👋 下班打卡';
            clockInBtn.dataset.type = 'CLOCK_OUT';
            clockInBtn.disabled = false;
            clockInBtn.style.opacity = '1';
            clockInBtn.style.cursor = 'pointer';
        } else if (lastClockInType === 'CLOCK_OUT') {
            // 已经下班打卡，显示灰色按钮
            clockInBtn.textContent = '✅ 已下班';
            clockInBtn.dataset.type = 'FINISHED';
            clockInBtn.disabled = false; // 仍然可点击，但显示总结
            clockInBtn.style.opacity = '0.6';
            clockInBtn.style.cursor = 'pointer';
        } else {
            // 新的一天，默认上班打卡
            clockInBtn.textContent = '👋 上班打卡';
            clockInBtn.dataset.type = 'CLOCK_IN';
            clockInBtn.disabled = false;
            clockInBtn.style.opacity = '1';
            clockInBtn.style.cursor = 'pointer';
        }
    }
    
    // 初始化时更新按钮
    updateClockInButton();
    
    // 每分钟更新一次按钮状态
    setInterval(updateClockInButton, 60000);
    
    // 打卡按钮点击事件
    clockInBtn.addEventListener('click', async () => {
        const type = clockInBtn.dataset.type;
        const greetingMessage = document.getElementById('greeting-message');
        const greetingError = document.getElementById('greeting-error');
        const greetingCountdown = document.getElementById('greeting-countdown');
        const moyuFortuneSection = document.getElementById('moyu-fortune-section');
        const clockOutSummary = document.getElementById('clock-out-summary');
        
        // 初始化特效系统
        const effects = new ClockEffects('effect-canvas');
        
        // 记录打卡时间和信息
        const now = new Date();
        const today = now.toDateString();
        const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        
        // 立即绑定关闭事件（在显示弹窗前，确保加载时也能关闭）
        const closeModal = () => {
            effects.clear();
            greetingModal.classList.remove('show');
            document.body.style.overflow = '';
        };
        
        closeGreetingBtn.onclick = closeModal;
        greetingModal.onclick = (e) => {
            if (e.target === greetingModal) closeModal();
        };
        
        // 如果是已下班状态，直接显示总结
        if (type === 'FINISHED') {
            greetingMessage.innerHTML = '<div class="greeting-loading"><div class="spinner"></div><span>正在加载...</span></div>';
            greetingError.textContent = '';
            greetingCountdown.textContent = '';
            moyuFortuneSection.style.display = 'none';
            greetingModal.classList.add('show');
            document.body.style.overflow = 'hidden';
            
            // 生成问候语
            const greetingResult = await window.AIModule.getAIGreeting('CLOCK_OUT');
            greetingMessage.textContent = greetingResult.message;
            
            // 显示容器并添加加载动画（只更新summary-content，不破坏容器）
            clockOutSummary.style.display = 'block';
            const summaryContent = document.getElementById('summary-content');
            if (summaryContent) {
                summaryContent.innerHTML = '<div class="loading-animation"><div class="spinner"></div><p>正在生成工作总结...</p></div>';
            }
            
            try {
                // 显示总结
                await displayWorkSummary();
            } catch (error) {
                const summaryContent = document.getElementById('summary-content');
                if (summaryContent) {
                    summaryContent.innerHTML = `
                        <div class="work-summary">
                            <h3>📋 今日工作总结</h3>
                            <div class="summary-ai-text">今天辛苦了！一天的工作圆满完成，明天继续加油！💪</div>
                        </div>
                    `;
                }
            }
            
            return;
        }
        
        // 先显示弹窗和加载动画
        greetingMessage.innerHTML = '<div class="greeting-loading"><div class="spinner"></div><span>正在生成问候语...</span></div>';
        greetingError.textContent = '';
        greetingCountdown.textContent = '';
        moyuFortuneSection.style.display = 'none';
        clockOutSummary.style.display = 'none';
        greetingModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // 立即保存打卡状态（关闭弹窗也算打卡成功）
        localStorage.setItem('lastClockInType', type);
        localStorage.setItem('lastClockInDate', today);
        if (type === 'CLOCK_IN') {
            localStorage.setItem(`clockInTime_${today}`, now.toISOString());
        }
        updateClockInButton();
        
        // 生成问候语
        const greetingResult = await window.AIModule.getAIGreeting(type);
        greetingMessage.textContent = greetingResult.message;
        
        if (type === 'CLOCK_IN') {
            // 上班打卡：生成摸鱼吉日签
            // 播放阳光特效
            effects.playSunshine();
            
            // 添加加载动画
            moyuFortuneSection.innerHTML = '<div class="loading-animation"><div class="spinner"></div><p>正在生成摸鱼吉日签...</p></div>';
            moyuFortuneSection.style.display = 'block';
            
            // 获取摸鱼吉日签
            const fortuneResult = await window.AIModule.getMoyuFortune();
            
            if (!fortuneResult.isAI && fortuneResult.error) {
                greetingError.textContent = `AI 调用失败: ${fortuneResult.error}`;
                console.warn('AI调用失败，使用兜底数据');
            }
            
            // 显示摸鱼吉日签（函数内部会重建 HTML）
            displayMoyuFortune(fortuneResult.data);
            
            // 保存摸鱼运势到localStorage（用于header显示）
            localStorage.setItem(`moyuFortune_${today}`, fortuneResult.data.fortune);
            displayDailyNote(fortuneResult.data.fortune);
            
            // 再求一签按钮
            document.getElementById('retry-fortune').onclick = async () => {
                document.getElementById('retry-fortune').disabled = true;
                document.getElementById('retry-fortune').textContent = '正在求签...';
                
                const newFortune = await window.AIModule.getMoyuFortune();
                displayMoyuFortune(newFortune.data);
                localStorage.setItem(`moyuFortune_${today}`, newFortune.data.fortune);
                displayDailyNote(newFortune.data.fortune);
                
                document.getElementById('retry-fortune').disabled = false;
                document.getElementById('retry-fortune').textContent = '🎲 再求一签';
            };
            
            // 开始摸鱼按钮
            document.getElementById('save-fortune').onclick = () => {
                addTimelineEvent('clock-in', `上班打卡 ${timeStr}`, { 
                    fortune: fortuneResult.data.fortune 
                });
                
                closeModal();
                showToast('摸鱼吉日签已保存！');
            };
        } else {
            // 下班打卡：生成今日统计报告
            // 播放礼花特效
            effects.playFireworks();
            
            // 显示容器并添加加载动画（只更新summary-content，不破坏容器）
            clockOutSummary.style.display = 'block';
            const summaryContent = document.getElementById('summary-content');
            if (summaryContent) {
                summaryContent.innerHTML = '<div class="loading-animation"><div class="spinner"></div><p>正在生成工作总结...</p></div>';
            }
            
            try {
                // 显示总结
                await displayWorkSummary();
            } catch (error) {
                console.error('显示工作总结失败:', error);
                const summaryContent = document.getElementById('summary-content');
                if (summaryContent) {
                    summaryContent.innerHTML = `
                        <div class="work-summary">
                            <h3>📋 今日工作总结</h3>
                            <div class="summary-ai-text">今天辛苦了！一天的工作圆满完成，明天继续加油！💪</div>
                        </div>
                    `;
                }
            }
            
            // 添加时间轴事件
            addTimelineEvent('clock-out', `下班打卡 ${timeStr}`);
        }
    });
    
    // 初始化时更新按钮状态
    updateClockInButton();
}

// 生成今日统计报告
function generateDailySummary() {
    const today = new Date().toDateString();
    const clockInTime = localStorage.getItem(`clockInTime_${today}`);
    
    // 统计摸鱼次数（点击卡片事件）
    const relaxEvents = todayTimeline.filter(e => e.type === 'relax');
    const morningRelax = relaxEvents.filter(e => {
        const hour = new Date(e.time).getHours();
        return hour < 12;
    });
    const afternoonRelax = relaxEvents.filter(e => {
        const hour = new Date(e.time).getHours();
        return hour >= 12;
    });
    
    let summary = '<h3>📋 今日工作总结</h3>';
    
    if (clockInTime) {
        const clockIn = new Date(clockInTime);
        const clockInStr = clockIn.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        summary += `<p>🌅 今天 ${clockInStr} 开始了一天的工作。</p>`;
    }
    
    const now = new Date();
    const clockOutStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    summary += `<p>🌆 现在是 ${clockOutStr}，辛苦了一天！</p>`;
    
    if (relaxEvents.length > 0) {
        summary += `<p>🎉 今天总共摸鱼了 <strong>${relaxEvents.length}</strong> 次，`;
        if (morningRelax.length > 0) {
            summary += `上午摸鱼 ${morningRelax.length} 次，`;
        }
        if (afternoonRelax.length > 0) {
            summary += `下午摸鱻 ${afternoonRelax.length} 次`;
        }
        summary += `。放松也是为了更好地工作！</p>`;
    } else {
        summary += `<p>💪 今天工作很专注，没有摸鱼记录。给你点赞！</p>`;
    }
    
    summary += `<p>✨ 下班后好好休息，明天继续加油！</p>`;
    
    return summary;
}

// 显示今日留言条（简洁版）
function displayDailyNote(note) {
    const dailyNoteBanner = document.getElementById('daily-note-banner');
    const dailyNoteBannerContent = document.getElementById('daily-note-banner-content');
    
    if (note && note.trim()) {
        dailyNoteBannerContent.textContent = note;
        dailyNoteBanner.style.display = 'block';
    } else {
        dailyNoteBanner.style.display = 'none';
    }
}

// 初始化时加载今日摸鱼运势
function loadDailyNote() {
    const today = new Date().toDateString();
    const fortune = localStorage.getItem(`moyuFortune_${today}`);
    if (fortune) {
        displayDailyNote(fortune);
    }
}

// 初始化时间轴
function initTimeline() {
    const openTimelineBtn = document.getElementById('open-timeline');
    const timelineModal = document.getElementById('timeline-modal');
    const closeTimelineBtn = document.getElementById('close-timeline');
    
    // 打开时间轴
    openTimelineBtn.addEventListener('click', () => {
        showTimeline();
        timelineModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    });
    
    // 关闭时间轴
    closeTimelineBtn.addEventListener('click', () => {
        timelineModal.classList.remove('show');
        document.body.style.overflow = '';
    });
    
    // 点击外部关闭
    timelineModal.addEventListener('click', (e) => {
        if (e.target === timelineModal) {
            timelineModal.classList.remove('show');
            document.body.style.overflow = '';
        }
    });
}

// 显示时间轴
function showTimeline() {
    const timelineDateEl = document.getElementById('timeline-date');
    const timelineListEl = document.getElementById('timeline-list');
    const timelineEmptyEl = document.getElementById('timeline-empty');
    
    // 显示日期
    const today = new Date();
    const dateStr = today.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
    timelineDateEl.textContent = dateStr;
    
    // 按时间顺序排序
    const sortedEvents = [...todayTimeline].sort((a, b) => {
        return new Date(a.time) - new Date(b.time);
    });
    
    if (sortedEvents.length === 0) {
        timelineListEl.style.display = 'none';
        timelineEmptyEl.style.display = 'block';
        return;
    }
    
    timelineListEl.style.display = 'block';
    timelineEmptyEl.style.display = 'none';
    
    // 渲染时间轴项
    timelineListEl.innerHTML = sortedEvents.map(event => {
        const time = new Date(event.time);
        const timeStr = time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        
        let typeClass = '';
        let typeName = '';
        
        switch(event.type) {
            case 'clock-in':
                typeClass = 'event-type-clock-in';
                typeName = '上班打卡';
                break;
            case 'clock-out':
                typeClass = 'event-type-clock-out';
                typeName = '下班打卡';
                break;
            case 'relax':
                typeClass = 'event-type-relax';
                typeName = '摸鱼一下';
                break;
            case 'pomodoro':
                typeClass = 'event-type-pomodoro';
                typeName = '番茄钟';
                break;
            default:
                typeClass = '';
                typeName = event.type;
        }
        
        let contentHtml = `<div class="timeline-event-type ${typeClass}">${typeName}</div>`;
        contentHtml += event.content;
        
        if (event.note) {
            contentHtml += `<div class="timeline-event-content">📝 ${event.note}</div>`;
        }
        
        return `
            <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-time">${timeStr}</div>
                <div class="timeline-event">
                    ${contentHtml}
                </div>
            </div>
        `;
    }).join('');
}

// 初始化快捷功能
function initShortcuts() {
    const toggleBtn = document.getElementById('toggle-shortcuts');
    const shortcutsPanel = document.getElementById('shortcuts-panel');
    
    if (toggleBtn && shortcutsPanel) {
        toggleBtn.addEventListener('click', () => {
            const isVisible = shortcutsPanel.style.display === 'flex';
            shortcutsPanel.style.display = isVisible ? 'none' : 'flex';
        });
    }
}

// 初始化AI助手（悬浮窗版）
function initCommandControl() {
    const aiFloatToggle = document.getElementById('ai-float-toggle');
    const aiFloatPanel = document.getElementById('ai-float-panel');
    const aiFloatClose = document.getElementById('ai-float-close');
    const aiFloatInput = document.getElementById('ai-float-input');
    const aiFloatSend = document.getElementById('ai-float-send');
    const aiFloatMessages = document.getElementById('ai-float-messages');
    const aiFloatStatus = document.getElementById('ai-float-status');
    
    if (!aiFloatToggle || !aiFloatPanel || !aiFloatInput || !aiFloatSend) {
        console.warn('AI助手元素未找到');
        return;
    }
    
    // 切换悬浮窗显示
    aiFloatToggle.addEventListener('click', () => {
        const isVisible = aiFloatPanel.style.display === 'flex';
        aiFloatPanel.style.display = isVisible ? 'none' : 'flex';
    });
    
    // 关闭悬浮窗
    aiFloatClose.addEventListener('click', () => {
        aiFloatPanel.style.display = 'none';
    });
    
    // 添加消息到聊天记录
    function addMessage(text, type = 'user') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ${type}`;
        messageDiv.textContent = text;
        aiFloatMessages.appendChild(messageDiv);
        
        // 滚动到底部
        aiFloatMessages.scrollTop = aiFloatMessages.scrollHeight;
    }
    
    // 显示执行状态
    function showStatus(message, type = 'info') {
        aiFloatStatus.textContent = message;
        aiFloatStatus.className = `ai-float-status ${type}`;
        aiFloatStatus.style.display = 'block';
        
        // 3秒后自动隐藏
        setTimeout(() => {
            aiFloatStatus.style.display = 'none';
        }, 3000);
    }
    
    // 点击发送按钮
    aiFloatSend.addEventListener('click', async () => {
        const command = aiFloatInput.value.trim();
        if (!command) {
            showToast('请输入内容');
            return;
        }
        
        // 显示用户消息
        addMessage(command, 'user');
        aiFloatInput.value = '';
        
        // 检查是否配置API Key
        const apiKey = localStorage.getItem('deepseekApiKey');
        if (!apiKey) {
            addMessage('请先在设置中配置DeepSeek API Key', 'system');
            showToast('请先在设置中配置DeepSeek API Key', 'error');
            setTimeout(() => {
                switchTab('settings');
            }, 1500);
            return;
        }
        
        // 禁用按钮
        aiFloatSend.disabled = true;
        aiFloatSend.textContent = '思考中...';
        
        try {
            // 调用指令处理模块（带意图判断）
            const result = await window.CommandModule.processCommand(command);
            
            // 显示AI回复
            if (result.chatResponse) {
                addMessage(result.chatResponse, 'assistant');
            }
            
            // 显示执行状态
            if (result.executed) {
                showStatus(`✅ 已执行：${result.actionName}`, 'success');
            } else if (result.lowConfidence) {
                showStatus('💬 理解为：聊天模式', 'info');
            }
        } catch (error) {
            console.error('处理失败:', error);
            addMessage('抱歉，出了点问题：' + error.message, 'system');
            showStatus('❌ 执行失败', 'error');
        } finally {
            // 恢复按钮状态
            aiFloatSend.disabled = false;
            aiFloatSend.textContent = '发送';
        }
    });
    
    // 支持回车键提交
    aiFloatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            aiFloatSend.click();
        }
    });
}

// 切换标签页
function switchTab(tabId) {
    const footerTabs = document.querySelectorAll('.footer-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // 更新当前活动标签
    activeTab = tabId;
    
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
    const savedMonthlySalary = localStorage.getItem('monthlySalary') || '8000';
    const settingsSalaryTypeEl = document.getElementById('settings-salary-type');
    const settingsSalaryDayEl = document.getElementById('settings-salary-day');
    const settingsMonthlySalaryEl = document.getElementById('settings-monthly-salary');
    if (settingsSalaryTypeEl) settingsSalaryTypeEl.value = savedSalaryType;
    if (settingsSalaryDayEl) settingsSalaryDayEl.value = savedSalaryDay;
    if (settingsMonthlySalaryEl) settingsMonthlySalaryEl.value = savedMonthlySalary;

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
    
    // 加载今日留言
    loadDailyNote();

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
            const oldTime = customTime;
            customTime = this.value ? new Date(this.value).toISOString() : null;
            localStorage.setItem('customTime', customTime);
            
            // 如果设置了新时间，检查是否是新的一天
            if (customTime) {
                const newDate = new Date(customTime).toDateString();
                const today = new Date().toDateString();
                const lastClockInDate = localStorage.getItem('lastClockInDate') || null;
                
                // 如果是不同的一天，清除打卡状态和时间轴
                if (newDate !== lastClockInDate) {
                    // 清除打卡状态
                    localStorage.removeItem('lastClockInType');
                    localStorage.removeItem('lastClockInDate');
                    localStorage.removeItem(`clockInTime_${newDate}`);
                    localStorage.removeItem(`dailyNote_${newDate}`);
                    
                    // 清除当天时间轴
                    localStorage.removeItem(`timeline_${newDate}`);
                    todayTimeline = [];
                    
                    // 重新加载时间轴数据（如果有）
                    loadTodayTimeline();
                    
                    // 隐藏留言卡片
                    const dailyNoteCard = document.getElementById('daily-note-card');
                    if (dailyNoteCard) {
                        dailyNoteCard.style.display = 'none';
                    }
                    
                    // 更新打卡按钮状态
                    const clockInBtn = document.getElementById('clock-in-btn');
                    if (clockInBtn) {
                        clockInBtn.textContent = '👋 上班打卡';
                        clockInBtn.dataset.type = 'CLOCK_IN';
                        clockInBtn.disabled = false;
                        clockInBtn.style.opacity = '1';
                        clockInBtn.style.cursor = 'pointer';
                    }
                    
                    showToast('已重置为新的一天');
                }
            }
            
            updateCountdowns();
        });
    }
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
    const monthlySalary = document.getElementById('settings-monthly-salary').value;

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
    localStorage.setItem('monthlySalary', monthlySalary || '8000');

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
    
    // 从 localStorage 读取官方节假日配置
    const officialHolidays = JSON.parse(localStorage.getItem('officialHolidays') || '{}');
    
    // 遍历配置文件中的节假日
    for (const dateStr in officialHolidays) {
        if (officialHolidays.hasOwnProperty(dateStr)) {
            const holidayName = officialHolidays[dateStr];
            const [year, month, day] = dateStr.split('-').map(Number);
            
            // 只添加当前年和未来的节假日
            if (year >= currentYear) {
                const dateKey = `${month}-${day}-${year}`;
                
                // 避免重复添加
                if (!addedDates.has(dateKey)) {
                    const holidayDate = new Date(year, month - 1, day);
                    events.push({
                        id: `holiday-${dateStr}`,
                        name: holidayName,
                        type: 'preset',
                        category: 'holiday',
                        date: holidayDate,
                        repeat: 'none'
                    });
                    addedDates.add(dateKey);
                }
            }
        }
    }
    
    // 如果没有配置节假日，使用默认的固定节日作为备用
    if (Object.keys(officialHolidays).length === 0) {
        // 定义固定公历节日
        const fixedHolidays = [
            { id: 'new-year', name: '元旦', month: 1, day: 1 },
            { id: 'labor-day', name: '劳动节', month: 5, day: 1 },
            { id: 'national-day', name: '国庆节', month: 10, day: 1 }
        ];
        
        // 定义清明节 (通常在4月4日或5日)
        const qingmingDay = new Date(currentYear, 3, 4);
        if (qingmingDay.getDay() === 5) qingmingDay.setDate(5);
        
        // 定义农历节日的近似公历日期
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
        // 检查是否在工作时间之外
        if (workdayEndEvent.timeRemaining.outOfWorkHours) {
            document.getElementById('time-workday-end').textContent = '下班啦！';
        } else {
            document.getElementById('time-workday-end').textContent = formatTimeRemaining(workdayEndEvent.timeRemaining, 'seconds');
        }
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
        
        // 检查是否为0或负数
        if (weekendEvent.timeRemaining.total <= 0) {
            document.getElementById('time-weekend').textContent = '周末啦！';
        } else {
            document.getElementById('time-weekend').textContent = `${hours}小时${minutes}分钟`;
        }
        document.getElementById('date-weekend').textContent = formatDate(weekendEvent.nextOccurrence, false); // 只显示日期
        const cardEl = document.getElementById('weekend-card');
        const tt = buildCalculationTooltip(weekendEvent);
        if (cardEl) cardEl.setAttribute('title', tt);
    }
    
    // 找到发薪日事件
    const salaryDayEvent = sortedEvents.find(e => e.id === 'salary-day');
    if (salaryDayEvent) {
        // 检查是否为0或负数
        if (salaryDayEvent.timeRemaining.total <= 0 || salaryDayEvent.timeRemaining.days <= 0) {
            document.getElementById('time-salary-day').textContent = '发钱啦！';
        } else {
            document.getElementById('time-salary-day').textContent = formatTimeRemaining(salaryDayEvent.timeRemaining, 'days');
        }
        // 显示日期时减去1天，因为nextOccurrence是发薪日的24点（即第二天凌晨0点）
        const displayDate = new Date(salaryDayEvent.nextOccurrence);
        displayDate.setDate(displayDate.getDate() - 1);
        document.getElementById('date-salary-day').textContent = formatDate(displayDate, false); // 只显示日期
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

// 渲染其他假期
function renderOtherHolidays(sortedEvents) {
    const container = document.querySelector('.other-holidays');
    if (!container) return; // 防止容器不存在导致报错
    container.innerHTML = '';

    // 获取已经在主要倒计时中显示的事件ID
    const mainEventIds = ['workday-end', 'weekend', 'salary-day', 'lunch-time'];
    
    // 获取在期待时间中显示的假期
    const expectationEvent = sortedEvents.find(e => 
        (e.category === 'holiday' || e.category === 'custom-holiday') && 
        !mainEventIds.includes(e.id)
    );
    
    if (expectationEvent) {
        mainEventIds.push(expectationEvent.id);
    }
    
    // 筛选出其他假期（不在主要倒计时中显示的假期）
    const otherHolidays = sortedEvents.filter(event =>
        (event.category === 'holiday' || event.category === 'custom-holiday') &&
        !mainEventIds.includes(event.id)
    );
    
    // 按假期名称分组，只显示每个假期的第一天
    const holidayGroups = new Map();
    otherHolidays.forEach(event => {
        const holidayName = event.name;
        if (!holidayGroups.has(holidayName)) {
            holidayGroups.set(holidayName, event);
        } else {
            // 如果已经有这个假期，比较日期，保留较早的那个
            const existing = holidayGroups.get(holidayName);
            if (event.nextOccurrence < existing.nextOccurrence) {
                holidayGroups.set(holidayName, event);
            }
        }
    });
    
    // 渲染假期卡片（每个假期只显示一张卡片）
    Array.from(holidayGroups.values()).forEach(event => {
        const card = document.createElement('div');
        card.className = 'countdown-card';
        
        card.innerHTML = `
            <h3>${event.name}</h3>
            <div class="countdown-time">${formatTimeRemaining(event.timeRemaining, 'days')}</div>
            <div class="countdown-date">${formatDate(event.nextOccurrence, false)}</div>
        `;
        
        // 添加点击事件
        card.addEventListener('click', () => {
            showToast('准备休假，想好去哪儿玩了吗？');
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
            // 每月重复的事件（发薪日）
            // 修正：从发薪日0点改为发薪日24点（即第二天0点）
            if (event.day === 'last') {
                // 每月最后一天
                nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                if (nextDate <= now) {
                    nextDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);
                }
            } else {
                // 固定日期
                nextDate = new Date(now.getFullYear(), now.getMonth(), event.day);
                
                // 如果本月的日期已过，设置为下个月
                if (nextDate <= now) {
                    nextDate = new Date(now.getFullYear(), now.getMonth() + 1, event.day);
                }
            }
            
            // 如果发薪日遇到周末或假期，提前到最近的工作日
            while (isWeekend(nextDate) || isHoliday(nextDate)) {
                // 向前推一天
                nextDate.setDate(nextDate.getDate() - 1);
            }
            
            // 设置为发薪日的第二天凌晨0点（即发薪日24点）
            nextDate.setDate(nextDate.getDate() + 1);
            nextDate.setHours(0, 0, 0, 0);
            
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
        // 获取工作结束时间
        const [endHour, endMinute] = workEndTime.split(':').map(Number);
        
        // 计算当前时间
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentSecond = now.getSeconds();
        
        // 获取上班时间
        const [startHour, startMinute] = workStartTime.split(':').map(Number);
        
        // 检查是否在工作时间范围内
        const isBeforeWork = currentHour < startHour || (currentHour === startHour && currentMinute < startMinute);
        const isAfterWork = currentHour > endHour || (currentHour === endHour && currentMinute >= endMinute);
        
        // 如果当前时间早于上班时间或晚于下班时间，返回特殊标记
        if (isBeforeWork || isAfterWork) {
            return {
                total: -1,  // 特殊标记，用于显示"下班啦！"
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
                isWorkTime: false,
                outOfWorkHours: true
            };
        }
        
        // 直接计算到下班时间的剩余时间（不扣除午休）
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
        const remainingMillis = totalWorkTime % (1000 * 60 * 60 * 24);
        const hours = days * 24 + Math.floor(remainingMillis / (1000 * 60 * 60));
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
    
    // 添加点击事件（仅添加一次）
    const progressSectionCard = document.getElementById('progress-section-card');
    if (progressSectionCard && !progressSectionCard.dataset.hasClickHandler) {
        progressSectionCard.dataset.hasClickHandler = 'true';
        progressSectionCard.style.cursor = 'pointer';
        progressSectionCard.addEventListener('click', function(e) {
            createCoinAnimation(e.clientX, e.clientY);
            showToast('摸鱼1s');
        });
    }
}

// 创建金币动画
function createCoinAnimation(x, y) {
    const coin = document.createElement('div');
    coin.className = 'coin-animation';
    coin.textContent = '💰 +1';
    coin.style.left = `${x}px`;
    coin.style.top = `${y}px`;
    coin.style.position = 'fixed';
    
    document.body.appendChild(coin);
    
    // 动画结束后移除元素
    setTimeout(() => {
        coin.remove();
    }, 1000);
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
        
        // 检查是否是受薪日（遵循遇周末假期提前到工作日的规则）
        const salaryType = localStorage.getItem('salaryType') || 'fixed';
        let isSalaryDay = false;
        
        // 计算原定发薪日
        let originalSalaryDay = 0;
        if (salaryType === 'last') {
            // 每月最后一天
            originalSalaryDay = new Date(year, month + 1, 0).getDate();
        } else {
            // 固定日期
            originalSalaryDay = parseInt(localStorage.getItem('salaryDay')) || 1;
        }
        
        // 检查原定发薪日是否是周末或假期，如果是则找到调整后的日期
        let actualSalaryDay = originalSalaryDay;
        let adjustedDate = new Date(year, month, originalSalaryDay);
        
        // 如果原定发薪日遇到周末或假期，向前推到工作日
        while (isWeekend(adjustedDate) || isHoliday(adjustedDate)) {
            adjustedDate.setDate(adjustedDate.getDate() - 1);
            actualSalaryDay = adjustedDate.getDate();
        }
        
        // 当前日期是调整后的发薪日
        if (i === actualSalaryDay) {
            isSalaryDay = true;
        }
        
        if (isSalaryDay) {
            const salaryLabel = document.createElement('div');
            salaryLabel.className = 'holiday-label';
            salaryLabel.style.background = 'rgba(52, 152, 219, 0.9)';
            // 如果是调整后的日期，显示提示
            if (actualSalaryDay !== originalSalaryDay) {
                salaryLabel.textContent = `发薪日(调整)`;
                salaryLabel.title = `原定${originalSalaryDay}号，遇假期/周末提前`;
            } else {
                salaryLabel.textContent = '发薪日';
            }
            dayElement.appendChild(salaryLabel);
        }
        // 检查是否有事件
        const formattedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const eventsCount = getEventsCountForDate(formattedDateStr);
        if (eventsCount > 0) {
            dayElement.classList.add('has-event');
        }
        
        // 点击事件 - 选择日期并显示事件
        dayElement.addEventListener('click', () => {
            // 更新选中的日期
            selectedDate = formattedDateStr;
            
            // 更新日期输入框
            const eventDateInput = document.getElementById('calendar-event-date');
            if (eventDateInput) {
                eventDateInput.value = selectedDate;
            }
            
            // 更新事件列表
            updateTodayEventsList();
            
            // 显示反馈
            const date = new Date(year, month, i);
            const dateDisplay = `${month + 1}月${i}日`;
            showToast(`已选择 ${dateDisplay}`);
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
            // 根据不同卡片显示不同的提示文案
            const cardId = card.id;
            let message = '马上下班啦，加油！！'; // 默认文案
            let cardName = '倒计时卡片';
            
            if (cardId === 'workday-end-card') {
                cardName = '下班倒计时';
            } else if (cardId === 'weekend-card') {
                message = '努力熬一熬，马上周末啦！';
                cardName = '周末倒计时';
            } else if (cardId === 'salary-day-card') {
                message = '这个月的工资怎么花呢？';
                cardName = '发薪倒计时';
            } else if (cardId === 'next-holiday-card') {
                // 判断是午休还是节假日
                const titleElement = card.querySelector('h3');
                if (titleElement && titleElement.textContent === '午休倒计时') {
                    message = '准备开饭！';
                    cardName = '午休倒计时';
                } else {
                    message = '准备休假，想好去哪儿玩了吗？';
                    cardName = '节假日倒计时';
                }
            }
            
            // 添加时间轴事件
            addTimelineEvent('relax', `点击了「${cardName}」卡片`, { cardId: cardId });
            
            showToast(message);
        });
        card.addEventListener('mouseenter', () => {
            const id = card.id;
            let event;
            if (id === 'workday-end-card') event = (window.lastSortedEvents || []).find(e => e.id === 'workday-end');
            if (id === 'weekend-card') event = (window.lastSortedEvents || []).find(e => e.id === 'weekend');
            if (id === 'salary-day-card') event = (window.lastSortedEvents || []).find(e => e.id === 'salary-day');
            if (!event) return;
            const tt = buildCalculationTooltip(event);
            showTooltipAtElement(card, tt);
        });
        card.addEventListener('mouseleave', hideTooltip);
        card.dataset.bound = 'true';
    });
}

// ==================== 日历事件管理功能 ====================

// 全局变量
let calendarEvents = [];
let selectedDate = null;

// 初始化日历事件功能
function initCalendarEvents() {
    // 加载事件数据
    loadCalendarEvents();
    
    // 设置默认选中日期为今天
    const today = new Date();
    selectedDate = formatDate(today);
    
    // 初始化日期输入框
    const eventDateInput = document.getElementById('calendar-event-date');
    if (eventDateInput) {
        eventDateInput.value = selectedDate;
    }
    
    // 绑定添加事件按钮
    const addEventBtn = document.getElementById('add-calendar-event');
    if (addEventBtn) {
        addEventBtn.addEventListener('click', addCalendarEvent);
    }
    
    // 更新今日事件列表
    updateTodayEventsList();
}

// 加载日历事件
function loadCalendarEvents() {
    const saved = localStorage.getItem('calendarEvents');
    if (saved) {
        try {
            calendarEvents = JSON.parse(saved);
        } catch (e) {
            console.error('加载日历事件失败:', e);
            calendarEvents = [];
        }
    }
}

// 保存日历事件
function saveCalendarEvents() {
    localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
}

// 格式化日期
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 添加日历事件
function addCalendarEvent() {
    const titleInput = document.getElementById('event-title');
    const timeInput = document.getElementById('event-time');
    const typeSelect = document.getElementById('event-type');
    const noteTextarea = document.getElementById('event-note');
    
    if (!titleInput || !typeSelect) {
        showToast('表单元素未找到', 'error');
        return;
    }
    
    const title = titleInput.value.trim();
    const time = timeInput ? timeInput.value : '';
    const type = typeSelect.value;
    const note = noteTextarea ? noteTextarea.value.trim() : '';
    const date = selectedDate; // 使用当前选中的日期
    
    // 验证
    if (!title) {
        showToast('请输入事件标题', 'error');
        return;
    }
    
    if (!date) {
        showToast('请先在日历上选择日期', 'error');
        return;
    }
    
    // 创建事件对象
    const event = {
        id: Date.now(),
        title: title,
        date: date,
        time: time || '',
        type: type,
        note: note,
        createdAt: new Date().toISOString()
    };
    
    // 添加到数组
    calendarEvents.push(event);
    
    // 保存
    saveCalendarEvents();
    
    // 清空表单
    titleInput.value = '';
    if (timeInput) timeInput.value = '';
    if (noteTextarea) noteTextarea.value = '';
    
    // 更新显示
    updateTodayEventsList();
    updateCalendarDays(); // 更新日历显示
    
    showToast('事件已添加！', 'success');
}

// 更新今日事件列表
function updateTodayEventsList() {
    const listContainer = document.getElementById('today-events-list');
    const dateDisplay = document.getElementById('selected-date-display');
    
    if (!listContainer) return;
    
    // 获取选中日期的事件
    const dateEvents = calendarEvents.filter(e => e.date === selectedDate);
    
    // 更新日期显示
    if (dateDisplay) {
        const date = new Date(selectedDate);
        const today = new Date();
        const isToday = formatDate(today) === selectedDate;
        
        if (isToday) {
            dateDisplay.textContent = '今日';
        } else {
            dateDisplay.textContent = `${date.getMonth() + 1}月${date.getDate()}日`;
        }
    }
    
    // 清空列表
    listContainer.innerHTML = '';
    
    if (dateEvents.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-events">
                <div class="empty-icon">📭</div>
                <div class="empty-text">暂无事件</div>
            </div>
        `;
        return;
    }
    
    // 按时间排序
    dateEvents.sort((a, b) => {
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
    });
    
    // 渲染事件项
    dateEvents.forEach(event => {
        const eventItem = createEventItem(event);
        listContainer.appendChild(eventItem);
    });
}

// 创建事件项元素
function createEventItem(event) {
    const div = document.createElement('div');
    div.className = `event-item type-${event.type}`;
    
    const typeEmojis = {
        work: '💼',
        personal: '👤',
        meeting: '🤝',
        birthday: '🎂',
        holiday: '🎉',
        other: '📌'
    };
    
    const typeNames = {
        work: '工作',
        personal: '个人',
        meeting: '会议',
        birthday: '生日',
        holiday: '节日',
        other: '其他'
    };
    
    const emoji = typeEmojis[event.type] || '📌';
    const typeName = typeNames[event.type] || '其他';
    
    let html = `
        <div class="event-header">
            <div class="event-title">${emoji} ${event.title}</div>
            <div class="event-type">${typeName}</div>
        </div>
    `;
    
    if (event.time) {
        html += `<div class="event-time">⏰ ${event.time}</div>`;
    }
    
    if (event.note) {
        html += `<div class="event-note">${event.note}</div>`;
    }
    
    html += `
        <div class="event-actions">
            <button class="event-delete-btn" onclick="deleteCalendarEvent(${event.id})">🗑️ 删除</button>
        </div>
    `;
    
    div.innerHTML = html;
    return div;
}

// 删除日历事件
function deleteCalendarEvent(eventId) {
    if (!confirm('确定要删除这个事件吗？')) {
        return;
    }
    
    // 从数组中删除
    calendarEvents = calendarEvents.filter(e => e.id !== eventId);
    
    // 保存
    saveCalendarEvents();
    
    // 更新显示
    updateTodayEventsList();
    updateCalendarDays();
    
    showToast('事件已删除', 'success');
}

// 获取指定日期的事件数量
function getEventsCountForDate(dateStr) {
    return calendarEvents.filter(e => e.date === dateStr).length;
}

// 全局暴露删除函数（供HTML调用）
window.deleteCalendarEvent = deleteCalendarEvent;

// 显示摸鱻吉日签
function displayMoyuFortune(fortuneData) {
    const moyuFortuneSection = document.getElementById('moyu-fortune-section');
    
    const fortune = fortuneData.fortune || '★★★★☆ 运势中等';
    const bestTime = fortuneData.bestTime || '14:30-15:00 - 下午茶时间';
    const tips = fortuneData.tips || [
        '摸鱻前记得看一眼老板的位置，安全第一👀',
        '摸鱻时保持工作姿势，技巧性摸鱻是一门艺术🎨',
        '适度摸鱼提高效率，劳逸结合才是王道🚀'
    ];
    
    const tipsHtml = tips.map(tip => `<div>${tip}</div>`).join('');
    
    moyuFortuneSection.innerHTML = `
        <div class="moyu-fortune-card">
            <h3>🎰 今日摸鱻吉日签</h3>
            <div class="fortune-item">
                <div class="fortune-label">🌟 摸鱻运势</div>
                <div class="fortune-value" id="moyu-fortune">${fortune}</div>
            </div>
            <div class="fortune-item">
                <div class="fortune-label">⏰ 最佳时间</div>
                <div class="fortune-value" id="moyu-best-time">${bestTime}</div>
            </div>
            <div class="fortune-item">
                <div class="fortune-label">💡 摸鱻锦囊</div>
                <div class="fortune-tips" id="moyu-tips">${tipsHtml}</div>
            </div>
            <div class="fortune-actions">
                <button id="retry-fortune" class="retry-fortune-btn">🎲 再求一签</button>
                <button id="save-fortune" class="save-fortune-btn">✔️ 开始摸鱻</button>
            </div>
        </div>
    `;
}

// 计算今日收入
async function calculateDailyIncome() {
    const monthlySalary = parseFloat(localStorage.getItem('monthlySalary') || '8000');
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // 获取当月天数
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // 计算每日工资
    const dailyIncome = (monthlySalary / daysInMonth).toFixed(2);
    
    return dailyIncome;
}

// 显示工作总结（带AI生成）
async function displayWorkSummary() {
    const today = new Date().toDateString();
    const clockInTime = localStorage.getItem(`clockInTime_${today}`);
    const now = new Date();
    
    // 统计摸鱻次数
    const relaxEvents = todayTimeline.filter(e => e.type === 'relax');
    const relaxCount = relaxEvents.length;
    
    // 计算今日收入
    const dailyIncome = await calculateDailyIncome();
    
    // 格式化时间
    const clockInTimeStr = clockInTime ? 
        new Date(clockInTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : 
        '未知';
    const clockOutTimeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    
    // 调用AI生成工作总结
    const summaryResult = await window.AIModule.generateWorkSummary({
        clockInTime: clockInTimeStr,
        clockOutTime: clockOutTimeStr,
        relaxCount: relaxCount,
        dailyIncome: dailyIncome
    });
    
    // 显示总结
    const summaryContent = document.getElementById('summary-content');
    if (!summaryContent) {
        return;
    }
    
    summaryContent.innerHTML = `
        <div class="work-summary">
            <h3>📋 今日工作总结</h3>
            <div class="summary-ai-text">${summaryResult.summary || '今天辛苦了！'}</div>
            <div class="summary-details">
                <div class="summary-item">
                    <span class="summary-label">🕑 上班时间</span>
                    <span class="summary-value">${clockInTimeStr}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">🕚 下班时间</span>
                    <span class="summary-value">${clockOutTimeStr}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">🎮 摸鱻次数</span>
                    <span class="summary-value">${relaxCount} 次</span>
                </div>
                <div class="summary-item highlight">
                    <span class="summary-label">💰 今日收入</span>
                    <span class="summary-value">￥${dailyIncome}</span>
                </div>
            </div>
        </div>
    `;
}
