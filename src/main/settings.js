const Store = require('electron-store');

class Settings {
    constructor() {
        this.store = new Store();
        this.defaults = {
            memory: {
                max: "4G",
                min: "2G"
            },
            lastVersion: "1.19.2",
            language: "en",
            theme: "dark"
        };
    }

    get(key) {
        return this.store.get(key, this.defaults[key]);
    }

    set(key, value) {
        return this.store.set(key, value);
    }
}

module.exports = new Settings();