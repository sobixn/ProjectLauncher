const { contextBridge, ipcRenderer } = require('electron');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');
const { Buffer } = require('buffer');

const checkJavaEnvironment = () => {
  try {
    // 먼저 java 명령어로 직접 확인
    try {
      const javaVersion = execSync('java -version 2>&1').toString();
      console.log('Java version check:', javaVersion);

      // Java가 설치되어 있으면 JAVA_HOME 확인
      const javaHome = process.env.JAVA_HOME || '';
      console.log('JAVA_HOME:', javaHome);

      // Java 실행 파일 경로 확인
      let javaPath = '';
      if (javaHome) {
        javaPath = path.join(javaHome, 'bin', 'java.exe');
      } else {
        // JAVA_HOME이 없는 경우 시스템 경로에서 java.exe 찾기
        const pathEnv = process.env.PATH || '';
        const paths = pathEnv.split(';');
        for (const p of paths) {
          const testPath = path.join(p, 'java.exe');
          if (fs.existsSync(testPath)) {
            javaPath = testPath;
            break;
          }
        }
      }

      console.log('Java path:', javaPath);

      if (javaVersion.includes('java version') || javaVersion.includes('openjdk')) {
        return { 
          exists: true, 
          path: javaPath, 
          version: javaVersion,
          message: 'Java가 정상적으로 설치되어 있습니다.' 
        };
      }
    } catch (execError) {
      console.error('Java execution error:', execError);
    }

    return { exists: false, message: 'Java 실행 파일을 찾을 수 없습니다.' };
  } catch (error) {
    console.error('Java check error:', error);
    return { exists: false, message: `Java 확인 중 오류 발생: ${error.message}` };
  }
};

contextBridge.exposeInMainWorld('electron', {
  checkJavaEnvironment: () => checkJavaEnvironment(),
  checkIntegrity: () => ipcRenderer.invoke('check-integrity'),
  checkLauncher: () => ipcRenderer.invoke('check-launcher'),
  checkLoginStatus: () => ipcRenderer.invoke('check-login-status'),
  updateProgress: (value, text) => ipcRenderer.invoke('update-progress', { value, text }),
  downloadJava: (url) => ipcRenderer.invoke('downloadJava', url),
  installJava: () => ipcRenderer.invoke('installJava'),
  launchMinecraft: async (options) => {
    try {
      const response = await ipcRenderer.invoke('launchMinecraft', options);
      log.info('Launch response:', response);
      return response;
    } catch (error) {
      log.error('IPC error:', error);
      return { success: false, error: error.message };
    }
  },
  getAppPath: () => process.env.APPDATA + '/.project-vir',
  log: {
    info: (...args) => log.info(...args),
    error: (...args) => log.error(...args)
  },
  path: {
    join: (...args) => path.join(...args)
  },
  getGamePath: async () => {
    const gamePath = path.join(process.env.APPDATA, '.project-vir');
    return gamePath;
  },
  ipcRenderer: {
    invoke: (...args) => ipcRenderer.invoke(...args),
    on: (...args) => ipcRenderer.on(...args)
  },
  buffer: {
    from: (data, encoding) => Buffer.from(data, encoding),
    toString: (buffer, encoding) => buffer.toString(encoding)
  }

});