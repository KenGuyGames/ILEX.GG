const path=require('node:path'),cp=require('node:child_process');
for(const name of ['mega-focused-tests.cjs','mega-framework-tests.cjs']){
 const result=cp.spawnSync(process.execPath,[path.join(__dirname,name)],{stdio:'inherit',windowsHide:true});
 if(result.status!==0)process.exit(result.status||1);
}
