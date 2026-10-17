const fs=require('fs'),path=require('path'),{spawn}=require('child_process');
const root=__dirname,source=path.resolve(root,'../dp-desktop-candidate'),dest=path.join(root,'preview-runtime');
fs.mkdirSync(dest,{recursive:true});
for(const file of fs.readdirSync(source)){if(file==='resources'||file.endsWith('.md')||file.endsWith('.json'))continue;if(!fs.existsSync(path.join(dest,file)))fs.cpSync(path.join(source,file),path.join(dest,file),{recursive:true});}
fs.cpSync(path.join(root,'preview'),path.join(dest,'resources/app'),{recursive:true});
const env={...process.env,ILEX_ANDROID_ROOT:root};delete env.ELECTRON_RUN_AS_NODE;
const p=spawn(path.join(dest,'ILEX.GG.exe'),['--no-sandbox','--disable-gpu','--enable-logging=stderr'],{env,windowsHide:true,stdio:'pipe'});
p.stdout.on('data',d=>process.stdout.write(d));p.stderr.on('data',d=>process.stderr.write(d));
const timer=setTimeout(()=>{p.kill();process.exitCode=1},120000);p.on('exit',code=>{clearTimeout(timer);process.exitCode=code===0?0:1});p.on('error',e=>{console.error(e);clearTimeout(timer);process.exitCode=1});
