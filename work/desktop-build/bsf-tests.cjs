const fs=require('fs'),vm=require('vm'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'rules-tests.cjs'),'utf8');
const extra=fs.readFileSync(path.join(__dirname,'bsf-test-cases.js'),'utf8');
const marker="fs.writeFileSync(path.join(root,'work/rules-research/rules-test-report.json')";
vm.runInNewContext(source.slice(0,source.indexOf(marker))+extra+'\n'+source.slice(source.indexOf(marker)),{require,__dirname,console,setTimeout,clearTimeout},{filename:'bsf-tests.cjs'});
