const {spawn}=require('node:child_process'),path=require('node:path');
const exe=path.resolve(__dirname,'../../outputs/TCG Lab-win32-x64/TCG Lab.exe');
const child=spawn(exe,['-p','JSON.stringify(process.versions)'],{windowsHide:true,env:{...process.env,ELECTRON_RUN_AS_NODE:'1'},stdio:'pipe'});
child.stdout.on('data',d=>process.stdout.write(d));child.stderr.on('data',d=>process.stderr.write(d));
child.on('exit',code=>{console.log('Runtime diagnostic exit: '+code);process.exitCode=code===0?0:1});
