// 从localStorage加载书签或使用默认数据
let bookmarks = JSON.parse(localStorage.getItem('personalBookmarks') || defaultBookmarks);

// 当前选中的分类
let currentCategory = 'all';

// 当前正在编辑的书签ID（如果是编辑模式）
let editingBookmarkId = null;

// 当前主题模式
let currentThemeMode = 'auto'; // 'auto', 'light', 'dark', 'blue', 'green', 'purple'

// 搜索引擎配置
const searchEngines = {
    google: {
        name: "Google",
        url: "https://www.google.com/search?q="
    },
    bing: {
        name: "Bing",
        url: "https://www.bing.com/search?q="
    },
    baidu: {
        name: "Baidu",
        url: "https://www.baidu.com/s?wd="
    }
};

// DOM元素
const bookmarksContainer = document.getElementById('bookmarksContainer');
const categoriesContainer = document.getElementById('categoriesContainer');
const searchInput = document.getElementById('searchInput');
const totalCountElement = document.getElementById('totalCount');
const bookmarkModal = document.getElementById('bookmarkModal');
const bookmarkForm = document.getElementById('bookmarkForm');
const modalTitle = document.getElementById('modalTitle');
const bookmarkCategorySelect = document.getElementById('bookmarkCategory');
// const addBookmarkBtn = document.getElementById('addBookmarkBtn');
const cancelBtn = document.getElementById('cancelBtn');
const currentYearElement = document.getElementById('currentYear');
const searchEngineSelect = document.getElementById('searchEngine');

// 移动端操作按钮
// const mobileAddBtn = document.getElementById('mobileAddBtn');
// 更新移动端操作按钮引用
const fabMain = document.getElementById('fabMain');
const fabSearch = document.getElementById('fabSearch');
// const fabTheme = document.getElementById('fabTheme');
const fabTop = document.getElementById('fabTop');
const fabMenu = document.querySelector('.fab-menu');

// 主题色设置
const themes = {
    auto: null, // 自动跟随系统
    light: {
        name: 'light',
        '--primary-color': '#4a6fa5',
        '--secondary-color': '#6b8cbc',
        '--background-color': '#f5f7fa',
        '--card-color': '#ffffff',
        '--text-color': '#333333',
        '--shadow': '0 4px 12px rgba(0, 0, 0, 0.1)',
        '--bookmark-item-bg': '#f9f9f9', // 新增
        '--search-input-bg': '#ffffff', // 新增
        '--search-border-color': '#ddd' // 新增
    },
    dark: {
        name: 'dark',
        '--primary-color': '#6b8cbc',
        '--secondary-color': '#8aa7d6',
        '--background-color': '#1a1a1a',
        '--card-color': '#2d2d2d',
        '--text-color': '#f0f0f0',
        '--shadow': '0 4px 12px rgba(0, 0, 0, 0.3)',
        '--bookmark-item-bg': 'rgba(255, 255, 255, 0.03)', // 新增
        '--search-input-bg': 'rgba(255, 255, 255, 0.08)', // 新增
        '--search-border-color': 'rgba(255, 255, 255, 0.15)' // 新增
    },
    blue: {
        name: 'blue',
        '--primary-color': '#4a6fa5',
        '--secondary-color': '#6b8cbc',
        '--background-color': '#f5f7fa',
        '--card-color': '#ffffff',
        '--text-color': '#333333',
        '--shadow': '0 4px 12px rgba(0, 0, 0, 0.1)',
        '--bookmark-item-bg': '#f9f9f9', // 新增
        '--search-input-bg': '#ffffff', // 新增
        '--search-border-color': '#ddd' // 新增
    },
    green: {
        name: 'green',
        '--primary-color': '#5a8d5a',
        '--secondary-color': '#7ba87b',
        '--background-color': '#f5f9f5',
        '--card-color': '#ffffff',
        '--text-color': '#333333',
        '--shadow': '0 4px 12px rgba(0, 0, 0, 0.1)',
        '--bookmark-item-bg': '#f9f9f9', // 新增
        '--search-input-bg': '#ffffff', // 新增
        '--search-border-color': '#ddd' // 新增
    },
    purple: {
        name: 'purple',
        '--primary-color': '#8a6fa5',
        '--secondary-color': '#a68cbc',
        '--background-color': '#f9f7fa',
        '--card-color': '#ffffff',
        '--text-color': '#333333',
        '--shadow': '0 4px 12px rgba(0, 0, 0, 0.1)',
        '--bookmark-item-bg': '#f9f9f9', // 新增
        '--search-input-bg': '#ffffff', // 新增
        '--search-border-color': '#ddd' // 新增
    }
};

