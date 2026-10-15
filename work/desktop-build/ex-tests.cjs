const fs=require('fs'),vm=require('vm'),path=require('path');
const base=fs.readFileSync(path.join(__dirname,'rules-tests.cjs'),'utf8');
const prefix=base.slice(0,base.indexOf("test('Limitless import:"));
// fixtureCard is declared farther down; use a purpose-built EX-only fixture.
const cases=fs.readFileSync(path.join(__dirname,'ex-test-cases.js'),'utf8')+fs.readFileSync(path.join(__dirname,'ex-batch-test-cases.js'),'utf8')+fs.readFileSync(path.join(__dirname,'ex-selected-test-cases.js'),'utf8')+fs.readFileSync(path.join(__dirname,'ex-wave-test-cases.js'),'utf8')+fs.readFileSync(path.join(__dirname,'ex-finish-test-cases.js'),'utf8')+fs.readFileSync(path.join(__dirname,'ex-interaction-test-cases.js'),'utf8')+fs.readFileSync(path.join(__dirname,'ex-holon-test-cases.js'),'utf8');
const selected=process.argv.find(a=>a.startsWith('--case='))?.slice(7);
const reportFile=selected?'ex-selected-focused-test-report.json':'ex-focused-test-report.json';
const selectedPrefix=selected?prefix.replace('function test(name,fn){fn();',"function test(name,fn){if(!name.includes("+JSON.stringify(selected)+"))return;fn();"):prefix;
vm.runInNewContext(selectedPrefix+cases+"\nfs.writeFileSync(path.join(root,'work/rules-research/"+reportFile+"'),JSON.stringify({passed:true,checks:passed,candidate:true,engineSha256:require('crypto').createHash('sha256').update(fs.readFileSync(path.join(ui,'rules-engine.js'))).digest('hex')},null,2));",{require,__dirname,console,setTimeout,clearTimeout},{filename:'ex-tests.cjs'});

