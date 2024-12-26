document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');

    // UI 요소
    const loginButton = document.getElementById('msLoginBtn');
    console.log('Login button:', loginButton);

    if (!loginButton) {
        console.error('Login button not found! Check if msLoginBtn ID exists in HTML');
        return;
    }

    const container = document.querySelector('.container');
    if (container) {
        container.style.opacity = '0';
        requestAnimationFrame(() => {
            container.style.opacity = '1';
        });
    }

    // 로그인 상태 관리
    let isLoggingIn = false;

    // 로그인 버튼 이벤트
    loginButton.addEventListener('click', async () => {
        console.log('Login button clicked');
        if (isLoggingIn) return;

        try {
            isLoggingIn = true;
            loginButton.disabled = true;
            loginButton.textContent = 'Microsoft 계정 인증 중...';
            
            const result = await window.electron.ipcRenderer.invoke('ms-login');
            window.electron.log.info('Login attempt result:', result);

            if (result.success) {
                // 로그인 정보 저장
                localStorage.setItem('username', result.username);
                localStorage.setItem('uuid', result.uuid);
                localStorage.setItem('accessToken', result.accessToken);

                loginButton.textContent = `환영합니다, ${result.username}님!`;
                await sleep(1000);
                await window.electron.ipcRenderer.invoke('navigate', 'main');
            } else {
                window.electron.log.error(`Login failed: ${result.error || '알 수 없는 오류'}`);
                throw new Error(result.error || '로그인 실패');
            }

        } catch (error) {
            window.electron.log.error('Login error:', error.message);
            loginButton.textContent = '로그인 실패';
            
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = error.message;
            loginButton.parentNode.appendChild(errorMessage);

            await sleep(3000);
            errorMessage.remove();
            loginButton.textContent = '마이크로소프트 계정으로 로그인';

        } finally {
            isLoggingIn = false;
            loginButton.disabled = false;
        }
    });

    // 로그인 버튼 호버 효과
    loginButton.addEventListener('mouseenter', () => {
        loginButton.style.backgroundColor = '#106ebe';
    });

    loginButton.addEventListener('mouseleave', () => {
        loginButton.style.backgroundColor = '#0078d4';
    });

    // 드래그 가능한 영역 설정
    const dragArea = document.querySelector('.title');
    if (dragArea) {
        dragArea.style.webkitAppRegion = 'drag';
    }

    // 창 컨트롤 버튼 이벤트
    const minimizeBtn = document.getElementById('minimizeBtn');
    const closeBtn = document.getElementById('closeBtn');

    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', () => {
            window.electron.ipcRenderer.invoke('window-control', 'minimize');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            window.electron.ipcRenderer.invoke('window-control', 'close');
        });
    }
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));