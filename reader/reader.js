// 阅读器核心模块

class Reader {
    constructor() {
        this.currentBook = null;
        this.currentChapter = 0;
        this.currentPage = 0;
        this.settings = this.loadSettings();
        this.highlights = this.loadHighlights();
        this.notes = this.loadNotes(); // v1.4.1 新增
        this.askHistory = this.loadAskHistory(); // v1.4.1 新增
    }
    
    /**
     * 加载阅读设置
     */
    loadSettings() {
        const defaultSettings = {
            fontSize: 18,
            theme: 'white',
            pageMode: 'scroll'
        };
        
        const saved = localStorage.getItem('reader_settings');
        return saved ? JSON.parse(saved) : defaultSettings;
    }
    
    /**
     * 保存阅读设置
     */
    saveSettings() {
        localStorage.setItem('reader_settings', JSON.stringify(this.settings));
    }
    
    /**
     * 加载高亮标记
     */
    loadHighlights() {
        const saved = localStorage.getItem('reader_highlights');
        return saved ? JSON.parse(saved) : {};
    }
    
    /**
     * 保存高亮标记
     */
    saveHighlights() {
        localStorage.setItem('reader_highlights', JSON.stringify(this.highlights));
    }
    
    /**
     * v1.4.1 新增：加载笔记
     */
    loadNotes() {
        const saved = localStorage.getItem('reader_notes');
        return saved ? JSON.parse(saved) : {};
    }
    
    /**
     * v1.4.1 新增：保存笔记
     */
    saveNotes() {
        localStorage.setItem('reader_notes', JSON.stringify(this.notes));
    }
    
    /**
     * v1.4.1 新增：加载问答历史
     */
    loadAskHistory() {
        const saved = localStorage.getItem('reader_ask_history');
        return saved ? JSON.parse(saved) : {};
    }
    
    /**
     * v1.4.1 新增：保存问答历史
     */
    saveAskHistory() {
        localStorage.setItem('reader_ask_history', JSON.stringify(this.askHistory));
    }
    
    /**
     * 打开书籍
     * @param {Object} book - 书籍数据
     * @param {number} chapter - 章节索引（可选）
     */
    openBook(book, chapter = 0) {
        this.currentBook = book;
        this.currentChapter = chapter;
        this.currentPage = 0;
        
        // 尝试恢复上次阅读进度
        const progress = this.getReadingProgress(book.id);
        if (progress) {
            this.currentChapter = progress.chapter;
            this.currentPage = progress.page;
        }
        
        this.renderChapter();
        this.applySettings();
    }
    
    /**
     * 渲染当前章节
     */
    renderChapter() {
        if (!this.currentBook) return;
        
        const chapter = this.currentBook.chapters[this.currentChapter];
        const readerContent = document.getElementById('reader-content');
        
        if (!chapter) {
            readerContent.innerHTML = '<p>章节不存在</p>';
            return;
        }
        
        // 将文本转换为段落
        const paragraphs = chapter.content.split(/\n+/).filter(p => p.trim());
        const html = paragraphs.map(p => `<p>${this.escapeHtml(p.trim())}</p>`).join('');
        
        readerContent.innerHTML = html;
        
        // 应用高亮标记
        this.applyHighlights();
        
        // 更新UI
        this.updateReaderUI();
        
        // 滚动到顶部
        readerContent.scrollTop = 0;
        
        // 保存进度
        this.saveReadingProgress();
    }
    
    /**
     * 转义HTML字符
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * 应用高亮标记
     */
    applyHighlights() {
        console.log('[Debug - applyHighlights] 开始执行');
        console.log('[Debug - applyHighlights] currentBook:', this.currentBook);
        
        if (!this.currentBook) {
            console.log('[Debug - applyHighlights] 没有当前书籍，退出');
            return;
        }
        
        const bookHighlights = this.highlights[this.currentBook.id];
        const bookNotes = this.notes[this.currentBook.id];
        
        console.log('[Debug - applyHighlights] bookHighlights:', bookHighlights);
        console.log('[Debug - applyHighlights] currentChapter:', this.currentChapter);
        
        const readerContent = document.getElementById('reader-content');
        const paragraphs = readerContent.querySelectorAll('p');
        
        console.log('[Debug - applyHighlights] 段落数量:', paragraphs.length);
        
        // 先清除所有高亮，重新渲染
        paragraphs.forEach(p => {
            // 移除高亮标签，保留纯文本
            const text = p.textContent;
            p.innerHTML = text;
        });
        
        if (!bookHighlights || !bookHighlights[this.currentChapter]) {
            console.log('[Debug - applyHighlights] 当前章节没有高亮数据，退出');
            return;
        }
        
        console.log('[Debug - applyHighlights] 当前章节高亮列表:', bookHighlights[this.currentChapter]);
        
        // 应用高亮
        bookHighlights[this.currentChapter].forEach((highlight, index) => {
            console.log(`[Debug - applyHighlights] 处理高亮 ${index + 1}:`, highlight.text);
            
            let foundInParagraph = false;
            paragraphs.forEach((p, pIndex) => {
                // 检查段落是否包含高亮文本
                if (p.textContent.includes(highlight.text)) {
                    console.log(`[Debug - applyHighlights] 在第 ${pIndex + 1} 个段落中找到高亮文字`);
                    foundInParagraph = true;
                    
                    // 检查是否有笔记
                    let hasNote = false;
                    if (bookNotes && bookNotes[this.currentChapter]) {
                        hasNote = bookNotes[this.currentChapter].some(n => 
                            n.reference === highlight.text
                        );
                    }
                    
                    const noteClass = hasNote ? ' has-note' : '';
                    
                    // 使用正则表达式进行文本替换
                    const regex = new RegExp(this.escapeRegExp(highlight.text), 'g');
                    const currentHTML = p.innerHTML;
                    const highlightHtml = `<span class="highlight ${highlight.color}${noteClass}" data-text="${this.escapeHtml(highlight.text)}">${highlight.text}</span>`;
                    const newHTML = currentHTML.replace(regex, highlightHtml);
                    
                    console.log(`[Debug - applyHighlights] 替换后的HTML:`, newHTML.substring(0, 100));
                    console.log(`[Debug - applyHighlights] 是否有变化:`, currentHTML !== newHTML);
                    
                    p.innerHTML = newHTML;
                    console.log(`[Debug - applyHighlights] 已应用高亮到段落 ${pIndex + 1}`);
                }
            });
            
            if (!foundInParagraph) {
                console.log(`[Debug - applyHighlights] 未在任何段落中找到高亮文字: ${highlight.text}`);
            }
        });
        
        console.log('[Debug - applyHighlights] 执行完成');
    }
    
