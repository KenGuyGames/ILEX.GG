// Compile only fully understood effects. Unrecognized text stays unavailable.
const fs=require('fs'),path=require('path'),vm=require('vm');
const additionalAttack=require('./wotc-attack-patterns.cjs');
const root=path.resolve(__dirname,'../..'),ui=path.join(root,'work/desktop/ui'),src=path.join(root,'work/rules-research/twinleafgg-main/ptcg-server/src');
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
function compile(a,name){
 let t=(a.text||'').replace(/\s+/g,' ').trim(),m;
 if(!t)return [];
 t=t.replace(/Flip a coin, If heads,/g,'Flip a coin. If heads,').replace(/\. if heads,/g,'. If heads,').replace(/the defending Pokémon/g,'the Defending Pokémon').replace(/^Then,? /,'');
 if(/[\p{L}\p{N}]$/u.test(t))t+='.';
 const additional=additionalAttack({...a,text:t},name,compile);if(additional!==null)return additional;
 if(t==='All damage done by attacks to Grimer during your opponent\'s next turn is reduced by 20 (after applying Weakness and Resistance).'&&name==='Grimer')return [{op:'reduceNextDamage',amount:20}];
 if(t==='Put up to 2 Energy cards from your discard pile into your hand. Gastly does 10 damage to itself.'&&name==='Gastly')return [{op:'recover',category:'Energy',amount:2,optional:true,after:true},{op:'recoil',amount:10,after:true}];
 if(t==="Flip a coin. If heads, choose a basic Energy card attached to 1 of your opponent's Pokémon and attach it to another of your opponent's Pokémon of your choice.")return [{op:'coin',heads:[{op:'moveOpponentEnergy',any:true}],tails:[]}];
 if(t==='Use this attack only if there are any Fire Energy cards attached to Dark Charmeleon. Flip a coin. If heads, discard 1 of those Energy cards. If tails, this attack does nothing (not even damage).'&&name==='Dark Charmeleon')return [{op:'requireEnergy',energy:'Fire'},{op:'coin',heads:[{op:'discardSelf',energy:'Fire',amount:1}],tails:[{op:'damage',amount:0}]}];
 if(t==='Use this attack only if there are any Fire Energy cards attached to Dark Flareon. Flip a coin. If heads, discard 1 of those Energy cards and this attack does 30 damage plus 20 more damage; if tails, this attack does 30 damage.'&&name==='Dark Flareon')return [{op:'requireEnergy',energy:'Fire'},{op:'coin',heads:[{op:'discardSelf',energy:'Fire',amount:1},{op:'damage',amount:50}],tails:[{op:'damage',amount:30}]}];
 if(t==="You may discard 1 Fire Energy card attached to Dark Rapidash when you use this attack. If you do and if your opponent has any Benched Pokémon, choose 1 of them and this attack does 10 damage to it. (Don't apply Weakness and Resistance for Benched Pokémon.)"&&name==='Dark Rapidash')return [{op:'optionalEnergyEffect',energy:'Fire',amount:1,ops:[{op:'benchDamage',amount:10}]}];
 if(t==='Search your deck for an Evolution card named Gyarados or Dark Gyarados and put it on Magikarp. (This counts as evolving Magikarp.) Shuffle your deck afterward.'&&name==='Magikarp')return [{op:'evolveSelf',names:['Gyarados','Dark Gyarados'],after:true}];
 if(t==="Choose 1 of your opponent's Pokémon. This attack does 10 damage to that Pokémon. Don't apply Weakness and Resistance for this attack. (Any other effects that would happen after applying Weakness and Resistance still happen.) If that Pokémon has a Pokémon Power, that power stops working until the end of your opponent's next turn.")return [{op:'targetDamage',amount:10,powerLock:true}];
 if(m=t.match(/^Flip a number of coins equal to the number of (Fire|Water|Grass|Lightning|Psychic|Fighting) Energy cards attached to (.+)\. This attack does (\d+) damage times the number of heads\. Discard a number of \1 Energy cards attached to \2 equal to the number of heads\.$/))if(m[2]===name)return [{op:'energyFlips',energy:m[1],amount:+m[3],cards:true,discardHeads:true}];
 if(t==="Your opponent flips a number of coins equal to the number of Pokémon on his or her Bench. This attack does 20 damage times the number of tails. Don't apply Weakness and Resistance for this attack. (Any other effects that would happen after applying Weakness and Resistance still happen.)")return [{op:'benchFlips',amount:20,tails:true},{op:'ignoreWeakness'},{op:'ignoreResistance'}];
 if(m=t.match(/^Your opponent flips a coin\. If tails, this attack does (\d+) damage plus (\d+) more damage; if heads, this attack does (\d+) damage\.$/))return [{op:'coin',opponent:true,heads:[{op:'damage',amount:+m[3]}],tails:[{op:'damage',amount:+m[1]+ +m[2]}]}];
 if(t==="Your opponent shuffles his or her Active Pokémon and all cards attached to it into his or her deck. This attack can't be used if your opponent has no Benched Pokémon.")return [{op:'requireBench'},{op:'returnPokemon',opponent:true,all:true,after:true}];
 if(t===`Shuffle ${name} into your deck. (Discard all cards attached to ${name}.)`)return [{op:'returnPokemon',after:true}];
 if(t==='Take all Energy cards attached to Dark Electrode and attach them to your Benched Pokémon (in any way you choose). If you have no Benched Pokémon, discard all Energy cards attached to Dark Electrode.'&&name==='Dark Electrode')return [{op:'distributeEnergy',after:true}];
 if(t==="If the Defending Pokémon has any basic Energy cards attached to it, choose 1 of them. If your opponent has any Benched Pokémon, choose 1 of them and attach that Energy card to it.")return [{op:'moveOpponentEnergy',after:true}];
 if(t==="Flip a coin. If heads, flip another coin. If the second coin is heads, this attack does 20 damage to each of your opponent's Benched Pokémon. If the second coin is tails, this attack does 10 damage to each of your opponent's Benched Pokémon. (Don't apply Weakness and Resistance for Benched Pokémon.)")return [{op:'coin',heads:[{op:'coin',heads:[{op:'spread',amount:20}],tails:[{op:'spread',amount:10}]}],tails:[],after:true}];
 if(m=t.match(/^Flip a coin\. If heads, this attack does (\d+) damage plus (\d+) more damage and the Defending Pokémon is now (Paralyzed|Poisoned|Asleep|Confused|Burned); if tails, this attack does (\d+) damage\.$/)){const status={Paralyzed:'PARALYZED',Poisoned:'POISONED',Asleep:'ASLEEP',Confused:'CONFUSED',Burned:'BURNED'}[m[3]];return [{op:'coin',heads:[{op:'damage',amount:+m[1]+ +m[2]},{op:'status',conditions:[status]}],tails:[{op:'damage',amount:+m[4]}]}];}
 if(m=t.match(/^(?:This attack does|Does) (\d+) damage times the number of damage counters on (.+)\.$/))if(m[2]===name)return [{op:'counterDamage',base:0,amount:+m[1]}];
 if(m=t.match(/^Prevent all damage (?:done by attacks |done )?to (.+) during your opponent's next turn\. \(Any other effects of attacks still happen\.\)$/))if(m[1]===name)return [{op:'protect'}];
 if(m=t.match(/^This attack does (\d+) damage and the Defending Pokémon is now (Paralyzed|Poisoned|Asleep|Confused|Burned)\.$/))return [{op:'damage',amount:+m[1]},{op:'status',conditions:[{Paralyzed:'PARALYZED',Poisoned:'POISONED',Asleep:'ASLEEP',Confused:'CONFUSED',Burned:'BURNED'}[m[2]]]}];
 if(m=t.match(/^The Defending Pokémon is now (Paralyzed|Poisoned|Asleep|Confused|Burned) and this attack does (\d+) damage to each of your opponent's Benched Pokémon\. \(Don't apply Weakness and Resistance for Benched Pokémon\.\)$/))return [{op:'status',conditions:[{Paralyzed:'PARALYZED',Poisoned:'POISONED',Asleep:'ASLEEP',Confused:'CONFUSED',Burned:'BURNED'}[m[1]]]},{op:'spread',amount:+m[2]}];
 if(m=t.match(/^If (.+) and the Defending Pokémon don't have the same number of Energy cards attached to them, this attack's base damage is (\d+) instead of (\d+)\.$/))if(m[1]===name)return [{op:'equalEnergyDamage',equal:+m[3],other:+m[2]}];
 if(t===`Choose a type of Energy other than Colorless attached to Mew. This attack does 20 damage to each of your opponent's Pokémon of that type (including Benched Pokémon). Don't apply Weakness and Resistance.`&&name==='Mew')return [{op:'rainbowWave',amount:20}];
 if(t===`Each player flips a coin. Each player who gets heads chooses a total of 3 damage counters from among his or her Pokémon and removes them. (If the player's Pokémon have fewer total damage counters than that, he or she removes all of them.)`)return [{op:'bothPlayersHealCounters',amount:3}];
 if(t===`If Lapras has any damage counters on it, remove 2 of them from it (1 if it only has 1). If the Defending Pokémon has any damage counters on it, remove 2 of them from it (1 if it only has 1). The Defending Pokémon is now Asleep.`&&name==='Lapras')return [{op:'healBoth',amount:20,after:true},{op:'status',conditions:['ASLEEP']}];
 if(m=t.match(/^Choose 1 of your opponent's Pokémon\. Flip a number of coins equal to the number of (Grass|Fire|Water|Lightning|Psychic|Fighting) Energy attached to (.+)\. This attack does (\d+) damage times the number of heads to that Pokémon\. Don't apply Weakness and Resistance\.$/))if(m[2]===name)return [{op:'targetEnergyFlips',energy:m[1],amount:+m[3]}];
 if(t===`Flip a coin. If heads, choose 1 Pokémon (yours or your opponent's) with damage counters on it and remove 2 damage counters from it (1 if it only has 1).`)return [{op:'coin',heads:[{op:'chooseHeal',amount:20,any:true}],tails:[],after:true}];
 if(t===`Flip a coin. If heads, remove 2 damage counters from Vileplume (1 if it only has 1). Then, if you have any Benched Pokémon with damage counters on them, choose 1 of them and remove 2 damage counters from it (1 if it only has 1).`&&name==='Vileplume')return [{op:'coin',heads:[{op:'heal',amount:20},{op:'chooseHeal',amount:20,bench:true}],tails:[],after:true}];
 const condition=s=>s.split(/ and /).map(x=>({Asleep:'ASLEEP',Burned:'BURNED',Confused:'CONFUSED',Paralyzed:'PARALYZED',Poisoned:'POISONED'})[x]);
 const sub=t=>compile({...a,text:t? t[0].toUpperCase()+t.slice(1):t},name);
 // Required Energy discards are paid by the attack reducer before cancellation.
 if(m=t.match(/^Discard (all|a|\d+) (?:(Fire|Water|Grass|Lightning|Fighting|Psychic|Darkness|Metal) )?Energy(?: cards?)? attached to .+? in order to use this attack\.\s*(.*)$/)){const tail=sub(m[3]);if(tail!==null)return [{op:'requiredCost',energy:m[2],amount:m[1]==='all'?'all':m[1]==='a'?1:+m[1]},...tail];}
 if(m=t.match(/^Flip a coin\. If heads, (.+) If tails, (.+)$/)){const h=sub(m[1]),l=sub(m[2]);if(h!==null&&l!==null)return [{op:'coin',heads:h,tails:l}];}
 if(m=t.match(/^Flip a coin\. If heads, (.+)$/)){const h=sub(m[1]);if(h!==null)return [{op:'coin',heads:h,tails:[]}];}
 if(m=t.match(/^Flip a coin\. If tails, (.+)$/)){const l=sub(m[1]);if(l!==null)return [{op:'coin',heads:[],tails:l}];}
 if(m=t.match(/^The Defending Pokémon is now (Asleep|Burned|Confused|Paralyzed|Poisoned)( and (?:Asleep|Burned|Confused|Paralyzed|Poisoned))?\.$/))return [{op:'status',conditions:condition(m[1]+(m[2]||''))}];
 if(m=t.match(/^Flip a coin\. If heads, the Defending Pokémon is now ((?:Asleep|Burned|Confused|Paralyzed|Poisoned)(?: and (?:Asleep|Burned|Confused|Paralyzed|Poisoned))?)\.(?: If tails, (?:the Defending Pokémon is now (Asleep|Burned|Confused|Paralyzed|Poisoned)\.|this attack does nothing \(not even damage\)\.))?$/))return [{op:'coin',heads:[{op:'status',conditions:condition(m[1])}],tails:m[2]?[{op:'status',conditions:condition(m[2])}]:t.includes('nothing')?[{op:'damage',amount:0}]:[]}];
 if(m=t.match(/^Flip a coin\. If heads, the Defending Pokémon is now (Poisoned|Confused|Paralyzed|Asleep); if tails, the Defending Pokémon is now (Poisoned|Confused|Paralyzed|Asleep)\.$/))return [{op:'coin',heads:[{op:'status',conditions:condition(m[1])}],tails:[{op:'status',conditions:condition(m[2])}]}];
 if(/^Flip a coin\. If tails, this attack does nothing(?: \(not even damage\))?\.$/.test(t))return [{op:'coin',heads:[],tails:[{op:'damage',amount:0}]}];
 if(t==='This attack does nothing (not even damage).')return [{op:'damage',amount:0}];
 if(m=t.match(/^Flip (\d+) coins\. (?:This attack does (\d+) damage times the number of heads\.|If (?:either|any) of them is tails, this attack does nothing\.)$/))return [{op:'flips',count:+m[1],perHead:m[2]?+m[2]:null,allHeads:!m[2]}];
 if(m=t.match(/^Flip a coin until you get tails\. This attack does (\d+) damage times the number of heads\.$/))return [{op:'untilTails',amount:+m[1]}];
 if(m=t.match(/^Flip a coin\. If heads, this attack does (\d+) damage plus (\d+) more damage(?:; if tails, this attack does (\d+) damage|\. If tails, this attack does (\d+) damage)?\.$/))return [{op:'coin',heads:[{op:'damage',amount:+m[1]+ +m[2]}],tails:[{op:'damage',amount:+(m[3]||m[4]||m[1])}]}];
 if(/^Draw a card\.$/.test(t))return [{op:'draw',amount:1}];
 if(m=t.match(/^Draw (\d+) cards\.$/))return [{op:'draw',amount:+m[1]}];
 if(t==="Shuffle your opponent's deck.")return [{op:'shuffle',opponent:true}];
 if(m=t.match(/^Shuffle your hand into your deck, then draw (\d+) cards\.$/))return [{op:'shuffleHand',amount:+m[1]}];
 if(/^Flip a coin\. If heads, draw a card\.$/.test(t))return [{op:'coin',heads:[{op:'draw',amount:1}],tails:[]}];
 if(t==="The Defending Pokémon can't retreat during your opponent's next turn.")return [{op:'noRetreat'}];
 if(t==="If the Defending Pokémon tries to attack during your opponent's next turn, your opponent flips a coin. If tails, that attack does nothing.")return [{op:'smokescreen'}];
 if(m=t.match(/^Does (\d+) damage plus (\d+) more damage for each Energy card attached to the Defending Pokémon\.$/))return [{op:'energyDamage',base:+m[1],amount:+m[2]}];
 if(m=t.match(/^This attack does (\d+) damage plus (\d+) more damage for each Special Energy card attached to the Defending Pokémon\.$/))return [{op:'energyDamage',base:+m[1],amount:+m[2],special:true}];
 if(m=t.match(/^This attack does (\d+) damage plus (\d+) (?:more )?damage for each Energy card attached to the Defending Pokémon\.$/))return [{op:'energyDamage',base:+m[1],amount:+m[2]}];
 if(m=t.match(/^(?:This attack does|Does) (\d+) damage plus (\d+) (?:more )?damage for each damage counter on (.+)\.$/)){
  if(m[3]===name||m[3]==='the Defending Pokémon')return [{op:'counterDamage',base:+m[1],amount:+m[2],opponent:m[3]==='the Defending Pokémon'}];
 }
 if(m=t.match(/^(?:This attack does|Does) (\d+) damage minus (\d+) (?:less )?damage for each damage counter on (.+)\.$/))if(m[3]===name)return [{op:'counterDamage',base:+m[1],amount:-m[2]}];
 if(m=t.match(/^The Defending Pokémon is now Poisoned\. It now takes (\d+) Poison damage instead of 10 after each player's turn \(even if it was already Poisoned\)\.$/))return [{op:'status',conditions:['POISONED'],poison:+m[1]}];
 if(m=t.match(/^During your opponent's next turn, prevent all (?:effects of attacks, including damage|damage done by attacks), done to (.+)\.$/))if(m[1]===name)return [{op:'protect',effects:t.includes('including damage')}];
 if(m=t.match(/^During your opponent's next turn, prevent all effects of attacks, including damage, done to (.+)\.$/))if(m[1]===name)return [{op:'protect',effects:true}];
 if(t==="The Defending Pokémon can't attack during your opponent's next turn.")return [{op:'noAttack'}];
 if(t==="You can't use this attack during your next turn.")return [{op:'selfLock',after:true}];
 if(m=t.match(/^This attack does (\d+) damage\.$/))return [{op:'damage',amount:+m[1]}];
 if(m=t.match(/^(?:This attack does|Does) (\d+) damage plus (\d+) more damage\.$/))return [{op:'damage',amount:+m[1]+ +m[2]}];
 if(t==='this attack does nothing.'||t==='This attack does nothing.')return [{op:'damage',amount:0}];
 if(t==='Does damage to the Defending Pokémon equal to half the Defending Pokémon\'s remaining HP (rounded up to the nearest 10).')return [{op:'halfHp'}];
 if(t==="Don't apply Resistance.")return [{op:'ignoreResistance'}];
 if(t==="Don't apply Weakness and Resistance."||t==="Don't apply Weakness and Resistance for this attack. (Any other effects that would happen after applying Weakness and Resistance still happen.)")return [{op:'ignoreWeakness'},{op:'ignoreResistance'}];
 if(t===`If your opponent has any Benched Pokémon, he or she chooses 1 of them and switches it with the Defending Pokémon. (Do the damage before switching the Pokémon.)`||t===`Your opponent switches the Defending Pokémon with 1 of his or her Benched Pokémon, if any. (Do the damage before switching the Pokémon.)`)return [{op:'switchOpponent',after:true}];
 if(t==='If your opponent has any Benched Pokémon, choose 1 of them and switch it with the Defending Pokémon.')return [{op:'gust',after:true}];
 if(t==="Choose 1 of your opponent's Benched Pokémon and switch it with the Defending Pokémon.")return [{op:'requireBench'},{op:'gust',after:true}];
 if(t==="Choose 1 of your opponent's Benched Pokémon and switch it with the Defending Pokémon. This attack can't be used if your opponent has no Benched Pokémon.")return [{op:'requireBench'},{op:'gust',after:true}];
 if(t==="Before doing damage, choose 1 of your opponent's Benched Pokémon and switch it with the Defending Pokémon. Do the damage to the new Defending Pokémon. This attack can't be used if your opponent has no Benched Pokémon.")return [{op:'requireBench'},{op:'gust'}];
 if(m=t.match(/^Does (\d+) damage plus (\d+) more damage for each (Fire|Water|Grass|Lightning|Psychic|Fighting) Energy attached to (.+) but not used to pay for this attack(?:'s Energy [Cc]ost)?\. You can't add more than (\d+) damage in this way\.$/))if(m[4]===name)return [{op:'surplusEnergy',base:+m[1],amount:+m[2],energy:m[3],cap:+m[5],cost:a.cost}];
 if(m=t.match(/^Flip a number of coins equal to the (?:amount|number) of (Fire|Water|Grass|Lightning|Psychic|Fighting)? ?Energy(?: cards)? attached to (.+)\. (?:This attack does (\d+) damage times the number of heads|For each heads, draw (\d+) cards)\.$/))if(m[2]===name)return [{op:'energyFlips',energy:m[1],amount:+(m[3]||m[4]),draw:!!m[4]}];
 if(m=t.match(/^If there are any (Fire|Water|Grass|Lightning|Psychic|Fighting) Energy cards in your discard pile, choose 1 of them and attach it to (.+)\.$/))if(m[2]===name)return [{op:'attachSelf',energy:m[1],zone:'discard',amount:1}];
 if(m=t.match(/^Search your deck for a (Fire|Water|Grass|Lightning|Psychic|Fighting) Energy card and attach it to (.+)\. Shuffle your deck afterward\.$/))if(m[2]===name)return [{op:'attachSelf',energy:m[1],zone:'deck',amount:1}];
 if(m=t.match(/^Take up to (\d+) (Fire|Water|Grass|Lightning|Psychic|Fighting) Energy cards from your discard pile and attach them to (.+)\.$/))if(m[3]===name)return [{op:'attachSelf',energy:m[2],zone:'discard',amount:+m[1],optional:true}];
 if(t==='Search your deck for a Trainer card, show it to your opponent, and put it into your hand. Shuffle your deck afterward.')return [{op:'search',category:'Trainer',amount:1}];
 if(t==='Put a basic Energy card from your discard pile into your hand.')return [{op:'recover',category:'BasicEnergy',amount:1}];
 if(m=t.match(/^Discard (a|1|2|all) (Fire|Water|Grass|Lightning|Psychic|Fighting)? ?Energy(?: cards?)? attached to (.+?)(?: or this attack does nothing)?\.$/))if(m[3]===name)return [{op:'discardSelf',energy:m[2],amount:m[1]==='all'?'all':m[1]==='a'?1:+m[1],orNothing:t.includes('or this attack does nothing')}];
 if(m=t.match(/^If your opponent has any Benched Pokémon, choose 1 of them and this attack does (\d+) damage to it\. \(Don't apply Weakness and Resistance for Benched Pokémon\.\)$/))return [{op:'benchDamage',amount:+m[1],after:true}];
 if(m=t.match(/^Does (\d+) damage to each of your own Benched Pokémon\. \(Don't apply Weakness and Resistance for Benched Pokémon\.\)$/))return [{op:'spread',amount:+m[1],own:true,after:true}];
 if(m=t.match(/^(?:This attack does|Does) (\d+) damage to each (?:of your opponent's )?Benched Pokémon(?: \(yours and your opponent's\))?\. \(Don't apply Weakness and Resistance for Benched Pokémon\.\)$/))return [{op:'spread',amount:+m[1],both:t.includes('yours and'),after:true}];
 if(m=t.match(/^the Defending Pokémon is now (Paralyzed|Poisoned|Asleep|Confused|Burned) and this attack does (\d+) damage to each of your opponent's Benched Pokémon\. \(Don't apply Weakness and Resistance for Benched Pokémon\.\)$/))return [{op:'status',conditions:condition(m[1])},{op:'spread',amount:+m[2]}];
 if(m=t.match(/^If your opponent has any Benched Pokémon, flip a coin\. If heads, choose 1 of them and this attack does (\d+) damage to it\. \(Don't apply Weakness and Resistance for Benched Pokémon\.\)$/))return [{op:'coin',heads:[{op:'benchDamage',amount:+m[1]}],tails:[],after:true}];
 if(m=t.match(/^Choose 1 of your opponent's Pokémon\. This attack does (\d+) damage to that Pokémon\. Don't apply Weakness and Resistance(?: for this attack\. \(Any other effects that would happen after applying Weakness and Resistance still happen\.\))?\.$/))return [{op:'targetDamage',amount:+m[1]}];
 if(m=t.match(/^Choose 1 of your opponent's Pokémon\. This attack does (\d+) damage to that Pokémon\. Don't apply Weakness and Resistance for this attack\. \(Any other effects that would happen after applying Weakness and Resistance still happen\.\)$/))return [{op:'targetDamage',amount:+m[1]}];
 if(m=t.match(/^Choose 1 of your opponent's Pokémon and flip a coin\. If heads, this attack does (\d+) damage to that Pokémon\. Don't apply Weakness and Resistance for this attack\. \(Any other effects that would happen after applying Weakness and Resistance still happen\.\)$/))return [{op:'targetDamage',amount:+m[1],coin:true}];
 if(m=t.match(/^If the Defending Pokémon has any (basic )?Energy cards attached to it, choose 1 of them and discard it\.$/))return [{op:'discardOpponentEnergy',basic:!!m[1],after:true}];
 if(m=t.match(/^If the Defending Pokémon has any (basic )?Energy cards attached to it, flip a coin\. If heads, choose 1 of those Energy cards and discard it\.$/))return [{op:'coin',heads:[{op:'discardOpponentEnergy',basic:!!m[1]}],tails:[],after:true}];
 if(m=t.match(new RegExp('^'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+' does (\\d+) damage to itself\\.$')))return [{op:'recoil',amount:+m[1],after:true}];
 if(m=t.match(/^Flip a coin\. If tails, .+ does (\d+) damage to itself\.$/))return [{op:'coin',heads:[],tails:[{op:'recoil',amount:+m[1]}],after:true}];
 if(m=t.match(/^Remove (\d+) damage counters? from (.+) \(remove (?:1|all) if .+\)\.$/))if(m[2]===name)return [{op:'heal',amount:+m[1]*10,after:true}];
 if(m=t.match(/^Remove (?:up to )?(\d+) damage counters? from (.+)\.$/))if(m[2]===name)return [{op:'heal',amount:+m[1]*10,after:true}];
 if(m=t.match(/^(.+) is now Confused \(after doing damage\)\.$/))if(m[1]===name)return [{op:'selfStatus',condition:'CONFUSED',after:true}];
 if(m=t.match(/^This attack does (\d+) damage plus (\d+) more damage and the Defending Pokémon is now (Paralyzed|Poisoned|Asleep|Confused|Burned)\.$/))return [{op:'damage',amount:+m[1]+ +m[2]},{op:'status',conditions:condition(m[3])}];
 if(m=t.match(/^Does (\d+) damage plus (\d+) more damage for each (.+) on your Bench\.$/))return [{op:'benchCountDamage',base:+m[1],amount:+m[2],names:m[3].split(/, and |, | and /)}];
 if(m=t.match(/^If the Defending Pokémon is (Poisoned|Asleep|Confused|Paralyzed|Burned), this attack does (\d+) damage plus (\d+) more damage\.$/))return [{op:'conditionalStatusDamage',condition:condition(m[1])[0],base:+m[2],amount:+m[3]}];
 // Compose independent complete clauses, preserving their effect timing.
 if(!/^Flip |^If /.test(t))for(const match of t.matchAll(/\. (?=[A-Z])/g)){
  const left=sub(t.slice(0,match.index+1)),right=sub(t.slice(match.index+2));
  if(left!==null&&right!==null)return [...left,...right];
 }
 return null;
}
function compilePower(a,name){
 const t=a.text||'';let m,op;
 if(a.name==='Neutral Shield'&&name==='Mew'&&t==="Prevent all effects of attacks, including damage, done to Mew by Evolved Pokémon. You can't use this power if Mew is Asleep, Confused, or Paralyzed.")op={kind:'preventAttackByEvolution'};
 if(a.name==='Aurora Veil'&&name==='Articuno'&&t==="As long as Articuno is your Active Pokémon, your Benched Pokémon do not take damage from and are not affected by attacks. This power cannot be used if Articuno is affected by a Special Condition.")op={kind:'preventBenchAttack',active:true};
 if(a.name==='Immunity'&&name==='Machamp'&&t==="Prevent all effects of your opponent's attacks done to Machamp.")op={kind:'preventAttackEffects'};
 if(a.name==='[Quicken]'&&name==='Unown [Q]'&&t==='Once during your turn (before your attack), you may flip a coin. If heads, prevent all effects of attacks, including damage, done to any of your Pokémon with Unown in its name during your opponent\'s next turn. If you have more than 1 Unown [Q] in play, use only 1 [Quicken] each turn. This power can be used even if Unown [Q] is Asleep, Confused, or Paralyzed.')op={kind:'activatedUnownShield',once:true,oncePerName:true};
 if(m=t.match(/^To attach a (Fire|Water|Lightning) Energy card from your hand to (.+), you must discard an Energy card attached to \2\. \(Attach the \1 Energy, and then discard an Energy from \2\.\)$/))if(m[2]===name)op={kind:'onAttachedDiscardEnergy',energy:m[1]};
 if(a.name==='[Search]'&&name==='Unown [S]'&&t==='Once during your turn (before your attack), you may look at 1 of your Prize cards. Return that Prize card face down. This power can be used even if Unown [S] is Asleep, Confused, or Paralyzed.')op={kind:'activatedPeekPrize',once:true};
 if(m=t.match(/^Whenever a (Darkness|Metal|Colorless) Pokémon damages 1 of your Pokémon, reduce that damage by (\d+) \(after applying Weakness and Resistance\)\. This power stops working if you have more than 1 (Unown \[[A-Z]\]) in play\. \(This power works even if \3 is Asleep, Confused, or Paralyzed\.\)$/))if(m[3]===name)op={kind:'reduceOwnDamageByType',energy:m[1],amount:+m[2],nonstackName:true};
 if(a.name==='Pollen Defense'&&name==="Erika's Vileplume"&&t==="If an attack does damage to Erika's Vileplume while it's your Active Pokémon (even if it's Knocked Out), flip a coin. If heads, your opponent's Active Pokémon is now Confused. This power works even while Erika's Vileplume is Asleep, Confused, or Paralyzed.")op={kind:'onDamagedStatus',active:true,coin:true,condition:'CONFUSED'};
 if(a.name==='Fluffy Wool'&&name==='Light Piloswine'&&t==="During your opponent's turn, if Light Piloswine is your Active Pokémon and is damaged by your opponent's attack (even if it's Knocked Out), flip a coin. If heads, the attacking Pokémon is now Asleep. This power stops working if Light Piloswine is already Asleep, Confused, or Paralyzed when your opponent attacks.")op={kind:'onDamagedStatus',active:true,coin:true,condition:'ASLEEP'};
 if(a.name==='Energy Drain'&&name==="Koga's Muk"&&t==="If an opponent's attack does damage to Koga's Muk (even if Koga's Muk is Knocked Out), flip a coin. If heads and if it has any, choose 1 Energy card attached to the attacking Pokémon and discard it. This power can't be used if Koga's Muk is already Asleep, Confused, or Paralyzed when your opponent attacks.")op={kind:'onDamagedDiscardEnergy',coin:true};
 if(a.name==='Restless Sleep'&&name==="Rocket's Snorlax"&&t==="If your opponent's attack does damage to Rocket's Snorlax and Rocket's Snorlax is already Asleep (even if it's Knocked Out), this power does 20 damage to the attacking Pokémon.")op={kind:'onDamagedReturnDamage',amount:20,requireCondition:'ASLEEP'};
 if(a.name==='Conductivity'&&name==='Dark Ampharos'&&t==="Whenever your opponent attaches an Energy card from his or her hand to a Pokémon, this power does 10 damage to that Pokémon. (Don't apply Weakness and Resistance.) This power stops working if you have more than 1 Dark Ampharos in play or while Dark Ampharos is Asleep, Confused, or Paralyzed.")op={kind:'onOpponentAttachDamage',amount:10,nonstackName:true};
 if(a.name==='Spikes'&&name==='Forretress'&&t==="During your opponent's turn, whenever 1 of your opponent's Benched Pokémon becomes his or her Active Pokémon, Forretress does 10 damage to it. (Don't apply Weakness and Resistance.) This power stops working if Forretress is Asleep, Confused, or Paralyzed.")op={kind:'onOpponentPromotionDamage',amount:10};
 if(a.name==='Suction Cups'&&name==='Octillery'&&t==="As long as Octillery is your Active Pokémon, whenever the Defending Pokémon retreats, discard all Energy cards attached to the Defending Pokémon when it goes to the Bench.")op={kind:'onOpponentRetreatDiscard',active:true};
 if(a.name==='Lightning Burst'&&name==='Raikou'&&t==="Whenever you attach a Lightning Energy card from your hand to Raikou, if your opponent has any Benched Pokémon, he or she chooses 1 of them and switches it with the Defending Pokémon. This power stops working while Raikou is Asleep, Confused, or Paralyzed.")op={kind:'onAttachOpponentSwitch',energy:'Lightning'};
 if(a.name==='Submerge'&&name==='Lanturn'&&t==="Once during your turn (before your attack), you may change Lanturn's type to Water until the end of your turn. This power can't be used if Lanturn is Asleep, Confused, or Paralyzed. If Lanturn becomes Asleep, Confused, or Paralyzed after you have used this power, its type changes back to Lightning.")op={kind:'activatedSelfType',energy:'Water',once:true};
 if(a.name==='Ion Coating'&&name==='Lanturn'&&t==="You may use this power once during each of your turns (before your attack). All Lightning Energy attached to your Active Pokémon becomes Water Energy for the rest of the turn. (This effect ends if your Active Pokémon retreats or is returned to your hand.) This power can't be used if Lanturn is affected by a Special Condition.")op={kind:'activatedActiveEnergyType',from:'Lightning',energy:'Water',once:true};
 if(a.name==='[Zoom]'&&name==='Unown [Z]'&&t==="As long as Unown [Z] is Benched, you pay no Energy cost to retreat a Pokémon with Unown in its name.")op={kind:'retreatOwnName',nameContains:'Unown',bench:true};
 if(a.name==='Gaze'&&name==='Igglybuff'&&t==="Once during your turn (before your attack), choose 1 of your opponent's Benched Pokémon that has a Pokémon Power. That power stops working until the end of this turn. This effect ends if that Pokémon leaves the Bench.")op={kind:'activatedBenchPowerLock',once:true};
 if(a.name==='Poison Resistance'&&name==='Scizor'&&t==="Scizor can't be Poisoned.")op={kind:'preventCondition',condition:'POISONED'};
 if(a.name==='Water Immunity'&&name==='Articuno'&&t==="You can't attach Water Energy cards from your hand to Articuno.")op={kind:'preventHandEnergy',energy:'Water'};
 if(m=t.match(/^Once during your turn \(before your attack\), if you have (Unown \[[A-Z]\]), (Unown \[[A-Z]\]), (Unown \[[A-Z]\]), and (Unown \[[A-Z]\]) on your Bench, you may search your deck for a (Trainer card|Basic Pokémon or Evolution card)\. Show that card to your opponent, then put it into your hand\. Shuffle your deck afterward\.$/))op={kind:'activatedSearch',once:true,benchNames:m.slice(1,5),category:m[5]==='Trainer card'?'Trainer':'Pokemon'};
 if(a.name==='[Help]'&&name==='Unown [H]'&&t==='Once during your turn (before your attack), if you have Unown [H], Unown [E], Unown [L], and Unown [P] on your Bench, you may shuffle your hand into your deck, then draw a new hand of the same number of cards.')op={kind:'activatedRefreshHand',once:true,benchNames:['Unown [H]','Unown [E]','Unown [L]','Unown [P]']};
 if(a.name==='[Want]'&&name==='Unown [W]'&&t==='Once during your turn (before your attack), if you have Unown [W], Unown [A], Unown [N], and Unown [T] on your Bench, you may flip a coin. If heads, put a Trainer card from your discard pile into your hand.')op={kind:'activatedRecoverTrainerCoin',once:true,benchNames:['Unown [W]','Unown [A]','Unown [N]','Unown [T]']};
 if(a.name==='[Undo]'&&name==='Unown [U]'&&t==='Once during your turn (before your attack), if you have Unown [U], Unown [N], Unown [D], and Unown [O] on your Bench, you may return your Active Pokémon and all cards attached to it to your hand.')op={kind:'activatedReturnActive',once:true,benchNames:['Unown [U]','Unown [N]','Unown [D]','Unown [O]']};
 if(a.name==='[Observe]'&&name==='Unown [O]'&&t==="Once during your turn (before your attack), you may look at 5 cards from the top of your opponent's deck and put them back in the same order.")op={kind:'activatedPeekOpponent',amount:5,once:true};
 if(a.name==='[Laugh]'&&name==='Unown [L]'&&t==='Once during your turn (before your attack), you may flip a coin. If heads, each player shuffles his or her deck. This power can be used even if Unown [L] is Asleep, Confused, or Paralyzed.')op={kind:'activatedBothShuffleCoin',once:true};
 if(a.name==='[Tell]'&&name==='Unown [T]'&&t==="Once during your turn (before your attack), you may flip a coin. If heads, look at your opponent's hand and show your hand to your opponent. This power can be used even if Unown [T] is Asleep, Confused, or Paralyzed.")op={kind:'activatedBothRevealCoin',once:true};
 if(a.name==='Flower Supplement'&&name==='Bellossom'&&t==="Once during your turn (before your attack), you may flip a coin. If heads, attach 1 basic Energy card from your hand to 1 of your Benched Pokémon. This power can't be used if Bellossom is affected by a Special Condition.")op={kind:'activatedAttachEnergyCoin',zone:'hand',basic:true,bench:true,once:true};
 if(a.name==='Super Dynamo'&&name==='Electrode'&&t==="Once during your turn (before your attack), if Electrode is your Active Pokémon, you may flip a coin. If heads, choose a Lightning Energy card from your discard pile and attach it to 1 of your Pokémon. This power can't be used if Electrode is affected by a Special Condition.")op={kind:'activatedAttachEnergyCoin',zone:'discard',energy:'Lightning',active:true,once:true};
 if(a.name==='Fire Recharge'&&name==='Typhlosion'&&t==="Once during your turn (before your attack), you may flip a coin. If heads, attach a Fire Energy card from your discard pile to 1 of your Fire Pokémon. This power can't be used if Typhlosion is Asleep, Confused, or Paralyzed.")op={kind:'activatedAttachEnergyCoin',zone:'discard',energy:'Fire',targetType:'Fire',once:true};
 if(a.name==='Energy Recharge'&&name==='Arcanine'&&t==="When you play Arcanine from your hand to evolve your Active Pokémon, you may flip 3 coins. For each heads, choose a basic Energy card from your discard pile and attach it to Arcanine.")op={kind:'onEvolutionAttachEnergyCoin',zone:'discard',basic:true,toSelf:true,active:true,count:3};
 if(a.name==='Beating Wings'&&name==='Pidgeot'&&t==="Once during your turn (before your attack), if Pidgeot is your Active Pokémon, you may shuffle 1 of your Benched Pokémon and all cards attached to it into your deck. This power can't be used if Pidgeot is affected by a Special Condition.")op={kind:'activatedBenchShuffle',once:true,active:true};
 if(a.name==='Plunge'&&name==='Poliwrath'&&t==="Once during your turn (before your attack), if Poliwrath is on your Bench, you may flip a coin. If heads, take all Energy cards attached to your Active Pokémon, if any, and attach them to Poliwrath. Then switch Poliwrath with your Active Pokémon.")op={kind:'activatedPlunge',once:true,bench:true};
 if(a.name==='Evolution Helper'&&name==='Nidoqueen'&&t==="Once during your turn (before your attack), if Nidoqueen is on your Bench, you may search your deck for a card that evolves from your Active Pokémon and attach it to your Active Pokémon. (This counts as evolving that Pokémon.) Shuffle your deck afterward.")op={kind:'activatedEvolveActive',once:true,bench:true};
 if(a.name==='Bubble Turn'&&name==='Azumarill'&&t==="Once during your turn (before your attack), if Azumarill is on your Bench, you may flip a coin. If heads, return Azumarill and all cards attached to it to your hand.")op={kind:'activatedBenchReturn',once:true,bench:true};
 if(a.name==='Drive Off'&&name==='Light Arcanine'&&t==="As long as Light Arcanine is your Active Pokémon, once during your turn (before your attack), if your opponent has any Benched Pokémon, he or she chooses 1 of them and switches it with the Defending Pokémon. This power can't be used while Light Arcanine is Asleep, Confused, or Paralyzed.")op={kind:'activatedOpponentSwitch',once:true,active:true};
 if(a.name==='Solar Power'&&name==='Venusaur'&&t==="Once during your turn (before your attack), you may use this power. Your Active Pokémon and the Defending Pokémon are no longer Asleep, Confused, Paralyzed, or Poisoned. This power can't be used if Venusaur is Asleep, Confused, or Paralyzed.")op={kind:'activatedClearBoth',once:true,conditionsApplied:['ASLEEP','CONFUSED','PARALYZED','POISONED']};
 if(a.name==='Carry Off'&&name==='Crobat'&&t==="Once during your turn (before your attack), you may flip a coin. If heads, look at your opponent's hand. If your opponent has any Baby Pokémon, Basic Pokémon, or Evolution cards there, choose 1 of them. Your opponent shuffles that card into his or her deck. This power can't be used if Crobat is affected by a Special Condition.")op={kind:'activatedHandPokemonShuffle',once:true};
 if(a.name==='Jet Stream'&&name==='Blastoise'&&t==="Once during your turn (before your attack), if Blastoise is your Active Pokémon, you may flip a coin. If heads, discard an Energy card attached to Blastoise, if any. Then, if there are any Energy cards attached to the Defending Pokémon, choose 1 of them and discard it. This power can't be used if Blastoise is affected by a Special Condition.")op={kind:'activatedBothDiscardEnergy',once:true,active:true};
 if(a.name==='Crystal Body'&&name==='Suicune'&&t==="Prevent all effects of your opponent's attacks, other than damage, done to Suicune. This power stops working while Suicune is Asleep, Confused, or Paralyzed.")op={kind:'preventAttackEffects'};
 if(a.name==='Major Tsunami'&&name==='Feraligatr'&&t==="Once during your turn (before your attack), if Feraligatr is your Active Pokémon and if your opponent has any Benched Pokémon, your opponent switches his or her Active Pokémon with 1 of his or her Benched Pokémon. Either way, if you have any Benched Pokémon, switch Feraligatr with 1 of them. This power can't be used if Feraligatr is affected by a Special Condition.")op={kind:'activatedBothSwitch',once:true,active:true};
 if(a.name==='Special Delivery'&&name==='Dragonite'&&t==="Once during your turn (before your attack), you may draw a card. If you do, choose a card from your hand and put it on top of your deck. This power can't be used if Dragonite is Asleep, Confused, or Paralyzed.")op={kind:'activatedDrawTop',once:true};
 if(a.name==='Cunning'&&name==='Dark Slowking'&&t==="Once during your turn (before your attack), you may flip a coin. If heads, look at the top card of your opponent's deck. Then, you may have your opponent shuffle his or her deck. This power can't be used if Dark Slowking is Asleep, Confused, or Paralyzed.")op={kind:'activatedOpponentPeekShuffle',once:true};
 if(a.name==='Terraforming'&&name==='Machamp'&&t==="Once during your turn (before your attack), you may look at the top 4 cards of your deck and rearrange them as you like. This power can't be used if Machamp is affected by a Special Condition.")op={kind:'activatedOrderTop',amount:4,once:true};
 if(a.name==='Earth Rage'&&name==='Nidoking'&&t==="Once during your turn (before your attack), if Nidoking is your Active Pokémon, you may flip a coin. If heads, put a damage counter on each of your opponent's Benched Pokémon. This power can't be used if Nidoking is affected by a Special Condition.")op={kind:'activatedBenchCounters',amount:10,once:true,active:true};
 if(a.name==='Strange Spiral'&&name==='Poliwrath'&&t==="Once during your turn (before your attack), if Poliwrath is your Active Pokémon, you may discard a basic Energy card attached to Poliwrath. If you do, the Defending Pokémon is now Confused. This power can't be used if Poliwrath is affected by a Special Condition.")op={kind:'activatedDiscardStatus',condition:'CONFUSED',basic:true,once:true,active:true};
 if(a.name==='Lolling About'&&name==='Snorlax'&&t==="Once during your turn (before your attack), if Snorlax is your Active Pokémon, you may remove 1 damage counter from Snorlax. Snorlax is now Asleep. This power can't be used if Snorlax is affected by a Special Condition.")op={kind:'activatedHealSleep',amount:10,once:true,active:true};
 if(a.name==='Venom Spray'&&name==='Beedrill'&&t==='When you play Beedrill from your hand to evolve your Active Pokémon, the Defending Pokémon is now Paralyzed and Poisoned.')op={kind:'onEvolutionStatus',active:true,conditionsApplied:['PARALYZED','POISONED']};
 if(a.name==='Berserk'&&name==='Feraligatr'&&t==="When you play Feraligatr from your hand, flip a coin. If heads, discard the top 5 cards from your opponent's deck. If tails, discard the top 5 cards from your deck.")op={kind:'onEvolutionMill',amount:5};
 if(a.name==='Sticky Goo'&&name==='Dark Muk')op={kind:'retreatTax',amount:2,active:true};
 if(a.name==='Final Beam'&&name==='Dark Gyarados')op={kind:'onKnockoutBeam',energy:'Water',amount:20};
 if(a.name==='Sinkhole'&&name==='Dark Dugtrio')op={kind:'onRetreatDamage',amount:20};
 if(a.name==='Reel In'&&name==='Dark Slowbro')op={kind:'onEvolutionRecover',amount:3};
 if(a.name==='Sneak Attack'&&name==='Dark Golbat')op={kind:'onEvolutionDamage',amount:10,weakness:true,optional:true};
 if(a.name==='Frenzy'&&name==='Dark Primeape')op={kind:'confusionBonus',amount:30};
 if(m=t.match(/^All Energy(?: cards)? attached to (.+) (?:provide|is) (Grass|Fire|Water|Lightning|Psychic|Fighting|Darkness|Metal) Energy instead of (?:their|its) usual type\./))if(m[1]===name)op={kind:'convertEnergy',energy:m[2]};
 if(m=t.match(/^Once during your turn \(before your attack\), you may remove (\d+) damage counters? from (.+)\. This power can't be used if/))if(m[2]===name)op={kind:'activatedHeal',amount:+m[1]*10,once:true};
 if(m=t.match(/^All damage done by attacks to (.+) is reduced by (\d+) \(after applying Weakness and Resistance\)\.$/))if(m[1]===name)op={kind:'reduceDamage',amount:+m[2]};
 if(m=t.match(/^Once during your turn \(before your attack\), you may remove all Special Conditions from your Active Pokémon\./))op={kind:'activatedClearConditions',once:true};
 if(a.name==='Gather Fire'&&name==='Charmander')op={kind:'activatedGather',energy:'Fire',once:true};
 if(a.name==='Downpour'&&name==='Feraligatr')op={kind:'activatedDiscardHand',energy:'Water'};
 if(a.name==='Surprise Bite'&&name==='Dark Crobat')op={kind:'onEvolutionDamage',amount:20,optional:true};
 if(a.name==='Softboiled'&&name==='Blissey')op={kind:'onEvolutionHealCoin',heads:80,tails:40,optional:true};
 if(a.name==='Herbal Scent'&&name==='Meganium')op={kind:'onEvolutionHealAllCoin',energy:'Grass',both:true};
 if(a.name==='Energy Connect'&&name==='Ampharos')op={kind:'activatedMoveEnergy',basic:true,fromBench:true,toActive:true};
 if(a.name==='Energy Jump'&&name==='Alakazam')op={kind:'activatedMoveEnergy',once:true};
 if(a.name==='Energy Charge'&&name==="Lt. Surge's Magneton")op={kind:'activatedMoveEnergy',energy:'Lightning',toSelf:true,active:true};
 if(a.name==='Electromagnetic Power'&&name==='Magneton')op={kind:'activatedMoveEnergy',names:['Magnemite','Magneton','Dark Magneton']};
 if(a.name==='Extreme Speed'&&name==='Arcanine')op={kind:'retreatSelf',perEnergy:-1};
 if(a.name==='Heavyweight'&&name==='Muk')op={kind:'retreatSelf',energy:'Grass',amount:2};
 if(a.name==='Wild Growth'&&name==='Meganium')op={kind:'multiplyBasicEnergy',energy:'Grass',amount:2,nonstack:true};
 if(a.name==='Rare Metal'&&name==='Steelix')op={kind:'convertEnergy',energy:'Metal',basic:true};
 if(a.name==='Sleep Pendulum'&&name==='Hypno')op={kind:'activatedStatus',conditions:['ASLEEP'],once:true,active:true};
 if(a.name==='Soothing Aroma'&&name==='Meganium')op={kind:'activatedHealAllCoin',amount:10,once:true};
 if(a.name==='Healing Fire'&&name==="Blaine's Ninetales")op={kind:'onAttachHeal',energy:'Fire',amount:10};
 if(a.name==='Self-healing'&&['Jolteon','Vaporeon'].includes(name))op={kind:'onAttachClearConditions',energy:name==='Jolteon'?'Lightning':'Water'};
 if(a.name==='Psychoflow'&&name==='Abra')op={kind:'retreatSelf',energy:'Psychic',zero:true};
 if(a.name==='Slippery Skin'&&name==='Dunsparce')op={kind:'retreatSelf',defenderEvolved:true,zero:true};
 if(a.name==='Lightweight'&&['Hoppip','Skiploom'].includes(name))op={kind:'retreatSelf',energy:'Grass',perEnergy:-1};
 if(a.name==='Energy Barrier'&&name==='Mr. Mime')op={kind:'reduceBasicEnergyDamage',amount:10,cap:20};
 if(a.name==='Dense Body'&&name==='Slowbro')op={kind:'reduceBasicAttackerDamage',amount:20};
 if(a.name==='Exoskeleton'&&name==='Kakuna')op={kind:'reduceDamage',amount:10};
 if(a.name==='Gaseous Form'&&name==="Sabrina's Gastly")op={kind:'energyHp',energy:'Psychic',amount:10};
 if(a.name==='Hard Shell'&&name==='Shuckle')op={kind:'damageThreshold',threshold:40,amount:10};
 if(a.name==='Relaxing Scent'&&name==="Erika's Ivysaur")op={kind:'halveAllDamage',active:true};
 if(a.name==='Crystal Type'&&/^Whenever you attach a /.test(t)){
  const energies=t.match(/^Whenever you attach a (.+) basic Energy card/);if(energies)op={kind:'onAttachCrystalType',energies:energies[1].split(/, or |, | or /)};
 }
 if(m=t.match(/^As long as (.+) is in play,? each player must pay an additional Colorless to retreat his or her Active Pokémon\./))if(m[1]===name)op={kind:'retreatTax',amount:1,both:true,nonstack:true};
 if(!op)return null;
 op.conditions=/affected by a Special Condition/.test(t)?'all':/Asleep, Confused, or Paralyzed/.test(t)&&!/(works even|work even)/.test(t)?'legacy':null;
 return op;
}
function compileTrainer(d){
 let text=(d.rules||[]).join(' ').replace(/^You can play only one Supporter card each turn\. When you play this card, put it next to your Active Pokémon\. When your turn ends, discard this card\. /,'');
 if(text==="Choose 1 of your opponent's face-down Prizes. Guess whether it is an Energy card, a Trainer card, or a Pokémon (Basic or Evolution) card. Flip the card face up (and leave it face up). If you guessed right, draw 2 cards.")return [{op:'cardFlipGame'}];
 if(text==="Put a card from your hand face down in front of you. Your opponent guesses whether it is an Energy card, a Trainer card, or a Pokémon (Basic or Evolution) card. Flip the card over. If your opponent guessed right, he or she draws 2 cards. If your opponent guessed wrong, you draw 2 cards. Either way, return the card to your hand.")return [{op:'quizCategory'}];
 if(text==="Look at your opponent's Prize cards. You may have your opponent shuffle them into his or her deck. If you do, your opponent takes that many cards from the top of his or her deck and sets them aside as his or her new Prize cards (without looking at them).")return [{op:'replaceOpponentPrizes'}];
 if(text==="Look at 1 of your Prize cards. Then, ask your opponent if you may switch that card with 1 of the cards in your hand. If your opponent accepts and if you have any other cards in your hand, switch those cards. If your opponent declines, return the Prize card face down and draw a card.")return [{op:'prizeWish'}];
 if((d.subtypes||[]).includes('Technical Machine')){const m=text.match(/^Attach this card to 1 of your (Darkness|Fighting|Fire|Grass|Lightning|Metal|Psychic|Water) Pokémon in play\. That Pokémon (?:may|my) (?:use|us) this card's attack instead of its own\. At the end of your turn, discard .+\.$/);if(m){const attacks=(d.attacks||[]).map(a=>compile(a,'this Pokémon'));if(attacks.length&&attacks.every(a=>a!==null))return [{op:'technicalMachine',energy:m[1],attacks}];}return null;}
 if(text==='Shuffle your deck, then reveal the top 3 cards of it. If at least 2 of those cards share the same name, put all the ones with that name into your hand and shuffle the rest into your deck. If none of them do, shuffle all 3 into your deck.')return [{op:'shuffle'},{op:'arcadeGame'}];
 if(text==='Choose an Energy card in your hand, show it to your opponent, and shuffle it into your deck. Then flip a coin. If heads, search your deck for up to 3 basic Energy cards. Show them to your opponent, and put them into your hand. Shuffle your deck afterward.')return [{op:'energyAmplifier'}];
 if(text==="Flip a coin until you get tails. For each heads, return an Energy card attached to your opponent's Active Pokémon to your opponent's hand. If the Pokémon has fewer attached Energy cards than that, return all of them to your opponent's hand. Your turn is over now (you don't get to attack).")return [{op:'untilReturnEnergy'},{op:'endTurn'}];
 if(text==="Flip 2 coins. If both of them are heads, choose 1 of your opponent's Benched Pokémon and return it and all cards attached to it to his or her hand. If 1 or both of them are tails, your turn ends immediately (you can't attack this turn).")return [{op:'coinTable',count:2,branches:[[{op:'endTurn'}],[{op:'endTurn'}],[{op:'returnOpponentBench'}]]}];
 if((d.subtypes||[]).includes('Stadium')){
  const clause=text.replace(/^This card stays in play (?:when you play it|after being played)\. Discard this card if another Stadium card comes into play\. /,'');
  const stadiums={
   "Once during each player's turn (before attacking), that player may flip a coin. If heads, that player draws a card.":'drawCoin',
   'Once during each player\'s turn, he or she may flip a coin. If heads, that player removes 2 damage counters from his or her Active Pokémon (1 if it only has 1).':'healCoin',
   "Once during each player's turn (before attacking), that player may look at the top 2 cards of his or her deck and put them back in the same order.":'lookTop',
   'Each player pays Colorless less to retreat his or her Pokémon if it has Misty in its name.':'mistyRetreat',
   'Each player pays Colorless more to retreat a Baby Pokémon or Basic Pokémon.':'basicRetreat',
   'Whenever a Pokémon with Giovanni in its name evolves, its owner removes 2 damage counters from that Pokémon (or 1 if it only has 1).':'giovanniHeal',
   'Ignore Weakness when a Water Pokémon does damage to a Pokémon with Blaine in its name.':'blaineWeakness',
   "All damage done by Colorless Pokémon's attacks is reduced by 30 (after applying Weakness and Resistance).":'colorlessReduction',
   'Once during each of his or her turns, a player may discard a basic Energy card from his or her hand. If that player does, he or she chooses a basic Energy card from his or her discard pile, shows it to his or her opponent, and then puts it into his or her hand.':'exchangeEnergy',
   "Don't apply Resistance to any attacks made by Pokémon with Brock in their names.":'brockResistance'
  };
  return stadiums[clause]?[{op:'stadium',kind:stadiums[clause]}]:null;
 }
 if((d.subtypes||[]).some(t=>['Stadium','Pokémon Tool','Technical Machine'].includes(t))||d.attacks?.length)return null;
 const simple=compile({text,cost:[],damage:''},d.name);if(simple!==null)return simple;
 if(text==="Look at the top 7 cards of your deck. If any of them are Trainer cards, you may show 1 of them to your opponent and put it into your hand. Shuffle your deck afterward. You can't play any more Trainer cards this turn.")return [{op:'topSearch',amount:7,category:'Trainer'},{op:'ownTrainerLock'}];
 if(text==="Your opponent may choose 5 Basic Pokémon, Evolution, and/or basic Energy cards in his or her discard pile. (If your opponent doesn't have that many, he or she chooses all or none of them.) If your opponent chooses any cards, he or she shuffles them into his or her deck. Either way, you may do the same, and you can't play any more Trainer cards this turn.")return [{op:'bothRecoverFive'},{op:'ownTrainerLock'}];
 if(text==='For each of your Pokémon, you may return any number of Energy cards attached to it to your hand.')return [{op:'returnOwnEnergyToHand'}];
 if(text==='Your opponent switches the Defending Pokémon with 1 of his or her Benched Pokémon, if any; then you switch your Active Pokémon with 1 of your Benched Pokémon, if any.')return [{op:'switchBoth'}];
 if(text==='Remove 1 damage counter from each of your Pokémon that has any damage counters on it.')return [{op:'healAll',amount:10}];
 if(text==='Remove 2 damage counters from each Pokémon (yours and your opponent\'s) with any damage counters on it. If a Pokémon has just 1 damage counter, remove it.')return [{op:'healAll',amount:20,both:true}];
 if(text==='You may draw up to 3 cards, then your opponent may draw up to 3 cards.')return [{op:'optionalBothDraw',amount:3}];
 if(text==='Each player shuffles his or her hand into his or her deck and draws a new hand of the same number of cards.')return [{op:'bothShuffleHands'}];
 if(text==='Flip a coin until you get tails. For each heads, draw 2 cards.')return [{op:'untilDraw',amount:2}];
 if(text==='Flip 3 coins. For each heads, put a Basic Energy card from your discard pile into your hand. If you don\'t have that many basic Energy cards in your discard pile, put all of them into your hand.')return [{op:'recoverFlips',count:3,category:'BasicEnergy'}];
 if(text==='Flip 3 coins. For each heads, choose an Evolution card from your discard pile, show it to your opponent, and put it into your hand.')return [{op:'recoverFlips',count:3,category:'Evolution',reveal:true}];
 if(text==='Flip a coin. If heads, shuffle 2 Energy cards from your discard pile into your deck (1 if you have only 1).')return [{op:'coin',heads:[{op:'recoverToDeck',amount:2,category:'Energy'}],tails:[]}];
 if(/^Look at 7 cards from the top of your deck\. You may choose a Basic Pokémon or Evolution card from those cards, show it (?:to )?your opponent, (?:then |and )?put it into your hand\. Shuffle the rest into your deck\.$/.test(text))return [{op:'topSearch',amount:7,category:'Pokemon'}];
 if(text==='Shuffle your deck. Then, look at the top 7 cards of your deck. Choose 1 of those cards and put it into your hand. Shuffle the rest into your deck afterward.')return [{op:'shuffle'},{op:'topSearch',amount:7,category:'Any',required:true}];
 if(text==='Look at the top 6 cards of your deck. Take all Basic Energy cards you find there, show them to your opponent, and then put them into your hand. Shuffle your deck afterward.')return [{op:'topSearch',amount:6,category:'BasicEnergy',all:true}];
 if(text==='Show the top 3 cards of your deck to all players. Put any Fire Energy cards there into your hand and discard the rest.')return [{op:'topHarvest',amount:3,energy:'Fire'}];
 if(text==='Remove 2 damage counters from 1 of your Pokémon (1 if that Pokémon has only 1).')return [{op:'chooseHeal',amount:20}];
 if(text==='You can\'t play this card if you have 5 or more cards in your hand (including this one). Draw cards until you have exactly 4 cards in your hand.')return [{op:'mailFromBill'}];
 if(text==='Move a basic Energy card attached to 1 of your Pokémon to another of your Pokémon.')return [{op:'moveOwnEnergy',basic:true,amount:1}];
 if(text==='Flip a coin. If heads, shuffle up to 2 Energy cards from your discard pile into your deck.')return [{op:'coin',heads:[{op:'recoverToDeck',amount:2,category:'Energy',optional:true}],tails:[]}];
 if(text==='Flip 2 coins. For each heads, search your deck for a Basic Energy card. Show that card to your opponent, then put it into your hand. Shuffle your deck afterward.')return [{op:'searchFlips',count:2,category:'BasicEnergy'}];
 if(text==='Flip a coin. If heads, put an Evolution card from your discard pile, if any, into your hand. If tails, put a Basic Pokémon card from your discard pile, if any, into your hand.')return [{op:'coin',heads:[{op:'recover',category:'Evolution',amount:1}],tails:[{op:'recover',category:'BasicPokemon',amount:1}]}];
 if(text==='Flip 2 coins. If both are heads, put a Baby Pokémon, Basic Pokémon, or Evolution card from your discard pile into your hand. If both are tails, put a Trainer card from your discard pile into your hand.')return [{op:'coinTable',count:2,branches:[[{op:'recover',category:'Trainer',amount:1}],[],[{op:'recover',category:'Pokemon',amount:1}]]}];
 if(text==='Shuffle your deck. Then, look at up to 5 cards from the top of your deck and rearrange them as you like.')return [{op:'shuffle'},{op:'orderTop',amount:5}];
 if(text==='Choose 1 of your Pokémon. Flip 2 coins. Remove 2 damage counters times the number of heads from that Pokémon. If the Pokémon has fewer damage counters than that, remove all of them.')return [{op:'chooseHealCoins',count:2,amount:20}];
 if(text==='Flip a coin. If heads, your Active Pokémon is no longer Asleep, Confused, Paralyzed, or Poisoned and remove 2 damage counters from it. If your Active Pokémon has fewer damage counters than that, remove all of them.')return [{op:'coin',heads:[{op:'clearConditions',conditions:['ASLEEP','CONFUSED','PARALYZED','POISONED']},{op:'heal',amount:20}],tails:[]}];
 if(text==='Discard up to 2 basic Energy cards from your hand. If you discarded 1 basic Energy card, draw 3 cards. If you discarded 2 basic Energy cards, draw 5 cards.')return [{op:'discardHandDraw',basicEnergy:true,max:2,drawTable:[0,3,5]}];
 if(text==='Discard any number of other cards from your hand, then flip a coin. If heads, draw twice that many cards.')return [{op:'discardHandDraw',coin:true,multiplier:2}];
 if(text==="Look at your opponent's hand. Then, you may discard as many other cards as you want from your hand and draw that many cards.")return [{op:'showHand'},{op:'discardHandDraw',multiplier:1}];
 if(text==='Search your deck for up to 2 Technical Machine and/or Pokémon Tool cards, show them to your opponent, and then put them into your hand. Shuffle your deck afterward.')return [{op:'search',category:'ToolOrMachine',amount:2}];
 if(text==='Discard 1 of the other cards in your hand in order to search your deck for up to 2 Water Energy cards. Show those cards to your opponent, then put them into your hand. Shuffle your deck afterward.')return [{op:'discardHandCost',amount:1},{op:'search',category:'BasicEnergy',energy:'Water',amount:2}];
 return null;
}
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
fs.writeFileSync(path.join(src,'tcg-lab-wotc-data.ts'),'export const wotcData:any = '+JSON.stringify(generated)+';\n');
fs.writeFileSync(path.join(root,'work/rules-research/wotc-automation-pending.json'),JSON.stringify(pending,null,2));
const scanSets=JSON.parse(fs.readFileSync(path.join(ui,'sets.json')));
const plan={total:cards.length,available:generated.length,pending:pending.length,methods:generated.reduce((a,c)=>(a[c.reason]=(a[c.reason]||0)+1,a),{}),bySet:Object.keys(sets).map(id=>{const scanSetId=Object.keys(scanAliases).find(k=>scanAliases[k]===id)||id;return {id,scanSetId,name:scanSets.find(s=>s.id===scanSetId)?.name||id,total:cards.filter(c=>c.set.id===id).length,available:generated.filter(c=>c.d.set.id===id).length};})};
fs.writeFileSync(path.join(root,'work/rules-research/wotc-library-plan.json'),JSON.stringify(plan,null,2));
fs.writeFileSync(path.join(ui,'wotc-coverage.json'),JSON.stringify({...plan,unsupported:pending.map(c=>({id:c.id,name:c.name,attacks:c.attacks.map(a=>a.name),powers:(c.abilities||[]).map(a=>a.name)}))},null,2));
console.log(JSON.stringify({total:cards.length,available:generated.length,pending:pending.length,methods:generated.reduce((a,c)=>(a[c.reason]=(a[c.reason]||0)+1,a),{})}));



