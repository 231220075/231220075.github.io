/**
 * 子域名重定向处理器
 * 将子域名访问重定向到主域名对应页面
 */

(function() {
    'use strict';
    
    const hostname = window.location.hostname;
    const mainDomain = 'summer-flower.com';
    
    // 如果是子域名访问，重定向到主域名
    if (hostname !== mainDomain && hostname.endsWith('.' + mainDomain)) {
        const subdomain = hostname.split('.')[0];
        
        // 定义子域名对应的路径
        const subdomainPaths = {
            'blog': '/',
            'games': '/games/',
            'music': '/music/',
            'movies': '/movies/',
            'photos': '/photos-gallery/',
            'dev': '/categories/技术分享/',
            'api': '/categories/技术学习/'
        };
        
        // 获取目标路径
        const targetPath = subdomainPaths[subdomain] || '/';
        
        // 构建重定向URL
        const redirectUrl = 'http://' + mainDomain + targetPath;
        
        // 显示重定向提示
        document.body.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                height: 100vh;
                font-family: Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-align: center;
                margin: 0;
                padding: 20px;
            ">
                <h1 style="font-size: 2.5em; margin-bottom: 20px;">🚀 正在跳转...</h1>
                <p style="font-size: 1.2em; margin-bottom: 30px;">
                    从 <strong>${subdomain}.${mainDomain}</strong> 跳转到主站
                </p>
                <p style="font-size: 1em; opacity: 0.9;">
                    如果没有自动跳转，请点击下方链接：
                </p>
                <a href="${redirectUrl}" style="
                    display: inline-block;
                    padding: 15px 30px;
                    background: rgba(255,255,255,0.2);
                    color: white;
                    text-decoration: none;
                    border-radius: 30px;
                    border: 2px solid rgba(255,255,255,0.3);
                    transition: all 0.3s ease;
                    margin-top: 20px;
                " onmouseover="this.style.background='rgba(255,255,255,0.3)'"
                   onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                    进入主站 →
                </a>
            </div>
        `;
        
        // 3秒后自动跳转
        setTimeout(function() {
            window.location.href = redirectUrl;
        }, 3000);
        
        return;
    }
})();
