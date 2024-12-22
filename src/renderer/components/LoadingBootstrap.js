const LoginScreen = require('./LoginScreen');
const log = require("electron-log");

class LoadingBootstrap {
    constructor() {
        log.info('LoadingBootstrap initialized'); // 디버깅용
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        log.info('LoadingBootstrap init'); // 디버깅용
        this.container = document.getElementById('loading');
        if (!this.container) {
            console.error('Loading container not found'); // 디버깅용
            return;
        }

        this.progress = 0;
        this.container.style.display = 'flex';
        this.container.style.position = 'fixed';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.container.style.justifyContent = 'center';
        this.container.style.alignItems = 'center';
        this.container.style.zIndex = '1000';

        document.getElementById('login').style.display = 'none';
        this.initialize();
    }

    initialize() {
        this.container.innerHTML = `
            <div class="loading-container" style="text-align: center;">
                <div class="loading-circle" style="width: 100px; height: 100px; position: relative; margin: 0 auto;">
                    <div class="fill" style="position: absolute; bottom: 0; left: 0; width: 100%; background-color: #3498db; transition: height 0.2s;"></div>
                    <div class="percentage" style="position: absolute; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #333333;">0%</div>
                </div>
                <div class="loading-text" style="color: #333333; margin-top: 20px;">초기화 중...</div>
            </div>
        `;
        setTimeout(() => {
            this.startLoading();
        }, 500);
    }

    startLoading() {
        const interval = setInterval(() => {
            if (this.progress >= 100) {
                clearInterval(interval);
                this.onLoadComplete();
                return;
            }
            this.progress += 2; // 속도 5배 증가
            this.updateProgress();
        }, 15); // 인터벌 시간 10ms로 감소
    }

    updateProgress() {
        const fill = this.container.querySelector('.fill');
        const percentage = this.container.querySelector('.percentage');
        if (fill && percentage) {
            fill.style.height = `${this.progress}%`;
            percentage.textContent = `${this.progress}%`;
        }
    }

    onLoadComplete() {
        log.info('1. Loading Complete');
        if (!this.container) return;
        
        this.container.classList.add('fade-out');
        setTimeout(() => {
            log.info('2. Loading fadeout done');
            this.container.style.display = 'none';
            
            const loginContainer = document.getElementById('login');
            if (!loginContainer) {
                log.error('Login container not found!');
                return;
            }
            
            log.info('3. Found login container');
            loginContainer.style.opacity = '0';
            loginContainer.style.display = 'flex';
            
            log.info('4. Creating LoginScreen');
            try {
                const loginScreen = new LoginScreen();
                loginContainer.style.opacity = '1';
            } catch (error) {
                log.error('Failed to create LoginScreen:', error);
            }
        }, 300);
    }
}

module.exports = LoadingBootstrap;