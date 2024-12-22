const DiscordRPC = require('discord-rpc');

class DiscordPresence {
    constructor() {
        this.clientId = '1319597550466105364';
        this.client = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.initialize().catch(() => {
            // Discord가 실행되지 않은 경우 조용히 실패
        });
    }

    async initialize() {
        if (!this.client) {
            this.client = new DiscordRPC.Client({ transport: 'ipc' });
        }
        await this.connectWithRetry();
    }

    async connectWithRetry() {
        try {
            await this.client.login({ clientId: this.clientId });
            this.retryCount = 0;
            this.setDefaultActivity();
        } catch (error) {
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                setTimeout(() => this.connectWithRetry(), 5000);
            }
        }
    }

    setDefaultActivity() {
        this.setActivity('Waiting in launcher', 'Main Menu');
    }

    setActivity(state = 'In Launcher', details = 'Idle') {
        try {
            if (this.client?.user) {
                this.client.setActivity({
                    state,
                    details,
                    largeImageKey: 'minecraft',
                    startTimestamp: new Date()
                });
            }
        } catch (error) {
            // 활동 설정 실패 시 조용히 처리
        }
    }

    destroy() {
        if (this.client) {
            this.client.destroy().catch(() => {});
            this.client = null;
        }
    }
}

module.exports = new DiscordPresence();