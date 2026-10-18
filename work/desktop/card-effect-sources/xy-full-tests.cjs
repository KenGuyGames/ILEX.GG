const fs=require('fs'),vm=require('vm'),path=require('path');
const base=fs.readFileSync(path.join(__dirname,'rules-tests.cjs'),'utf8'),prefix=base.slice(0,base.indexOf("test('Limitless import:"));
const helpers=fs.readFileSync(path.join(__dirname,'xy-test-cases.js'),'utf8').split("test('Kalos and XY")[0];
vm.runInNewContext(prefix+helpers+fs.readFileSync(path.join(__dirname,'xy-full-test-cases.js'),'utf8'),{require,__dirname,console,setTimeout,clearTimeout,process},{filename:'xy-full-tests.cjs'});
