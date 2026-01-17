const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getAccounts: () => ipcRenderer.invoke('get-accounts'),
  addAccount: (account) => ipcRenderer.invoke('add-account', account),
  updateAccount: (account) => ipcRenderer.invoke('update-account', account),
  removeAccount: (id) => ipcRenderer.invoke('remove-account', id),
  switchAccount: (id) => ipcRenderer.invoke('switch-account', id),
  selectFile: () => ipcRenderer.invoke('select-file'),
  getGlobalConfig: () => ipcRenderer.invoke('get-global-config'),
})
