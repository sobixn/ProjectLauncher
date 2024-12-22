const { Client } = require('minecraft-launcher-core');
const path = require('path');

class Launcher {
    constructor() {
        this.launcher = new Client();
    }

    async launchGame(account, version, memory) {
        const options = {
            authorization: account,
            root: path.join(process.env.APPDATA, '.minecraft'),
            version: {
                number: version,
                type: "release"
            },
            memory: {
                max: memory.max,
                min: memory.min
            }
        };

        try {
            await this.launcher.launch(options);
            return { success: true };
        } catch (error) {
            return { success: false, error };
        }
    }
}

module.exports = new Launcher();