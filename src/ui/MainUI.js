document.addEventListener('DOMContentLoaded', async () => {
    // 페이드인 효과
    const container = document.querySelector('.container');
    if (container) {
        container.style.opacity = '0';
        requestAnimationFrame(() => {
            container.style.opacity = '1';
        });
    }

    // path 모듈 로드를 위해 preload.js를 통해 노출된 API 사용
    const path = window.electron.path; // preload.js에서 path 모듈 추가 필요

    const playButton = document.getElementById('playButton');
    const playerName = document.getElementById('playerName');
    const skinPreview = document.getElementById('skinPreview');
    let isLaunching = false;

    playButton.addEventListener('click', async () => {
        if (isLaunching) return;

        try {
            isLaunching = true;
            playButton.disabled = true;
            window.electron.log.info('Starting game launch...');
            playButton.textContent = 'Checking game files...';

            // 게임 경로를 먼저 가져옵니다
            const gamePath = await window.electron.getGamePath();
            if (!gamePath) {
                throw new Error('Game path is not available');
            }

            // path.join을 window.electron.path.join으로 사용
            const instancePath = window.electron.path.join(gamePath, 'instances', 'Project_vir');

            const options = {
                authorization: {
                    access_token: localStorage.getItem('accessToken'),
                    client_token: localStorage.getItem('clientToken'),
                    uuid: localStorage.getItem('uuid'),
                    name: localStorage.getItem('username')
                },
                root: gamePath,
                gameDir: instancePath, // 게임 데이터 저장 경로
                version: {
                    number: "1.21.1",
                    type: "release"
                },
                forge: false, // Forge 설정 변경
                memory: {
                    max: "4G",
                    min: "2G"
                },
                overrides: {
                    detached: false
                },
                javaPath: null // Java 자동 감지
            };

            window.electron.log.info('Launch options:', options);
            const result = await window.electron.ipcRenderer.invoke('launchMinecraft', options);
            window.electron.log.info('Launch result:', result);

            if (!result) {
                throw new Error('Launch failed - no response');
            }

            if (!result.success) {
                throw new Error(result.error || 'Unknown launch error');
            }

            playButton.textContent = 'Game launched successfully';
            await new Promise(resolve => setTimeout(resolve, 1000));
            await window.electron.ipcRenderer.invoke('minimize-window');

        } catch (error) {
            window.electron.log.error('Launch error:', error);
            playButton.textContent = '실행 실패';
            alert(error.message);
        } finally {
            setTimeout(() => {
                isLaunching = false;
                playButton.disabled = false;
                playButton.textContent = '플레이';
            }, 3000);
        }
    });

    // 프로필 정보 로드
    const loadProfile = async () => {
        try {
            console.log('[Profile] Loading profile...');
            const profile = await window.electron.ipcRenderer.invoke('get-profile');
            console.log('[Profile] Profile data received:', profile);

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
        } catch (error) {
            console.error('[Profile] Load error:', error);
        }
    };

    loadProfile();
});