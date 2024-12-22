const { auth } = require('minecraft-auth');

class Account {
    async login(username, password) {
        try {
            const response = await auth.authenticate(username, password);
            return {
                accessToken: response.accessToken,
                clientToken: response.clientToken,
                username: response.selectedProfile.name,
                uuid: response.selectedProfile.id
            };
        } catch (error) {
            throw new Error('Authentication failed');
        }
    }

    async validate(accessToken) {
        try {
            return await auth.validate(accessToken);
        } catch {
            return false;
        }
    }

    async refresh(accessToken, clientToken) {
        try {
            const response = await auth.refresh(accessToken, clientToken);
            return {
                accessToken: response.accessToken,
                clientToken: response.clientToken
            };
        } catch {
            throw new Error('Session refresh failed');
        }
    }
}

module.exports = new Account();