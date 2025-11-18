/**
 * 网上冲浪 - 热搜榜单模块
 * 功能：展示微博和抖音实时热搜
 */

// API 配置
const API_CONFIG = {
    weibo: 'https://v2.xxapi.cn/api/weibohot',
    douyin: 'https://v2.xxapi.cn/api/douyinhot'
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 加载微博热搜
    loadWeiboHot();
    
    // 加载抖音热搜
    loadDouyinHot();
    
    // 绑定刷新按钮
    document.getElementById('refresh-weibo').addEventListener('click', loadWeiboHot);
    document.getElementById('refresh-douyin').addEventListener('click', loadDouyinHot);
});

/**
 * 加载微博热搜
 */
async function loadWeiboHot() {
    const loadingEl = document.getElementById('weibo-loading');
    const listEl = document.getElementById('weibo-list');
    
    try {
        // 显示加载动画
        showLoading(loadingEl);
        listEl.innerHTML = '';
        
        // 调用 API
        const response = await fetch(API_CONFIG.weibo);
        const data = await response.json();
        
        // 隐藏加载动画
        hideLoading(loadingEl);
        
        // 检查数据格式
        if (data && data.code === 200 && data.data) {
            renderWeiboList(data.data, listEl);
        } else {
            showError(listEl, '暂无微博热搜数据');
        }
    } catch (error) {
        hideLoading(loadingEl);
        showError(listEl, '加载失败，请稍后重试');
        console.error('微博热搜加载失败:', error);
    }
}

/**
 * 加载抖音热搜
 */
async function loadDouyinHot() {
    const loadingEl = document.getElementById('douyin-loading');
    const listEl = document.getElementById('douyin-list');
    
    try {
        // 显示加载动画
        showLoading(loadingEl);
        listEl.innerHTML = '';
        
        // 调用 API
        const response = await fetch(API_CONFIG.douyin);
        const data = await response.json();
        
        // 隐藏加载动画
        hideLoading(loadingEl);
        
        // 检查数据格式
        if (data && data.code === 200 && data.data) {
            renderDouyinList(data.data, listEl);
        } else {
            showError(listEl, '暂无抖音热搜数据');
        }
    } catch (error) {
        hideLoading(loadingEl);
        showError(listEl, '加载失败，请稍后重试');
        console.error('抖音热搜加载失败:', error);
    }
}

/**
 * 渲染微博热搜列表
 */
function renderWeiboList(data, container) {
    container.innerHTML = '';
    
    // 确保数据是数组
    const items = Array.isArray(data) ? data : [];
    
    if (items.length === 0) {
        showError(container, '暂无热搜数据');
        return;
    }
    
    items.forEach((item, index) => {
        const hotItem = document.createElement('div');
        hotItem.className = 'hot-item';
        
        // 热度标签
        const hotLabel = getHotLabel(item.hot_word_num || item.hot);
        
        // 构建内容
        hotItem.innerHTML = `
            <div class="hot-rank ${index < 3 ? 'hot-rank-top' : ''}">${index + 1}</div>
            <div class="hot-content">
                <div class="hot-title">${escapeHtml(item.title || item.word || '无标题')}</div>
                ${hotLabel ? `<div class="hot-label">${hotLabel}</div>` : ''}
            </div>
        `;
        
        // 如果有链接，添加点击跳转
        if (item.url) {
            hotItem.style.cursor = 'pointer';
            hotItem.addEventListener('click', () => {
                window.open(item.url, '_blank');
            });
        }
        
        container.appendChild(hotItem);
    });
}

/**
 * 渲染抖音热搜列表
 */
function renderDouyinList(data, container) {
    container.innerHTML = '';
    
    // 确保数据是数组
    const items = Array.isArray(data) ? data : [];
    
    if (items.length === 0) {
        showError(container, '暂无热搜数据');
        return;
    }
    
    items.forEach((item, index) => {
        const hotItem = document.createElement('div');
        hotItem.className = 'hot-item';
        
        // 热度标签
        const hotLabel = getHotLabel(item.hot_value || item.hot);
        
        // 构建内容
        hotItem.innerHTML = `
            <div class="hot-rank ${index < 3 ? 'hot-rank-top' : ''}">${index + 1}</div>
            <div class="hot-content">
                <div class="hot-title">${escapeHtml(item.title || item.word || '无标题')}</div>
                ${hotLabel ? `<div class="hot-label">${hotLabel}</div>` : ''}
            </div>
        `;
        
        // 如果有链接，添加点击跳转
        if (item.url) {
            hotItem.style.cursor = 'pointer';
            hotItem.addEventListener('click', () => {
                window.open(item.url, '_blank');
            });
        }
        
        container.appendChild(hotItem);
    });
}

/**
 * 获取热度标签
 */
function getHotLabel(hotValue) {
    if (!hotValue) return '';
    
    // 格式化热度值
    if (typeof hotValue === 'number') {
        if (hotValue >= 100000000) {
            return `${(hotValue / 100000000).toFixed(1)}亿热度`;
        } else if (hotValue >= 10000) {
            return `${(hotValue / 10000).toFixed(1)}万热度`;
        } else {
            return `${hotValue}热度`;
        }
    }
    
    return String(hotValue);
}

/**
 * 显示加载动画
 */
function showLoading(loadingEl) {
    if (loadingEl) {
        loadingEl.style.display = 'flex';
    }
}

/**
 * 隐藏加载动画
 */
function hideLoading(loadingEl) {
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
}

/**
 * 显示错误信息
 */
function showError(container, message) {
    container.innerHTML = `
        <div class="error-message">
            <div class="error-icon">⚠️</div>
            <div>${message}</div>
        </div>
    `;
}

/**
 * HTML 转义（防止 XSS）
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