// 初始化页面
function initPage() {
    // 设置当前年份
    currentYearElement.textContent = new Date().getFullYear();

    // 更新总计数
    updateTotalCount();

    // 生成分类按钮
    generateCategoryButtons();

    // 生成书签内容
    generateBookmarks();

    // 为分类选择框生成选项
    populateCategorySelect();

    // 设置事件监听器
    setupEventListeners();

    // 应用保存的主题
    applySavedTheme();

    // 监听系统主题变化
    watchSystemThemeChange();

    // 移动端优化：设置视口高度
    setViewportHeight();
}

// 设置视口高度（解决移动端100vh问题）
function setViewportHeight() {
    const setHeight = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setHeight();
    window.addEventListener('resize', setHeight);
    window.addEventListener('orientationchange', setHeight);
}

// 生成分类按钮
function generateCategoryButtons() {
    // 获取所有分类
    const categories = ['all', ...new Set(bookmarks.map(bookmark => bookmark.category))];

    // 清空现有按钮（除了"全部"按钮）
    const allBtn = document.querySelector('.category-btn[data-category="all"]');
    categoriesContainer.innerHTML = '';
    categoriesContainer.appendChild(allBtn);

    // 为每个分类创建按钮
    categories.forEach(category => {
        if (category === 'all')
            return;

        const button = document.createElement('button');
        button.className = 'category-btn';
        button.textContent = category;
        button.dataset.category = category;

        if (category === currentCategory) {
            button.classList.add('active');
        }

        categoriesContainer.appendChild(button);
    });
}

// 生成书签内容
function generateBookmarks() {
    // 清空容器
    bookmarksContainer.innerHTML = '';

    // 获取过滤后的书签
    let filteredBookmarks = [...bookmarks]; // 创建副本

    // 按分类过滤
    if (currentCategory !== 'all') {
        filteredBookmarks = filteredBookmarks.filter(bookmark => bookmark.category === currentCategory);
    }

    // 按搜索词过滤
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filteredBookmarks = filteredBookmarks.filter(bookmark =>
            bookmark.name.toLowerCase().includes(searchTerm) ||
            (bookmark.description && bookmark.description.toLowerCase().includes(searchTerm)) ||
            bookmark.url.toLowerCase().includes(searchTerm) ||
            bookmark.category.toLowerCase().includes(searchTerm));
    }

    // 如果没有书签，显示空状态
    if (filteredBookmarks.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
                    <i class="fas fa-bookmark"></i>
                    <h3>${searchTerm ? '没有找到匹配的收藏' : '暂无收藏'}</h3>
                    <p>${searchTerm ? '尝试使用其他关键词搜索' : '点击"添加新收藏"按钮开始添加网站'}</p>
                `;
        bookmarksContainer.appendChild(emptyState);
        return;
    }

    // 按分类分组
    const bookmarksByCategory = {};
    filteredBookmarks.forEach(bookmark => {
        if (!bookmarksByCategory[bookmark.category]) {
            bookmarksByCategory[bookmark.category] = [];
        }
        bookmarksByCategory[bookmark.category].push(bookmark);
    });

    // 为每个分类创建区域
    Object.keys(bookmarksByCategory).forEach(category => {
                // 对每个分类的书签按点击次数降序排序
                bookmarksByCategory[category].sort((a, b) => {
                    const clicksA = a.clicks || 0;
                    const clicksB = b.clicks || 0;
                    return clicksB - clicksA; // 降序排列
                });

                const categorySection = document.createElement('div');
                categorySection.className = 'category-section';

                // 分类标题和统计信息
                const categoryTitle = document.createElement('div');
                categoryTitle.className = 'category-title';
                categoryTitle.innerHTML = `
                    <i class="fas fa-folder category-icon"></i>
                    <h2>${category}</h2>
                `;

                // 分类统计信息
                const bookmarkStats = document.createElement('div');
                bookmarkStats.className = 'bookmark-stats';
                bookmarkStats.innerHTML = `
                    <div>共 <span class="bookmark-count">${bookmarksByCategory[category].length}</span> 个收藏</div>
                `;

                // 书签列表
                const bookmarksList = document.createElement('ul');
                bookmarksList.className = 'bookmarks-list';

                // 为每个书签创建项目
                bookmarksByCategory[category].forEach(bookmark => {
                            const bookmarkItem = document.createElement('li');
                            bookmarkItem.className = 'bookmark-item';
                            bookmarkItem.dataset.id = bookmark.id;

                            // 获取网站favicon
                            let faviconUrl = '';
                            try {
                                // const url = new URL(bookmark.url);
                                // faviconUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
                                faviconUrl = `./img/${bookmark.id}.png`;
                            } catch {
                                faviconUrl = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzRBNjdBNSI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bS0xIDE1bC01LTUgMS40MS0xLjQxTDEwIDE0LjE3bDYuNTktNi41OUwxOCA5bC04IDh6Ii8+PC9zdmc+';
                            }

                            bookmarkItem.innerHTML = `
                        <a href="${bookmark.url}" target="_blank" rel="noopener" class="bookmark-link">
                            <div class="bookmark-header">
                                <img src="${faviconUrl}" alt="${bookmark.name}图标" class="bookmark-favicon" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzRBNjdBNSI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bS0xIDE1bC01LTUgMS40MS0xLjQxTDEwIDE0LjE3bDYuNTktNi41OUwxOCA5bC04IDh6Ii8+PC9zdmc+'">
                                <div class="bookmark-info">
                                    <div class="bookmark-name">${bookmark.name}</div>
                                    <div class="bookmark-url">${bookmark.url.replace(/^https?:\/\//, '')}</div>
                                </div>
                            </div>
                            ${bookmark.description ? `<div class="bookmark-description">${bookmark.description}</div>` : ''}
                        </a>
                        <div class="bookmark-actions">
                            <button class="action-btn edit-btn" title="编辑">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete-btn" title="删除">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    `;

            bookmarksList.appendChild(bookmarkItem);
        });

        categorySection.appendChild(categoryTitle);
        categorySection.appendChild(bookmarkStats);
        categorySection.appendChild(bookmarksList);
        bookmarksContainer.appendChild(categorySection);
    });
}

