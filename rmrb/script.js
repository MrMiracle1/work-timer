// 人民日报阅读模块
// CORS 代理配置
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const BASE_HOST = "https://paper.people.com.cn";

// URL 生成函数
function getIndexUrl(date) {
    const yyyy = date.getFullYear().toString().padStart(4, '0');
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    return `${BASE_HOST}/rmrb/pc/layout/${yyyy}${mm}/${dd}/node_01.html`;
}

function getDateBase(date) {
    const yyyy = date.getFullYear().toString().padStart(4, '0');
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    return `${BASE_HOST}/rmrb/pc/layout/${yyyy}${mm}/${dd}/`;
}

function getContentBase(date) {
    const yyyy = date.getFullYear().toString().padStart(4, '0');
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    return `${BASE_HOST}/rmrb/pc/content/${yyyy}${mm}/${dd}/`;
}

// 提取版面页链接
function extractPageUrls(doc, base) {
    const pageUrls = [];
    const links = doc.querySelectorAll('a[href]');
    
    links.forEach(link => {
        const href = link.getAttribute('href').trim();
        // 匹配 node_XX.html 格式
        if (/^node_\d{2}\.html$/.test(href)) {
            pageUrls.push(base + href);
        }
    });
    
    // 去重并排序
    const uniqueUrls = [...new Set(pageUrls)];
    const urlsWithNums = uniqueUrls.map(url => {
        const match = url.match(/node_(\d{2})\.html$/);
        return match ? { url, num: parseInt(match[1]) } : null;
    }).filter(item => item !== null);
    
    return urlsWithNums.sort((a, b) => a.num - b.num).map(item => item.url);
}

// 提取文章链接和标题
function extractArticles(doc, contentBaseUrl) {
    const articles = [];
    const links = doc.querySelectorAll('a[href]');
    const seen = new Set();
    
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        
        const hrefTrimmed = href.trim();
        // 匹配包含 content_数字.html 的链接
        if (hrefTrimmed.includes('content') && /content_\d+\.html$/.test(hrefTrimmed)) {
            const match = hrefTrimmed.match(/(content_\d+\.html)$/);
            if (match) {
                const articleUrl = contentBaseUrl + match[1];
                if (!seen.has(articleUrl)) {
                    seen.add(articleUrl);
                    const title = link.textContent.trim();
                    if (title) {
                        articles.push({ title, url: articleUrl });
                    }
                }
            }
        }
    });
    
    return articles;
}

// 解析文章内容
function parseArticle(doc) {
    let title = '';
    let content = '';
    
    // 提取标题
    const h1 = doc.querySelector('h1');
    const titleEl = doc.querySelector('#title');
    if (h1) {
        title = h1.textContent.trim();
    } else if (titleEl) {
        title = titleEl.textContent.trim();
    } else {
        const candidates = doc.querySelectorAll('h2, h3, .title, .text_tit');
        if (candidates.length > 0) {
            title = candidates[0].textContent.trim();
        }
    }
    
    // 提取正文
    const contentParts = [];
    const bodyContainers = [
        doc.querySelector('#ozoom'),
        doc.querySelector('.article'),
        doc.querySelector('.text'),
        doc.querySelector('.content')
    ];
    
    for (const container of bodyContainers) {
        if (container) {
            const paragraphs = container.querySelectorAll('p');
            if (paragraphs.length > 0) {
                paragraphs.forEach(p => {
                    const text = p.textContent.trim();
                    if (text) contentParts.push(text);
                });
                break;
            }
        }
    }
    
    // 回退：页面所有 p
    if (contentParts.length === 0) {
        const allPs = doc.querySelectorAll('p');
        allPs.forEach(p => {
            const text = p.textContent.trim();
            if (text) contentParts.push(text);
        });
    }
    
    content = contentParts.join('\n\n');
    return { title, content };
}

