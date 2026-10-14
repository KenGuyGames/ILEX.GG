const fs=require('fs'),vm=require('vm'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'rules-tests.cjs'),'utf8');
const bsf=fs.readFileSync(path.join(__dirname,'bsf-test-cases.js'),'utf8');
const helpers=bsf.slice(0,bsf.indexOf("test('Every Base"));
const marker="fs.writeFileSync(path.join(root,'work/rules-research/rules-test-report.json')";
const suite=source.slice(0,source.indexOf(marker))+helpers+fs.readFileSync(path.join(__dirname,'gym-heroes-test-cases.js'),'utf8')+"\nfs.writeFileSync(path.join(root,'work/rules-research/gym-heroes-test-report.json'),JSON.stringify({passed:passed.length,checks:passed,attackScenarios:globalThis.gymScenarios},null,2));";
vm.runInNewContext(suite,{require,__dirname,console,setTimeout,clearTimeout},{filename:'gym-heroes-tests.cjs'});
