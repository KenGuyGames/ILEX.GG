const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../..'),ui=path.join(root,'work/desktop/ui'),folder=path.join(root,'work/cube-candidate');
function edit(name,from,to){const file=path.join(ui,name),s=fs.readFileSync(file,'utf8');if(!s.includes(from))throw Error('Patch target missing '+name);fs.writeFileSync(file,s.replace(from,to));}
edit('cube-ui.js',"cubeListFilter==='All'||cubeListFilter==='Review'?!e.id:","cubeListFilter==='All'?true:cubeListFilter==='Review'?!e.id:");
edit('cube-ui.js',"tab='decks';render();cubeDeckTools(deck,format);","tab='decks';render();");
edit('cube-ui.js',"const pool=f.elements.pool.value,item=entry||{key:crypto.randomUUID()};","const pool=f.elements.pool.value,item=entry||{key:crypto.randomUUID()};if(entry&&!item.sourceLabel)item.sourceLabel=item.name;");
edit('cube-library.js',"if(map[raw])return raw;","if(Object.hasOwn(map,raw)&&typeof map[raw]==='string'&&norm(metadata[raw]?.name)===norm(remote.card_Name||remote.name))return raw;");
edit('cube-library.js',",bw11:'bw10',bw10:'bw9',bw9:'bw8',bw8:'bw7',bw7:'bw6'",'');
// Avoid accepting an ambiguous legacy ID whose printing is from a different set.
edit('cube-library.js',"if(Object.hasOwn(map,raw)&&typeof map[raw]==='string'&&norm(metadata[raw]?.name)===norm(remote.card_Name||remote.name))return raw;","if(Object.hasOwn(map,raw)&&typeof map[raw]==='string'&&norm(metadata[raw]?.name)===norm(remote.card_Name||remote.name)&&(!remote.ptcgo||String(remote.ptcgo).split(' ')[0]===metadata[raw]?.ptcgoCode))return raw;");
const app=path.join(root,'outputs/ILEX.GG-1.21.1/resources/app');
let s=fs.readFileSync(path.join(app,'main.cjs'),'utf8');const point="    protocol.handle('tcglab',async request=>{";if(!s.includes(point))throw Error('Main bridge anchor');s=s.replace(point,"    ipcMain.handle('cube-import',async(event,url)=>{if(event.sender!==win?.webContents||!ownURL(event.senderFrame.url)||typeof url!=='string'||url.length>1000)throw Error('Invalid cube import request');return require('./cube-import.cjs').load((u,o)=>net.fetch(u,o),url);});\n"+point);fs.writeFileSync(path.join(folder,'main.cjs'),s);
s=fs.readFileSync(path.join(app,'preload.cjs'),'utf8').replace('exportJSON:(name,data)=>','importCube:url=>ipcRenderer.invoke(\'cube-import\',url),exportJSON:(name,data)=>');fs.writeFileSync(path.join(folder,'preload.cjs'),s);
console.log('Cube import bridge and UI checks prepared');
