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
 * 获取 AI 问候语（带兜底）
 * @param {string} type - 问候类型
 * @returns {Promise<object>} 返回结果对象
 */
async function getAIGreeting(type) {
    try {
        const prompt = AI_PROMPTS[type];
        if (!prompt) {
            throw new Error('无效的问候类型');
        }
        
        const greeting = await callDeepSeekAPI(prompt, { maxTokens: 100 });
        return {
            success: true,
            message: greeting,
            isAI: true
        };
    } catch (error) {
        console.error('AI 问候语获取失败:', error);
        return {
            success: false,
            message: getRandomFallbackMessage(type),
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
        const promptTemplate = AI_PROMPTS[promptType];
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
            content: getRandomFallbackMessage(promptType),
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
        callAIAnalysis
    };
}
