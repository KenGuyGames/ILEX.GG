const {spawn}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const child=spawn(path.join(root,'outputs/ILEX.GG-win32-x64/ILEX.GG.exe'),['--enable-logging=stderr','--no-sandbox','--self-test',path.join(root,'work/desktop-ilex-wotc-tests-v24')],{windowsHide:true,env,stdio:'pipe'});
child.stdout.on('data',d=>process.stdout.write(d));
child.stderr.on('data',d=>process.stderr.write(d));
const timer=setTimeout(()=>{child.kill();console.error('Desktop self-test timed out');process.exitCode=1},90000);
child.on('error',e=>{clearTimeout(timer);console.error(e);process.exitCode=1});
child.on('exit',(code)=>{clearTimeout(timer);console.log('Desktop self-test exit: '+code);process.exitCode=code===0?0:1});




