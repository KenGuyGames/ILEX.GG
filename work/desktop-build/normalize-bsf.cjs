// Correct printed fields independently of effect implementations. This is not
// an effect generator: only the existing, implemented Base/Jungle/Fossil cards
// receive their original printed stats, evolution names, attack names and costs.
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'../..');
const data={};for(const [id,code] of [['base1','BS'],['base2','JU'],['base3','FO']])for(const c of JSON.parse(fs.readFileSync(path.join(root,'work/card-sources/pokemon-tcg-data-master/cards/en',id+'.json'))))data[code+'-'+c.number]=c;
const dest=path.join(root,'work/rules-research/twinleafgg-main/ptcg-server/src/tcg-lab-printed.ts');
fs.writeFileSync(dest,`import * as sets from './sets';
import { CardType, Stage, SuperType } from './game';
const data: any = ${JSON.stringify(data)};
const types: any = {Fire:CardType.FIRE,Grass:CardType.GRASS,Water:CardType.WATER,Lightning:CardType.LIGHTNING,Psychic:CardType.PSYCHIC,Fighting:CardType.FIGHTING,Colorless:CardType.COLORLESS};
for (const cards of Object.values(sets)) if(Array.isArray(cards)) for(const card of cards) {
 const d=data[card.set+'-'+card.setNumber]; if(!d)continue;
 if(d.supertype==='Trainer')card.name=d.name;
 if(card.superType===SuperType.POKEMON){
  card.hp=Number(d.hp);card.cardType=d.types.map((t:string)=>types[t]);card.evolvesFrom=d.evolvesFrom||'';
  card.stage=d.subtypes.includes('Stage 2')?Stage.STAGE_2:d.subtypes.includes('Stage 1')?Stage.STAGE_1:Stage.BASIC;
  card.weakness=(d.weaknesses||[]).map((w:any)=>({type:types[w.type]}));card.resistance=(d.resistances||[]).map((w:any)=>({type:types[w.type],value:Number(w.value)}));card.retreat=(d.retreatCost||[]).map((t:string)=>types[t]);
  if(card.attacks.length!==(d.attacks||[]).length)throw Error('Printed attack count differs: '+card.fullName);
  card.attacks.forEach((a:any,i:number)=>{const printed=d.attacks[i];a.name=printed.name;a.cost=printed.cost.map((t:string)=>types[t]);a.damage=Number.parseInt(printed.damage)||0;});
 }
 if(card.set==='FO'&&card.setNumber==='62')card.hp=10;
}
`);
console.log('Original printed Base/Jungle/Fossil fields prepared');
