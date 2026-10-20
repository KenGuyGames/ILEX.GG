const fs=require('fs'),path=require('path'),crypto=require('crypto');module.exports=async(win,dir)=>{
 const run=s=>win.webContents.executeJavaScript(s,true);for(let i=0;i<150;i++){if(await run("typeof cubeAssets!=='undefined'&&rulesReady"))break;await new Promise(r=>setTimeout(r,100));}await run('cubeAssets');
 const checks=await run(fs.readFileSync(path.join(__dirname,'mutant-browser-checks.js'),'utf8'));
 fs.writeFileSync(path.join(dir,'cube-native-tests.json'),JSON.stringify({passed:true,checks,hashes:Object.fromEntries(['rules-engine.js'].map(n=>[n,crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'ui',n))).digest('hex')]))},null,2));
};
