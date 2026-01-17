const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
const path = require('path')
const fs = require('fs-extra')
const simpleGit = require('simple-git')
const os = require('os')
const { exec } = require('child_process')

const git = simpleGit()

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // 检查是否在开发模式
  const isDev = process.env.npm_lifecycle_event === 'electron:dev'

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// --- 后端逻辑 ---

const CONFIG_DIR = path.join(app.getPath('userData'), 'config')
const CONFIG_FILE = path.join(CONFIG_DIR, 'accounts.json')
const SSH_DIR = path.join(os.homedir(), '.ssh')
const SSH_CONFIG_FILE = path.join(SSH_DIR, 'config')

// 确保配置存在
fs.ensureDirSync(CONFIG_DIR)
if (!fs.existsSync(CONFIG_FILE)) {
  fs.writeJsonSync(CONFIG_FILE, { accounts: [], activeId: null })
}

// 助手：获取配置
function getConfig() {
  return fs.readJsonSync(CONFIG_FILE)
}

// 助手：保存配置
function saveConfig(data) {
  fs.writeJsonSync(CONFIG_FILE, data)
}

// IPC: 获取账户
ipcMain.handle('get-accounts', async () => {
  const config = getConfig()
  
  // 如果账户列表为空，尝试导入当前全局配置
  if (config.accounts.length === 0) {
    try {
      const name = await git.getConfig('user.name', 'global');
      const email = await git.getConfig('user.email', 'global');
      
      if (name.value && email.value) {
        const newAccount = {
          id: Date.now().toString(),
          name: name.value,
          email: email.value,
          sshKeyPath: '' // 无法自动准确推断私钥路径，留空让用户自己补充
        }
        config.accounts.push(newAccount)
        config.activeId = newAccount.id
        saveConfig(config)
      }
    } catch (e) {
      console.error('无法读取初始全局配置:', e)
    }
  }
  
  return config
})

// IPC: 添加账户
ipcMain.handle('add-account', async (event, account) => {
  const config = getConfig()
  account.id = Date.now().toString()
  config.accounts.push(account)
  saveConfig(config)
  return config.accounts
})

// IPC: 更新账户
ipcMain.handle('update-account', async (event, account) => {
  const config = getConfig()
  const index = config.accounts.findIndex(a => a.id === account.id)
  if (index !== -1) {
    config.accounts[index] = account
    saveConfig(config)
  }
  return config.accounts
})

// IPC: 移除账户
ipcMain.handle('remove-account', async (event, id) => {
  const config = getConfig()
  config.accounts = config.accounts.filter(a => a.id !== id)
  if (config.activeId === id) config.activeId = null
  saveConfig(config)
  return config.accounts
})

// IPC: 切换账户
ipcMain.handle('switch-account', async (event, id) => {
  const config = getConfig()
  const account = config.accounts.find(a => a.id === id)
  
  if (!account) throw new Error('账户未找到')

  // 1. 更新全局 Git 配置
  try {
    await git.addConfig('user.name', account.name, true, 'global')
    await git.addConfig('user.email', account.email, true, 'global')
    
    if (account.sshKeyPath) {
      // 使用 core.sshCommand 强制指定密钥
      // 指定密钥需要 -i。Windows 路径可能需要转义或正斜杠。
      const sshCmd = `ssh -i "${account.sshKeyPath.replace(/\\/g, '/')}" -o IdentitiesOnly=yes`
      await git.addConfig('core.sshCommand', sshCmd, true, 'global')
    } else {
      // 移除 core.sshCommand 以使用默认 SSH 行为
      // simple-git addConfig 不容易直接 unset？
      // 我们可以设置为空或尝试 unset。
      // simple-git 没有直接暴露 'unsetConfig'，但我们可以使用 raw。
      await git.raw(['config', '--global', '--unset', 'core.sshCommand']).catch(() => {})
    }
  } catch (e) {
    console.error('Git 配置错误:', e)
    throw e
  }

  config.activeId = id
  saveConfig(config)
  
  // 返回当前全局 Git 配置以验证
  const name = await git.getConfig('user.name', 'global')
  const email = await git.getConfig('user.email', 'global')
  
  return { 
    success: true, 
    activeId: id, 
    gitConfig: { name: name.value, email: email.value } 
  }
})

// IPC: 选择文件
ipcMain.handle('select-file', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    defaultPath: SSH_DIR
  })
  if (canceled) return null
  return filePaths[0]
})

// IPC: 获取当前全局配置
ipcMain.handle('get-global-config', async () => {
    try {
        const name = await git.getConfig('user.name', 'global');
        const email = await git.getConfig('user.email', 'global');
        return { name: name.value, email: email.value };
    } catch (e) {
        return { name: '', email: '' };
    }
});
