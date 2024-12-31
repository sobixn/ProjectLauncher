document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded');

    // UI 요소
    const loginButton = document.getElementById('msLoginBtn');
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

    let isLoggingIn = false;

    const saveAccountInfo = async (accountInfo) => {
    try {
        const data = {
            username: accountInfo.username,
            uuid: accountInfo.uuid,
            accessToken: accountInfo.accessToken,
            clientToken: accountInfo.clientToken,
            timestamp: Date.now()
        };

        console.log('[Account Save] Preparing account data:', data);
        // 직접 객체 전달
        const saveResult = await window.electron.ipcRenderer.invoke('save-account-info', data);

        if (saveResult.success) {
            localStorage.setItem('username', accountInfo.username);
            localStorage.setItem('uuid', accountInfo.uuid);
            localStorage.setItem('accessToken', accountInfo.accessToken);
            localStorage.setItem('clientToken', accountInfo.clientToken);

            console.log(`[Account Save] Successfully saved account info for: ${accountInfo.username}`);
            return true;
        } else {
            throw new Error(saveResult.error || 'Unknown error during account save');
        }
    } catch (error) {
        console.error('Save account error:', error);
        return false;
    }
};

    const handleLogin = async () => {
        if (isLoggingIn) return;
    
        try {
            isLoggingIn = true;
            loginButton.disabled = true;
            loginButton.textContent = 'Microsoft 계정 인증 중...';
    
            const result = await window.electron.ipcRenderer.invoke('ms-login');
            console.log('[Login] Raw login result:', result);
    
            // result.data가 있는 경우 사용, 없으면 result 직접 사용
            const accountData = result.data || result;
            console.log('[Login] Account data check:', accountData);
    
            // 계정 정보 저장
            const saveResult = await window.electron.ipcRenderer.invoke('save-account-info', accountData);
            console.log('[Login] Save result:', saveResult);
    
            if (!saveResult.success) {
                throw new Error(saveResult.error || '계정 정보 저장 실패');
            }
    
            loginButton.textContent = `환영합니다, ${accountData.username}님!`;
            await sleep(1000);
            await window.electron.ipcRenderer.invoke('navigate', 'main');
    
        } catch (error) {
            console.error('[Login] Error:', error);
            loginButton.textContent = '로그인 실패';
            setTimeout(() => {
                loginButton.textContent = '마이크로소프트 계정으로 로그인';
                loginButton.disabled = false;
            }, 3000);
        } finally {
            isLoggingIn = false;
            loginButton.disabled = false;
        }
    };

    loginButton.addEventListener('click', handleLogin);

    loginButton.disabled = false;
});

const loadProfile = async () => {
    const profile = await window.electron.ipcRenderer.invoke('get-profile');
    if (profile) {
        playerName.textContent = profile.username || '플레이어';
        skinPreview.src = profile.uuid 
            ? `https://crafatar.com/avatars/${profile.uuid}?overlay=true`
            : 'default-skin.png';
    } else {
        playerName.textContent = '플레이어';
        skinPreview.src = 'default-skin.png';
    }

    // 디버그 로그 추가
    console.log('[Profile] Loaded profile:', profile);
};

loadProfile();