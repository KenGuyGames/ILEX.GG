const fs=require('fs'),path=require('path');
const src=path.resolve(__dirname,'../rules-research/twinleafgg-main/ptcg-server/src');
const file=path.join(src,'tcg-lab-wotc.ts');let s=fs.readFileSync(file,'utf8');
if(!s.includes("import {svAction}"))s="import {svAction} from './tcg-lab-sv-actions';\n"+s;
if(!s.includes("case 'sv':"))s=s.replace("case 'swsh':return", "case 'sv':return svAction(store,state,b,op,next,{run:(ops:any,done:any)=>run(store,state,e,ops,done),damage,heal});\n case 'swsh':return");
if(!s.includes("import {svData}"))s="import {svData} from './tcg-lab-sv-data';\nimport {installSvCard} from './tcg-lab-sv-cards';\n"+s;
s=s.replace('...smData,...swshData])','...smData,...swshData,...svData])').replace('||swshData.includes(record),','||swshData.includes(record)||svData.includes(record),');
if(!s.includes('if(svData.includes(record))'))s=s.replace('supplemental.push(card);','if(svData.includes(record))installSvCard(card,record);\n supplemental.push(card);');
if(!s.includes('Object.assign(codes,{"sv01"'))s=s.replace('for(const record of [...wotcData','Object.assign(codes,{"sv01":"SVI"});\nfor(const record of [...wotcData');
if(process.argv.includes('--era')){
 const codes=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../desktop/ui/deck-set-codes.json'),'utf8'));
 Object.assign(codes,{svp:'SVP','2023sv':'MCD23','2024sv':'MCD24'});
 const svCodes=Object.fromEntries(Object.entries(codes).filter(([key])=>/^sv/.test(key)||['2023sv','2024sv'].includes(key)));
 const line='Object.assign(codes,'+JSON.stringify(svCodes)+');';
 if(!s.includes(line))s=s.replace('for(const record of [...wotcData',line+'\nfor(const record of [...wotcData');
 fs.writeFileSync(path.join(src,'tcg-lab-sv-data.ts'),"// Unvalidated full-era candidate activation. Production release remains unchanged.\nexport {svEraCandidateData as svData,svEraCandidateSupporterCopyData as svSupporterCopyData} from './tcg-lab-sv-era-candidate-data';\n");
}
fs.writeFileSync(file,s);
const powerFile=path.join(src,'tcg-lab-wotc-powers.ts');let powers=fs.readFileSync(powerFile,'utf8');
if(!powers.includes('import {svPower,'))powers="import {svPower,svPowerTrigger} from './tcg-lab-sv-powers';\n"+powers;
if(!powers.includes('!svPowerTrigger('))powers=powers.replace('if(!swshPowerTrigger(', 'if(!svPowerTrigger(op,e,owner,list)&&!swshPowerTrigger(');
if(!powers.includes("case 'activatedSv':"))powers=powers.replace("case 'activatedSwsh':", "case 'activatedSv':case 'svPassive':return svPower(card,op,power,store,state,e,owner,list,use);\n  case 'activatedSwsh':");
powers=powers.replace("const reactiveDamage=op.kind.startsWith('onDamaged')&&", "const reactiveDamage=(!op.active||owner.active===list)&&op.kind.startsWith('onDamaged')&&");
powers=powers.replace("case 'onDamagedReturnDamage':if(!op.requireCondition", "case 'onDamagedReturnDamage':if(op.requireTool&&!list.tools.length)break;if(!op.requireCondition");
fs.writeFileSync(powerFile,powers);
console.log('SV source registration installed; no release files built.');