// 更新总计数
function updateTotalCount() {
    totalCountElement.textContent = bookmarks.length;
}

// 为分类选择框生成选项
function populateCategorySelect() {
    // 清空现有选项（保留第一个选项）
    bookmarkCategorySelect.innerHTML = '<option value="">选择分类</option>';

    // 获取所有分类
    const categories = [...new Set(bookmarks.map(bookmark => bookmark.category))];

    // 添加选项
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        bookmarkCategorySelect.appendChild(option);
    });

    // 添加"新建分类"选项
    const newOption = document.createElement('option');
    newOption.value = 'new';
    newOption.textContent = '+ 新建分类';
    bookmarkCategorySelect.appendChild(newOption);
}

// 设置事件监听器
function setupEventListeners() {
    // 分类按钮点击事件
    categoriesContainer.addEventListener('click', function (e) {
        if (e.target.classList.contains('category-btn')) {
            // 更新当前分类
            currentCategory = e.target.dataset.category;

            // 更新活动按钮
            document.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            e.target.classList.add('active');

            // 重新生成书签
            generateBookmarks();

            // 移动端：滚动到顶部
            if (window.innerWidth <= 768) {
                bookmarksContainer.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        }
    });

    // 搜索框输入事件 - 过滤本地书签
    searchInput.addEventListener('input', function () {
        generateBookmarks();
    });

    // 搜索框回车键事件 - 执行网页搜索
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            performWebSearch();
        }
    });

    // 添加书签按钮点击事件
    // addBookmarkBtn.addEventListener('click', openBookmarkModal);

    // 移动端添加按钮点击事件
    // mobileAddBtn.addEventListener('click', openBookmarkModal);

    // 悬浮搜索按钮点击事件
    fabSearch.addEventListener('click', function () {
        searchInput.focus();
        // 移动端键盘弹出时可能需要调整布局
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                searchInput.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }, 300);
        }
    });

    // 悬浮主题按钮点击事件
    /*
    fabTheme.addEventListener('click', function() {
    // 显示主题选择器
    document.querySelector('.theme-selector').scrollIntoView({ behavior: 'smooth' });
    });*/

    // 悬浮顶部按钮点击事件
    fabTop.addEventListener('click', function () {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // 取消按钮点击事件
    cancelBtn.addEventListener('click', function () {
        bookmarkModal.style.display = 'none';
    });

    // 模态框外部点击关闭
    bookmarkModal.addEventListener('click', function (e) {
        if (e.target === bookmarkModal) {
            bookmarkModal.style.display = 'none';
        }
    });

    // 表单提交事件
    bookmarkForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const name = document.getElementById('bookmarkName').value.trim();
        const url = document.getElementById('bookmarkUrl').value.trim();
        let category = document.getElementById('bookmarkCategory').value;
        const description = document.getElementById('bookmarkDescription').value.trim();

        // 处理新建分类
        if (category === 'new') {
            const newCategory = prompt('请输入新分类名称：');
            if (!newCategory)
                return;
            category = newCategory.trim();
        }

        // 验证URL格式
        try {
            new URL(url);
        } catch {
            alert('请输入有效的URL地址，例如：https://example.com');
            return;
        }

        if (editingBookmarkId) {
            // 更新现有书签
            const index = bookmarks.findIndex(b => b.id === editingBookmarkId);
            if (index !== -1) {
                bookmarks[index] = {
                    ...bookmarks[index],
                    name,
                    url,
                    category,
                    description
                };
            }
        } else {
            // 添加新书签
            const newId = bookmarks.length > 0 ? Math.max(...bookmarks.map(b => b.id)) + 1 : 1;
            bookmarks.push({
                id: newId,
                name,
                url,
                category,
                description
            });
        }

        // 保存到localStorage
        localStorage.setItem('personalBookmarks', JSON.stringify(bookmarks));

        // 更新UI
        updateTotalCount();
        generateCategoryButtons();
        populateCategorySelect();
        generateBookmarks();

        // 关闭模态框
        bookmarkModal.style.display = 'none';

        // 移动端：显示成功提示
        if (window.innerWidth <= 768) {
            showMobileToast(editingBookmarkId ? '收藏已更新' : '收藏已添加');
        }
    });

    // 书签操作事件委托
    bookmarksContainer.addEventListener('click', function (e) {
        const bookmarkItem = e.target.closest('.bookmark-item');
        if (!bookmarkItem)
            return;

        const bookmarkId = parseInt(bookmarkItem.dataset.id);
        const bookmark = bookmarks.find(b => b.id === bookmarkId);

        if (!bookmark)
            return;

        // 书签链接点击事件 - 增加点击次数
        if (e.target.closest('.bookmark-link')) {
            // 增加点击次数
            bookmark.clicks = (bookmark.clicks || 0) + 1;

            // 保存到localStorage
            localStorage.setItem('personalBookmarks', JSON.stringify(bookmarks));

            // 让链接正常跳转，不阻止默认行为

            // 如果需要重新排序（实时），可以取消下面的注释
            // 但由于我们只是在下次进入页面时排序，所以这里不需要重新生成
            // generateBookmarks();

            return;
        }

        // 编辑按钮点击
        if (e.target.closest('.edit-btn')) {
            editingBookmarkId = bookmarkId;
            modalTitle.textContent = '编辑收藏';

            // 填充表单
            document.getElementById('bookmarkName').value = bookmark.name;
            document.getElementById('bookmarkUrl').value = bookmark.url;
            document.getElementById('bookmarkCategory').value = bookmark.category;
            document.getElementById('bookmarkDescription').value = bookmark.description || '';

            // 显示模态框
            bookmarkModal.style.display = 'flex';
        }

        // 删除按钮点击
        if (e.target.closest('.delete-btn')) {
            if (confirm(`确定要删除 "${bookmark.name}" 吗？`)) {
                // 从数组中删除
                bookmarks = bookmarks.filter(b => b.id !== bookmarkId);

                // 保存到localStorage
                localStorage.setItem('personalBookmarks', JSON.stringify(bookmarks));

                // 更新UI
                updateTotalCount();
                generateCategoryButtons();
                populateCategorySelect();
                generateBookmarks();

                // 移动端：显示成功提示
                if (window.innerWidth <= 768) {
                    showMobileToast('收藏已删除');
                }
            }
        }
    });

    // 主题切换
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const themeId = this.id;

            // 更新活动主题按钮
            document.querySelectorAll('.theme-btn').forEach(b => {
                b.classList.remove('active');
            });
            this.classList.add('active');

            // 应用主题
            applyTheme(themeId);

            // 保存主题选择
            localStorage.setItem('bookmarkTheme', themeId);
            currentThemeMode = themeId.replace('Theme', '');
        });
    });

    // 监听键盘事件
    document.addEventListener('keydown', function (e) {
        // ESC键关闭模态框
        if (e.key === 'Escape' && bookmarkModal.style.display === 'flex') {
            bookmarkModal.style.display = 'none';
        }

        // Ctrl+F或Cmd+F聚焦搜索框
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            searchInput.focus();
        }
    });
}

