class MainScreen {
    constructor() {
        this.initialize();
    }

    initialize() {
        this.container = document.getElementById('main');
        this.render();
        this.attachEvents();
    }

    render() {
        this.container.innerHTML = `
            <div class="title-bar">
                <div class="window-controls">
                    <button id="minimize">-</button>
                    <button id="maximize">□</button>
                    <button id="close">×</button>
                </div>
            </div>
            <div class="content">
                <div class="profile-section">
                    <img id="skin-preview" />
                    <span id="username"></span>
                </div>
                <div class="launch-section">
                    <select id="version"></select>
                    <button id="launch">Play</button>
                </div>
            </div>
        `;
    }

    attachEvents() {
        // Window controls
        document.getElementById('minimize').onclick = () => ipcRenderer.send('minimize');
        document.getElementById('maximize').onclick = () => ipcRenderer.send('maximize');
        document.getElementById('close').onclick = () => ipcRenderer.send('close');
    }
}