// 获取 HTML 内容
async function fetchHtml(url) {
    try {
        const proxyUrl = CORS_PROXY + encodeURIComponent(url);
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        const parser = new DOMParser();
        return parser.parseFromString(html, 'text/html');
    } catch (error) {
        console.error('获取页面失败:', url, error);
        return null;
    }
}

// 获取当天新闻列表
async function fetchTodayNews(date, maxArticles = 100) {
    const indexUrl = getIndexUrl(date);
    const dateBase = getDateBase(date);
    const contentBase = getContentBase(date);
    
    showLoading('正在获取人民日报电子版...');
    
    const indexDoc = await fetchHtml(indexUrl);
    if (!indexDoc) {
        showError('无法获取电子版首页，可能原因：\n1. 今日报纸尚未发布（通常在早上6点后发布）\n2. 网络连接问题\n3. 网站结构变化');
        return [];
    }
    
    const pageUrls = extractPageUrls(indexDoc, dateBase);
    showLoading(`找到 ${pageUrls.length} 个版面页，正在提取文章...`);
    
    const allArticles = [];
    const seen = new Set();
    
    for (let i = 0; i < pageUrls.length && allArticles.length < maxArticles; i++) {
        const pageUrl = pageUrls[i];
        const pageDoc = await fetchHtml(pageUrl);
        
        if (pageDoc) {
            const articles = extractArticles(pageDoc, contentBase);
            articles.forEach(article => {
                if (!seen.has(article.url) && allArticles.length < maxArticles) {
                    seen.add(article.url);
                    allArticles.push(article);
                }
            });
        }
        
        // 更新进度
        showLoading(`正在处理版面 ${i + 1}/${pageUrls.length}，已找到 ${allArticles.length} 篇文章...`);
        
        // 延迟避免请求过快
        if (i < pageUrls.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }
    
    hideLoading();
    return allArticles;
}

// 读取文章内容
async function readArticle(articleUrl) {
    showLoading('正在加载文章内容...');
    
    const doc = await fetchHtml(articleUrl);
    if (!doc) {
        showError('无法加载文章内容');
        return null;
    }
    
    const article = parseArticle(doc);
    hideLoading();
    return article;
}

// UI 函数
function showLoading(message) {
    const loadingEl = document.getElementById('loading-message');
    const loadingContainer = document.getElementById('loading-container');
    if (loadingEl && loadingContainer) {
        loadingEl.textContent = message;
        loadingContainer.style.display = 'flex';
    }
}

function hideLoading() {
    const loadingContainer = document.getElementById('loading-container');
    if (loadingContainer) {
        loadingContainer.style.display = 'none';
    }
}

function showError(message) {
    hideLoading();
    alert(message);
}

function renderArticleList(articles) {
    const listContainer = document.getElementById('article-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    
    if (articles.length === 0) {
        listContainer.innerHTML = '<div class="no-articles">暂无文章</div>';
        return;
    }
    
    articles.forEach((article, index) => {
        const articleItem = document.createElement('div');
        articleItem.className = 'article-item';
        articleItem.innerHTML = `
            <div class="article-number">${index + 1}</div>
            <div class="article-title">${article.title}</div>
        `;
        
        articleItem.addEventListener('click', async () => {
            const fullArticle = await readArticle(article.url);
            if (fullArticle) {
                showArticleModal(fullArticle);
            }
        });
        
        listContainer.appendChild(articleItem);
    });
}

function showArticleModal(article) {
    const modal = document.getElementById('article-modal');
    const titleEl = document.getElementById('article-modal-title');
    const contentEl = document.getElementById('article-modal-content');
    
    if (modal && titleEl && contentEl) {
        titleEl.textContent = article.title;
        contentEl.textContent = article.content;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeArticleModal() {
    const modal = document.getElementById('article-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// 初始化
async function init() {
    // 关闭文章模态框
    const closeBtn = document.getElementById('close-article-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeArticleModal);
    }
    
    const modal = document.getElementById('article-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeArticleModal();
            }
        });
    }
    
    // 关闭AI模态框
    const closeAIBtn = document.getElementById('close-ai-modal');
    if (closeAIBtn) {
        closeAIBtn.addEventListener('click', closeAIModal);
    }
    
    const aiModal = document.getElementById('ai-analysis-modal');
    if (aiModal) {
        aiModal.addEventListener('click', (e) => {
            if (e.target === aiModal) {
                closeAIModal();
            }
        });
    }
    
    // 刷新按钮
    const refreshBtn = document.getElementById('refresh-news');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            const today = new Date();
            const articles = await fetchTodayNews(today);
            window.currentArticles = articles;
            renderArticleList(articles);
        });
    }
    
    // AI读报按钮
    const aiAnalysisBtn = document.getElementById('ai-analysis-btn');
    if (aiAnalysisBtn) {
        aiAnalysisBtn.addEventListener('click', handleAIAnalysis);
    }
    
    // 日期选择
    const dateInput = document.getElementById('news-date');
    if (dateInput) {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        dateInput.value = dateStr;
        
        dateInput.addEventListener('change', async () => {
            const selectedDate = new Date(dateInput.value);
            const articles = await fetchTodayNews(selectedDate);
            window.currentArticles = articles;
            renderArticleList(articles);
        });
    }
    
    // 加载今天的新闻
    const today = new Date();
    const articles = await fetchTodayNews(today);
    window.currentArticles = articles;
    renderArticleList(articles);
}

