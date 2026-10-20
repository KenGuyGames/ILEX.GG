const fs=require('fs'),path=require('path');
// Initial generator only; preserve the completed conditional fixtures.
if(fs.readFileSync(path.join(__dirname,'sm-full-sweep.cjs'),'utf8').includes('function attackConditions'))throw Error('Final SM runners already exist; do not overwrite their fixtures.');
for(const [from,to] of [['xy-full-sweep.cjs','sm-full-sweep.cjs'],['xy-full-power-audit.cjs','sm-full-power-audit.cjs'],['xy-full-trainer-audit.cjs','sm-full-trainer-audit.cjs']]){
 let s=fs.readFileSync(path.join(__dirname,from),'utf8').replaceAll('xy-full-wave-data.json','sm-wave-data.json').replaceAll('xy-full','sm-full').replaceAll('ILEX_XY','ILEX_SM').replaceAll("setup('xy',blank)","setup('sm',blank)").replaceAll('Kalos Starter/XY with BW-onward fixtures','Sun & Moon with BW-onward fixtures');
 fs.writeFileSync(path.join(__dirname,to),s);
}
