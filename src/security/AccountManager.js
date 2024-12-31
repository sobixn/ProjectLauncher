const fs = require('fs');
const path = require('path');
const log = require('electron-log');
const { app } = require('electron');

class AccountManager {
    constructor() {
        this.gamePath = path.join(process.env.APPDATA, '.project-vir');
        this.accountDir = path.join(this.gamePath, 'account');
        this.accountFile = path.join(this.accountDir, 'launcher-project.json');
    }

    async save(accountData) {
        try {
            log.info('[Account] Attempting to save account data:', accountData);

            // 데이터 구조 검증
            if (!accountData) {
                throw new Error('No account data provided');
            }

            const requiredFields = ['username', 'uuid', 'accessToken'];
            const missingFields = requiredFields.filter(field => !accountData[field]);
            
            if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }

            // 디렉토리 생성
            if (!fs.existsSync(this.gamePath)) {
                fs.mkdirSync(this.gamePath, { recursive: true });
            }
            if (!fs.existsSync(this.accountDir)) {
                fs.mkdirSync(this.accountDir, { recursive: true });
            }

            const saveData = {
                username: accountData.username,
                uuid: accountData.uuid,
                accessToken: accountData.accessToken,
                clientToken: accountData.clientToken || accountData.uuid,
                expires_by: accountData.expires_by || (Date.now() + (3600 * 1000)),
                timestamp: Date.now()
            };

            fs.writeFileSync(this.accountFile, JSON.stringify(saveData, null, 2), 'utf8');
            log.info('[Account] Successfully saved account info for:', saveData.username);
            return { success: true, data: saveData };

        } catch (error) {
            log.error('[Account] Save error:', error);
            return { success: false, error: error.message };
        }
    }

    async load() {
        try {
            if (!fs.existsSync(this.accountFile)) {
                log.info('[Account] No account file found');
                return { success: false, error: 'No account data found' };
            }

            const data = JSON.parse(fs.readFileSync(this.accountFile, 'utf8'));
            
            // 데이터 검증
            if (!data || !data.accessToken || !data.clientToken || !data.username || !data.uuid) {
                log.info('[Account] Invalid account data structure:', data);
                return { success: false, error: 'Invalid account data' };
            }

            // 타임스탬프 확인
            if (data.timestamp && Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
                log.info('[Account] Session expired');
                fs.unlinkSync(this.accountFile);
                return { success: false, error: 'Session expired' };
            }

            log.info('[Account] Successfully loaded account data for:', data.username);
            return { 
                success: true, 
                data: {
                    username: data.username,
                    uuid: data.uuid,
                    accessToken: data.accessToken,
                    clientToken: data.clientToken,
                    timestamp: data.timestamp,
                    expires_by: data.expires_by || (data.timestamp + (3600 * 1000))
                }
            };
        } catch (error) {
            log.error('[Account] Load error:', error);
            return { success: false, error: error.message };
        }
    }

    async get(key) {
        try {
            const result = await this.load();
            if (result.success && result.data[key]) {
                return { success: true, data: result.data[key] };
            }
            return { success: false, error: 'Data not found' };
        } catch (error) {
            log.error('[Account] Get error:', error);
            return { success: false, error: error.message };
        }
    }

    async getProfile() {
        try {
            const result = await this.load();
            if (result.success) {
                return result.data;
            }
            return null;
        } catch (error) {
            log.error('[Account] Get profile error:', error);
            return null;
        }
    }
}

module.exports = new AccountManager();