// 执行网页搜索
function performWebSearch() {
    const searchTerm = searchInput.value.trim();
    if (!searchTerm) {
        searchInput.focus();
        return;
    }

    const selectedEngine = searchEngineSelect.value;
    const engine = searchEngines[selectedEngine];

    if (engine) {
        const searchUrl = engine.url + encodeURIComponent(searchTerm);
        window.location.href = searchUrl;
    }
}

// 打开书签模态框
function openBookmarkModal() {
    editingBookmarkId = null;
    modalTitle.textContent = '添加新收藏';
    bookmarkForm.reset();
    bookmarkModal.style.display = 'flex';

    // 移动端：聚焦第一个输入框
    if (window.innerWidth <= 768) {
        setTimeout(() => {
            document.getElementById('bookmarkName').focus();
        }, 300);
    }
}

// 应用主题
function applyTheme(themeId) {
    // 移除现有的主题属性
    document.documentElement.removeAttribute('data-theme');

    if (themeId === 'autoTheme') {
        // 自动主题：跟随系统
        currentThemeMode = 'auto';
        applySystemTheme();
    } else {
        // 手动选择主题
        const themeKey = themeId.replace('Theme', '');
        const theme = themes[themeKey];

        if (theme) {
            currentThemeMode = themeKey;
            // 设置data-theme属性
            if (themeKey === 'light' || themeKey === 'dark') {
                document.documentElement.setAttribute('data-theme', themeKey);
            }

            // 设置CSS变量
            Object.entries(theme).forEach(([property, value]) => {
                if (property !== 'name') {
                    document.documentElement.style.setProperty(property, value);
                }
            });
        }
    }
}

