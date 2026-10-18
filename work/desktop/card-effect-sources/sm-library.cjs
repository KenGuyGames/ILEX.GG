const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../..'),research=path.join(root,'work/rules-research'),read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const inventory=read(path.join(research,'sm-inventory.json')),attack=require('./sm-attack-patterns.cjs'),power=require('./sm-power-patterns.cjs'),trainer=require('./sm-trainer-patterns.cjs'),held=require('./dp-printed-rules.cjs');
const data=[],pending=[];
for(const row of inventory.rows){
 if(!row.d){pending.push({id:row.id,name:row.name,reason:'missing-printed-text'});continue;}
 const d=row.d,ops=(d.attacks||[]).map(a=>attack({...a,text:(a.text||'').replace(/\s*\(You can't use more than 1 GX attack in a game\.\)/g,'')},d.name)),powers=(d.abilities||[]).map(a=>power(a,d.name)),trainerOps=d.supertype==='Trainer'?trainer(d):null;
 const heldRules=held({...d,rules:(d.rules||[]).filter(r=>!/^Pokémon-GX rule:|^TAG TEAM rule:|^◇ \(Prism Star\) rule:/.test(r))});
 const verifiedAliases={'sm8-59':'Suicune LOT','sm4-68':'Registeel CIN'};
 let record;if((['sm4-6','sm11-157','sm3.5-19'].includes(d.id)||d.name==='Greninja & Zoroark-GX')&&ops.every(o=>o!==null))record={d,ops,powers,reason:'compiled-origin-repair'};
 else if(verifiedAliases[d.id])record={d,reuse:verifiedAliases[d.id],reason:'native-equivalent-printed-label'};
 else if(['Misty & Lorelei','Bonnie','Flyinium Z: Air Slash'].includes(d.name))record={d,trainerOps,reason:'compiled-gx-permission'};
 else if(row.native.length)record={d,reuse:row.native[0],reason:'native-source'};
 else if(trainerOps!==null)record={d,trainerOps,reason:'compiled-trainer'};
 else if(d.supertype==='Energy'&&d.subtypes.includes('Basic'))record={d,ops:[],reason:'basic-energy'};
 else if(d.supertype==='Pokémon'&&heldRules!==null&&ops.every(o=>o!==null)&&powers.every(p=>p!==null))record={d,ops,powers,reason:'compiled-effects'};
 if(record){record.copyOps=ops;record.heldRules=heldRules||[];data.push(record);}else pending.push({id:d.id,name:d.name,reason:'uncompiled-effect',supertype:d.supertype,rules:d.rules,attacks:(d.attacks||[]).filter((a,i)=>ops[i]===null),abilities:(d.abilities||[]).filter((a,i)=>powers[i]===null)});
}
fs.writeFileSync(path.join(research,'sm-wave-data.json'),JSON.stringify(data,null,2));fs.writeFileSync(path.join(research,'sm-pending.json'),JSON.stringify(pending,null,2));
const plan={status:'candidate-source-unvalidated',total:inventory.total,available:data.length,pending:pending.length,validated:0,interactionScope:inventory.scope,bySet:inventory.bySet.map(s=>({...s,available:data.filter(r=>r.d.set.id===s.id).length,validated:0})),unsupported:pending};
fs.writeFileSync(path.join(root,'work/desktop/ui/sm-coverage.json'),JSON.stringify(plan,null,2));fs.writeFileSync(path.join(research,'twinleafgg-main/ptcg-server/src/tcg-lab-sm-data.ts'),'export const smData:any = '+JSON.stringify(data)+';\nexport const smSupporterCopyData:any = '+JSON.stringify(Object.fromEntries(data.filter(r=>r.d.subtypes?.includes('Supporter')&&(r.trainerOps||trainer(r.d))).map(r=>[r.d.id,r.trainerOps||trainer(r.d)])))+';\n');
console.log(JSON.stringify({total:plan.total,available:data.length,pending:pending.length,missingText:pending.filter(r=>r.reason==='missing-printed-text').length,uncompiled:pending.filter(r=>r.reason==='uncompiled-effect').map(r=>r.id+' '+r.name)},null,2));
