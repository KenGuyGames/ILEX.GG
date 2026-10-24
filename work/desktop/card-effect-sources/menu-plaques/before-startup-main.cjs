const {app,BrowserWindow,protocol,net,Menu,shell,dialog,ipcMain}=require('electron');
const path=require('node:path');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
app.setName('ILEX.GG');
const selfTest=process.argv.includes('--self-test');
const testRoot=selfTest ? process.argv[process.argv.indexOf('--self-test')+1] : null;
if(selfTest){
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('allow-loopback-in-peer-connection');
  app.commandLine.appendSwitch('disable-features','WebRtcHideLocalIpsWithMdns');
  if(!testRoot || !path.isAbsolute(testRoot)) throw Error('Self-test requires an absolute output directory');
  fs.mkdirSync(testRoot,{recursive:true});
  app.setPath('userData',path.join(testRoot,'profile'));
}else{
  app.setPath('userData',path.join(app.getPath('appData'),'TCG Lab'));
}
protocol.registerSchemesAsPrivileged([{scheme:'tcglab',privileges:{standard:true,secure:true,supportFetchAPI:true}}]);
const ownURL=url=>{try{const u=new URL(url);return u.protocol==='tcglab:'&&u.host==='app'}catch{return false}};
const openLink=url=>{try{const u=new URL(url);if(u.protocol==='https:')shell.openExternal(u.href)}catch{}};
let win;
if(!app.requestSingleInstanceLock())app.quit();
else{
  app.on('second-instance',()=>{if(win){if(win.isMinimized())win.restore();win.show();win.focus()}});
  app.whenReady().then(async()=>{
    const ui=path.join(__dirname,'ui');
    const scans=app.isPackaged ? path.join(process.resourcesPath,'scans') : path.resolve(__dirname,'../../outputs/Pokemon-TCG-Lab/scans');
    const CardCache=require('./card-cache.cjs');
    const cache=new CardCache({manifest:JSON.parse(fs.readFileSync(path.join(ui,'scan-manifest.json'),'utf8')),directory:path.join(app.getPath('userData'),'card-cache'),bundled:scans,fetch:(url,options)=>net.fetch(url,options),notify:status=>{if(win&&!win.isDestroyed())win.webContents.send('card-cache-progress',status)}});
    for(const [channel,action] of Object.entries({'card-cache-status':()=>cache.status(),'card-cache-start':()=>cache.start(),'card-cache-pause':()=>cache.pause()}))ipcMain.handle(channel,event=>{if(event.sender!==win?.webContents||!ownURL(event.senderFrame.url))throw Error('Invalid cache request');return action()});
    ipcMain.handle('cube-import',async(event,url)=>{if(event.sender!==win?.webContents||!ownURL(event.senderFrame.url)||typeof url!=='string'||url.length>1000)throw Error('Invalid cube import request');return require('./cube-import.cjs').load((u,o)=>net.fetch(u,o),url);});
    protocol.handle('tcglab',async request=>{
      try{
        const u=new URL(request.url);
        if(u.host!=='app' || !['GET','HEAD'].includes(request.method))return new Response('Not found',{status:404});
        let name=decodeURIComponent(u.pathname).replace(/^\/+/, '')||'index.html';
        const isScan=name.startsWith('scans/');
        const root=isScan?scans:ui;
        const target=path.resolve(root,isScan?name.slice(6):name);
        const relative=path.relative(root,target);
        if(!relative || relative.startsWith('..') || path.isAbsolute(relative))return new Response('Not found',{status:404});
        return await net.fetch(pathToFileURL(isScan?await cache.resolve(name.slice(6)):target).toString());
      }catch{return new Response('Not found',{status:404})}
    });
    win=new BrowserWindow({width:1440,height:960,minWidth:900,minHeight:640,title:'ILEX.GG',icon:path.join(__dirname,'icon.ico'),backgroundColor:'#0d211b',show:!selfTest,autoHideMenuBar:true,webPreferences:{offscreen:selfTest,backgroundThrottling:!selfTest,preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}});
    // Manual invitations intentionally share connection addresses with the invited peer.
    // Explicit interface policy avoids relying on multicast DNS across Windows networks.
    win.webContents.setWebRTCIPHandlingPolicy(selfTest?'default':'default_public_and_private_interfaces');
    ipcMain.handle('export-json',async(event,name,data)=>{
      if(event.sender!==win.webContents || !ownURL(event.senderFrame.url) || typeof name!=='string' || !/^[a-zA-Z0-9_-]{1,60}\.json$/.test(name))throw Error('Invalid export request');
      const text=JSON.stringify(data,null,2);
      if(text.length>25*1024*1024)throw Error('Workspace export is too large');
      const destination=selfTest ? path.join(testRoot,name) : dialog.showSaveDialogSync(win,{title:'Export workspace',defaultPath:path.join(app.getPath('documents'),name),filters:[{name:'JSON files',extensions:['json']}]});
      if(!destination)return false;
      await fs.promises.writeFile(destination,text,'utf8');return true;
    });
    const privateNetworkPermissions=new Set(['local-network','loopback-network','local-network-access']);
    const ownNetworkPermission=(wc,permission,origin)=>!!wc&&ownURL(wc.getURL())&&ownURL(origin||wc.getURL())&&privateNetworkPermissions.has(permission);
    win.webContents.session.setPermissionRequestHandler((wc,permission,callback,details)=>{if(selfTest)fs.appendFileSync(path.join(testRoot,'permission-checks.log'),'request '+permission+'\n');callback(ownNetworkPermission(wc,permission,details?.requestingUrl));});
    win.webContents.session.setPermissionCheckHandler((wc,permission,origin)=>{if(selfTest)fs.appendFileSync(path.join(testRoot,'permission-checks.log'),'check '+permission+'\n');return ownNetworkPermission(wc,permission,origin);});
    win.webContents.setWindowOpenHandler(({url})=>{
      if(ownURL(url)){net.fetch(url).then(r=>r.text()).then(text=>dialog.showMessageBox(win,{title:'ILEX.GG scan audit',message:text,buttons:['Close']})).catch(()=>{});}
      else openLink(url);
      return {action:'deny'};
    });
    win.webContents.on('will-navigate',(event,url)=>{if(!ownURL(url)){event.preventDefault();openLink(url)}});
    win.webContents.session.on('will-download',(event,item)=>{
      if(selfTest){item.setSavePath(path.join(testRoot,item.getFilename()));return;}
      const destination=dialog.showSaveDialogSync(win,{title:'Export workspace',defaultPath:path.join(app.getPath('documents'),item.getFilename()),filters:[{name:'JSON files',extensions:['json']}]});
      if(destination)item.setSavePath(destination);else item.cancel();
    });
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      {label:'File',submenu:[{label:'Export workspaceâ€¦',click:()=>win.webContents.executeJavaScript("document.querySelector('#backup').click()")},{type:'separator'},{role:'quit'}]},
      {label:'View',submenu:[{role:'reload'},{role:'resetZoom'},{role:'zoomIn'},{role:'zoomOut'},{role:'togglefullscreen'}]},
      {label:'Help',submenu:[{label:'About ILEX.GG',click:()=>dialog.showMessageBox(win,{title:'ILEX.GG',message:'ILEX.GG '+app.getVersion(),detail:'Paper TCG and Pokemon TCG Pocket simulator. Separate Pocket cards, decks, Energy Zone battles and packs. Local decks and saves are retained. Unofficial fan-made simulator.'})}]}
    ]));
    await win.loadURL('tcglab://app/index.html');
    if(selfTest)win.webContents.setAudioMuted(true);
    if(!selfTest)win.maximize();
    if(selfTest){
      try{
        await require('./self-test.cjs')(win,testRoot);
        app.exit(0);
      }catch(e){fs.writeFileSync(path.join(testRoot,'failure.txt'),e?.stack||String(e));app.exit(1)}
    }
  }).catch(e=>{if(selfTest)fs.writeFileSync(path.join(testRoot,'failure.txt'),e?.stack||String(e));else dialog.showErrorBox('ILEX.GG could not start',e.message);app.exit(1)});
  app.on('window-all-closed',()=>app.quit());
}

