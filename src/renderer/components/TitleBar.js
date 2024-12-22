const { ipcRenderer } = require('electron');

class TitleBar {
    constructor() {
        this.initialize();
    }

    initialize() {
        this.render();
        this.attachEvents();
        this.applyStyles();
    }

    render() {
        const titleBar = document.createElement('div');
        titleBar.className = 'title-bar';
        titleBar.innerHTML = `
            <div class="drag-region">
                <span class="app-title">Project Launcher</span>
            </div>
            <div class="window-controls">
                <button class="control-button minimize">─</button>
                <button class="control-button maximize">□</button>
                <button class="control-button close">×</button>
            </div>
        `;
        document.body.insertBefore(titleBar, document.body.firstChild);
    }

    attachEvents() {
        const minimize = document.querySelector('.control-button.minimize');
        const maximize = document.querySelector('.control-button.maximize');
        const close = document.querySelector('.control-button.close');

        minimize.addEventListener('click', () => ipcRenderer.send('minimize'));
        maximize.addEventListener('click', () => ipcRenderer.send('maximize'));
        close.addEventListener('click', () => ipcRenderer.send('close'));
    }

    applyStyles() {
        const style = document.createElement('style');
        style.textContent = `
            body {
                margin: 0;
                padding-top: 30px;
            }
            
            .title-bar {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                height: 30px;
                background: #1a1a1a;
                display: flex;
                justify-content: space-between;
                align-items: center;
                -webkit-app-region: drag;
                z-index: 9999;
            }

            .drag-region {
                flex: 1;
                height: 100%;
                display: flex;
                align-items: center;
            }

            .window-controls {
                display: flex;
                -webkit-app-region: no-drag;
            }

            .control-button {
                width: 46px;
                height: 30px;
                border: none;
                background: transparent;
                color: #ffffff;
                font-size: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: background-color 0.2s;
            }

            .control-button:hover {
                background: rgba(255,255,255,0.1);
            }

            .control-button.close:hover {
                background: #e81123;

            .app-title {
                color: #ffffff;
                font-weight: bold;
                font-size: 14px;
                margin-left: 12px;
                font-family: 'Segoe UI', sans-serif;
            }
        `;
        document.head.appendChild(style);
    }
}

module.exports = TitleBar;
