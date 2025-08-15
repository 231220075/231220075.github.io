/**
 * 子域名处理器
 * 根据不同的子域名提供不同的体验
 */

(function() {
    'use strict';
    
    // 获取当前域名信息
    const hostname = window.location.hostname;
    const pathArray = hostname.split('.');
    const subdomain = pathArray.length > 2 ? pathArray[0] : '';
    
    console.log('当前子域名:', subdomain);
    
    // 如果是根域名，不做任何处理
    if (!subdomain || subdomain === 'www') {
        return;
    }
    
    // 定义不同子域名的处理逻辑
    const subdomainConfig = {
        'blog': {
            title: '博客 - Summer Flower',
            description: '专注于技术分享和学习记录',
            redirect: '/',
            style: 'blog'
        },
        'photos': {
            title: '照片集 - Summer Flower', 
            description: '记录生活中的美好瞬间',
            redirect: '/photos-gallery/',
            style: 'photos'
        },
        'music': {
            title: '音乐空间 - Summer Flower',
            description: '分享好听的音乐',
            redirect: '/music/',
            style: 'music'
        },
        'movies': {
            title: '电影天地 - Summer Flower',
            description: '电影推荐和观后感',
            redirect: '/movies/',
            style: 'movies'
        },
        'games': {
            title: '游戏世界 - Summer Flower',
            description: '游戏相关内容',
            redirect: '/games/',
            style: 'games'
        },
        'dev': {
            title: '开发环境 - Summer Flower',
            description: '开发和测试专用',
            redirect: '/',
            style: 'dev'
        },
        'api': {
            title: 'API文档 - Summer Flower',
            description: '技术API文档',
            redirect: '/',
            style: 'api'
        }
    };
    
    // 获取当前子域名的配置
    const config = subdomainConfig[subdomain];
    
    if (config) {
        // 更新页面标题和描述
        updatePageMeta(config);
        
        // 添加子域名样式
        addSubdomainStyle(config.style);
        
        // 添加子域名标识
        addSubdomainBanner(subdomain, config);
        
        // 如果有重定向配置且当前不在目标页面，则重定向
        if (config.redirect && window.location.pathname === '/') {
            setTimeout(() => {
                window.location.href = config.redirect;
            }, 1000);
        }
    } else {
        // 未知的子域名，显示通用提示
        addUnknownSubdomainBanner(subdomain);
    }
    
    /**
     * 更新页面元信息
     */
    function updatePageMeta(config) {
        // 更新标题
        document.title = config.title;
        
        // 更新描述
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', config.description);
        } else {
            const meta = document.createElement('meta');
            meta.name = 'description';
            meta.content = config.description;
            document.head.appendChild(meta);
        }
    }
    
    /**
     * 添加子域名样式
     */
    function addSubdomainStyle(style) {
        const body = document.body;
        body.classList.add(`subdomain-${style}`);
        
        // 添加自定义CSS
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .subdomain-banner {
                background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 10px 20px;
                text-align: center;
                font-size: 14px;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 9999;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .subdomain-${style} {
                margin-top: 50px;
            }
            
            .subdomain-banner a {
                color: #ffeb3b;
                text-decoration: none;
                margin-left: 10px;
            }
            
            .subdomain-banner a:hover {
                text-decoration: underline;
            }
            
            .subdomain-photos .subdomain-banner {
                background: linear-gradient(45deg, #ff9a9e 0%, #fecfef 100%);
            }
            
            .subdomain-music .subdomain-banner {
                background: linear-gradient(45deg, #a8edea 0%, #fed6e3 100%);
            }
            
            .subdomain-movies .subdomain-banner {
                background: linear-gradient(45deg, #d299c2 0%, #fef9d7 100%);
            }
            
            .subdomain-games .subdomain-banner {
                background: linear-gradient(45deg, #89f7fe 0%, #66a6ff 100%);
            }
            
            .subdomain-dev .subdomain-banner {
                background: linear-gradient(45deg, #fc466b 0%, #3f5efb 100%);
            }
            
            .subdomain-api .subdomain-banner {
                background: linear-gradient(45deg, #fdbb2d 0%, #22c1c3 100%);
            }
        `;
        document.head.appendChild(styleElement);
    }
    
    /**
     * 添加子域名横幅
     */
    function addSubdomainBanner(subdomain, config) {
        const banner = document.createElement('div');
        banner.className = 'subdomain-banner';
        banner.innerHTML = `
            <span>🌟 您正在访问 <strong>${subdomain}.summer-flower.com</strong> - ${config.description}</span>
            <a href="https://summer-flower.com">← 返回主站</a>
        `;
        
        document.body.insertBefore(banner, document.body.firstChild);
    }
    
    /**
     * 添加未知子域名横幅
     */
    function addUnknownSubdomainBanner(subdomain) {
        const banner = document.createElement('div');
        banner.className = 'subdomain-banner';
        banner.style.background = 'linear-gradient(45deg, #ff6b6b 0%, #ee5a24 100%)';
        banner.innerHTML = `
            <span>⚠️ 未知的子域名: <strong>${subdomain}.summer-flower.com</strong></span>
            <a href="https://summer-flower.com">← 返回主站</a>
        `;
        
        document.body.insertBefore(banner, document.body.firstChild);
    }
    
})();
