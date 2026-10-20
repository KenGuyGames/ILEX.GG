const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../..'),ui=path.join(root,'work/unlimited-candidate/ui');
const read=n=>JSON.parse(fs.readFileSync(path.join(ui,n))),details=read('card-details.json'),map=read('rules-card-map.json'),sets=read('sets.json'),rank=new Map(sets.map((s,i)=>[s.id,i]));
const setOf=id=>sets.filter(s=>id.startsWith(s.id+'-')).sort((a,b)=>b.id.length-a.id.length)[0]?.id;
const groups=new Map();
for(const [id,d]of Object.entries(details)){const special=d.category==='Energy'&&d.energyType==='Special'&&!d.subtypes?.includes('Basic');if((d.category!=='Trainer'&&!special)||!map[id]||id.startsWith('limitless')||['mfb','30th-c','cel25cc'].includes(setOf(id)))continue;const key=d.category+'|'+d.name,group=groups.get(key)||[];group.push({id,rank:rank.get(setOf(id))??-1,d});groups.set(key,group);}
const nameAliases={},idAliases={},groupsOut=[];
for(const [key,rows]of groups){rows.sort((a,b)=>b.rank-a.rank||a.id.localeCompare(b.id,undefined,{numeric:true}));const latest=rows[0];if(rows.length<2)continue;for(const old of rows){if(old.id===latest.id)continue;if(map[old.id]===map[latest.id])continue;idAliases[old.id]=latest.id;const existing=nameAliases[map[old.id]];if(existing&&existing!==map[latest.id])throw Error('Conflicting Unlimited identity '+old.id);nameAliases[map[old.id]]=map[latest.id];}groupsOut.push({name:latest.d.name,category:latest.d.category,reference:latest.id,printings:rows.map(r=>r.id)});}
const p=path.join(ui,'rules-match.js');let s=fs.readFileSync(p,'utf8');
if(!s.includes('function resolveCardName(')){
 s=s.replace('  const manager=',"  const unlimitedReprints="+JSON.stringify(nameAliases)+";\n  function resolveCardName(name,profile){return profile==='unlimited'?(unlimitedReprints[name]||name):name;}\n  const manager=");
 s=s.replace('if(map[id])return map[id];',"if(map[id])return resolveCardName(map[id],spec.profile);");
 s=s.replace('return {R,profiles,prototypes,','return {R,profiles,prototypes,resolveCardName,');
}else s=s.replace(/const unlimitedReprints=.*?;\n/,"const unlimitedReprints="+JSON.stringify(nameAliases)+";\n");
fs.writeFileSync(p,s);
fs.writeFileSync(path.join(ui,'unlimited-reprints.json'),JSON.stringify({idAliases,groups:groupsOut,policy:'Trainer and Special Energy reprints use newest catalog wording only in Unlimited; printed IDs/art remain intact. Pokémon are never merged, and Basic Energy is kept distinct from Special Energy.'},null,2));
const counts={trainerPrintingOverrides:Object.keys(idAliases).filter(id=>details[id].category==='Trainer').length,specialEnergyPrintingOverrides:Object.keys(idAliases).filter(id=>details[id].category==='Energy').length,trainerGroups:groupsOut.filter(g=>g.category==='Trainer').length,specialEnergyGroups:groupsOut.filter(g=>g.category==='Energy').length};
fs.writeFileSync(path.join(root,'work/rules-research/unlimited-reprints-audit.json'),JSON.stringify({status:'candidate-needs-validation',...counts,groups:groupsOut},null,2));
console.log(JSON.stringify(counts));

require('./format-reprints.cjs');
