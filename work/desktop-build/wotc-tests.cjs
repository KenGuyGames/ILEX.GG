const fs=require('fs'),vm=require('vm'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'rules-tests.cjs'),'utf8');
const extra=fs.readFileSync(path.join(__dirname,'bsf-test-cases.js'),'utf8')+'\n'+fs.readFileSync(path.join(__dirname,'wotc-test-cases.js'),'utf8');
const marker="fs.writeFileSync(path.join(root,'work/rules-research/rules-test-report.json')";
let suite=source.slice(0,source.indexOf(marker))+extra+'\n'+source.slice(source.indexOf(marker));
if(process.argv.includes('--focused')){
 suite=suite.replace('function test(name,fn){fn();',"function test(name,fn){if(name==='Every distinct Base–Fossil attack resolves its choices under both seeded coin branches'||name==='Every newly compiled distinct WOTC attack completes validated prompts under two seeded coin branches')return;fn();");
 suite=suite.replaceAll('rules-test-report.json','rules-focused-test-report.json').replaceAll('wotc-test-report.json','wotc-focused-test-report.json');
}
vm.runInNewContext(suite,{require,__dirname,console,setTimeout,clearTimeout},{filename:'wotc-tests.cjs'});
