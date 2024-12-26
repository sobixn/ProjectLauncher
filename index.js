const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const log = require('electron-log');
const { Client } = require('minecraft-launcher-core');
const launcher = new Client();
const { exec } = require('child_process');
const https = require('https');
const fs = require('fs');

// 로그 디렉토리 생성
const createLogDirectories = () => {
    const dirs = [
        path.join(__dirname, 'logs/game'),
        path.join(__dirname, 'logs/launcher')
    ];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

// 로그 설정
log.transports.file.level = 'debug';
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
log.transports.file.resolvePathFn = () => path.join(__dirname, 'logs/launcher/main.log');

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
            devTools: false  // DevTools 비활성화
        }
    });

    // F12 키 비활성화
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F12') {
            event.preventDefault();
        }
    });

    // 프로덕션 모드에서는 메뉴바 제거
    mainWindow.setMenu(null);

    mainWindow.loadFile(path.join(__dirname, 'src/init/InitializedBootstrap.html'));
}

app.whenReady().then(() => {
    createLogDirectories();
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
  // 여기에 무결성 검사 로직 추가
  return { success: true };
});

ipcMain.handle('check-launcher', async () => {
  log.info('Checking launcher');
  // 여기에 런처 검사 로직 추가
  return { success: true };
});

// 로그인 상태 체크 핸들러
ipcMain.handle('check-login-status', async () => {
  log.info('Checking login status');
  try {
    // 여기에 실제 로그인 상태 체크 로직 추가
    // 임시로 false 반환 (로그인되지 않은 상태)
    return false;
  } catch (error) {
    log.error('Login status check failed:', error);
    return false;
  }
});

// 페이지 전환 핸들러
ipcMain.handle('navigate', async (event, page) => {
    log.info(`Navigating to ${page}`);
    try {
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

// Microsoft OAuth 설정
const msOAuthConfig = {
    client_id: '63ee60c7-5070-4e43-aa17-f1134b834e77',
    redirect_uri: 'http://localhost:3000/callback'
};

ipcMain.handle('ms-login', async () => {
    try {
        // 테스트용 오프라인 모드 사용자
        return {
            success: true,
            username: 'TestUser',
            uuid: '12345678-1234-1234-1234-123456789012',
            accessToken: 'test-access-token'
        };
    } catch (error) {
        log.error('Login error:', error);
        return {
            success: false,
            error: error.message
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

// 마인크래프트 실행 핸들러
ipcMain.handle('launchMinecraft', async (event, options) => {
    try {
        log.info('Received launch request');
        
        if (!options || !options.authorization) {
            throw new Error('Invalid launch options');
        }

        const launcher = new Client();
        await launcher.launch(options);
        
        log.info('Game launched successfully');
        return { success: true };
        
    } catch (error) {
        log.error('Launch error:', error);
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
        
        // UI 리소스 디렉토리 생성
        if (!fs.existsSync(assetsPath)) {
            fs.mkdirSync(assetsPath, { recursive: true });
        }

        // UI 설정 저장
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