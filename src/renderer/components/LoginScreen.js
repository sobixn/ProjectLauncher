const { shell } = require('electron');
const Store = require('electron-store');
const log = require('electron-log');
const path = require('path');
const msmc = require("msmc");

class LoginScreen {
    constructor() {
        try {
            log.info('5. LoginScreen constructor starting');
            this.store = new Store();
            
            this.container = document.querySelector('#login');
            log.info('Initial container state:', {
                exists: !!this.container,
                display: this.container?.style.display,
                innerHTML: this.container?.innerHTML
            });
            
            if (!this.container) {
                throw new Error('Login container not found in LoginScreen');
            }

            // SVG 파일 경로로 변경
            this.msLogoPath = '../../../assets/Microsoft_logo.svg';
            
            log.info('6. Starting initialize');
            this.initialize();
        } catch (error) {
            log.error('LoginScreen constructor error:', error);
            throw error; // 에러를 다시 던져서 LoadingBootstrap에서 처리할 수 있게 함
        }
    }

    initialize() {
        try {
            log.info('7. Initialize started');
            
            // 초기화 전 컨테이너 상태 확인
            log.info('Container before initialization:', {
                display: this.container.style.display,
                visibility: this.container.style.visibility,
                opacity: this.container.style.opacity
            });

            this.render();
            this.applyStyles();
            
            log.info('9. Initialization complete');
        } catch (error) {
            log.error('Initialize error:', error);
            throw error;
        }
    }

    render() {
        try {
            this.container.innerHTML = `
                <div class="login-container">
                    <div class="login-box">
                        <button id="ms-login-btn" class="login-button">
                            <img src="${this.msLogoPath}" alt="Microsoft" class="ms-icon">
                            <span>Microsoft로 로그인</span>
                        </button>
                    </div>
                </div>
            `;
            log.info('8. HTML rendered');
        } catch (error) {
            log.error('Render error:', error);
            throw error;
        }
    }

    applyStyles() {
        const style = document.createElement('style');
        style.textContent = `
            body {
                margin: 0;
                padding: 0;
            }

            .login-container {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                width: 100vw;
                background-color: #f5f5f5;
                position: fixed;
                top: 0;
                left: 0;
            }

            .login-box {
                display: flex;
                justify-content: center;
                align-items: center;
                background: transparent;
                padding: 2rem;
                width: 300px;
            }

            .login-button {
                background: #0078d4;
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 4px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                width: 220px;
                height: 40px;
            }

            .ms-icon {
                width: 18px;
                height: 18px;
                margin-right: 4px;
            }

            .login-button:hover {
                background: #106ebe;
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            .login-button:active {
                background: #005a9e;
                transform: translateY(0);
            }
        `;
        document.head.appendChild(style);
    }

    async handleLogin() {
        try {
            // msmc 인증 처리
            const xboxManager = new msmc.Authflow();
            
            // 마이크로소프트 로그인 실행
            const result = await xboxManager.launch("raw");
            
            if (msmc.errorCheck(result)) {
                throw new Error(result.reason);
            }

            // 인증 성공, 데이터 저장
            this.store.set('auth', {
                accessToken: result.access_token,
                username: result.profile.name,
                uuid: result.profile.id,
                msa: true,
                timestamp: Date.now()
            });

            log.info('Login successful:', result.profile.name);

            // 메인 화면으로 전환
            this.container.style.display = 'none';
            document.getElementById('main').style.display = 'block';

        } catch (error) {
            log.error('Login failed:', error);
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = '로그인 실패: ' + error.message;
            this.container.appendChild(errorDiv);
        }
    }
}

module.exports = LoginScreen;