const path = require('path');
const log = require('electron-log');
const AccountManager = require('./AccountManager');

class AutoLogin {
    constructor() {
        this.accountManager = AccountManager;
    }

    async checkAndAutoLogin() {
        try {
            log.info('[AutoLogin] Checking saved account...');
            const accountInfo = await this.accountManager.load();
            
            if (!accountInfo.success) {
                log.info('[AutoLogin] No saved account found');
                return { success: false, redirect: 'login' };
            }

            const data = accountInfo.data;
            if (!data || !data.accessToken || !data.username || !data.uuid) {
                log.info('[AutoLogin] Invalid account data');
                return { success: false, redirect: 'login' };
            }

            // 토큰이 유효한 경우 마이크로소프트 인증 과정 스킵
            const currentTime = Date.now();
            if (data.expires_by && currentTime < data.expires_by) {
                log.info('[AutoLogin] Using cached token');
                return {
                    success: true,
                    redirect: 'main',
                    data: data
                };
            }

            // 토큰이 만료된 경우
            log.info('[AutoLogin] Token expired, requiring new login');
            return { success: false, redirect: 'login' };

        } catch (error) {
            log.error('[AutoLogin] Error:', error);
            return { success: false, redirect: 'login' };
        }
    }
}

module.exports = new AutoLogin();