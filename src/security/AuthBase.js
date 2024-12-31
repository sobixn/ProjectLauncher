const msmc = require('msmc');
const log = require('electron-log');

class AuthBase {
    constructor() {
        this.msmc = msmc;
    }

    static getInstance() {
        if (!this.instance) {
            this.instance = new this();
        }
        return this.instance;
    }

    static async authenticate() {
        return await this.getInstance().authenticateInstance();
    }
}

module.exports = AuthBase;