// AI读报分析处理
async function handleAIAnalysis() {
    if (!window.currentArticles || window.currentArticles.length === 0) {
        showError('请先加载新闻内容');
        return;
    }
    
    // 只分析前4版的文章（假设每版约25篇文章）
    const firstFourPagesArticles = window.currentArticles.slice(0, Math.min(100, window.currentArticles.length));
    
    showLoading('AI正在阅读人民日报，请稍候...');
    
    try {
        // 获取前4版文章的完整内容
        const articlesWithContent = [];
        for (let i = 0; i < Math.min(4, firstFourPagesArticles.length); i++) {
            const article = firstFourPagesArticles[i];
            showLoading(`正在读取第 ${i + 1} 篇文章...`);
            const fullArticle = await readArticle(article.url);
            if (fullArticle && fullArticle.content) {
                articlesWithContent.push({
                    title: fullArticle.title,
                    content: fullArticle.content
                });
            }
        }
        
        if (articlesWithContent.length === 0) {
            showError('无法获取文章内容');
            return;
        }
        
        // 构建分析内容
        let newsContent = '人民日报前四版要闻：\n\n';
        articlesWithContent.forEach((article, index) => {
            newsContent += `## 文章${index + 1}：${article.title}

${article.content}

---

`;
        });
        
        showLoading('正在进行AI分析，请耐心等待...');
        
        // 调用AI分析
        const result = await window.AIModule.callAIAnalysis('NEWS_ANALYSIS', newsContent);
        
        hideLoading();
        
        if (result.success) {
            showAIAnalysisModal(result.content);
        } else {
            showError('AI分析失败：' + (result.error || '未知错误'));
        }
    } catch (error) {
        hideLoading();
        showError('AI分析出错：' + error.message);
    }
}

// 显示AI分析结果
function showAIAnalysisModal(content) {
    const modal = document.getElementById('ai-analysis-modal');
    const contentEl = document.getElementById('ai-analysis-content');
    
    if (modal && contentEl) {
        // 将Markdown转换为HTML（简单处理）
        const htmlContent = markdownToHtml(content);
        contentEl.innerHTML = htmlContent;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// 关闭AI模态框
function closeAIModal() {
    const modal = document.getElementById('ai-analysis-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// 简单的Markdown转 HTML
function markdownToHtml(markdown) {
    let html = markdown;
    
    // 标题
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    
    // 粗体
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // 列表
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // 分隔线
    html = html.replace(/^---$/gm, '<hr>');
    
    // 换行
    html = html.replace(/\n/g, '<br>');
    
    return html;
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
