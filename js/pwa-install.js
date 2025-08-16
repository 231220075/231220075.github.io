// PWA安装按钮
(function() {
    'use strict';
    
    let deferredPrompt;
    let installButton;
    
    // 创建安装按钮
    function createInstallButton() {
        const button = document.createElement('button');
        button.id = 'pwa-install-btn';
        button.innerHTML = `
            <i class="fas fa-download"></i>
            <span>安装APP</span>
        `;
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 50px;
            padding: 12px 20px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: inherit;
            opacity: 0;
            transform: translateY(100px);
            animation: slideUp 0.5s ease forwards;
        `;
        
        // 添加悬浮效果
        button.onmouseenter = () => {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
        };
        
        button.onmouseleave = () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
        };
        
        return button;
    }
    
    // 添加动画样式
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideUp {
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            
            #pwa-install-btn.pulse {
                animation: pulse 2s infinite;
            }
            
            @media (max-width: 768px) {
                #pwa-install-btn {
                    bottom: 15px;
                    right: 15px;
                    padding: 10px 16px;
                    font-size: 13px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 显示安装按钮
    function showInstallButton() {
        if (installButton) return;
        
        addStyles();
        installButton = createInstallButton();
        document.body.appendChild(installButton);
        
        // 添加脉搏动画
        setTimeout(() => {
            installButton.classList.add('pulse');
        }, 1000);
        
        // 点击安装
        installButton.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                
                if (outcome === 'accepted') {
                    console.log('用户接受了安装');
                    hideInstallButton();
                }
                deferredPrompt = null;
            } else {
                // 手动安装提示
                showManualInstallTip();
            }
        });
    }
    
    // 隐藏安装按钮
    function hideInstallButton() {
        if (installButton) {
            installButton.style.animation = 'slideDown 0.3s ease forwards';
            setTimeout(() => {
                installButton.remove();
                installButton = null;
            }, 300);
        }
    }
    
    // 手动安装提示
    function showManualInstallTip() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        
        let message = '';
        if (isIOS) {
            message = '在Safari中点击分享按钮 📤，然后选择"添加到主屏幕"';
        } else if (isAndroid) {
            message = '点击浏览器菜单，选择"安装应用"或"添加到主屏幕"';
        } else {
            message = '请使用支持PWA的浏览器（Chrome、Edge、Safari等）访问';
        }
        
        showNotification(message, 5000);
    }
    
    // 显示通知
    function showNotification(message, duration = 3000) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10000;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 14px;
            max-width: 90%;
            text-align: center;
            backdrop-filter: blur(10px);
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => notification.style.opacity = '1', 100);
        
        // 自动消失
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
    
    // 检查是否已安装
    function checkIfInstalled() {
        // 检查是否在PWA模式下运行
        if (window.matchMedia('(display-mode: standalone)').matches || 
            window.navigator.standalone === true) {
            return true;
        }
        
        // 检查localStorage
        return localStorage.getItem('pwa-installed') === 'true';
    }
    
    // 监听PWA安装事件
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        if (!checkIfInstalled()) {
            // 延迟显示，让用户先浏览一下网站
            setTimeout(showInstallButton, 3000);
        }
    });
    
    // 监听安装完成事件
    window.addEventListener('appinstalled', () => {
        console.log('PWA安装成功！');
        localStorage.setItem('pwa-installed', 'true');
        hideInstallButton();
        showNotification('🎉 安装成功！现在可以从桌面快速访问了');
    });
    
    // 页面加载完成后检查
    document.addEventListener('DOMContentLoaded', () => {
        // 如果没有安装提示事件，且未安装，显示按钮
        if (!deferredPrompt && !checkIfInstalled()) {
            setTimeout(() => {
                // 只在移动设备或支持PWA的桌面浏览器显示
                if (window.innerWidth <= 768 || 'serviceWorker' in navigator) {
                    showInstallButton();
                }
            }, 5000);
        }
    });
    
    // 添加slideDown动画
    const slideDownStyle = document.createElement('style');
    slideDownStyle.textContent = `
        @keyframes slideDown {
            to {
                opacity: 0;
                transform: translateY(100px);
            }
        }
    `;
    document.head.appendChild(slideDownStyle);
})();
