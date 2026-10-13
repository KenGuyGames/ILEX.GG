function put(m,name,list){const c=fixtureCard(m,name);m.store.state.players[0].hand.moveCardTo(c,list);return c;}
function combat(name,opponent='Chansey BS'){
 const m=setup('wotc'),[p,o]=m.store.state.players;p.active.moveTo(p.discard);o.active.moveTo(o.discard);put(m,name,p.active);put(m,opponent,o.active);
 for(const owner of [p,o])for(let i=0;i<3;i++){owner.bench[i].moveTo(owner.discard);put(m,['Bulbasaur BS','Charmander BS','Voltorb BS'][i],owner.bench[i]);}
 return m;
}
function attach(m,list,name,n=1){for(let i=0;i<n;i++)put(m,name,list);}
function settle(m){for(let steps=0;steps<150;steps++){
 const q=M.pending(m)[0];if(!q)return;
 let value=true;
 if(q.type==='Choose cards'){value=q.cards.cards.map((c,i)=>({c,i})).filter(x=>!q.options.blocked.includes(x.i)&&R.matchesPromptFilter(x.c,q.filter)).slice(0,Math.max(q.options.min,Math.min(q.options.max??1,1))).map(x=>x.i);}
 else if(q.type==='Choose pokemon'){value=M.targets(m,q).filter(x=>!q.options.blocked.some(t=>JSON.stringify(t)===JSON.stringify(x.target))).slice(0,q.options.min||1).map(x=>x.target);}
 else if(['Shuffle deck','Shuffle hand'].includes(q.type)){const p=m.store.state.players.find(p=>p.id===q.playerId);value=Array.from({length:(q.type==='Shuffle deck'?p.deck:p.hand).cards.length},(_,i)=>i);}
 else if(q.type==='Order cards')value=q.cards.cards.map((_,i)=>i);
 else if(q.type==='Select')value=q.values.findIndex((_,i)=>!q.options.disabled?.[i]);
 else if(q.type==='Choose attack'){const index=q.cards.findIndex(c=>c.attacks.length);value={index,attack:q.cards[index].attacks[0].name};}
 else if(q.type==='Choose prize')value=Array.from({length:q.options.count},(_,i)=>i);
 else if(q.type==='Choose energy'){
   value=[];const costs=[...q.cost];costs.sort((a,b)=>(a===R.CardType.COLORLESS)-(b===R.CardType.COLORLESS));
   for(const cost of costs){const i=q.energy.findIndex((e,i)=>!value.includes(i)&&(cost===R.CardType.COLORLESS||e.provides.includes(cost)||e.provides.includes(R.CardType.ANY)));if(i>=0)value.push(i);}
 }
 else if(!['WaitPrompt','Coin flip','Confirm','Show cards','Show mulligan','Alert','Confirm cards'].includes(q.type))throw Error('Unresolved interface '+q.type);
 answer(m,q,value);
 }throw Error('Prompt loop');}
