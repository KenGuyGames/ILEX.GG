const fs=require('fs'),path=require('path'),vm=require('vm');
let source=fs.readFileSync(path.join(__dirname,'bot-tests.cjs'),'utf8');
source="class StrategyClock extends Date {static now(){return 0;}}\n"+source.replace('ctx={console,Date,setTimeout','ctx={console,Date:StrategyClock,setTimeout').replace("for(const level of Object.keys(B.levels))test(level+' completes","ctx.Date=Date;\nfor(const level of Object.keys(B.levels))test(level+' completes");
// Fixed clock for exact tactical choices; real clock for all complete games.
vm.runInNewContext(source,{require,__dirname,console,Date,setTimeout,clearTimeout,process});
