const Store = require('electron-store');
const Account = require('./account');

class AccountManager {
    constructor() {
        this.store = new Store();
        this.account = new Account();
    }

    async login(username, password) {
        try {
            const accountData = await this.account.login(username, password);
            this.saveAccount(accountData);
            return accountData;
        } catch (error) {
            throw new Error('Login failed: ' + error.message);
        }
    }

    async validateSession() {
        const currentAccount = this.getAccount();
        if (!currentAccount) {
            return false;
        }

        const isValid = await this.account.validate(currentAccount.accessToken);
        return isValid;
    }

    saveAccount(accountData) {
        this.store.set('account', {
            ...accountData,
            timestamp: Date.now()
        });
    }

    getAccount() {
        return this.store.get('account');
    }

    isLoggedIn() {
        return !!this.getAccount();
    }

    logout() {
        this.store.delete('account');
    }

    refreshSession() {
        // Add refresh token logic here if needed
        const currentAccount = this.getAccount();
        if (!currentAccount) {
            throw new Error('No active session');
        }
        return this.account.validate(currentAccount.accessToken);
    }
}

module.exports = new AccountManager();