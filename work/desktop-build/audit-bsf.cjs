const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'../..'),ui=path.join(root,'work/desktop/ui');const ctx={console,setTimeout,clearTimeout};vm.createContext(ctx);for(const f of ['rules-engine.js','rules-match.js'])vm.runInContext(fs.readFileSync(path.join(ui,f),'utf8'),ctx);
const R=ctx.TCGRules,map=JSON.parse(fs.readFileSync(path.join(ui,'rules-card-map.json'))),all=Object.values(R.sets).filter(Array.isArray).flat();
const type=n=>({Fire:R.CardType.FIRE,Grass:R.CardType.GRASS,Water:R.CardType.WATER,Lightning:R.CardType.LIGHTNING,Psychic:R.CardType.PSYCHIC,Fighting:R.CardType.FIGHTING,Colorless:R.CardType.COLORLESS})[n];const differences=[];
for(const s of ['base1','base2','base3'])for(const d of JSON.parse(fs.readFileSync(path.join(root,'work/card-sources/pokemon-tcg-data-master/cards/en',s+'.json')))){
 const c=all.find(c=>c.fullName===map[d.id]);if(!c){differences.push({id:d.id,name:d.name,missing:true});continue;}
 if(d.supertype!=='Pokémon')continue;const compare=(k,a,b)=>{if(JSON.stringify(a)!==JSON.stringify(b))differences.push({id:d.id,name:d.name,field:k,printed:a,engine:b});};
 compare('hp',Number(d.hp),c.hp);compare('types',d.types.map(type),Array.from(c.cardType));compare('retreat',(d.retreatCost||[]).map(type),Array.from(c.retreat));compare('evolvesFrom',d.evolvesFrom||'',c.evolvesFrom||'');compare('weakness',(d.weaknesses||[]).map(w=>type(w.type)),Array.from(c.weakness,w=>w.type));compare('resistance',(d.resistances||[]).map(w=>[type(w.type),Number(w.value)]),Array.from(c.resistance,w=>[w.type,w.value]));compare('attacks',(d.attacks||[]).map(a=>[a.name,a.cost.map(type),Number.parseInt(a.damage)||0]),Array.from(c.attacks,a=>[a.name,Array.from(a.cost),a.damage]));
}
fs.writeFileSync(path.join(root,'work/rules-research/base-fossil-audit.json'),JSON.stringify(differences,null,2));console.log(JSON.stringify(differences,null,2));

