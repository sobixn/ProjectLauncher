const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const log = require('electron-log');
const Store = require('electron-store');

// electron-log 설정
log.initialize({ preload: true });

// electron-store 초기화
Store.initRenderer();

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        // 아이콘 경로 수정
        icon: path.join(__dirname, '../assets/project.ico'),
        frame: false,  // 프레임 없는 창
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        // ...existing code...
    });

    // ...existing code...
}

// ...existing code...