    /**
     * 转义正则表达式特殊字符
     */
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    /**
     * 更新阅读器UI
     */
    updateReaderUI() {
        const chapter = this.currentBook.chapters[this.currentChapter];
        
        // 更新章节名称
        document.getElementById('current-chapter').textContent = chapter.title;
        
        // 更新进度
        const progress = ((this.currentChapter + 1) / this.currentBook.totalChapters * 100).toFixed(0);
        document.getElementById('reading-progress').textContent = `${progress}%`;
        
        // 更新进度条
        const slider = document.getElementById('progress-slider');
        slider.max = this.currentBook.totalChapters - 1;
        slider.value = this.currentChapter;
        
        // 更新翻页按钮状态
        document.getElementById('prev-page').disabled = this.currentChapter === 0;
        document.getElementById('next-page').disabled = this.currentChapter >= this.currentBook.totalChapters - 1;
    }
    
    /**
     * 上一页/章
     */
    prevPage() {
        if (this.currentChapter > 0) {
            this.currentChapter--;
            this.renderChapter();
        }
    }
    
    /**
     * 下一页/章
     */
    nextPage() {
        if (this.currentChapter < this.currentBook.totalChapters - 1) {
            this.currentChapter++;
            this.renderChapter();
        }
    }
    
    /**
     * 跳转到指定章节
     */
    goToChapter(chapterIndex) {
        if (chapterIndex >= 0 && chapterIndex < this.currentBook.totalChapters) {
            this.currentChapter = chapterIndex;
            this.renderChapter();
        }
    }
    
    /**
     * 应用阅读设置
     */
    applySettings() {
        const readerContent = document.getElementById('reader-content');
        
        // 字体大小
        readerContent.style.fontSize = `${this.settings.fontSize}px`;
        
        // 主题
        readerContent.className = 'reader-content';
        if (this.settings.theme !== 'white') {
            readerContent.classList.add(`theme-${this.settings.theme}`);
        }
        
        // 翻页模式（暂时只支持滚动）
        // pageMode 功能可以在后续扩展
    }
    
    /**
     * 更新设置
     */
    updateSettings(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        this.applySettings();
    }
    
