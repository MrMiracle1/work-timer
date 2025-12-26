// 读书模块主逻辑

class BookshelfManager {
    constructor() {
        this.books = this.loadBooks();
        this.reader = new Reader();
        this.currentDeleteBookId = null;
        this.savedSelectedText = ''; // 用于保存右键菜单选中的文字
        this.initEventListeners();
        this.renderBookshelf();
    }
    
    /**
     * 初始化事件监听
     */
    initEventListeners() {
        // 导入书籍按钮
        document.getElementById('import-book-btn').addEventListener('click', () => {
            document.getElementById('book-file-input').click();
        });
        
        // 文件选择
        document.getElementById('book-file-input').addEventListener('change', (e) => {
            this.handleFileImport(e.target.files);
        });
        
        // 返回书架
        document.getElementById('back-to-shelf').addEventListener('click', () => {
            this.showBookshelf();
        });
        
        // 阅读器翻页
        document.getElementById('prev-page').addEventListener('click', () => {
            this.reader.prevPage();
        });
        
        document.getElementById('next-page').addEventListener('click', () => {
            this.reader.nextPage();
        });
        
        // 进度条
        document.getElementById('progress-slider').addEventListener('input', (e) => {
            const chapterIndex = parseInt(e.target.value);
            this.reader.goToChapter(chapterIndex);
        });
        
        // 打开设置
        document.getElementById('open-settings').addEventListener('click', () => {
            this.showSettings();
        });
        
        // 关闭设置
        document.getElementById('close-settings').addEventListener('click', () => {
            this.hideSettings();
        });
        
        // 打开目录
        document.getElementById('toggle-toc').addEventListener('click', () => {
            this.showTocModal();
        });
        
        // 字体大小设置
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const size = parseInt(e.target.dataset.size);
                this.updateFontSize(size);
            });
        });
        
        // 主题设置
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.currentTarget.dataset.theme;
                this.updateTheme(theme);
            });
        });
        
        // 翻页模式设置
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                this.updatePageMode(mode);
            });
        });
        
        // 删除确认
        document.getElementById('cancel-delete').addEventListener('click', () => {
            this.hideDeleteModal();
        });
        
        document.getElementById('confirm-delete').addEventListener('click', () => {
            this.confirmDelete();
        });
        
        // 查看高亮
        document.getElementById('view-highlights').addEventListener('click', () => {
            this.showHighlightsModal();
        });
        
        // 文本选择菜单
        this.initContextMenu();
        
        // v1.4.1 新增：笔记弹窗
        this.initNoteModal();
        
        // v1.4.1 新增：AI问答弹窗
        this.initAIAskModal();
        
        // v1.4.1 新增：高亮管理弹窗
        this.initHighlightsModal();
        
        // 目录弹窗
        this.initTocModal();
        
        // 自动隐藏功能栏
        this.initAutoHideControls();
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('reader-view').classList.contains('active')) {
                if (e.key === 'ArrowLeft') {
                    this.reader.prevPage();
                } else if (e.key === 'ArrowRight') {
                    this.reader.nextPage();
                }
            }
        });
    }
    
    /**
     * 初始化右键菜单（改为选中文字自动显示）
     */
    initContextMenu() {
        const readerContent = document.getElementById('reader-content');
        const contextMenu = document.getElementById('text-context-menu');
        const highlightBtn = document.getElementById('highlight-text');
        const removeHighlightBtn = document.getElementById('remove-highlight');
        
        // 监听文字选中事件
        readerContent.addEventListener('mouseup', (e) => {
            // 稍微延迟以确保选区已更新
            setTimeout(() => {
                const selection = window.getSelection();
                const selectedText = selection.toString().trim();
                
                console.log('[Debug - 文字选中] 选中文字:', selectedText);
                
                if (selectedText) {
                    // 保存选中的文字到实例变量
                    this.savedSelectedText = selectedText;
                    console.log('[Debug - 文字选中] 已保存选中文字:', this.savedSelectedText);
                    
                    // 检查是否点击的是高亮文字
                    const clickedElement = e.target;
                    const isHighlighted = clickedElement.closest('.highlight');
                    
                    if (isHighlighted) {
                        // 点击的是高亮文字，显示“取消高亮”，隐藏“高亮标记”
                        highlightBtn.style.display = 'none';
                        removeHighlightBtn.style.display = 'flex';
                    } else {
                        // 点击的是普通文字，显示“高亮标记”，隐藏“取消高亮”
                        highlightBtn.style.display = 'flex';
                        removeHighlightBtn.style.display = 'none';
                    }
                    
                    // 显示菜单（在鼠标位置）
                    const range = selection.getRangeAt(0);
                    const rect = range.getBoundingClientRect();
                    
                    // 将菜单显示在选中文字的下方中间
                    const menuX = rect.left + (rect.width / 2);
                    const menuY = rect.bottom + window.scrollY + 5;
                    
                    contextMenu.style.left = menuX + 'px';
                    contextMenu.style.top = menuY + 'px';
                    contextMenu.classList.add('show');
                } else {
                    // 没有选中文字，隐藏菜单
                    contextMenu.classList.remove('show');
                }
            }, 10);
        });
        
        // 高亮标记
        document.getElementById('highlight-text').addEventListener('click', () => {
            console.log('[Debug - 高亮] 点击高亮按钮');
            console.log('[Debug - 高亮] 保存的文字:', this.savedSelectedText);
            console.log('[Debug - 高亮] 文字长度:', this.savedSelectedText.length);
            console.log('[Debug - 高亮] reader对象:', this.reader);
            console.log('[Debug - 高亮] 当前书籍:', this.reader.currentBook);
            
            if (this.savedSelectedText) {
                console.log('[Debug - 高亮] 开始调用 addHighlight');
                this.reader.addHighlight(this.savedSelectedText);
                console.log('[Debug - 高亮] addHighlight 调用完成');
                this.showToast('已添加高亮标记');
                this.savedSelectedText = ''; // 清空保存的文字
            } else {
                console.log('[Debug - 高亮] 没有保存的文字');
                this.showToast('请先选中文字');
            }
            
            contextMenu.classList.remove('show');
        });
        
        // 复制文本
        document.getElementById('copy-text').addEventListener('click', () => {
            console.log('[Debug - 复制] 保存的文字:', this.savedSelectedText);
            
            if (this.savedSelectedText) {
                // 使用 Clipboard API
                navigator.clipboard.writeText(this.savedSelectedText).then(() => {
                    this.showToast('已复制到剪贴板');
                }).catch(err => {
                    console.error('复制失败:', err);
                    this.showToast('复制失败，请重试', 'error');
                });
                this.savedSelectedText = '';
            } else {
                this.showToast('没有可复制的内容');
            }
            
            contextMenu.classList.remove('show');
        });
        
        // 取消高亮（仅当选中的是已高亮文字时显示）
        document.getElementById('remove-highlight').addEventListener('click', () => {
            if (this.savedSelectedText) {
                this.reader.removeHighlight(this.savedSelectedText);
                this.showToast('已取消高亮');
                this.savedSelectedText = '';
            }
            contextMenu.classList.remove('show');
        });
        
        // 点击其他地方关闭菜单
        document.addEventListener('click', () => {
            contextMenu.classList.remove('show');
        });
    }
    
    /**
     * 加载书籍列表
     */
    loadBooks() {
        const saved = localStorage.getItem('reader_books');
        return saved ? JSON.parse(saved) : [];
    }
    
    /**
     * 保存书籍列表
     */
    saveBooks() {
        localStorage.setItem('reader_books', JSON.stringify(this.books));
    }
    
    /**
     * 处理文件导入
     */
    async handleFileImport(files) {
        if (!files || files.length === 0) return;
        
        for (const file of files) {
            try {
                this.showToast('正在导入书籍...');
                
                const bookData = await BookParser.parse(file);
                
                // 生成唯一ID
                bookData.id = `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                bookData.status = 'unread'; // unread, reading, finished
                
                // 添加到书架
                this.books.push(bookData);
                this.saveBooks();
                
                this.showToast(`《${bookData.title}》导入成功！`);
            } catch (error) {
                console.error('导入失败:', error);
                this.showToast(`导入失败: ${error.message}`, 'error');
            }
        }
        
        // 清空文件输入
        document.getElementById('book-file-input').value = '';
        
        // 刷新书架
        this.renderBookshelf();
    }
    
    /**
     * 渲染书架
     */
    renderBookshelf() {
        const booksGrid = document.getElementById('books-grid');
        
        if (this.books.length === 0) {
            booksGrid.innerHTML = `
                <div class="empty-bookshelf">
                    <div class="empty-icon">📚</div>
                    <div class="empty-text">书架空空如也</div>
                    <div class="empty-hint">点击上方"导入书籍"按钮添加第一本书吧</div>
                </div>
            `;
        } else {
            booksGrid.innerHTML = this.books.map(book => this.renderBookCard(book)).join('');
            
            // 绑定事件
            this.books.forEach(book => {
                const card = document.getElementById(`book-${book.id}`);
                if (card) {
                    card.addEventListener('click', (e) => {
                        if (!e.target.classList.contains('delete-book-btn')) {
                            this.openBook(book);
                        }
                    });
                }
                
                const deleteBtn = document.getElementById(`delete-${book.id}`);
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.showDeleteModal(book);
                    });
                }
            });
        }
        
        // 更新统计
        this.updateStats();
    }
    
    /**
     * 渲染书籍卡片
     */
    renderBookCard(book) {
        const progress = this.reader.getReadingProgress(book.id);
        const progressPercent = progress 
            ? ((progress.chapter + 1) / book.totalChapters * 100).toFixed(0)
            : 0;
        
        // 根据书名生成颜色
        const colors = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
        ];
        
        const colorIndex = book.id.charCodeAt(book.id.length - 1) % colors.length;
        const coverColor = colors[colorIndex];
        
        return `
            <div class="book-card" id="book-${book.id}">
                <div class="book-cover" style="background: ${coverColor};">
                    📖
                    <div class="book-progress">
                        <div class="book-progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
                <div class="book-info">
                    <div class="book-name" title="${book.title}">${book.title}</div>
                    <div class="book-meta">
                        <span>${book.totalChapters}章</span>
                        <span>${progressPercent}%</span>
                    </div>
                </div>
                <button class="delete-book-btn" id="delete-${book.id}">✕</button>
            </div>
        `;
    }
    
    /**
     * 更新统计信息
     */
    updateStats() {
        const total = this.books.length;
        const reading = this.books.filter(b => {
            const progress = this.reader.getReadingProgress(b.id);
            return progress && progress.chapter > 0 && progress.chapter < b.totalChapters - 1;
        }).length;
        const finished = this.books.filter(b => {
            const progress = this.reader.getReadingProgress(b.id);
            return progress && progress.chapter >= b.totalChapters - 1;
        }).length;
        
        document.getElementById('total-books').textContent = total;
        document.getElementById('reading-books').textContent = reading;
        document.getElementById('finished-books').textContent = finished;
    }
    
    /**
     * 打开书籍
     */
    openBook(book) {
        this.reader.openBook(book);
        this.showReader();
        
        // 更新标题
        document.getElementById('current-book-title').textContent = book.title;
    }
    
    /**
     * 显示书架
     */
    showBookshelf() {
        document.getElementById('bookshelf-view').classList.add('active');
        document.getElementById('reader-view').classList.remove('active');
        
        this.renderBookshelf();
    }
    
    /**
     * 显示阅读器
     */
    showReader() {
        document.getElementById('bookshelf-view').classList.remove('active');
        document.getElementById('reader-view').classList.add('active');
    }
    
    /**
     * 显示删除确认弹窗
     */
    showDeleteModal(book) {
        this.currentDeleteBookId = book.id;
        document.getElementById('delete-book-title').textContent = book.title;
        document.getElementById('delete-modal').classList.add('show');
    }
    
    /**
     * 隐藏删除确认弹窗
     */
    hideDeleteModal() {
        document.getElementById('delete-modal').classList.remove('show');
        this.currentDeleteBookId = null;
    }
    
    /**
     * 确认删除
     */
    confirmDelete() {
        if (!this.currentDeleteBookId) return;
        
        // 删除书籍
        this.books = this.books.filter(b => b.id !== this.currentDeleteBookId);
        this.saveBooks();
        
        // 删除阅读进度
        localStorage.removeItem(`reading_progress_${this.currentDeleteBookId}`);
        
        this.showToast('书籍已删除');
        this.hideDeleteModal();
        this.renderBookshelf();
    }
    
    /**
     * 显示设置弹窗
     */
    showSettings() {
        document.getElementById('settings-modal').classList.add('show');
        
        // 更新设置UI
        this.updateSettingsUI();
    }
    
    /**
     * 隐藏设置弹窗
     */
    hideSettings() {
        document.getElementById('settings-modal').classList.remove('show');
    }
    
    /**
     * 更新设置UI
     */
    updateSettingsUI() {
        const settings = this.reader.settings;
        
        // 字体大小
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.size) === settings.fontSize);
        });
        
        // 主题
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === settings.theme);
        });
        
        // 翻页模式
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === settings.pageMode);
        });
    }
    
    /**
     * 更新字体大小
     */
    updateFontSize(size) {
        this.reader.updateSettings('fontSize', size);
        this.updateSettingsUI();
    }
    
    /**
     * 更新主题
     */
    updateTheme(theme) {
        this.reader.updateSettings('theme', theme);
        this.updateSettingsUI();
    }
    
    /**
     * 更新翻页模式
     */
    updatePageMode(mode) {
        this.reader.updateSettings('pageMode', mode);
        this.updateSettingsUI();
    }
    
    /**
     * 显示提示消息
     */
    showToast(message, type = 'success') {
        // 创建提示元素
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#e74c3c' : '#2ecc71'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10001;
            animation: slideDown 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 2000);
    }
    
    /**
     * 显示目录弹窗
     */
    showTocModal() {
        if (!this.reader.currentBook) {
            this.showToast('请先打开一本书');
            return;
        }
        
        const modal = document.getElementById('toc-modal');
        const tocList = document.getElementById('toc-list');
        
        // 生成目录列表
        const chapters = this.reader.currentBook.chapters;
        tocList.innerHTML = chapters.map((chapter, index) => `
            <div class="toc-item ${index === this.reader.currentChapter ? 'active' : ''}" data-index="${index}">
                <span class="toc-number">${index + 1}</span>
                <span class="toc-title">${chapter.title}</span>
            </div>
        `).join('');
        
        // 绑定点击事件
        tocList.querySelectorAll('.toc-item').forEach(item => {
            item.addEventListener('click', () => {
                const chapterIndex = parseInt(item.dataset.index);
                this.reader.goToChapter(chapterIndex);
                modal.classList.remove('show');
                this.showToast(`已跳转到 ${chapters[chapterIndex].title}`);
            });
        });
        
        // 显示弹窗
        modal.classList.add('show');
    }
    
    /**
     * 初始化目录弹窗
     */
    initTocModal() {
        const modal = document.getElementById('toc-modal');
        const closeBtn = document.getElementById('close-toc');
        
        // 关闭按钮
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });
    }
    
    /**
     * v1.4.1 新增：初始化笔记弹窗
     */
    initNoteModal() {
        const modal = document.getElementById('note-modal');
        const closeBtn = document.getElementById('close-note');
        const cancelBtn = document.getElementById('cancel-note');
        const saveBtn = document.getElementById('save-note');
        const textarea = document.getElementById('note-textarea');
        const reference = document.getElementById('note-reference');
        
        // 关闭按钮
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });
        
        cancelBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });
        
        // 保存笔记
        saveBtn.addEventListener('click', () => {
            const noteText = textarea.value.trim();
            const selectedText = reference.textContent;
            
            if (!noteText) {
                this.showToast('请输入笔记内容', 'error');
                return;
            }
            
            this.reader.saveNote(selectedText, noteText);
            // 添加笔记后也进行高亮标记
            this.reader.addHighlight(selectedText, 'yellow');
            this.showToast('笔记已保存并高亮');
            
            textarea.value = '';
            modal.classList.remove('show');
        });
        
        // 右键菜单 - 添加笔记
        document.getElementById('add-note').addEventListener('click', () => {
            console.log('[Debug - 笔记] 保存的文字:', this.savedSelectedText);
            
            if (this.savedSelectedText) {
                reference.textContent = this.savedSelectedText;
                textarea.value = '';
                modal.classList.add('show');
                textarea.focus();
                // 不清空，因为保存后还需要用
            } else {
                this.showToast('请先选中文字');
            }
            
            document.getElementById('text-context-menu').classList.remove('show');
        });
    }
    
    /**
     * v1.4.1 新增：初始化AI问答侧边栏
     */
    initAIAskModal() {
        const sidebar = document.getElementById('ai-ask-modal');
        const closeBtn = document.getElementById('close-ai-ask');
        const minimizeBtn = document.getElementById('minimize-ai-sidebar');
        const expandBtn = document.getElementById('expand-ai-sidebar');
        const followUpBtn = document.getElementById('follow-up-btn');
        const followUpInput = document.getElementById('follow-up-input');
        const saveAsNoteBtn = document.getElementById('save-ai-as-note');
        const statusText = expandBtn.querySelector('.ai-status-text');
        
        // 关闭按钮
        closeBtn.addEventListener('click', () => {
            sidebar.classList.remove('show');
            sidebar.classList.remove('minimized');
            expandBtn.classList.remove('ai-thinking');
            expandBtn.classList.remove('ai-complete');
            statusText.textContent = 'AI助手';
        });
        
        // 收起按钮
        minimizeBtn.addEventListener('click', () => {
            sidebar.classList.add('minimized');
        });
        
        // 展开按钮
        expandBtn.addEventListener('click', () => {
            sidebar.classList.remove('minimized');
        });
        
        // 继续提问
        followUpBtn.addEventListener('click', () => {
            const question = followUpInput.value.trim();
            if (question) {
                this.handleFollowUpQuestion(question);
                followUpInput.value = '';
            }
        });
        
        // 回车键提问
        followUpInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                followUpBtn.click();
            }
        });
        
        // 保存为笔记
        saveAsNoteBtn.addEventListener('click', () => {
            const context = document.getElementById('ai-selected-context').textContent;
            const answer = document.getElementById('ai-answer-content').textContent;
            
            if (context && answer && !answer.includes('正在思考')) {
                this.reader.saveNote(context, answer);
                this.showToast('已保存为AI解释笔记');
            }
        });
        
        // 右键菜单 - 问AI
        document.getElementById('ask-ai').addEventListener('click', () => {
            console.log('[Debug - AI] 保存的文字:', this.savedSelectedText);
            
            if (this.savedSelectedText) {
                this.handleAskAI(this.savedSelectedText);
                this.savedSelectedText = ''; // AI问答后清空
            } else {
                this.showToast('请先选中文字再提问');
            }
            
            document.getElementById('text-context-menu').classList.remove('show');
        });
    }
    
    /**
     * v1.4.1 新增：处理AI提问
     */
    async handleAskAI(selectedText) {
        const sidebar = document.getElementById('ai-ask-modal');
        const contextDiv = document.getElementById('ai-selected-context');
        const answerDiv = document.getElementById('ai-answer-content');
        const expandBtn = document.getElementById('expand-ai-sidebar');
        const statusText = expandBtn.querySelector('.ai-status-text');
        
        // 显示侧边栏
        sidebar.classList.add('show');
        sidebar.classList.remove('minimized');
        
        // 设置为回答中状态
        expandBtn.classList.add('ai-thinking');
        expandBtn.classList.remove('ai-complete');
        statusText.textContent = 'AI回答中';
        
        // 提取上下文
        const context = this.reader.extractContext(selectedText);
        
        // 安全转义HTML
        const escapedPrev = this.safeEscapeHtml(context.prev);
        const escapedCurrent = this.safeEscapeHtml(context.current);
        const escapedNext = this.safeEscapeHtml(context.next);
        
        // 显示上下文
        contextDiv.innerHTML = `
            <p style="opacity: 0.6;">${escapedPrev}</p>
            <p><strong>${escapedCurrent}</strong></p>
            <p style="opacity: 0.6;">${escapedNext}</p>
        `;
        
        // 显示loading
        answerDiv.innerHTML = `
            <div class="loading-animation">
                <div class="spinner"></div>
                <p>正在思考...</p>
            </div>
        `;
        
        try {
            // 检查API Key
            const apiKey = localStorage.getItem('deepseekApiKey');
            if (!apiKey) {
                answerDiv.innerHTML = '<p style="color: #e74c3c;">⚠️ 请先在设置中配置DeepSeek API密钥</p>';
                // 设置为完毕状态
                expandBtn.classList.remove('ai-thinking');
                expandBtn.classList.add('ai-complete');
                statusText.textContent = 'AI回答完毕';
                return;
            }
            
            // 构造Prompt
            const prompt = window.AI_PROMPTS.BOOK_ASK
                .replace('{PREV_PARAGRAPH}', context.prev)
                .replace('{CURRENT_PARAGRAPH}', context.current)
                .replace('{NEXT_PARAGRAPH}', context.next)
                .replace('{SELECTED_TEXT}', selectedText);
            
            // 调用AI
            const answer = await window.AIModule.callDeepSeekAPI(prompt, {
                maxTokens: 500,
                temperature: 0.7
            });
            
            // 显示结果
            answerDiv.innerHTML = `<p>${this.safeEscapeHtml(answer)}</p>`;
            
            // 设置为完毕状态
            expandBtn.classList.remove('ai-thinking');
            expandBtn.classList.add('ai-complete');
            statusText.textContent = 'AI回答完毕';
            
            // 保存问答记录
            this.reader.saveAskHistory({
                selectedText,
                context,
                question: '请解释这段内容',
                answer,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('AI提问失败:', error);
            answerDiv.innerHTML = `<p style="color: #e74c3c;">⚠️ ${this.safeEscapeHtml(error.message)}</p>`;
            // 设置为完毕状态（即使出错）
            expandBtn.classList.remove('ai-thinking');
            expandBtn.classList.add('ai-complete');
            statusText.textContent = 'AI回答完毕';
        }
    }
    
    /**
     * v1.4.1 新增：处理继续提问
     */
    async handleFollowUpQuestion(question) {
        const answerDiv = document.getElementById('ai-answer-content');
        const context = document.getElementById('ai-selected-context').textContent;
        const expandBtn = document.getElementById('expand-ai-sidebar');
        const statusText = expandBtn.querySelector('.ai-status-text');
        
        // 设置为回答中状态
        expandBtn.classList.add('ai-thinking');
        expandBtn.classList.remove('ai-complete');
        statusText.textContent = 'AI回答中';
        
        // 显示loading
        answerDiv.innerHTML = `
            <div class="loading-animation">
                <div class="spinner"></div>
                <p>正在思考...</p>
            </div>
        `;
        
        try {
            const apiKey = localStorage.getItem('deepseekApiKey');
            if (!apiKey) {
                answerDiv.innerHTML = '<p style="color: #e74c3c;">⚠️ 请先在设置中配置DeepSeek API密钥</p>';
                // 设置为完毕状态
                expandBtn.classList.remove('ai-thinking');
                expandBtn.classList.add('ai-complete');
                statusText.textContent = 'AI回答完毕';
                return;
            }
            
            // 构造继续提问的Prompt
            const prompt = `基于以下上下文，回答用户的问题。

上下文：
${context}

用户问题：${question}

请简洁明了地回答，控制在100-200字。`;
            
            const answer = await window.AIModule.callDeepSeekAPI(prompt, {
                maxTokens: 500,
                temperature: 0.7
            });
            
            answerDiv.innerHTML = `<p>${this.safeEscapeHtml(answer)}</p>`;
            
            // 设置为完毕状态
            expandBtn.classList.remove('ai-thinking');
            expandBtn.classList.add('ai-complete');
            statusText.textContent = 'AI回答完毕';
            
        } catch (error) {
            console.error('继续提问失败:', error);
            answerDiv.innerHTML = `<p style="color: #e74c3c;">⚠️ ${this.safeEscapeHtml(error.message)}</p>`;
            // 设置为完毕状态（即使出错）
            expandBtn.classList.remove('ai-thinking');
            expandBtn.classList.add('ai-complete');
            statusText.textContent = 'AI回答完毕';
        }
    }
    
    /**
     * v1.4.1 新增：初始化高亮管理弹窗
     */
    initHighlightsModal() {
        const modal = document.getElementById('highlights-modal');
        const closeBtn = document.getElementById('close-highlights');
        const filterBtns = document.querySelectorAll('.filter-btn');
        
        // 关闭按钮
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });
        
        // 筛选按钮
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const filter = btn.dataset.filter;
                this.renderHighlightsList(filter);
            });
        });
    }
    
    /**
     * v1.4.1 新增：显示高亮管理弹窗
     */
    showHighlightsModal() {
        const modal = document.getElementById('highlights-modal');
        modal.classList.add('show');
        this.renderHighlightsList('all');
    }
    
    /**
     * v1.4.1 新增：渲染高亮列表
     */
    renderHighlightsList(filter = 'all') {
        if (!this.reader.currentBook) return;
        
        const listDiv = document.getElementById('highlights-list');
        const bookId = this.reader.currentBook.id;
        const highlights = this.reader.getBookHighlights(bookId);
        const notes = this.reader.getBookNotes(bookId);
        
        let items = [];
        
        // 根据筛选条件构建列表
        if (filter === 'all' || filter === 'highlights') {
            highlights.forEach(h => {
                items.push({
                    type: 'highlight',
                    ...h
                });
            });
        }
        
        if (filter === 'all' || filter === 'notes') {
            notes.forEach(n => {
                items.push({
                    type: 'note',
                    ...n
                });
            });
        }
        
        // 按时间排序
        items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        if (items.length === 0) {
            listDiv.innerHTML = '<div class="empty-list">暂无高亮或笔记</div>';
            return;
        }
        
        listDiv.innerHTML = items.map(item => {
            if (item.type === 'highlight') {
                return `
                    <div class="highlight-item" data-chapter="${item.chapter}">
                        <div class="highlight-header">
                            <span class="highlight-color-tag ${item.color}">${this.getColorName(item.color)}</span>
                            <span class="highlight-chapter">第${item.chapter + 1}章</span>
                        </div>
                        <div class="highlight-text">${this.escapeHtml(item.text)}</div>
                        ${item.note ? `<div class="highlight-note">📝 ${this.escapeHtml(item.note)}</div>` : ''}
                        <div class="highlight-time">${this.formatTime(item.timestamp)}</div>
                    </div>
                `;
            } else {
                return `
                    <div class="highlight-item note-item" data-chapter="${item.chapter}">
                        <div class="highlight-header">
                            <span class="highlight-color-tag note">📝 笔记</span>
                            <span class="highlight-chapter">第${item.chapter + 1}章</span>
                        </div>
                        <div class="highlight-text" style="opacity: 0.7;">${this.escapeHtml(item.reference)}</div>
                        <div class="highlight-note">${this.escapeHtml(item.note)}</div>
                        <div class="highlight-time">${this.formatTime(item.timestamp)}</div>
                    </div>
                `;
            }
        }).join('');
        
        // 绑定点击事件，跳转到对应章节
        listDiv.querySelectorAll('.highlight-item').forEach(item => {
            item.addEventListener('click', () => {
                const chapter = parseInt(item.dataset.chapter);
                this.reader.goToChapter(chapter);
                document.getElementById('highlights-modal').classList.remove('show');
                this.showToast('已跳转到对应章节');
            });
        });
    }
    
    /**
     * v1.4.1 新增：获取颜色名称
     */
    getColorName(color) {
        const names = {
            yellow: '黄色',
            green: '绿色',
            blue: '蓝色',
            pink: '粉色',
            purple: '紫色'
        };
        return names[color] || color;
    }
    
    /**
     * v1.4.1 新增：格式化时间
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
        
        return date.toLocaleDateString('zh-CN');
    }
    
    /**
     * 安全转义HTML字符（防止栈溢出）
     */
    safeEscapeHtml(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
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
     * 自动隐藏功能栏
     */
    initAutoHideControls() {
        let hideTimer = null;
        const header = document.getElementById('reader-header');
        const footer = document.querySelector('.reader-footer');
        const readerView = document.getElementById('reader-view');
        
        // 鼠标移动时重置计时器
        const resetTimer = () => {
            // 显示功能栏
            if (header) header.classList.remove('hidden');
            if (footer) footer.classList.remove('hidden');
            
            // 清除之前的计时器
            if (hideTimer) {
                clearTimeout(hideTimer);
            }
            
            // 3秒后隐藏
            hideTimer = setTimeout(() => {
                if (readerView.classList.contains('active')) {
                    if (header) header.classList.add('hidden');
                    if (footer) footer.classList.add('hidden');
                }
            }, 3000);
        };
        
        // 监听鼠标移动
        document.addEventListener('mousemove', resetTimer);
        
        // 点击任意处切换显示/隐藏
        const readerContent = document.getElementById('reader-content');
        if (readerContent) {
            readerContent.addEventListener('click', (e) => {
                // 避免影响右键菜单
                if (e.target.closest('.context-menu') || e.target.closest('.highlight')) {
                    return;
                }
                
                const isHidden = header && header.classList.contains('hidden');
                if (isHidden) {
                    // 显示
                    if (header) header.classList.remove('hidden');
                    if (footer) footer.classList.remove('hidden');
                    resetTimer();
                } else {
                    // 隐藏
                    if (header) header.classList.add('hidden');
                    if (footer) footer.classList.add('hidden');
                    if (hideTimer) {
                        clearTimeout(hideTimer);
                    }
                }
            });
        }
        
        // 初始化时启动计时器
        resetTimer();
    }
}

// 初始化
let bookshelfManager;

document.addEventListener('DOMContentLoaded', () => {
    bookshelfManager = new BookshelfManager();
});
