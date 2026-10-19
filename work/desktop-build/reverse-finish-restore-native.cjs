const fs=require('fs'),path=require('path'),cp=require('child_process');
const root=path.resolve(__dirname,'../..'),candidate=path.join(root,'work/dp-desktop-candidate'),app=path.join(candidate,'resources/app'),hook=path.join(app,'self-test.cjs'),backup=fs.readFileSync(hook),dir=path.join(root,'work/reverse-finish-native');fs.mkdirSync(dir,{recursive:true});
for(const name of ['index.html','app.js','packs.js','finish-catalog.js','foil.js','pack-finish-view.js'])fs.copyFileSync(path.join(root,'work/desktop/ui',name),path.join(app,'ui',name));
const fixture=`(()=>{const pack=state.packOpening;if(pack?.last?.id!=='reverse-native-fixture'||pack.collection['sv08.5-001|reverse']!==2||pack.collection['sv08.5-001|masterball']!==4)throw Error('Finish state did not restore');if(pack.last.cards.some(c=>c.revealed))throw Error('Unrevealed pack changed');return {passed:true,restoredExactFinishes:true,hiddenPackRetained:true};})()`;
const body=`const fs=require('fs'),path=require('path');module.exports=async(w,dir)=>{
 const run=async s=>{const result=await w.webContents.executeJavaScript('(async()=>{try{return await ('+s+')}catch(e){return {testError:e.stack}}})()',true);if(result?.testError)throw Error(result.testError);return result;},pause=ms=>new Promise(r=>setTimeout(r,ms));
 for(let i=0;i<200;i++){if(await run("typeof RulesMatch!=='undefined'&&rulesReady&&cards.length>23700"))break;await pause(100);}
 const fixture=await run(${JSON.stringify(fixture)});fs.writeFileSync(path.join(dir,'restored.json'),JSON.stringify(fixture,null,2));await pause(800);fs.writeFileSync(path.join(dir,'restored.png'),(await w.webContents.capturePage()).toPNG());
};`;
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
try{fs.writeFileSync(hook,body);const p=cp.spawnSync(path.join(candidate,'ILEX.GG.exe'),['--no-sandbox','--self-test',dir],{env,cwd:candidate,windowsHide:true,encoding:'utf8',timeout:90000});fs.writeFileSync(path.join(dir,'run.log'),(p.stdout||'')+(p.stderr||''));if(p.status!==0)throw Error(fs.existsSync(path.join(dir,'failure.txt'))?fs.readFileSync(path.join(dir,'failure.txt'),'utf8'):String(p.error||p.stderr||p.status));console.log(fs.readFileSync(path.join(dir,'result.json'),'utf8'));}finally{fs.writeFileSync(hook,backup);}

