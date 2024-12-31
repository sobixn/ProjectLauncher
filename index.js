const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const log = require('electron-log');
const fs = require('fs');
const msmc = require('msmc');  // msmc 모듈 추가
const MicrosoftAuth = require('./src/security/MicrosoftAuth');
const AccountManager = require('./src/security/AccountManager');
const AutoLogin = require('./src/security/AutoLogin');

// 로그 디렉토리 설정
const LAUNCHER_LOG_DIR = path.join(process.env.APPDATA, '.project-vir', 'logs', 'launcher');
const GAME_LOG_DIR = path.join(process.env.APPDATA, '.project-vir', 'logs', 'game');

// 로그 디렉토리 생성
if (!fs.existsSync(LAUNCHER_LOG_DIR)) {
    fs.mkdirSync(LAUNCHER_LOG_DIR, { recursive: true });
}
if (!fs.existsSync(GAME_LOG_DIR)) {
    fs.mkdirSync(GAME_LOG_DIR, { recursive: true });
}

// 런처 로그 설정
log.catchErrors();
log.variables.processType = 'launcher';

// 런처 메인 로그
const mainLog = log.create('main');
mainLog.transports.file.resolvePath = () => path.join(LAUNCHER_LOG_DIR, 'launcher_main.log');
mainLog.transports.file.level = 'info';

// 런처 디버그 로그
const debugLog = log.create('debug');
debugLog.transports.file.resolvePath = () => path.join(LAUNCHER_LOG_DIR, 'launcher_debug.log');
debugLog.transports.file.level = 'debug';

// 게임 로그 설정
const gameLog = log.create('game');
gameLog.transports.file.resolvePath = () => path.join(GAME_LOG_DIR, 'game_main.log');
gameLog.transports.file.level = 'info';

global.log = {
    main: mainLog,
    debug: debugLog,
    game: gameLog
};

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        frame: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'src/preload.js'),
            devTools: false
        }
    });

    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F12') {
            event.preventDefault();
        }
    });

    mainWindow.setMenu(null);
    mainWindow.loadFile(path.join(__dirname, 'src/init/InitializedBootstrap.html'));
}

app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        log.info('All windows closed, quitting app');
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.handle('update-progress', async (event, { value, text }) => {
    log.info(`Progress Update: ${value}% - ${text}`);
    return true;
});

ipcMain.handle('check-filesystem', async () => {
    log.info('Checking file system');
    return new Promise(resolve => setTimeout(resolve, 1000));
});

ipcMain.handle('check-java', async () => {
    log.info('Checking Java');
    return new Promise(resolve => setTimeout(resolve, 1500));
});

ipcMain.handle('check-updates', async () => {
    log.info('Checking updates');
    return new Promise(resolve => setTimeout(resolve, 1000));
});

ipcMain.handle('check-integrity', async () => {
    log.info('Checking file integrity');
    return { success: true };
});

ipcMain.handle('check-launcher', async () => {
    log.info('Checking launcher');
    return { success: true };
});

ipcMain.handle('check-login-status', async () => {
    log.info('Checking login status');
    try {
        return false;
    } catch (error) {
        log.error('Login status check failed:', error);
        return false;
    }
});

ipcMain.handle('navigate', async (event, page) => {
    log.info(`Navigating to ${page}`);
    try {
        // AutoLogin을 생성자로 호출하지 않고 직접 사용
        const autoLoginResult = await AutoLogin.checkAndAutoLogin();
        
        if (autoLoginResult.success) {
            log.info('[Navigation] Auto login successful, redirecting to main');
            mainWindow.loadFile(path.join(__dirname, 'src/ui/Main.html'));
            return true;
        }

        // 자동 로그인 실패시 일반 네비게이션
        switch (page) {
            case 'login':
                mainWindow.loadFile(path.join(__dirname, 'src/ui/Login.html'));
                break;
            case 'main':
                mainWindow.loadFile(path.join(__dirname, 'src/ui/Main.html'));
                break;
            default:
                mainWindow.loadFile(path.join(__dirname, 'src/init/InitializedBootstrap.html'));
        }
        return true;
    } catch (error) {
        log.error('Navigation failed:', error);
        return false;
    }
});

