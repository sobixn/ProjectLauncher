const path = require('path');
const fs = require('fs');
const log = require('electron-log');
const { app } = require('electron');
const { Client } = require('minecraft-launcher-core');
const https = require('https');

class ForgeClient {
    constructor() {
        this.mcVersion = "1.21.1";
        this.forgeVersion = "52.0.37";
        this.brandName = "project_vir";
        this.serverHost = "syuu.net";  // 서버 주소 변경
        this.gamePath = path.join(process.env.APPDATA, '.project-vir');
        this.dataPath = path.join(this.gamePath, 'data');
        this.assetsPath = path.join(this.gamePath, 'assets');
        this.versionsPath = path.join(this.gamePath, 'versions');
        this.forgeJar = path.join(this.dataPath, 'forge-installer.jar');
        this.forgeVersionPath = path.join(this.versionsPath, `${this.mcVersion}-forge-${this.forgeVersion}`);
        this.instancePath = path.join(this.gamePath, 'instances', `forge-${this.mcVersion}`);
        this.client = new Client();
        this.setupDirectories();
        this.setupEventListeners();
        this.setupLoggers();
        this.process = null;
    }

    setupLoggers() {
        // 게임 메인 로그
        this.gameLogger = log.scope('game');
        this.gameLogger.transports.file.level = 'info';
        this.gameLogger.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
        this.gameLogger.transports.file.resolvePathFn = () => path.join(
            this.gamePath,
            'logs',
            'game',
            'game_main.log'
        );

        // 게임 디버그 로그
        this.debugLogger = log.scope('game-debug');
        this.debugLogger.transports.file.level = 'debug';
        this.debugLogger.transports.file.resolvePathFn = () => path.join(
            this.gamePath,
            'logs',
            'game',
            'game_debug.log'
        );

        // 이벤트 리스너에서 로그 사용
        this.client.on('debug', (e) => this.debugLogger.debug('[Game]:', e));
        this.client.on('data', (e) => this.gameLogger.info('[Game]:', e));
        this.client.on('error', (e) => {
            this.gameLogger.error('[Game] Error:', e);
            this.debugLogger.error('[Game] Error details:', e);
        });
    }

    setupDirectories() {
        const dirs = [
            this.gamePath,
            this.dataPath,
            this.versionsPath,
            path.join(this.versionsPath, `${this.mcVersion}-forge-${this.forgeVersion}`),
            this.instancePath,
            path.join(this.instancePath, 'mods'),
            path.join(this.instancePath, 'resourcepacks'),
            path.join(this.instancePath, 'saves')
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });

