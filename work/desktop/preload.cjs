const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktop',Object.freeze({exportJSON:(name,data)=>ipcRenderer.invoke('export-json',name,data)}));
