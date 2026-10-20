const fs=require('fs'),path=require('path'),dir=__dirname;
let s=fs.readFileSync(path.join(dir,'mega-candidate-preload.cjs'),'utf8').replaceAll('mega-candidate','unlimited-candidate').replaceAll('ILEX_MEGA_PRESERVE_REPORTS','ILEX_UNLIMITED_PRESERVE_REPORTS');
s=s.replace("p===path.join(root,'work/sv-candidate/rules-engine.js')","p===path.join(root,'work/sv-candidate/rules-engine.js')||p===path.join(root,'work/mega-candidate/ui/rules-engine.js')");
s=s.replace("if(process.env.ILEX_UNLIMITED_PRESERVE_REPORTS==='1')", "if(true)").replace("&&/^(sv|swsh)-/.test(path.basename(file))",'');
// Mega's focused fixtures explicitly point at its candidate adapter too.
s=s.replace("else if(relative&&!relative.startsWith('..')", "else if(p.startsWith(path.join(root,'work/mega-candidate/ui')+path.sep))file=path.join(to,path.basename(p));else if(relative&&!relative.startsWith('..')");
fs.writeFileSync(path.join(dir,'unlimited-candidate-preload.cjs'),s);
for(const name of ['shared-regressions','preserved-modern']){
 s=fs.readFileSync(path.join(dir,'mega-'+name+'.cjs'),'utf8').replaceAll('mega-candidate','unlimited-candidate').replaceAll('mega-'+name,'unlimited-'+name).replaceAll('ILEX_MEGA_PRESERVE_REPORTS','ILEX_UNLIMITED_PRESERVE_REPORTS');
 fs.writeFileSync(path.join(dir,'unlimited-'+name+'.cjs'),s);
}
console.log('Historical, modern and private-protocol regressions target the isolated Unlimited candidate.');