// 应用系统主题
function applySystemTheme() {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // 移除手动设置的主题属性
    document.documentElement.removeAttribute('data-theme');

    // 应用系统主题对应的CSS变量
    if (isDarkMode) {
        // 应用深色主题变量
        Object.entries(themes.dark).forEach(([property, value]) => {
            if (property !== 'name') {
                document.documentElement.style.setProperty(property, value);
            }
        });
    } else {
        // 应用浅色主题变量
        Object.entries(themes.light).forEach(([property, value]) => {
            if (property !== 'name') {
                document.documentElement.style.setProperty(property, value);
            }
        });
    }
}

// 监听系统主题变化
function watchSystemThemeChange() {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    darkModeMediaQuery.addEventListener('change', (e) => {
        // 只有在自动主题模式下才跟随系统变化
        if (currentThemeMode === 'auto') {
            applySystemTheme();
        }
    });
}

// 应用保存的主题
function applySavedTheme() {
    const savedTheme = localStorage.getItem('bookmarkTheme') || 'autoTheme';

    // 更新活动主题按钮
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.id === savedTheme) {
            btn.classList.add('active');
        }
    });

    // 应用主题
    applyTheme(savedTheme);
}

// 移动端显示提示
function showMobileToast(message) {
    // 创建提示元素
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
                position: fixed;
                bottom: 80px;
                left: 50%;
                transform: translateX(-50%);
                background-color: var(--primary-color);
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                z-index: 1000;
                font-weight: 600;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                animation: fadeInOut 2s ease-in-out;
            `;

    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; bottom: 60px; }
                    10% { opacity: 1; bottom: 80px; }
                    90% { opacity: 1; bottom: 80px; }
                    100% { opacity: 0; bottom: 100px; }
                }
            `;
    document.head.appendChild(style);

    document.body.appendChild(toast);

    // 2秒后移除提示
    setTimeout(() => {
        document.body.removeChild(toast);
        document.head.removeChild(style);
    }, 2000);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initPage);
