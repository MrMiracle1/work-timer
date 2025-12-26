// AI 功能模块
// 独立的 DeepSeek API 调用封装

// DeepSeek API 配置
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

/**
 * 调用 DeepSeek API
 * @param {string} prompt - 提示词
 * @param {object} options - 可选配置
 * @returns {Promise<string>} API 返回的内容
 */
async function callDeepSeekAPI(prompt, options = {}) {
    const apiKey = localStorage.getItem('deepseekApiKey');
    
    if (!apiKey) {
        throw new Error('未配置 API 密钥');
    }
    
    const {
        temperature = 1.2,
        maxTokens = 2000,
        topP = 0.95
    } = options;
    
    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: DEEPSEEK_MODEL,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: temperature,
                max_tokens: maxTokens,
                top_p: topP
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API 请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (error) {
        console.error('DeepSeek API 调用失败:', error);
        throw error;
    }
}

/**
 * 获取打卡问候语（简化版，不调用AI）
 * @param {string} type - 打卡类型（CLOCK_IN/CLOCK_OUT）
 * @returns {Promise<object>} 返回结果对象
 */
async function getAIGreeting(type) {
    // 为了加快速度，直接返回固定文案，不调用AI
    const greetings = {
        'CLOCK_IN': [
            '🌞 早上好！新的一天开始啦！',
            '☀️ 早安！今天也要加油哦！',
            '🌅 美好的一天从打卡开始！',
            '🚀 准备好开始一天的工作了吗？',
            '✨ 新的一天，新的开始！'
        ],
        'CLOCK_OUT': [
            '🎉 辛苦一天了，好好休息！',
            '🎆 一天的工作圆满完成！',
            '🌟 下班啦！享受你的个人时间吧！',
            '🎈 今天表现很棒，明天继续加油！',
            '✅ 完美的一天，赶紧回家休息吧！'
        ]
    };
    
    const messages = greetings[type] || greetings['CLOCK_IN'];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    return {
        success: true,
        message: randomMessage,
        isAI: false
    };
}

/**
 * 获取摸鱻吉日签（带兜底）
 * @returns {Promise<object>} 返回结果对象
 */
async function getMoyuFortune() {
    try {
        const prompt = window.AI_PROMPTS.MOYU_FORTUNE;
        const response = await callDeepSeekAPI(prompt, { 
            maxTokens: 500,
            temperature: 1.3
        });
        
        // 解析JSON响应
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const fortune = JSON.parse(jsonMatch[0]);
            return {
                success: true,
                data: fortune,
                isAI: true
            };
        }
        throw new Error('无法解析AI返回的JSON');
    } catch (error) {
        console.error('摸鱻吉日签获取失败:', error);
        return {
            success: false,
            data: window.FALLBACK_MESSAGES.MOYU_FORTUNE,
            isAI: false,
            error: error.message
        };
    }
}

/**
 * 生成工作总结（带兜底）
 * @param {object} workData - 工作数据
 * @returns {Promise<object>} 返回结果对象
 */
async function generateWorkSummary(workData) {
    try {
        const { clockInTime, clockOutTime, relaxCount, dailyIncome } = workData;
        
        let prompt = window.AI_PROMPTS.WORK_SUMMARY;
        prompt = prompt.replace('{CLOCK_IN_TIME}', clockInTime);
        prompt = prompt.replace(/{CLOCK_IN_TIME}/g, clockInTime);
        prompt = prompt.replace('{CLOCK_OUT_TIME}', clockOutTime);
        prompt = prompt.replace(/{CLOCK_OUT_TIME}/g, clockOutTime);
        prompt = prompt.replace('{RELAX_COUNT}', relaxCount);
        prompt = prompt.replace(/{RELAX_COUNT}/g, relaxCount);
        prompt = prompt.replace('{DAILY_INCOME}', dailyIncome);
        prompt = prompt.replace(/{DAILY_INCOME}/g, dailyIncome);
        
        const summary = await callDeepSeekAPI(prompt, { 
            maxTokens: 300,
            temperature: 1.4
        });
        
        return {
            success: true,
            summary: summary,
            isAI: true
        };
    } catch (error) {
        console.error('工作总结生成失败:', error);
        return {
            success: false,
            summary: window.FALLBACK_MESSAGES.WORK_SUMMARY,
            isAI: false,
            error: error.message
        };
    }
}

/**
 * 调用 AI 分析内容
 * @param {string} promptType - Prompt 类型
 * @param {string} content - 要分析的内容
 * @returns {Promise<object>} 返回结果对象
 */
async function callAIAnalysis(promptType, content) {
    try {
        const promptTemplate = window.AI_PROMPTS[promptType];
        if (!promptTemplate) {
            throw new Error('无效的 Prompt 类型');
        }
        
        // 将内容插入到 Prompt 模板中
        const prompt = promptTemplate.replace('{CONTENT}', content);
        
        const result = await callDeepSeekAPI(prompt, { 
            maxTokens: 2000,
            temperature: 1.2 
        });
        
        return {
            success: true,
            content: result,
            isAI: true
        };
    } catch (error) {
        console.error('AI 分析失败:', error);
        return {
            success: false,
            content: window.getRandomFallbackMessage(promptType),
            isAI: false,
            error: error.message
        };
    }
}

// 导出函数供其他模块使用
if (typeof window !== 'undefined') {
    window.AIModule = {
        callDeepSeekAPI,
        getAIGreeting,
        getMoyuFortune,
        generateWorkSummary,
        callAIAnalysis
    };
}
