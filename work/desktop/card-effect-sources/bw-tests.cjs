const fs=require('fs'),vm=require('vm'),path=require('path');
const base=fs.readFileSync(path.join(__dirname,'rules-tests.cjs'),'utf8'),prefix=base.slice(0,base.indexOf("test('Limitless import:"));
const cases=fs.readFileSync(path.join(__dirname,'bw-test-cases.js'),'utf8');
vm.runInNewContext(prefix+cases,{require,__dirname,console,setTimeout,clearTimeout,process},{filename:'bw-tests.cjs'});
