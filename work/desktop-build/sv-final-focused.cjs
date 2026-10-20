const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto'),root=path.resolve(__dirname,'../..');
const names=['foundation','common','bench',3,4,5,6,7,8,9,10,11,12,13,14,16,17,18,20,'environment','final-effects','final-extra','reaction','native-repair'].map(n=>typeof n==='number'?'wave'+n:n);
const results=[],engineSha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'work/sv-candidate/rules-engine.js'))).digest('hex');
for(const name of [...names.map(n=>'sv-'+n+'-tests'),'sv-tool-attacks','sv-deep-identity','sv-native-guard-audit','sv-full-power-audit','sv-full-trainer-audit']){
 const log=path.join(root,'work/sv-candidate/'+name+'-final.log'),fd=fs.openSync(log,'w');const r=cp.spawnSync(process.execPath,[path.join(__dirname,name+'.cjs')],{cwd:root,windowsHide:true,stdio:['ignore',fd,fd]});fs.closeSync(fd);results.push({name,passed:r.status===0,log:path.relative(root,log)});console.log(name+' '+r.status);if(r.status!==0)process.exit(1);
}
fs.writeFileSync(path.join(root,'work/rules-research/sv-final-focused.json'),JSON.stringify({passed:true,engineSha256,results},null,2));