        // Create version JSON
        const versionJsonPath = path.join(this.versionsPath, `${this.mcVersion}-forge-${this.forgeVersion}`, `${this.mcVersion}-forge-${this.forgeVersion}.json`);
        if (!fs.existsSync(versionJsonPath)) {
            fs.writeFileSync(versionJsonPath, JSON.stringify({
                id: `${this.mcVersion}-forge-${this.forgeVersion}`,
                inheritsFrom: this.mcVersion,
                releaseTime: new Date().toISOString(),
                time: new Date().toISOString(),
                type: "release"
            }, null, 2));
        }
    }

    setupEventListeners() {
        this.client.on('debug', (e) => log.info('[Forge Debug]:', e));
        this.client.on('data', (e) => log.info('[Forge Data]:', e));
        this.client.on('error', (e) => {
            log.info('[Forge Error]:', {
                message: e.message,
                stack: e.stack,
                code: e.code
            });
        });
        this.client.on('close', (code) => {
            log.info('[Forge] Process closed with code:', {
                code: code,
                details: this.getExitCodeDetails(code)
            });
        });

        // 프로세스 종료 핸들러
        process.on('exit', (code) => {
            if (this.process) {
                this.process.kill();
            }
        });

        // 강제 종료 시그널 처리
        ['SIGINT', 'SIGTERM'].forEach(signal => {
            process.on(signal, () => {
                if (this.process) {
                    this.process.kill();
                    process.exit(0);
                }
            });
        });
    }

    getExitCodeDetails(code) {
        const exitCodes = {
            0: 'Normal exit',
            1: 'Java runtime error or Forge launch failure',
            2: 'Missing game files',
            3: 'Insufficient memory',
            4: 'Java version compatibility issue',
            5: 'Network error'
        };
        return exitCodes[code] || 'Unknown error';
    }

    async save(config) {
        try {
            if (!fs.existsSync(this.instancePath)) {
                fs.mkdirSync(this.instancePath, { recursive: true });
                ['saves', 'mods', 'resourcepacks', 'screenshots'].forEach(dir => {
                    fs.mkdirSync(path.join(this.instancePath, dir), { recursive: true });
                });
            }

            fs.writeFileSync(this.forgeConfigPath, JSON.stringify(config, null, 2), 'utf8');
            log.info('[Forge] Saved config');
            return { success: true };
        } catch (error) {
            log.error('[Forge] Save error:', error);
            return { success: false, error: error.message };
        }
    }

    async load() {
        try {
            if (fs.existsSync(this.forgeConfigPath)) {
                const data = JSON.parse(fs.readFileSync(this.forgeConfigPath, 'utf8'));
                return { success: true, data };
            }
            return { success: false, error: 'No forge config found' };
        } catch (error) {
            log.error('[Forge] Load error:', error);
            return { success: false, error: error.message };
        }
    }

    async get(key) {
        try {
            const result = await this.load();
            if (result.success && result.data[key]) {
                return result.data[key];
            }
            return null;
        } catch (error) {
            log.error('[Forge] Get error:', error);
            return null;
        }
    }

    async downloadForge() {
        return new Promise((resolve, reject) => {
            const forgeUrl = 'https://maven.minecraftforge.net/net/minecraftforge/forge/1.21.1-52.0.37/forge-1.21.1-52.0.37-installer.jar';
            const file = fs.createWriteStream(this.forgeJar);
            
            https.get(forgeUrl, (response) => {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(true);
                });
            }).on('error', (err) => {
                fs.unlink(this.forgeJar, () => reject(err));
            });
        });
    }

    async installForge() {
        try {
            if (!fs.existsSync(this.forgeJar)) {
                log.info('[Forge] Downloading Forge installer...');
                await this.downloadForge();
            }

            log.info('[Forge] Installing...');
            const { execSync } = require('child_process');
            
            // 클라이언트 모드로 설치
            execSync(`java -jar "${this.forgeJar}" --installClient`, { 
                cwd: this.gamePath,
                stdio: 'inherit'
            });

            return true;
        } catch (error) {
            if (error.message.includes('java')) {
                log.error('[Forge] Java not found');
                return { success: false, error: 'Java가 설치되어 있지 않습니다.' };
            }
            log.error('[Forge] Install error:', error);
            return false;
        }
    }

    async launch(authData) {
        try {
            const options = {
                authorization: authData.authorization,
                root: this.gamePath,
                version: {
                    number: this.mcVersion,
                    type: "release",
                    custom: `${this.mcVersion}-forge-${this.forgeVersion}`
                },
                memory: {
                    max: "4G",
                    min: "2G"
                },
                forge: this.forgeJar,
                gameDir: this.instancePath,
                defaultLaunchArgs: [
                    "--server", this.serverHost,
                    "--port", "25565"
                ],
                launchArgs: [
                    `--quickPlayMultiplayer=${this.serverHost}:25565`
                ],
                server: {
                    host: this.serverHost,
                    port: 25565,
                    autoConnect: true
                },
                javaArgs: [
                    "-XX:+UnlockExperimentalVMOptions",
                    "-XX:+UseG1GC",
                    `-Dminecraft.launcher.brand=${this.brandName}`,
                    `-Dminecraft.server.ip=${this.serverHost}`
                ]
            };

            log.info('[Forge] Starting with server connection to:', this.serverHost);
            await this.client.launch(options);
            return { success: true };

        } catch (error) {
            log.error('[Forge] Launch error:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new ForgeClient();
