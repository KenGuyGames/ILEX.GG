const fs=require('fs'),vm=require('vm'),path=require('path');
const base=fs.readFileSync(path.join(__dirname,'rules-tests.cjs'),'utf8'),prefix=base.slice(0,base.indexOf("test('Limitless import:"));
vm.runInNewContext(prefix+fs.readFileSync(path.join(__dirname,'xy-test-cases.js'),'utf8'),{require,__dirname,console,setTimeout,clearTimeout,process},{filename:'xy-tests.cjs'});