test('Every Base/Jungle/Fossil printing has a real implementation: 102 + 64 + 62',()=>{
 const pool=cards.filter(c=>/^base[123]-/.test(c.id));assert.equal(pool.length,228);for(const c of pool)assert.ok(map[c.id],c.id);
 const audit=JSON.parse(fs.readFileSync(path.join(root,'work/rules-research/base-fossil-audit.json')));assert.equal(audit.length,0);
});
test('Energy Burn converts all Energy units, including Double Colorless, and can be used repeatedly',()=>{
 const m=combat('Charizard BS'),p=m.store.state.players[0];attach(m,p.active,'Double Colorless Energy BS',2);
 for(let i=0;i<2;i++){M.apply(m,{type:'ability',player:1,name:'Energy Burn',target});settle(m);}
 const check=new R.CheckProvidedEnergyEffect(p,p.active);m.store.reduceEffect(m.store.state,check);assert.equal(check.energyMap.flatMap(e=>e.provides).filter(t=>t===R.CardType.FIRE).length,4);
 M.apply(m,{type:'attack',player:1,name:'Fire Spin'});settle(m);assert.equal(p.discard.cards.filter(c=>c.name==='Double Colorless Energy').length,2);
});
test('Gastly Destiny Bond pays Psychic cost and awards both simultaneous knockout prizes',()=>{
 const m=combat('Gastly BS','Arcanine BS'),[p,o]=m.store.state.players;attach(m,p.active,'Psychic Energy BS',2);attach(m,o.active,'Fire Energy BS',4);
 M.apply(m,{type:'attack',player:1,name:'Destiny Bond'});settle(m);assert.equal(p.discard.cards.filter(c=>c.name==='Psychic Energy').length,1);
 M.apply(m,{type:'attack',player:2,name:'Take Down'});settle(m);assert.ok(p.discard.cards.some(c=>c.name==='Gastly'));assert.ok(o.discard.cards.some(c=>c.name==='Arcanine'));assert.equal(p.prizes.filter(l=>l.cards.length).length,5);assert.equal(o.prizes.filter(l=>l.cards.length).length,5);
});
test('Mr Mime uses final damage after Weakness and PlusPower',()=>{
 const m=combat('Mewtwo BS','Mr Mime JU'),[p,o]=m.store.state.players;attach(m,p.active,'Psychic Energy BS',2);attach(m,o.active,'Psychic Energy BS');
 M.apply(m,{type:'attack',player:1,name:'Psychic'});settle(m);assert.equal(o.active.damage,0);
 const n=combat('Charmander BS','Mr Mime JU'),np=n.store.state.players[0],no=n.store.state.players[1];attach(n,np.active,'Fire Energy BS',2);const power=fixtureCard(n,'PlusPower BS');M.apply(n,{type:'play',player:1,index:np.hand.cards.indexOf(power),target});M.apply(n,{type:'attack',player:1,name:'Ember'});settle(n);assert.equal(no.active.damage,0);
});
test('Damage Swap rejects lethal transfers and unavailable counters',()=>{
 const m=combat('Alakazam BS'),p=m.store.state.players[0];p.active.damage=10;p.bench[0].damage=30;
 M.apply(m,{type:'ability',player:1,name:'Damage Swap',target});drain(m);let q=M.pending(m)[0];assert.equal(q.type,'Move damage');const to={player:R.PlayerType.BOTTOM_PLAYER,slot:R.SlotType.BENCH,index:0};assert.throws(()=>answer(m,q,[{from:target,to}]));assert.throws(()=>answer(m,q,[{from:target,to:{...to,index:1}},{from:target,to:{...to,index:1}}]));answer(m,q,[{from:target,to:{...to,index:1}}]);assert.equal(p.active.damage,0);assert.equal(p.bench[1].damage,10);
});
test('Strange Behavior only moves counters onto Slowbro',()=>{
 const m=combat('Slowbro FO'),p=m.store.state.players[0];p.bench[0].damage=10;M.apply(m,{type:'ability',player:1,name:'Strange Behavior',target});drain(m);const q=M.pending(m)[0],from={player:2,slot:2,index:0};assert.throws(()=>answer(m,q,[{from,to:{player:2,slot:2,index:1}}]));answer(m,q,[{from,to:target}]);assert.equal(p.active.damage,10);
});
test('Curse moves exactly one counter and resets its per-card limit next turn',()=>{
 const m=combat('Gengar FO'),[p,o]=m.store.state.players;o.active.damage=20;const transfer={from:{player:1,slot:1,index:0},to:{player:1,slot:2,index:0}};
 M.apply(m,{type:'ability',player:1,name:'Curse',target});drain(m);answer(m,M.pending(m)[0],[transfer]);assert.equal(o.active.damage,10);assert.equal(o.bench[0].damage,10);assert.ok(p.marker.hasMarker('CURSE_MARKER'));M.apply(m,{type:'pass',player:1});settle(m);assert.ok(!p.marker.hasMarker('CURSE_MARKER'));
});
test('Toxic Gas suppresses Rain Dance and resumes it when Muk is Asleep',()=>{
 const m=combat('Blastoise BS','Muk FO'),[p,o]=m.store.state.players;fixtureCard(m,'Water Energy BS');assert.throws(()=>M.apply(m,{type:'ability',player:1,name:'Rain Dance',target}));m.store.state.players[1].active.specialConditions=[R.SpecialCondition.ASLEEP];M.apply(m,{type:'ability',player:1,name:'Rain Dance',target});drain(m);assert.equal(M.pending(m)[0].type,'Attach energy');
});
test('Snorlax blocks Poison and other conditions, but Toxic Gas disables its protection',()=>{
 for(const lock of [false,true]){const m=combat('Nidoking BS','Snorlax JU'),[p,o]=m.store.state.players;if(lock){o.bench[0].moveTo(o.discard);put(m,'Muk FO',o.bench[0]);}attach(m,p.active,'Grass Energy BS',3);M.apply(m,{type:'attack',player:1,name:'Toxic'});settle(m);assert.equal(o.active.specialConditions.includes(R.SpecialCondition.POISONED),lock);}
});
test('Transparency protects from damage-free status attacks with one flip',()=>{
 const m=combat('Haunter BS','Haunter FO'),p=m.store.state.players[0],o=m.store.state.players[1];attach(m,p.active,'Psychic Energy BS');m.randomState=7;M.apply(m,{type:'attack',player:1,name:'Hypnosis'});settle(m);assert.ok(!o.active.specialConditions.includes(R.SpecialCondition.ASLEEP));
});
test('Ditto copies the defender, preserves Double Colorless units and reverts under Confusion',()=>{
 const m=combat('Ditto FO18','Hitmonchan BS'),[p,o]=m.store.state.players;attach(m,p.active,'Double Colorless Energy BS');const check=new R.CheckProvidedEnergyEffect(p,p.active);m.store.reduceEffect(m.store.state,check);assert.equal(p.active.getPokemonCard().hp,70);assert.equal(check.energyMap[0].provides.length,2);assert.ok(check.energyMap[0].provides.every(t=>t===R.CardType.ANY));p.active.specialConditions=[R.SpecialCondition.CONFUSED];m.store.reduceEffect(m.store.state,new R.CheckHpEffect(p,p.active));assert.equal(p.active.getPokemonCard().hp,50);assert.equal(p.active.getPokemonCard().name,'Ditto');
});
test('Original Devolution Spray discards chosen evolution stages and keeps Energy and damage',()=>{
 const m=combat('Bulbasaur BS'),p=m.store.state.players[0];put(m,'Ivysaur BS',p.active);put(m,'Venusaur BS',p.active);attach(m,p.active,'Grass Energy BS');p.active.damage=10;p.active.specialConditions=[R.SpecialCondition.POISONED];const card=fixtureCard(m,'Devolution Spray BS');M.apply(m,{type:'play',player:1,index:p.hand.cards.indexOf(card),target});answer(m,M.pending(m)[0],[target]);answer(m,M.pending(m)[0],0);settle(m);assert.equal(p.active.getPokemonCard().name,'Bulbasaur');assert.equal(p.active.damage,10);assert.equal(p.active.specialConditions.length,0);assert.ok(p.discard.cards.some(c=>c.name==='Ivysaur'));assert.ok(!p.hand.cards.some(c=>c.name==='Venusaur'));assert.ok(p.active.cards.some(c=>c.name==='Grass Energy'));
});
test('Pokédex puts ordered cards back on top, not at the bottom',()=>{
 const m=setup('wotc'),p=m.store.state.players[0],top=p.deck.cards.slice(0,5),c=fixtureCard(m,'Pokedex BS');M.apply(m,{type:'play',player:1,index:p.hand.cards.indexOf(c),target});const q=M.pending(m)[0];answer(m,q,[4,3,2,1,0]);settle(m);assert.deepEqual(p.deck.cards.slice(0,5).map(c=>c.id),top.reverse().map(c=>c.id));
});
test('Gambler shuffles first and draws precisely eight or one',()=>{
 for(const heads of [false,true]){const m=setup('wotc'),p=m.store.state.players[0],c=fixtureCard(m,'Gambler FO');M.apply(m,{type:'play',player:1,index:p.hand.cards.indexOf(c),target});const q=M.pending(m)[0];assert.equal(q.type,'Shuffle deck');m.randomState=heads?7:1;answer(m,q,p.deck.cards.map((_,i)=>i));settle(m);assert.equal(p.hand.cards.length,heads?8:1);}
});
test('Mysterious Fossil is 10 HP and its discard power works from Bench',()=>{
 const m=setup('wotc'),p=m.store.state.players[0],c=fixtureCard(m,'Mysterious Fossil FO');M.apply(m,{type:'play',player:1,index:p.hand.cards.indexOf(c),target});settle(m);const list=p.bench.find(l=>l.getPokemonCard()===c);assert.ok(list);assert.equal(c.hp,10);const t={player:2,slot:2,index:p.bench.indexOf(list)};M.apply(m,{type:'ability',player:1,name:'Mysterious Fossil',target:t});settle(m);assert.ok(p.discard.cards.includes(c));assert.equal(p.active.getPokemonCard().name,'Charmander');
});
test('Drain attacks deal damage once and heal the attacker from final damage',()=>{
 for(const [name,attack,energy,n,damage,heal] of [['Bulbasaur BS','Leech Seed','Grass Energy BS',2,20,10],['Exeggcute JU','Leech Seed','Grass Energy BS',2,20,10],['Butterfree JU','Mega Drain','Grass Energy BS',4,40,20],['Golbat FO','Leech Life','Grass Energy BS',3,20,20],['Kabutops FO','Absorb','Fighting Energy BS',4,80,30]]){
  const m=combat(name),[p,o]=m.store.state.players;p.active.damage=30;attach(m,p.active,energy,n);M.apply(m,{type:'attack',player:1,name:attack});settle(m);assert.equal(o.active.damage,damage,name);assert.equal(p.active.damage,30-heal,name);
 }
 const m=combat('Golbat FO','Mr Mime JU'),[p,o]=m.store.state.players;p.active.damage=30;attach(m,p.active,'Grass Energy BS',3);const plus=fixtureCard(m,'PlusPower BS');M.apply(m,{type:'play',player:1,index:p.hand.cards.indexOf(plus),target});M.apply(m,{type:'attack',player:1,name:'Leech Life'});settle(m);assert.equal(o.active.damage,0);assert.equal(p.active.damage,30);
});
test('Water Gun counts surplus Water after mixed costs and caps the bonus at twenty',()=>{
 for(const waters of [2,3,7]){const m=combat('Vaporeon JU'),[p,o]=m.store.state.players;attach(m,p.active,'Water Energy BS',waters);attach(m,p.active,'Double Colorless Energy BS');M.apply(m,{type:'attack',player:1,name:'Water Gun'});settle(m);assert.equal(o.active.damage,30+10*Math.min(2,waters-2));}
});
test('Gigashock damages exactly three selected occupied Bench slots',()=>{
 const m=combat('Raichu FO'),[p,o]=m.store.state.players;attach(m,p.active,'Lightning Energy BS',4);M.apply(m,{type:'attack',player:1,name:'Gigashock'});settle(m);assert.equal(JSON.stringify(o.bench.slice(0,3).map(b=>b.damage)),'[10,10,10]');assert.equal(o.active.damage,30);assert.ok(o.bench.slice(3).every(b=>b.damage===0));
});
test('Quick Attack tails keeps printed damage and Big Eggsplosion uses twenty per head',()=>{
 const m=combat('Eevee JU'),[p,o]=m.store.state.players;attach(m,p.active,'Double Colorless Energy BS');m.randomState=1;M.apply(m,{type:'attack',player:1,name:'Quick Attack'});settle(m);assert.equal(o.active.damage,10);
 const n=combat('Exeggutor JU'),[a,b]=n.store.state.players;attach(n,a.active,'Grass Energy BS');n.randomState=7;M.apply(n,{type:'attack',player:1,name:'Big Eggsplosion'});settle(n);assert.equal(b.active.damage,20);
});
test('Damage prevention resolves before the attack applies Paralysis',()=>{
 const m=combat('Gyarados BS','Mr Mime JU'),[p,o]=m.store.state.players;attach(m,p.active,'Water Energy BS',4);m.randomState=7;M.apply(m,{type:'attack',player:1,name:'Bubblebeam'});settle(m);assert.equal(o.active.damage,0);assert.ok(o.active.specialConditions.includes(R.SpecialCondition.PARALYZED));
});
test('Hurricane returns a surviving defender and attachments, while lethal damage awards a prize',()=>{
 for(const lethal of [false,true]){const m=combat('Pidgeot JU',lethal?'Voltorb BS':'Chansey BS'),[p,o]=m.store.state.players;if(lethal)o.active.damage=20;attach(m,p.active,'Double Colorless Energy BS',2);attach(m,o.active,'Psychic Energy BS');M.apply(m,{type:'attack',player:1,name:'Hurricane'});settle(m);assert.ok((lethal?o.discard:o.hand).cards.some(c=>c.name===(lethal?'Voltorb':'Chansey')));assert.equal(p.prizes.filter(l=>l.cards.length).length,lethal?5:6);}
});
test('Scavenge pays its Psychic discard once and recovers an Item Trainer',()=>{
 const m=combat('Slowpoke FO'),p=m.store.state.players[0];attach(m,p.active,'Psychic Energy BS',2);const bill=fixtureCard(m,'Bill BS');p.hand.moveCardTo(bill,p.discard);M.apply(m,{type:'attack',player:1,name:'Scavenge'});settle(m);assert.ok(p.hand.cards.includes(bill));assert.equal(p.discard.cards.filter(c=>c.name==='Psychic Energy').length,1);
});
test('Mirror Move reflects the final damage once without rerunning the original attack',()=>{
 for(const bird of ['Spearow JU','Pidgeotto BS']){const m=combat(bird,'Mewtwo BS'),[p,o]=m.store.state.players;attach(m,p.active,'Double Colorless Energy BS',3);attach(m,o.active,'Psychic Energy BS',2);M.apply(m,{type:'pass',player:1});settle(m);M.apply(m,{type:'attack',player:2,name:'Psychic'});settle(m);assert.equal(p.active.damage,40);M.apply(m,{type:'attack',player:1,name:'Mirror Move'});settle(m);assert.equal(o.active.damage,40);assert.equal(p.active.damage,40);}
});
test('Two opposing Ditto stay at printed HP without recursive copying',()=>{
 const m=combat('Ditto FO18','Ditto FO'),[p,o]=m.store.state.players;for(const owner of [p,o])m.store.reduceEffect(m.store.state,new R.CheckHpEffect(owner,owner.active));assert.equal(p.active.getPokemonCard().hp,50);assert.equal(o.active.getPokemonCard().hp,50);
});
test('Buzzap awards its knockout prize and Energy Burn converts its two Energy units',()=>{
 const m=combat('Charizard BS'),[p,o]=m.store.state.players;p.bench[0].moveTo(p.discard);const electrode=put(m,'Electrode BS',p.bench[0]);const t={player:2,slot:2,index:0};M.apply(m,{type:'ability',player:1,name:'Buzzap',target:t});settle(m);assert.equal(o.prizes.filter(l=>l.cards.length).length,5);assert.ok(p.active.cards.includes(electrode));M.apply(m,{type:'ability',player:1,name:'Energy Burn',target});settle(m);const energy=new R.CheckProvidedEnergyEffect(p,p.active);m.store.reduceEffect(m.store.state,energy);const e=energy.energyMap.filter(e=>e.card===electrode);assert.equal(e.length,1);assert.equal(e[0].provides.length,2);assert.ok(e[0].provides.every(t=>t===R.CardType.FIRE));
});
test('Thunderstorm flips only for occupied Bench slots, deals twenty per head and applies tails recoil',()=>{
 for(const seed of [1,7]){const m=combat('Zapdos FO'),[p,o]=m.store.state.players;attach(m,p.active,'Lightning Energy BS',4);m.randomState=seed;M.apply(m,{type:'attack',player:1,name:'Thunderstorm'});settle(m);const hits=o.bench.slice(0,3).filter(b=>b.damage===20).length;assert.ok(o.bench.every(b=>[0,20].includes(b.damage)));assert.equal(p.active.damage,(3-hits)*10);assert.equal(o.active.damage,40);}
});
test('Every distinct Base–Fossil attack resolves its choices under both seeded coin branches',()=>{
 const names=[...new Set(cards.filter(c=>/^base[123]-/.test(c.id)).map(c=>map[c.id]))];let count=0;
 for(const name of names){const probe=combat(name),card=probe.store.state.players[0].active.getPokemonCard();if(!card?.attacks?.length)continue;
  for(const attack of card.attacks)for(const seed of [1,7]){
   const m=combat(name),[p,o]=m.store.state.players;p.active.damage=10;put(m,'Hitmonchan BS',p.deck);
   for(const energy of ['Grass','Fire','Water','Lightning','Psychic','Fighting'])attach(m,p.active,energy+' Energy BS',5);
   attach(m,o.active,'Psychic Energy BS',3);if(attack.name==='Dream Eater')o.active.specialConditions=[R.SpecialCondition.ASLEEP];const bill=fixtureCard(m,'Bill BS');p.hand.moveCardTo(bill,p.discard);
   const e=fixtureCard(m,'Psychic Energy BS');p.hand.moveCardTo(e,p.discard);m.randomState=seed;
   try{M.apply(m,{type:'attack',player:1,name:attack.name});settle(m);}catch(error){throw Error(name+' / '+attack.name+' / '+seed+': '+error.message);}
   assert.equal(M.pending(m).length,0,name+' / '+attack.name);count++;
  }
 }
 assert.ok(count>250);console.log('Resolved attack scenarios: '+count);
});





