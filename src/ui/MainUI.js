document.addEventListener('DOMContentLoaded', () => {
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

            const options = {
                clientPackage: null,
                authorization: {
                    access_token: localStorage.getItem('accessToken'),
                    client_token: localStorage.getItem('clientToken'),
                    uuid: localStorage.getItem('uuid'),
                    name: localStorage.getItem('username')
                },
                root: "./minecraft",
                version: {
                    number: "1.21.1",
                    type: "Project_vir"
                },
                memory: {
                    max: "4G",
                    min: "2G"
                },
                hideConsole: true,
                detached: true,
                customArgs: [
                    "-Xmx4G",
                    "-Xms2G",
                    "-XX:+UseG1GC",
                    "-XX:+ParallelRefProcEnabled",
                    "-XX:MaxGCPauseMillis=200",
                    "-XX:+UnlockExperimentalVMOptions",
                    "-XX:+DisableExplicitGC",
                    "-XX:+AlwaysPreTouch",
                    "-XX:G1NewSizePercent=30",
                    "-XX:G1MaxNewSizePercent=40",
                    "-XX:G1HeapRegionSize=8M",
                    "-XX:G1ReservePercent=20",
                    "-XX:G1HeapWastePercent=5",
                    "-XX:G1MixedGCCountTarget=4",
                    "-XX:InitiatingHeapOccupancyPercent=15",
                    "-XX:G1MixedGCLiveThresholdPercent=90",
                    "-XX:G1RSetUpdatingPauseTimePercent=5",
                    "-XX:SurvivorRatio=32",
                    "-XX:+PerfDisableSharedMem",
                    "-XX:MaxTenuringThreshold=1",
                    "-Dusing.aikars.flags=https://mcflags.emc.gs",
                    "-Daikars.new.flags=true",
                    "-Djava.awt.headless=false"
                ]
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
    const loadProfile = () => {
        const username = localStorage.getItem('username') || '플레이어';
        playerName.textContent = username;
        
        // 스킨 프리뷰 로드
        const uuid = localStorage.getItem('uuid');
        if (uuid) {
            skinPreview.src = `https://crafatar.com/avatars/${uuid}?overlay=true`;
        }
    };

    loadProfile();
});