// 自然语言指令控制模块
// 通过大模型理解用户意图，执行相应操作

/**
 * 可执行的指令类型定义
 */
const COMMAND_TYPES = {
    CLOCK_IN: 'clock_in',           // 上班打卡
    CLOCK_OUT: 'clock_out',         // 下班打卡
    START_POMODORO: 'start_pomodoro', // 开始番茄钟
    PAUSE_POMODORO: 'pause_pomodoro', // 暂停番茄钟
    SHOW_TIMELINE: 'show_timeline',   // 查看时间轴
    SHOW_CALENDAR: 'show_calendar',   // 查看日历
    SWITCH_TAB: 'switch_tab',         // 切换标签页
    RELAX: 'relax',                   // 摸鱼
    SHOW_SETTINGS: 'show_settings',   // 打开设置
    CHAT: 'chat',                     // 聊天模式
    UNKNOWN: 'unknown'                // 未知指令
};

/**
 * 指令理解 Prompt 模板（带意图判断和聊天模式）
 */
const COMMAND_UNDERSTANDING_PROMPT = `你是一个智能助手，负责理解用户的自然语言并判断是否需要执行操作。

可用的操作类型：
1. clock_in - 上班打卡（例如：我要打卡、上班了、开始工作）
2. clock_out - 下班打卡（例如：下班打卡、我要下班了、结束工作）
3. start_pomodoro - 开始番茄钟（例如：开始番茄钟、启动专注时间、开始工作25分钟）
4. pause_pomodoro - 暂停番茄钟（例如：暂停番茄钟、停止专注）
5. show_timeline - 查看时间轴（例如：查看时间轴、今天做了什么、看看记录）
6. show_calendar - 查看日历（例如：打开日历、看看假期、查看日期）
7. switch_tab - 切换标签页（例如：切换到日历、打开网上冲浪、去人民日报、我想读书）
8. relax - 摸鱼休息（例如：我要摸鱻、休息一下、放松一下）
9. show_settings - 打开设置（例如：打开设置、修改配置、调整时间）
10. chat - 纯聊天模式（用户只是闲聊，没有明确的操作意图）

用户输入：{COMMAND}

请分析用户意图，判断是否需要执行操作。只返回一个JSON对象，格式如下：
{
  "type": "操作类型（如果是聊天则为chat）",
  "confidence": 置信度(0-1之间的数字，表示对意图的确定程度),
  "params": {
    "tab": "如果是switch_tab，这里是目标标签页名称（countdown/calendar/rmrb/surf/reader/settings）"
  },
  "chat_response": "对用户的友好回复（如果是chat模式，则这里是聊天内容）"
}

重要规则：
1. 只有明确的操作请求才设置高置信度（>0.7）
2. 如果用户只是问好、闲聊、说心情，请设置为chat模式
3. chat_response要自然友好，不要太正式
4. 只返回JSON，不要有其他文字。`;

/**
 * 解析大模型返回的JSON
 */
function parseCommandResponse(response) {
    try {
        // 尝试提取JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return parsed;
        }
        return null;
    } catch (error) {
        console.error('解析指令响应失败:', error);
        return null;
    }
}

/**
 * 执行指令
 */
async function executeCommand(commandType, params = {}) {
    const actions = {
        [COMMAND_TYPES.CLOCK_IN]: () => {
            const clockInBtn = document.getElementById('clock-in-btn');
            if (clockInBtn && clockInBtn.dataset.type === 'CLOCK_IN') {
                clockInBtn.click();
                return { success: true, message: '正在为您上班打卡...' };
            }
            return { success: false, message: '当前不能上班打卡' };
        },
        
        [COMMAND_TYPES.CLOCK_OUT]: () => {
            const clockInBtn = document.getElementById('clock-in-btn');
            if (clockInBtn && clockInBtn.dataset.type === 'CLOCK_OUT') {
                clockInBtn.click();
                return { success: true, message: '正在为您下班打卡...' };
            }
            return { success: false, message: '当前不能下班打卡' };
        },
        
        [COMMAND_TYPES.START_POMODORO]: () => {
            const pomodoroBtn = document.getElementById('open-pomodoro');
            if (pomodoroBtn) {
                pomodoroBtn.click();
                // 等待模态框打开后点击开始
                setTimeout(() => {
                    const startBtn = document.getElementById('start-pomodoro');
                    if (startBtn && startBtn.style.display !== 'none') {
                        startBtn.click();
                    }
                }, 100);
                return { success: true, message: '正在为您启动番茄钟...' };
            }
            return { success: false, message: '无法启动番茄钟' };
        },
        
        [COMMAND_TYPES.PAUSE_POMODORO]: () => {
            const pauseBtn = document.getElementById('pause-pomodoro');
            if (pauseBtn && pauseBtn.style.display !== 'none') {
                pauseBtn.click();
                return { success: true, message: '已暂停番茄钟' };
            }
            return { success: false, message: '番茄钟未在运行' };
        },
        
        [COMMAND_TYPES.SHOW_TIMELINE]: () => {
            const timelineBtn = document.getElementById('open-timeline');
            if (timelineBtn) {
                timelineBtn.click();
                return { success: true, message: '正在打开时间轴...' };
            }
            return { success: false, message: '无法打开时间轴' };
        },
        
        [COMMAND_TYPES.SHOW_CALENDAR]: () => {
            if (typeof switchTab === 'function') {
                switchTab('calendar');
                return { success: true, message: '正在打开日历...' };
            }
            return { success: false, message: '无法打开日历' };
        },
        
        [COMMAND_TYPES.SWITCH_TAB]: () => {
            const tabName = params.tab || 'countdown';
            if (typeof switchTab === 'function') {
                switchTab(tabName);
                const tabNames = {
                    'countdown': '倒计时',
                    'calendar': '日历',
                    'rmrb': '人民日报',
                    'surf': '网上冲浪',
                    'reader': '读书',
                    'settings': '设置'
                };
                return { success: true, message: `正在切换到${tabNames[tabName] || tabName}...` };
            }
            return { success: false, message: '无法切换标签页' };
        },
        
        [COMMAND_TYPES.RELAX]: () => {
            // 触发摸鱼事件（点击一个倒计时卡片）
            const cards = document.querySelectorAll('.countdown-card');
            if (cards.length > 0) {
                cards[0].click();
                return { success: true, message: '摸鱼时间到！记得适度哦 😊' };
            }
            return { success: false, message: '无法记录摸鱼事件' };
        },
        
        [COMMAND_TYPES.SHOW_SETTINGS]: () => {
            if (typeof switchTab === 'function') {
                switchTab('settings');
                return { success: true, message: '正在打开设置...' };
            }
            return { success: false, message: '无法打开设置' };
        },
        
        [COMMAND_TYPES.UNKNOWN]: () => {
            return { success: false, message: '抱歉，我不太理解您的指令。请尝试：上班打卡、开始番茄钟、查看时间轴等。' };
        }
    };
    
    const action = actions[commandType] || actions[COMMAND_TYPES.UNKNOWN];
    return action();
}