// Microsoft 로그인 핸들러
ipcMain.handle('ms-login', async () => {
    try {
        log.info('[Auth] Starting Microsoft login...');
        const result = await MicrosoftAuth.authenticate();
        
        log.info('[Auth] Login result:', result);

        if (!result.success) {
            throw new Error(result.error || 'Authentication failed');
        }

        return {
            success: true,
            data: result.data
        };
    } catch (error) {
        log.error('[Auth] Microsoft login error:', error);
        return {
            success: false,
            error: error.message || 'Microsoft 로그인 실패'
        };
    }
});

const downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(true);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {
                reject(err);
            });
        });
    });
};

ipcMain.handle('downloadJava', async (event, url) => {
    const javaInstaller = path.join(app.getPath('temp'), 'jdk-17_windows-x64_bin.exe');
    try {
        await downloadFile(url, javaInstaller);
        return { success: true, path: javaInstaller };
    } catch (error) {
        log.error('Java download failed:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('installJava', async () => {
    return new Promise((resolve, reject) => {
        const javaInstaller = path.join(app.getPath('temp'), 'jdk-17_windows-x64_bin.exe');
        exec(`${javaInstaller} /s`, (error) => {
            if (error) reject(error);
            else resolve(true);
        });
    });
});

ipcMain.handle('launchMinecraft', async (event, options) => {
    try {
        log.info('Launching Minecraft with options:', options);
        const launcher = new Client();

        launcher.on('debug', (e) => log.info('Debug:', e));
        launcher.on('data', (e) => log.info('Data:', e));
        launcher.on('error', (e) => log.error('Error:', e));

        await launcher.launch(options);

        log.info('Game launched successfully');
        return { success: true };
    } catch (error) {
        log.error('Launch error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('save-account-info', async (event, accountData) => {
    try {
        log.info('[Account Save] Attempting to save account info...');
        
        if (!accountData || typeof accountData !== 'object') {
            throw new Error('Invalid account data format');
        }

        const result = await AccountManager.save(accountData);
        log.info('[Account Save] Save result:', result);
        return result;
    } catch (error) {
        log.error('[Account Save] Error:', error);
        return { 
            success: false, 
            error: error.message 
        };
    }
});

ipcMain.handle('load-account-info', async () => {
    try {
        const gamePath = path.join(process.env.APPDATA, '.project-vir');
        const accountFile = path.join(gamePath, 'account', 'launcher-project.json');

        if (fs.existsSync(accountFile)) {
            const jsonData = fs.readFileSync(accountFile, 'utf8');
            const data = JSON.parse(jsonData);

            if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
                fs.unlinkSync(accountFile);
                return { success: false };
            }

            return { success: true, data };
        }

        return { success: false, error: 'No account data found' };
    } catch (error) {
        log.error('Failed to load account info:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('minimize-window', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
        log.info('Minimizing launcher window');
        win.minimize();
        return true;
    }
    return false;
});

ipcMain.handle('get-game-path', () => {
    return path.join(app.getPath('appData'), '.project-vir');
});

ipcMain.handle('patch-client-ui', async (event, uiConfig) => {
    try {
        const gamePath = path.join(app.getPath('appData'), '.project-vir');
        const assetsPath = path.join(gamePath, 'assets');

        if (!fs.existsSync(assetsPath)) {
            fs.mkdirSync(assetsPath, { recursive: true });
        }

        fs.writeFileSync(
            path.join(gamePath, 'ui-config.json'),
            JSON.stringify(uiConfig, null, 2)
        );

        return { success: true };
    } catch (error) {
        console.error('UI patch error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-profile', async () => {
    try {
        log.info('[Profile] Loading profile...');
        const profile = await AccountManager.getProfile();
        log.info('[Profile] Profile data:', profile);
        return profile;
    } catch (error) {
        log.error('[Profile] Get profile error:', error);
        return null;
    }
});
