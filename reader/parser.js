// 电子书解析模块
// 支持 TXT、EPUB 等常见格式

class BookParser {
    /**
     * 解析书籍文件
     * @param {File} file - 书籍文件
     * @returns {Promise<Object>} 解析后的书籍数据
     */
    static async parse(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        
        switch (extension) {
            case 'txt':
                return await this.parseTXT(file);
            case 'epub':
                return await this.parseEPUB(file);
            default:
                throw new Error(`不支持的文件格式: ${extension}`);
        }
    }
    
    /**
     * 解析 TXT 文件
     * @param {File} file
     * @returns {Promise<Object>}
     */
    static async parseTXT(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    let content = e.target.result;
                    
                    // 尝试检测编码并处理
                    content = this.detectAndDecode(content);
                    
                    // 提取书名（从文件名）
                    const title = file.name.replace('.txt', '');
                    
                    // 尝试自动分章节
                    const chapters = this.extractChapters(content);
                    
                    resolve({
                        title: title,
                        author: '未知',
                        format: 'txt',
                        chapters: chapters,
                        totalChapters: chapters.length,
                        rawContent: content,
                        fileSize: file.size,
                        importDate: new Date().toISOString()
                    });
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsText(file, 'UTF-8');
        });
    }
    
    /**
     * 解析 EPUB 文件（简化版）
     * @param {File} file
     * @returns {Promise<Object>}
     */
    static async parseEPUB(file) {
        // EPUB 是 ZIP 压缩包，包含 HTML/XHTML 文件
        // 这里实现简化版本，实际项目可以使用 epub.js 库
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    // 提取基本信息
                    const title = file.name.replace('.epub', '');
                    
                    // EPUB 解析需要额外的库，这里提供占位实现
                    resolve({
                        title: title,
                        author: '未知',
                        format: 'epub',
                        chapters: [{
                            title: '第1章',
                            content: 'EPUB 格式需要安装额外的解析库。\n\n当前版本暂不支持完整解析，请使用 TXT 格式。'
                        }],
                        totalChapters: 1,
                        fileSize: file.size,
                        importDate: new Date().toISOString()
                    });
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsArrayBuffer(file);
        });
    }
    
    /**
     * 检测并解码文本内容
     * @param {string} content
     * @returns {string}
     */
    static detectAndDecode(content) {
        // 简单的编码检测和修正
        // 实际项目可以使用更完善的编码检测库
        return content;
    }
    
    /**
     * 从文本内容中提取章节
     * @param {string} content
     * @returns {Array}
     */
    static extractChapters(content) {
        const chapters = [];
        
        // 常见的章节标题模式
        const patterns = [
            /^第[零一二三四五六七八九十百千万\d]+章.*/gm,
            /^第[零一二三四五六七八九十百千万\d]+节.*/gm,
            /^Chapter \d+.*/gmi,
            /^\d+\..*/gm
        ];
        
        let chapterMatches = [];
        
        // 尝试匹配章节标题
        for (const pattern of patterns) {
            const matches = content.match(pattern);
            if (matches && matches.length > 1) {
                // 找到了章节分隔，使用这个模式
                chapterMatches = matches;
                break;
            }
        }
        
        if (chapterMatches.length > 0) {
            // 根据章节标题分割内容
            const parts = content.split(new RegExp(chapterMatches.join('|')));
            
            for (let i = 0; i < chapterMatches.length; i++) {
                const chapterTitle = chapterMatches[i].trim();
                const chapterContent = parts[i + 1] ? parts[i + 1].trim() : '';
                
                if (chapterContent) {
                    chapters.push({
                        title: chapterTitle,
                        content: chapterContent
                    });
                }
            }
        }
        
        // 如果没有找到章节，将整本书作为一章
        if (chapters.length === 0) {
            chapters.push({
                title: '正文',
                content: content.trim()
            });
        }
        
        return chapters;
    }
    
    /**
     * 将内容分页（用于翻页模式）
     * @param {string} content - 章节内容
     * @param {number} charsPerPage - 每页字符数
     * @returns {Array<string>}
     */
    static paginateContent(content, charsPerPage = 1000) {
        const pages = [];
        const paragraphs = content.split(/\n+/);
        
        let currentPage = '';
        
        for (const paragraph of paragraphs) {
            if (currentPage.length + paragraph.length > charsPerPage && currentPage.length > 0) {
                pages.push(currentPage.trim());
                currentPage = paragraph + '\n\n';
            } else {
                currentPage += paragraph + '\n\n';
            }
        }
        
        if (currentPage.trim()) {
            pages.push(currentPage.trim());
        }
        
        return pages;
    }
}

// 导出到全局
if (typeof window !== 'undefined') {
    window.BookParser = BookParser;
}
