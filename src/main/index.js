const { app, BrowserWindow, ipcMain, shell, Menu, protocol } = require('electron');
const path = require('path');
const DiscordPresence = require('../renderer/services/discordRPC');
const Store = require('electron-store');
const { auth } = require('minecraft-auth');
const isElevated = require('is-elevated'); // 추가

const store = new Store();

let mainWindow;

ipcMain.on('electron-store-get-data', (event, val) => {
    event.returnValue = store.get(val);
});

ipcMain.on('electron-store-set-data', (event, key, val) => {
    store.set(key, val);
    event.returnValue = true;
});

ipcMain.on('__ELECTRON_LOG__', (event, args) => {
    console.log('Log received:', args);
});

async function initializeDiscord() {
    try {
        await DiscordPresence.initialize();
        DiscordPresence.setActivity(); // Set default activity
    } catch (error) {
        console.error('Failed to initialize Discord RPC:', error);
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        frame: false,
        icon: path.join(__dirname, '../../assets/project.ico'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        // 작업 표시줄 우클릭 메뉴 비활성화
        skipTaskbar: false, // 작업 표시줄에는 표시
        menuBarVisible: false, // 메뉴바 숨기기
    });

    // MSMC를 위한 프로토콜 처리
    protocol.registerHttpProtocol('msmc', (req, cb) => {
        const url = new URL(req.url);
        mainWindow.webContents.send('msmc-callback', url.toString());
    });

    // 컨텍스트 메뉴 완전히 비활성화
    mainWindow.setMenuBarVisibility(false);
    Menu.setApplicationMenu(null);

    // 작업 표시줄 우클릭 메뉴 처리
    mainWindow.setMenu(null);
    mainWindow.removeMenu();

    // 우클릭 메뉴 비활성화
    mainWindow.hookWindowMessage(0x0116, () => {
        mainWindow.setEnabled(false);
        setTimeout(() => mainWindow.setEnabled(true), 100);
        return true;
    });

    // 개발 환경에서 DevTools 활성화
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.loadFile(path.join(__dirname, '../index.html'));

    // Microsoft 인증 콜백 처리
    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (url.startsWith('http://localhost:3000/callback')) {
            event.preventDefault();
            mainWindow.webContents.send('auth-callback', url);
        }
    });

    ipcMain.on('minimize', () => mainWindow.minimize());
    ipcMain.on('maximize', () => {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    });
    ipcMain.on('close', () => mainWindow.close());

    // Discord RPC status update handler
    ipcMain.on('update-activity', (_, activity) => {
        DiscordPresence.setActivity(activity.state, activity.details);
    });
}

async function checkAdminRights() {
    try {
        const elevated = await isElevated();
        if (!elevated) {
            const { spawn } = require('child_process');
            // 현재 프로세스를 관리자 권한으로 다시 실행
            spawn('powershell.exe', ['Start-Process', `"${process.execPath}"`, '-Verb', 'RunAs'], {
                detached: true
            });
            app.quit();
            return false;
        }
        return true;
    } catch (error) {
        console.error('Failed to check admin rights:', error);
        return false;
    }
}

// 앱 시작 시 단일 인스턴스만 실행되도록 보장
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.whenReady().then(async () => {
        if (await checkAdminRights()) {
            Store.initRenderer(); // electron-store 초기화 추가
            await initializeDiscord();
            createWindow();
        }

        app.on('activate', function () {
            if (BrowserWindow.getAllWindows().length === 0) createWindow();
        });
    });
}

// 모든 창이 닫히면 앱 종료
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});