    /**
     * 保存阅读进度
     */
    saveReadingProgress() {
        if (!this.currentBook) return;
        
        const progress = {
            bookId: this.currentBook.id,
            chapter: this.currentChapter,
            page: this.currentPage,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem(`reading_progress_${this.currentBook.id}`, JSON.stringify(progress));
    }
    
    /**
     * 获取阅读进度
     */
    getReadingProgress(bookId) {
        const saved = localStorage.getItem(`reading_progress_${bookId}`);
        return saved ? JSON.parse(saved) : null;
    }
    
    /**
     * 添加高亮标记
     */
    addHighlight(text, color = 'yellow') {
        console.log('[Debug - addHighlight] 开始执行');
        console.log('[Debug - addHighlight] 文字:', text);
        console.log('[Debug - addHighlight] 颜色:', color);
        console.log('[Debug - addHighlight] currentBook:', this.currentBook);
        
        if (!this.currentBook) {
            console.log('[Debug - addHighlight] 没有当前书籍，退出');
            return;
        }
        
        const bookId = this.currentBook.id;
        const chapterIndex = this.currentChapter;
        
        console.log('[Debug - addHighlight] bookId:', bookId);
        console.log('[Debug - addHighlight] chapterIndex:', chapterIndex);
        
        if (!this.highlights[bookId]) {
            this.highlights[bookId] = {};
            console.log('[Debug - addHighlight] 创建新的 bookId 高亮对象');
        }
        
        if (!this.highlights[bookId][chapterIndex]) {
            this.highlights[bookId][chapterIndex] = [];
            console.log('[Debug - addHighlight] 创建新的章节高亮数组');
        }
        
        this.highlights[bookId][chapterIndex].push({
            text: text,
            color: color,
            timestamp: new Date().toISOString()
        });
        
        console.log('[Debug - addHighlight] 高亮数据已添加');
        console.log('[Debug - addHighlight] 当前章节高亮列表:', this.highlights[bookId][chapterIndex]);
        
        this.saveHighlights();
        console.log('[Debug - addHighlight] 高亮数据已保存');
        
        this.applyHighlights();
        console.log('[Debug - addHighlight] applyHighlights 已调用');
    }
    
    /**
     * 删除高亮标记
     */
    removeHighlight(text) {
        if (!this.currentBook) return;
        
        const bookId = this.currentBook.id;
        const chapterIndex = this.currentChapter;
        
        if (!this.highlights[bookId] || !this.highlights[bookId][chapterIndex]) {
            return;
        }
        
        // 从数组中删除匹配的高亮
        this.highlights[bookId][chapterIndex] = this.highlights[bookId][chapterIndex].filter(
            h => h.text !== text
        );
        
        this.saveHighlights();
        this.applyHighlights();
    }
    
    /**
     * 生成目录
     */
    generateTOC() {
        if (!this.currentBook) return [];
        
        return this.currentBook.chapters.map((chapter, index) => ({
            title: chapter.title,
            index: index
        }));
    }
    
    /**
     * v1.4.1 新增：保存笔记
     */
    saveNote(reference, note) {
        if (!this.currentBook) return;
        
        const bookId = this.currentBook.id;
        const chapterIndex = this.currentChapter;
        
        if (!this.notes[bookId]) {
            this.notes[bookId] = {};
        }
        
        if (!this.notes[bookId][chapterIndex]) {
            this.notes[bookId][chapterIndex] = [];
        }
        
        this.notes[bookId][chapterIndex].push({
            reference: reference,
            note: note,
            chapter: chapterIndex,
            timestamp: new Date().toISOString()
        });
        
        this.saveNotes();
        this.applyHighlights(); // 重新应用高亮和笔记
    }
    
    /**
     * v1.4.1 新增：提取上下文
     */
    extractContext(selectedText) {
        if (!this.currentBook) {
            return { prev: '', current: '', next: '' };
        }
        
        const readerContent = document.getElementById('reader-content');
        const paragraphs = Array.from(readerContent.querySelectorAll('p'));
        
        // 查找包含选中文本的段落
        let currentIndex = -1;
        for (let i = 0; i < paragraphs.length; i++) {
            if (paragraphs[i].textContent.includes(selectedText)) {
                currentIndex = i;
                break;
            }
        }
        
        if (currentIndex === -1) {
            return { prev: '', current: selectedText, next: '' };
        }
        
        const prev = currentIndex > 0 ? paragraphs[currentIndex - 1].textContent : '';
        const current = paragraphs[currentIndex].textContent;
        const next = currentIndex < paragraphs.length - 1 ? paragraphs[currentIndex + 1].textContent : '';
        
        return { prev, current, next };
    }
    
    /**
     * v1.4.1 新增：保存问答历史
     */
    saveAskHistory(item) {
        if (!this.currentBook) return;
        
        const bookId = this.currentBook.id;
        const chapterIndex = this.currentChapter;
        
        if (!this.askHistory[bookId]) {
            this.askHistory[bookId] = {};
        }
        
        if (!this.askHistory[bookId][chapterIndex]) {
            this.askHistory[bookId][chapterIndex] = [];
        }
        
        this.askHistory[bookId][chapterIndex].push({
            ...item,
            chapter: chapterIndex
        });
        
        // 保存到localStorage
        localStorage.setItem('reader_ask_history', JSON.stringify(this.askHistory));
    }
    
    /**
     * v1.4.1 新增：获取书籍所有高亮
     */
    getBookHighlights(bookId) {
        const bookHighlights = this.highlights[bookId];
        if (!bookHighlights) return [];
        
        const allHighlights = [];
        Object.keys(bookHighlights).forEach(chapter => {
            bookHighlights[chapter].forEach(h => {
                allHighlights.push({
                    ...h,
                    chapter: parseInt(chapter)
                });
            });
        });
        
        return allHighlights;
    }
    
    /**
     * v1.4.1 新增：获取书籍所有笔记
     */
    getBookNotes(bookId) {
        const bookNotes = this.notes[bookId];
        if (!bookNotes) return [];
        
        const allNotes = [];
        Object.keys(bookNotes).forEach(chapter => {
            bookNotes[chapter].forEach(n => {
                allNotes.push({
                    ...n,
                    chapter: parseInt(chapter)
                });
            });
        });
        
        return allNotes;
    }
}

// 导出到全局
if (typeof window !== 'undefined') {
    window.Reader = Reader;
}
