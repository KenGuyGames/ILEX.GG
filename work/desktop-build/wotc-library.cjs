// Compile only fully understood effects. Unrecognized text stays unavailable.
const fs=require('fs'),path=require('path'),vm=require('vm');
const additionalAttack=require('./wotc-attack-patterns.cjs');
const finalClauses=require('./wotc-final-clauses.json');const clauseText=t=>String(t||'').replace(/\s+/g,' ').replace(/Flip a coin, If heads,/g,'Flip a coin. If heads,').trim();
const root=path.resolve(__dirname,'../..'),ui=path.join(root,'work/desktop/ui'),src=path.join(root,'work/cube-source/src');
const sets={base1:'BS',base2:'JU',base3:'FO',base4:'B2',base5:'TR',gym1:'G1',gym2:'G2',neo1:'N1',neo2:'N2',neo3:'N3',neo4:'N4',si1:'SI',base6:'LC',ecard1:'EX',ecard2:'AQ',ecard3:'SK',basep:'PR',bp:'BP'};
const canonical=Object.keys(sets).flatMap(s=>JSON.parse(fs.readFileSync(path.join(root,'work/card-sources/pokemon-tcg-data-master/cards/en',s+'.json'))).map(c=>({...c,set:{id:s}})));
const scanCards=JSON.parse(fs.readFileSync(path.join(ui,'cards.json'))),scanAliases={lc:'base6',bog:'bp'},numberAlias=s=>s.replace(/^H0+(?=\d)/i,'H').replace(/(?<=\d)[ab]$/i,'');
const cards=scanCards.flatMap(scan=>{const prefix=scan.id.slice(0,scan.id.lastIndexOf('-')),id=scanAliases[prefix]||prefix;if(!sets[id])return [];const number=scan.id.slice(prefix.length+1),source=canonical.find(c=>c.id===id+'-'+numberAlias(number));if(!source)throw Error('Uncataloged WOTC scan '+scan.id);return [{...source,id:scan.id,number,_sourceId:source.id,_sourceNumber:source.number}];});
// Verified against bundled Unown J promo #38 scan: JOIN requires Unown N.
// The upstream transcription incorrectly calls the fourth letter "Dragon".
for(const card of cards)if(card._sourceId==='basep-38')card.abilities=card.abilities.map(a=>({...a,text:a.text.replace('Unown Dragon','Unown [N]')}));
const context={console,setTimeout,clearTimeout};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(ui,'rules-engine.js'),'utf8'),context);
const engine=Object.values(context.TCGRules.sets).filter(Array.isArray).flat().filter(c=>!c.fullName.startsWith('ILEX WOTC '));
const oldMap=JSON.parse(fs.readFileSync(path.join(ui,'rules-card-map.json'))),unsafe=new Set(JSON.parse(fs.readFileSync(path.join(ui,'rules-coverage.json'))).knownIncompleteTemplates);
const norm=s=>String(s||'').normalize('NFKD').replace(/[^a-z0-9]/gi,'').toLowerCase().replace('impostorprofessoroak','imposterprofessoroak');
const atk=c=>(c.attacks||[]).map(a=>[norm(a.name),a.cost,a.damage]);
const identity=c=>JSON.stringify([norm(c.name),c.supertype,c.hp,c.types,c.evolvesFrom,atk(c),(c.abilities||[]).map(a=>[norm(a.name),a.type]),c.subtypes]);
const exact=c=>JSON.stringify([identity(c),(c.attacks||[]).map(a=>norm(a.text)),(c.abilities||[]).map(a=>norm(a.text)),(c.rules||[]).map(norm)]);
const sources=new Map();
// Match same-set definitions with a unique printed attack/power identity. This
// repairs wrong upstream numbers (TR 15/16/17 and Neo Metal Energy 19).
for(const d of cards){
 let c=engine.find(c=>c.fullName===oldMap[d.id])||engine.find(c=>c.set===sets[d.set.id]&&String(c.setNumber).toLowerCase()===String(d._sourceNumber).toLowerCase()&&norm(c.name)===norm(d.name)&&!unsafe.has(c.fullName));
 if(!c){const candidates=engine.filter(c=>c.set===sets[d.set.id]&&norm(c.name)===norm(d.name)&&!unsafe.has(c.fullName));
  const matched=d.supertype==='Pokémon'?candidates.filter(c=>JSON.stringify(c.attacks.map(a=>norm(a.name)))===JSON.stringify((d.attacks||[]).map(a=>norm(a.name)))&&JSON.stringify(c.powers.map(p=>norm(p.name)))===JSON.stringify((d.abilities||[]).map(a=>norm(a.name)))):candidates;
  if(matched.length===1)c=matched[0];
 }
 if(c)sources.set(d.id,c.fullName);
}
const {compile,compilePower,compileTrainer}=require('./printed-effect-compiler.cjs');
const printedLengths=JSON.parse(fs.readFileSync(path.join(root,'work/rules-research/wotc-card-lengths.json'),'utf8'));
const generated=[],pending=[];
for(const d of cards){
 let reuse=sources.get(d.id),reason='existing';
 if(!reuse){
  const reprint=cards.find(x=>sources.has(x.id)&&((['base4','base6'].includes(d.set.id)&&identity(x)===identity(d))||exact(x)===exact(d)));
  if(reprint){reuse=sources.get(reprint.id);reason='verified-reprint';}
 }
 if(reuse){generated.push({d,reuse,reason});continue;}
 if(d.set.id==='base6'){
  const compiledReprint=generated.find(x=>!x.reuse&&x.reason==='compiled-effects'&&identity(x.d)===identity(d));
  if(compiledReprint){generated.push({...compiledReprint,d,reason:'verified-compiled-reprint'});continue;}
 }
 if(d.supertype==='Energy'&&['Darkness Energy','Metal Energy'].includes(d.name)){
  const source=cards.find(x=>x.name===d.name&&sources.has(x.id));if(source){generated.push({d,reuse:sources.get(source.id),reason:'verified-reprint'});continue;}
 }
 if(d.supertype==='Energy'&&d.name==='Crystal Energy'&&(d.rules||[]).join(' ')==='Crystal Energy provides 1 Energy of all types (colors) of basic Energy cards attached to the Pokémon Crystal Energy is attached to. If there are no basic Energy cards attached to the Pokémon Crystal Energy is attached to, Crystal Energy provides Colorless Energy.'){generated.push({d,reason:'compiled-energy',specialEnergy:'crystal'});continue;}
 const specialEnergyTexts={
  'Bounce Energy':"This card provides ColorlessColorless Energy. You can attach this card to your Pokémon that has basic Energy cards attached to it. When you play this card from your hand and attach it to 1 of your Pokémon, return a basic Energy card attached to that Pokémon to your hand.",
  'Cyclone Energy':"This card provides Colorless Energy. When you play this card from your hand and attach it to your Active Pokémon, your opponent switches his or her Active Pokémon with 1 of his or her Benched Pokémon.",
  'Retro Energy':"This card provides Colorless Energy. When you play this card from your hand and attach it to 1 of your Evolved Pokémon, you may remove up to 2 damage counters from that Pokémon and discard the top card from it. (This counts as devolving it.)"
 };
 if(d.supertype==='Energy'&&specialEnergyTexts[d.name]===(d.rules||[]).join(' ')){generated.push({d,reason:'compiled-energy',specialEnergy:d.name.split(' ')[0].toLowerCase()});continue;}
 if(d.supertype==='Energy'&&finalClauses.energy.some(x=>x.name===d.name&&clauseText(x.text)===clauseText((d.rules||[]).join(' ')))){generated.push({d,reason:'compiled-energy',specialEnergy:'miracle'});continue;}
 if(d.supertype==='Energy'&&d.subtypes.includes('Basic')){generated.push({d,reason:'basic-energy',ops:[]});continue;}
 if(d.supertype==='Trainer'){const trainerOps=compileTrainer(d);if(trainerOps!==null){generated.push({d,trainerOps,reason:'compiled-trainer'});continue;}}
 const ops=(d.attacks||[]).map(a=>compile(a,d.name));
 const powers=(d.abilities||[]).map(a=>compilePower(a,d.name));
 const babyRule=d.subtypes?.includes('Baby')&&(d.rules||[]).every(r=>/^If (?:your Active Pokémon is a Baby Pokémon|this Baby Pokémon is your Active Pokémon) and your opponent (?:announces an attack|tries to attack), your opponent flips a coin \((?:before doing anything else|before doing anything required in order to use that attack)\)\. If tails, your opponent's turn ends(?: without an attack)?\.$/.test(r));
 const knownRules=(d.rules||[]).every(r=>babyRule||r==='You may have up to 4 Basic Pokémon cards in your deck with Unown in their names.'||r===`You can't have more than 1 ${d.name} in your deck.`&&d.name.startsWith('Shining '));
 if(d.supertype==='Pokémon'&&knownRules&&ops.every(x=>x!==null)&&powers.every(x=>x!==null)){generated.push({d,ops,powers,babyRule,reason:'compiled-effects'});continue;}
 pending.push({id:d.id,name:d.name,attacks:(d.attacks||[]).filter((a,i)=>ops[i]===null),abilities:d.abilities,rules:d.rules});
}
// Resolve compiled reprints after every source printing has been considered.
for(let i=pending.length-1;i>=0;i--){const d=cards.find(c=>c.id===pending[i].id);if(d.set.id!=='base6')continue;const source=generated.find(x=>!x.reuse&&x.reason==='compiled-effects'&&identity(x.d)===identity(d));if(source){generated.push({...source,d,reason:'verified-compiled-reprint'});pending.splice(i,1);}}
for(const record of generated)if(record.d.supertype==='Pokémon'){record.copyOps=(record.d.attacks||[]).map(a=>compile(a,record.d.name));record.printedLength=printedLengths[record.d._sourceId];}
fs.writeFileSync(path.join(src,'tcg-lab-wotc-data.ts'),'export const wotcData:any = '+JSON.stringify(generated)+';\n');
fs.writeFileSync(path.join(root,'work/rules-research/wotc-automation-pending.json'),JSON.stringify(pending,null,2));
const scanSets=JSON.parse(fs.readFileSync(path.join(ui,'sets.json')));
const plan={total:cards.length,available:generated.length,pending:pending.length,methods:generated.reduce((a,c)=>(a[c.reason]=(a[c.reason]||0)+1,a),{}),bySet:Object.keys(sets).map(id=>{const scanSetId=Object.keys(scanAliases).find(k=>scanAliases[k]===id)||id;return {id,scanSetId,name:scanSets.find(s=>s.id===scanSetId)?.name||id,total:cards.filter(c=>c.set.id===id).length,available:generated.filter(c=>c.d.set.id===id).length};})};
fs.writeFileSync(path.join(root,'work/rules-research/wotc-library-plan.json'),JSON.stringify(plan,null,2));
fs.writeFileSync(path.join(ui,'wotc-coverage.json'),JSON.stringify({...plan,unsupported:pending.map(c=>({id:c.id,name:c.name,attacks:c.attacks.map(a=>a.name),powers:(c.abilities||[]).map(a=>a.name)}))},null,2));
console.log(JSON.stringify({total:cards.length,available:generated.length,pending:pending.length,methods:generated.reduce((a,c)=>(a[c.reason]=(a[c.reason]||0)+1,a),{})}));



