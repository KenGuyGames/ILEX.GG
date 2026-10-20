const fs=require('fs'),path=require('path'),cp=require('child_process'),root=path.resolve(__dirname,'../..'),app=path.join(root,'work/dp-desktop-candidate/resources/app'),entry=path.join(app,'self-test.cjs'),original=fs.readFileSync(entry),dir=path.join(root,'work/desktop-table-repair-focus');
fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(entry,`const fs=require('fs'),path=require('path');module.exports=async(win,root)=>{for(let i=0;i<200;i++){if(await win.webContents.executeJavaScript("typeof rulesReady!=='undefined'&&rulesReady&&typeof CardFoil!=='undefined'"))break;await new Promise(r=>setTimeout(r,100));}const report=await win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname,'table-repair-native-tests.js'),'utf8'),true);fs.writeFileSync(path.join(root,'table-repair-native-tests.json'),JSON.stringify(report,null,2));};`);
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const child=cp.spawn(path.join(app,'../../ILEX.GG.exe'),['--no-sandbox','--self-test',dir],{cwd:path.join(app,'../..'),env,windowsHide:true,stdio:'inherit'});
child.on('exit',code=>{fs.writeFileSync(entry,original);process.exitCode=code;});
child.on('error',error=>{fs.writeFileSync(entry,original);console.error(error);process.exitCode=1;});
