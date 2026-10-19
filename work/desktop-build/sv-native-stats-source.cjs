const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const root=path.resolve(__dirname,'../..'),ui=path.join(root,'work/desktop/ui'),read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const engine=fs.readFileSync(path.join(ui,'rules-engine.js')),ctx={console,setTimeout,clearTimeout};vm.createContext(ctx);vm.runInContext(engine.toString(),ctx);
const R=ctx.TCGRules,native=Object.values(R.sets).filter(Array.isArray).flat().filter(c=>!c.fullName.startsWith('ILEX '));
const supplementFile=path.join(root,'work/card-sources/sv-supplements.json'),data=read(supplementFile),types={Grass:R.CardType.GRASS,Fire:R.CardType.FIRE,Water:R.CardType.WATER,Lightning:R.CardType.LIGHTNING,Psychic:R.CardType.PSYCHIC,Fighting:R.CardType.FIGHTING,Darkness:R.CardType.DARK,Metal:R.CardType.METAL,Colorless:R.CardType.COLORLESS,Dragon:R.CardType.DRAGON,Fairy:R.CardType.FAIRY},typeName=Object.fromEntries(Object.entries(types).map(([k,v])=>[v,k]));
const norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/gi,'').toLowerCase();
const matched=[],unresolved=[],conflicts=[];
for(const d of data.filter(d=>d._svSourceIncomplete)){
 const set=d.set.id==='sv10.5b'?'BLK':'WHT';
 const candidates=native.filter(c=>c.set===set&&norm(c.name)===norm(d.name)&&Number(c.hp)===Number(d.hp)&&c.stage===(d.subtypes.includes('Stage 2')?R.Stage.STAGE_2:d.subtypes.includes('Stage 1')?R.Stage.STAGE_1:R.Stage.BASIC)&&JSON.stringify(Array.from(c.cardType))===JSON.stringify(d.types.map(t=>types[t]))&&c.attacks.length===d.attacks.length&&c.attacks.every((a,i)=>norm(a.name)===norm(d.attacks[i].name)&&Number(a.damage||0)===(parseInt(d.attacks[i].damage)||0)&&JSON.stringify(Array.from(a.cost))===JSON.stringify(d.attacks[i].cost.map(t=>types[t])))&&c.powers.length===(d.abilities||[]).length&&c.powers.every((p,i)=>norm(p.name)===norm(d.abilities[i].name)));
 if(!candidates.length){unresolved.push(d.id);continue;}
 const stats=c=>({weaknesses:Array.from(c.weakness||[],w=>({type:typeName[w.type],value:w.value?String(w.value):'×2'})),resistances:Array.from(c.resistance||[],w=>({type:typeName[w.type],value:String(w.value??-30)})),retreatCost:Array.from(c.retreat||[],t=>typeName[t])});
 const signatures=new Set(candidates.map(c=>JSON.stringify(stats(c))));
 if(signatures.size!==1){conflicts.push({id:d.id,reason:'Native counterparts disagree',candidates:candidates.map(c=>({name:c.fullName,stats:stats(c)}))});continue;}
 const s=stats(candidates[0]);
 if(JSON.stringify(s.retreatCost)!==JSON.stringify(d.retreatCost)){conflicts.push({id:d.id,reason:'Cached retreat differs',cached:d.retreatCost,native:s.retreatCost});continue;}
 d.weaknesses=s.weaknesses;d.resistances=s.resistances;delete d._svSourceIncomplete;
 d._svStatsSource={kind:'native-printed-source-candidate',counterparts:candidates.map(c=>c.fullName),verification:'Full scan/stat audit still required; not release validated'};
 matched.push({id:d.id,...d._svStatsSource,stats:s});
}
fs.writeFileSync(supplementFile,JSON.stringify(data,null,2));
fs.writeFileSync(path.join(root,'work/rules-research/sv-native-stat-provenance.json'),JSON.stringify({status:'candidate-stat-transcription-not-validation',sourceEngineSha256:crypto.createHash('sha256').update(engine).digest('hex'),matched,unresolved,conflicts},null,2));
console.log(JSON.stringify({matched:matched.length,unresolved:unresolved.length,conflicts:conflicts.length}));
