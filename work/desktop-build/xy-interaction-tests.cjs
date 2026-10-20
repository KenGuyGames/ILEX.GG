const fs=require('fs'),vm=require('vm'),path=require('path');
const base=fs.readFileSync(path.join(__dirname,'rules-tests.cjs'),'utf8'),prefix=base.slice(0,base.indexOf("test('Limitless import:")),helpers=fs.readFileSync(path.join(__dirname,'xy-test-cases.js'),'utf8').split("test('Kalos and XY")[0];
// During discovery keep each failure independent so one defect does not hide another.
const discovery=process.env.ILEX_XY_DISCOVERY==='1';
const source=prefix+helpers+(discovery?`const failures=[];test=(name,fn)=>{try{fn();passed.push(name);console.log('PASS '+name);}catch(error){failures.push({name,error:error.message});console.log('FAIL '+name+': '+error.message);}};`:'')+fs.readFileSync(path.join(__dirname,'xy-interaction-cases.js'),'utf8')+(discovery?`fs.writeFileSync(path.join(root,'work/rules-research/xy-interaction-discovery.json'),JSON.stringify({failures},null,2));`:'');
vm.runInNewContext(source,{require,__dirname,console,setTimeout,clearTimeout,process},{filename:'xy-interaction-tests.cjs'});
