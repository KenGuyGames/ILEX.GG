const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'../..'),read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const supplementFile=path.join(root,'work/card-sources/sv-supplements.json'),provenanceFile=path.join(root,'work/rules-research/sv-supplement-provenance.json');
const inventory=read(path.join(root,'work/rules-research/sv-inventory.json')),out=fs.existsSync(supplementFile)?read(supplementFile):[],sources=fs.existsSync(provenanceFile)?read(provenanceFile).sources:[],unresolved=[];
for(const row of inventory.rows.filter(r=>!r.d)){
 const file=path.join(root,'work/card-sources/pack-finishes',row.id+'.json');if(!fs.existsSync(file)){unresolved.push({id:row.id,reason:'No cached text record'});continue;}
 const source=read(file),pokemon=source.category==='Pokemon',energy=source.category==='Energy';
 const subtypes=pokemon?[source.stage==='Stage1'?'Stage 1':source.stage==='Stage2'?'Stage 2':'Basic',...(source.suffix?[source.suffix]:[])]:energy?[source.energyType==='Normal'?'Basic':'Special']:[source.trainerType==='Supporter'?'Supporter':source.trainerType==='Stadium'?'Stadium':source.trainerType==='Tool'?'Pokémon Tool':'Item'];
 const d={id:row.id,number:source.localId,name:source.name,supertype:pokemon?'Pokémon':energy?'Energy':'Trainer',subtypes,set:{id:row.set},regulationMark:source.regulationMark,rarity:source.rarity};
 if(pokemon){
  Object.assign(d,{hp:String(source.hp),types:source.types||[],evolvesFrom:source.evolveFrom,attacks:(source.attacks||[]).map(a=>({name:a.name,cost:a.cost||[],damage:String(a.damage||''),text:a.effect||''})),abilities:(source.abilities||[]).map(a=>({name:a.name,type:'Ability',text:a.effect||''})),retreatCost:Array(source.retreat||0).fill('Colorless')});
  if(source.weaknesses)d.weaknesses=source.weaknesses;if(source.resistances)d.resistances=source.resistances;
  // These catalogs omit known printed Weakness information. Keep the gap visible.
  if(['sv10.5b','sv10.5w'].includes(row.set)&&!source.weaknesses)d._svSourceIncomplete=['Printed Weakness/Resistance must be verified against a complete source or scan'];
 }
 if(source.effect)d.rules=[source.effect];
 if(source.rules)d.rules=Array.isArray(source.rules)?source.rules:[source.rules];
 if(!out.some(r=>r.id===d.id))out.push(d);if(!sources.some(r=>r.id===d.id))sources.push({id:row.id,url:'https://api.tcgdex.net/v2/en/cards/'+row.id,cache:path.relative(root,file),sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),fieldsIncomplete:d._svSourceIncomplete||[]});
}
fs.writeFileSync(path.join(root,'work/card-sources/sv-supplements.json'),JSON.stringify(out,null,2));
fs.writeFileSync(path.join(root,'work/rules-research/sv-supplement-provenance.json'),JSON.stringify({status:'candidate-transcription-not-validated',records:out.length,sources,unresolved},null,2));
console.log(JSON.stringify({candidateRecords:out.length,missing:unresolved.length,incompletePrintStats:out.filter(d=>d._svSourceIncomplete).length}));
