module.exports = {
  appId: "com.project.vir",
  productName: "Project VIR",
  asar: true,
  compression: "maximum",
  directories: {
    output: "dist",
    buildResources: "assets"
  },
  files: [
    "src/**/*",
    "index.js",
    "package.json",
    "!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}",
    "!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}",
    "!**/node_modules/*.d.ts",
    "!**/node_modules/.bin",
    "!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}"
  ],
  win: {
    target: [
      {
        target: "nsis",
        arch: ["x64"]
      }
    ],
    icon: "assets/project.ico",
    requestedExecutionLevel: "requireAdministrator"
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    installerIcon: "assets/project.ico",
    uninstallerIcon: "assets/project.ico",
    installerHeaderIcon: "assets/project.ico",
    artifactName: "Project-VIR-Setup.${ext}"
  }
}