const msmc = require('msmc');
const log = require('electron-log');

class MicrosoftAuth {
    static async authenticate() {
        try {
            log.info('[MicrosoftAuth] Starting authentication...');
            const result = await msmc.fastLaunch("raw");

            if (!result || !result.profile) {
                throw new Error('Invalid login result');
            }

            log.info('[MicrosoftAuth] Authentication successful:', result.profile);

            return {
                success: true,
                data: {
                    username: result.profile.name,
                    uuid: result.profile.id,
                    accessToken: result.access_token,
                    clientToken: result.profile.id,
                    expires_by: Date.now() + (3600 * 1000)
                }
            };
        } catch (error) {
            log.error('[MicrosoftAuth] Authentication error:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = MicrosoftAuth;