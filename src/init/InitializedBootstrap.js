document.addEventListener('DOMContentLoaded', async () => {
    const progressBar = document.getElementById('progressBar');
    const loadingText = document.getElementById('loadingText');
    const spinner = document.getElementById('spinner');

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const updateProgress = async (startValue, endValue, text, duration = 1000) => {
        const steps = 20;
        const stepDuration = duration / steps;
        const valueIncrement = (endValue - startValue) / steps;

        for (let i = 0; i <= steps; i++) {
            const currentValue = startValue + (valueIncrement * i);
            progressBar.style.width = `${currentValue}%`;
            if (i === 0) loadingText.textContent = text;
            await sleep(stepDuration);
        }
    };

    const initSequence = async () => {
        try {
            // 초기 상태
            await updateProgress(0, 10, '런처를 초기화하는 중...', 800);
            
            // 1. Java 시스템 확인
            await updateProgress(10, 30, '자바 확인 중...', 1500);
            const javaCheck = await window.electron.checkJavaEnvironment();
            if (!javaCheck.exists) {
                await updateProgress(30, 30, '자바가 설치되어 있지 않습니다.', 0);
                return;
            }

            // 2. 무결성 검사
            await updateProgress(30, 60, '무결성 체크 중...', 2000);
            const integrityCheck = await window.electron.checkIntegrity();
            if (!integrityCheck.success) {
                await updateProgress(60, 60, '파일 무결성 검사 실패', 0);
                return;
            }

            // 3. 런처 검사
            await updateProgress(60, 90, '런처 검사 중...', 1500);
            const launcherCheck = await window.electron.checkLauncher();
            if (!launcherCheck.success) {
                await updateProgress(90, 90, '런처 검사 실패', 0);
                return;
            }

            // 완료
            await updateProgress(90, 100, '초기화 완료', 1000);
            progressBar.classList.remove('loading');
            
            // 로그인 상태 확인
            const isLoggedIn = await window.electron.checkLoginStatus();
            if (!isLoggedIn) {
                await sleep(500);
                const container = document.querySelector('.container');
                container.classList.add('fade-out');
                await sleep(500);
                window.electron.ipcRenderer.invoke('navigate', 'login');
            }

        } catch (error) {
            await updateProgress(0, 0, `초기화 실패: ${error.message}`, 0);
        }
    };

    initSequence();
});