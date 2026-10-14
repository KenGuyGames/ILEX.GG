const fs=require('fs'),vm=require('vm'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'rules-tests.cjs'),'utf8'),bsf=fs.readFileSync(path.join(__dirname,'bsf-test-cases.js'),'utf8');
const marker="fs.writeFileSync(path.join(root,'work/rules-research/rules-test-report.json')";
const suite=source.slice(0,source.indexOf(marker))+bsf.slice(0,bsf.indexOf("test('Every Base"))+fs.readFileSync(path.join(__dirname,'undo-test-cases.js'),'utf8');
vm.runInNewContext(suite,{require,__dirname,console,setTimeout,clearTimeout},{filename:'undo-tests.cjs'});