/**
 * 处理自然语言指令（带意图判断和聊天模式）
 */
async function processCommand(userCommand) {
    try {
        // 调用大模型理解指令
        const prompt = COMMAND_UNDERSTANDING_PROMPT.replace('{COMMAND}', userCommand);
        const response = await window.AIModule.callDeepSeekAPI(prompt, {
            maxTokens: 300,
            temperature: 0.3  // 使用较低的温度以获得更确定的结果
        });
        
        // 解析响应
        const parsed = parseCommandResponse(response);
        
        if (!parsed || !parsed.type) {
            return {
                success: false,
                executed: false,
                chatResponse: '抱歉，我没能理解你的意思，请重新表述。',
                details: { rawResponse: response }
            };
        }
        
        // 判断是否为聊天模式
        if (parsed.type === 'chat') {
            return {
                success: true,
                executed: false,
                chatResponse: parsed.chat_response || '好的，我在听呢！',
                lowConfidence: false,
                details: { understood: parsed }
            };
        }
        
        // 置信度阈值：低于0.7则仅聊天，不执行操作
        const CONFIDENCE_THRESHOLD = 0.7;
        if (parsed.confidence < CONFIDENCE_THRESHOLD) {
            return {
                success: true,
                executed: false,
                chatResponse: parsed.chat_response || '嘲，我不太确定你是想让我做什么，随便聊聊吧！',
                lowConfidence: true,
                details: {
                    understood: parsed,
                    confidence: parsed.confidence,
                    threshold: CONFIDENCE_THRESHOLD
                }
            };
        }
        
        // 执行指令
        const result = await executeCommand(parsed.type, parsed.params || {});
        
        // 获取操作名称
        const actionName = getActionName(parsed.type, parsed.params);
        
        // 返回结果
        return {
            success: result.success,
            executed: result.success,
            actionName: actionName,
            chatResponse: parsed.chat_response || result.message,
            details: {
                understood: parsed,
                confidence: parsed.confidence
            }
        };
    } catch (error) {
        console.error('指令处理失败:', error);
        return {
            success: false,
            executed: false,
            chatResponse: '抱歉，出了点问题：' + error.message,
            error: error
        };
    }
}

/**
 * 获取操作名称（用于状态显示）
 */
function getActionName(commandType, params = {}) {
    const actionNames = {
        [COMMAND_TYPES.CLOCK_IN]: '上班打卡',
        [COMMAND_TYPES.CLOCK_OUT]: '下班打卡',
        [COMMAND_TYPES.START_POMODORO]: '开始番茄钟',
        [COMMAND_TYPES.PAUSE_POMODORO]: '暂停番茄钟',
        [COMMAND_TYPES.SHOW_TIMELINE]: '查看时间轴',
        [COMMAND_TYPES.SHOW_CALENDAR]: '打开日历',
        [COMMAND_TYPES.RELAX]: '摸鱼休息',
        [COMMAND_TYPES.SHOW_SETTINGS]: '打开设置',
        [COMMAND_TYPES.SWITCH_TAB]: `切换到${getTabName(params.tab)}`
    };
    
    return actionNames[commandType] || '未知操作';
}

/**
 * 获取标签页名称
 */
function getTabName(tab) {
    const tabNames = {
        'countdown': '倒计时',
        'calendar': '日历',
        'rmrb': '人民日报',
        'surf': '网上冲浪',
        'reader': '读书',
        'settings': '设置'
    };
    return tabNames[tab] || tab;
}

/**
 * 显示提示信息
 */
function showToast(message, type = 'info') {
    if (typeof window.showToast === 'function') {
        window.showToast(message);
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// 导出函数供其他模块使用
if (typeof window !== 'undefined') {
    window.CommandModule = {
        processCommand,
        executeCommand,
        COMMAND_TYPES
    };
}
