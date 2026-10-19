const wotcPlan=JSON.parse(fs.readFileSync(path.join(root,'work/rules-research/wotc-library-plan.json')));
const wotcData=JSON.parse(fs.readFileSync(path.join(root,'work/mega-source/src/tcg-lab-wotc-data.ts'),'utf8').replace(/^export const wotcData:any = /,'').replace(/;\s*$/,''));
const wotcAudit=[];
test('Energy Flow permits independent zero-or-many choices and returns Special Energy without moving Pokemon',()=>{
 const m=combat('Charmander BS'),p=m.store.state.players[0];attach(m,p.active,'Fire Energy BS',2);attach(m,p.active,'Double Colorless Energy BS');attach(m,p.bench[0],'Water Energy BS');const source=p.active.getPokemonCard(),special=p.active.cards.find(c=>c.name==='Double Colorless Energy'),flow=fixtureCard(m,map['gym1-122']);M.apply(m,{type:'play',player:1,index:p.hand.cards.indexOf(flow),target});let q=M.pending(m).find(q=>q.type==='Choose cards');assert.equal(q.options.min,0);answer(m,q,[p.active.cards.indexOf(special)]);q=M.pending(m).find(q=>q.type==='Choose cards');answer(m,q,[]);settle(m);assert.ok(p.hand.cards.includes(special));assert.equal(p.active.getPokemonCard(),source);assert.equal(p.active.cards.filter(c=>c.superType===R.SuperType.ENERGY).length,2);assert.equal(p.bench[0].cards.filter(c=>c.superType===R.SuperType.ENERGY).length,1);assert.equal(p.energyPlayedTurn,0);
});
test('PokeGear selects a Trainer from the top seven and locks only the rest of its users turn',()=>{
 const m=combat('Charmander BS');let [p,o]=m.store.state.players;const bill=fixtureCard(m,'Bill BS','deck');p.deck.cards=[bill,...p.deck.cards.filter(c=>c!==bill)];const gear=fixtureCard(m,map['neo1-88']);M.apply(m,{type:'play',player:1,index:p.hand.cards.indexOf(gear),target});settle(m);assert.ok(p.hand.cards.includes(bill));assert.throws(()=>M.apply(m,{type:'play',player:1,index:m.store.state.players[0].hand.cards.findIndex(c=>c.name==='Bill'),target}));M.apply(m,{type:'pass',player:1});settle(m);M.apply(m,{type:'pass',player:2});settle(m);p=m.store.state.players[0];M.apply(m,{type:'play',player:1,index:p.hand.cards.findIndex(c=>c.name==='Bill'),target});settle(m);
});
test('Time Capsule permits declining opponent recovery, excludes Special Energy, and locks only its user',()=>{
 const m=combat('Charmander BS');let [p,o]=m.store.state.players;const special=fixtureCard(m,'Double Colorless Energy BS','discard'),capsule=fixtureCard(m,map['neo1-90']);M.apply(m,{type:'play',player:1,index:p.hand.cards.indexOf(capsule),target});const q=M.pending(m).find(q=>q.type==='Choose cards');assert.equal(q.playerId,o.id);assert.ok(q.options.allowCancel);answer(m,q,null);settle(m);assert.ok(p.discard.cards.includes(special));assert.equal(p.cannotPlayItemCards,true);assert.equal(o.cannotPlayItemCards,false);M.apply(m,{type:'pass',player:1});settle(m);assert.equal(m.store.state.players[0].cannotPlayItemCards,false);
});
test('Power Plant exchanges only basic Energy, reveals recovery and supports either player once per turn',()=>{
 const m=combat('Charmander BS');let [p,o]=m.store.state.players;p.hand.moveTo(p.deck);const fire=fixtureCard(m,'Fire Energy BS'),special=fixtureCard(m,'Double Colorless Energy BS'),water=fixtureCard(m,'Water Energy BS','discard'),plant=fixtureCard(m,map['ecard2-139']);M.apply(m,{type:'play',player:1,index:p.hand.cards.indexOf(plant),target});settle(m);M.apply(m,{type:'stadium',player:1});const cost=M.pending(m).find(q=>q.type==='Choose cards');assert.ok(cost);assert.equal(cost.filter.energyType,R.EnergyType.BASIC);answer(m,cost,[p.hand.cards.indexOf(fire)]);const recovery=M.pending(m).find(q=>q.type==='Choose cards');answer(m,recovery,[p.discard.cards.indexOf(water)]);const reveal=M.pending(m).find(q=>q.type==='Show cards');assert.equal(reveal.playerId,o.id);assert.equal(reveal.cards[0],water);settle(m);assert.ok(p.hand.cards.includes(special));assert.ok(p.hand.cards.includes(water));assert.ok(p.discard.cards.includes(fire));assert.throws(()=>M.apply(m,{type:'stadium',player:1}));M.apply(m,{type:'pass',player:1});settle(m);put(m,'Water Energy BS',m.store.state.players[1].hand);M.apply(m,{type:'stadium',player:2});settle(m);assert.equal(m.store.state.turn,2);
});
test('Warp Point lets each owner choose a replacement and ignores attack-only protection',()=>{
 const m=combat('Charmander BS',map['neo3-14']),[p,o]=m.store.state.players;o.active.preventEffectsOfAttacksNextTurn={};const source=p.active.getPokemonCard(),defender=o.active.getPokemonCard(),warp=fixtureCard(m,map['ecard1-152']);M.apply(m,{type:'play',player:1,index:p.hand.cards.indexOf(warp),target});const q=M.pending(m).find(q=>q.type==='Choose pokemon');assert.equal(q.playerId,o.id);settle(m);assert.equal(p.active.getPokemonCard().name,'Bulbasaur');assert.equal(o.active.getPokemonCard().name,'Bulbasaur');assert.ok(p.bench[0].cards.includes(source));assert.ok(o.bench[0].cards.includes(defender));assert.equal(m.store.state.turn,1);
});
test('Tusk Toss returns the complete defending stack or lets its owner switch, without a prize',()=>{
 let returned=0,switched=0;for(const seed of [1,7]){const m=combat(map['neo4-3'],'Blastoise BS'),[p,o]=m.store.state.players;attach(m,p.active,'Fighting Energy BS',2);attach(m,o.active,'Double Colorless Energy BS');const defender=o.active.getPokemonCard(),energy=o.active.cards.find(c=>c.superType===R.SuperType.ENERGY),prizes=p.prizes.filter(x=>x.cards.length).length;m.randomState=seed;M.apply(m,{type:'attack',player:1,name:'Tusk Toss'});settle(m);assert.equal(o.active.getPokemonCard().name,'Bulbasaur');assert.equal(p.prizes.filter(x=>x.cards.length).length,prizes);if(o.hand.cards.includes(defender)){returned++;assert.ok(o.hand.cards.includes(energy));}else{switched++;assert.ok(o.bench[0].cards.includes(defender));assert.ok(o.bench[0].cards.includes(energy));}}assert.ok(returned&&switched);
 for(const seed of [1,7]){const n=combat(map['neo4-3'],map['neo3-14']),[np,no]=n.store.state.players;attach(n,np.active,'Fighting Energy BS',2);n.randomState=seed;M.apply(n,{type:'attack',player:1,name:'Tusk Toss'});settle(n);assert.equal(no.active.getPokemonCard().name,'Suicune');}
});
test('Star Boomerang does damage before returning its source and attachments to hand',()=>{
 let returned=0;for(const seed of [1,7]){const m=combat(map['gym2-92']),[p,o]=m.store.state.players;attach(m,p.active,'Water Energy BS');const source=p.active.getPokemonCard(),energy=p.active.cards.find(c=>c.superType===R.SuperType.ENERGY);m.randomState=seed;M.apply(m,{type:'attack',player:1,name:'Star Boomerang'});settle(m);assert.equal(o.active.damage,20);if(p.hand.cards.includes(source)){returned++;assert.ok(p.hand.cards.includes(energy));assert.equal(p.active.getPokemonCard().name,'Bulbasaur');}else assert.equal(p.active.getPokemonCard(),source);}assert.ok(returned);
});
test('Blindside rejects an undamaged board and targets only a damaged Pokemon without Weakness',()=>{
 const m=combat(map['ecard3-79']),[p,o]=m.store.state.players;attach(m,p.active,'Darkness Energy N1');attach(m,p.active,'Fire Energy BS',3);assert.throws(()=>M.apply(m,{type:'attack',player:1,name:'Blindside'}));const [np,no]=m.store.state.players;no.bench[0].damage=10;M.apply(m,{type:'attack',player:1,name:'Blindside'});settle(m);assert.equal(no.bench[0].damage,30);assert.equal(no.active.damage,0);
});
test('Triple Spin switches Hitmontop only with at least two heads and deals damage before switching',()=>{
 const amounts=new Set();for(const seed of [1,2,3,4,5,6,7,8]){const m=combat(map['ecard2-82']),[p,o]=m.store.state.players;o.active.getPokemonCard().hp=500;attach(m,p.active,'Fighting Energy BS',3);m.randomState=seed;M.apply(m,{type:'attack',player:1,name:'Triple Spin'});settle(m);const heads=o.active.damage/40;amounts.add(heads);assert.equal(p.active.getPokemonCard().name,heads>=2?'Bulbasaur':'Hitmontop');}assert.ok([...amounts].some(n=>n>=2));assert.ok([...amounts].some(n=>n<2));
});
test('Threaten privately reveals the opposing hand and shuffles only its selected Trainer',()=>{
 let heads=0;for(const seed of [1,7]){const m=combat(map['neo4-9']);const [p,o]=m.store.state.players;o.hand.moveTo(o.deck);const bill=put(m,'Bill BS',o.hand),energy=put(m,'Fire Energy BS',o.hand);attach(m,p.active,'Fire Energy BS',4);m.randomState=seed;M.apply(m,{type:'attack',player:1,name:'Threaten'});settle(m);assert.ok(o.hand.cards.includes(energy));if(o.deck.cards.includes(bill)){heads++;assert.ok(!o.hand.cards.includes(bill));}else assert.ok(o.hand.cards.includes(bill));}assert.ok(heads);
});
test('Shuffle Attack orders only the opposing deck prefix and counts Energy cards rather than units',()=>{
 const m=combat(map['ecard2-34']),[p,o]=m.store.state.players;attach(m,p.active,'Psychic Energy BS',4);attach(m,o.active,'Double Colorless Energy BS');attach(m,o.active,'Fire Energy BS');const before=[...o.deck.cards];M.apply(m,{type:'attack',player:1,name:'Shuffle Attack'});const q=M.pending(m).find(q=>q.type==='Order cards');assert.ok(q);assert.equal(q.playerId,p.id);assert.equal(q.cards.cards.length,2);answer(m,q,[1,0]);settle(m);assert.ok(o.hand.cards.includes(before[1]));assert.equal(o.deck.cards[0],before[0]);assert.equal(JSON.stringify(o.deck.cards.slice(1).map(c=>c.fullName)),JSON.stringify(before.slice(2).map(c=>c.fullName)));
});
test('Major Tsunami lets the opponent choose first and then switches the source without ending the turn',()=>{
 const m=combat(map['ecard1-12'],'Blastoise BS'),[p,o]=m.store.state.players,source=p.active.getPokemonCard(),defender=o.active.getPokemonCard();M.apply(m,{type:'ability',player:1,name:'Major Tsunami',target});drain(m);const q=M.pending(m).find(q=>q.type==='Choose pokemon');assert.equal(q.playerId,o.id);settle(m);assert.equal(p.active.getPokemonCard().name,'Bulbasaur');assert.equal(o.active.getPokemonCard().name,'Bulbasaur');assert.ok(p.bench[0].cards.includes(source));assert.ok(o.bench[0].cards.includes(defender));assert.equal(m.store.state.turn,1);
});
test('Crystal Body prevents an attack Power lock without preventing its damage or Trainer switching',()=>{
 const m=combat(map['base5-2'],map['neo3-14']),[p,o]=m.store.state.players;attach(m,p.active,'Grass Energy BS',2);M.apply(m,{type:'attack',player:1,name:'Stare'});settle(m);assert.equal(o.active.damage,10);assert.equal(o.active.marker.hasMarker('WOTC_STARE_POWER_LOCK'),false);
 const n=combat('Charmander BS',map['neo3-14']),[np,no]=n.store.state.players;no.active.preventEffectsOfAttacksNextTurn={};const gust=fixtureCard(n,map['base1-93']);M.apply(n,{type:'play',player:1,index:np.hand.cards.indexOf(gust),target});settle(n);assert.equal(no.active.getPokemonCard().name,'Bulbasaur');
});
test('Amnesia disables only the selected attack and expires after one opponent turn',()=>{
 const m=combat(map['neo1-82'],'Charmeleon BS'),[p,o]=m.store.state.players;attach(m,p.active,'Water Energy BS');attach(m,o.active,'Fire Energy BS',3);M.apply(m,{type:'attack',player:1,name:'Amnesia'});settle(m);assert.throws(()=>M.apply(m,{type:'attack',player:2,name:'Slash'}));M.apply(m,{type:'pass',player:2});settle(m);M.apply(m,{type:'pass',player:1});settle(m);M.apply(m,{type:'attack',player:2,name:'Slash'});settle(m);assert.equal(m.store.state.turn,5);
 const n=combat(map['neo1-82'],'Charmeleon BS'),[np,no]=n.store.state.players;attach(n,np.active,'Water Energy BS');attach(n,no.active,'Fire Energy BS',3);no.active.preventEffectsOfAttacksNextTurn={};no.active.marker.addMarker('WOTC_AMNESIA_LOCK',np.active.getPokemonCard());M.apply(n,{type:'attack',player:1,name:'Amnesia'});settle(n);assert.equal(no.active.cannotUseAttacksNextTurn.length,0);M.apply(n,{type:'attack',player:2,name:'Slash'});settle(n);
});
test('Scary Face blocks both attack and retreat for exactly one opposing turn',()=>{
 let locked=0;for(const seed of [1,7]){const m=combat(map['neo1-75'],'Charmander BS');let [p,o]=m.store.state.players;attach(m,p.active,'Fire Energy BS');attach(m,o.active,'Fire Energy BS',2);m.randomState=seed;M.apply(m,{type:'attack',player:1,name:'Scary Face'});settle(m);if(o.active.cannotAttackNextTurn){locked++;assert.ok(o.active.cannotRetreatNextTurn);assert.throws(()=>M.apply(m,{type:'attack',player:2,name:'Scratch'}));assert.throws(()=>M.apply(m,{type:'retreat',player:2,index:0}));}M.apply(m,{type:'pass',player:2});settle(m);[p,o]=m.store.state.players;assert.equal(o.active.cannotAttackNextTurn,false);assert.equal(o.active.cannotRetreatNextTurn,false);M.apply(m,{type:'pass',player:1});settle(m);M.apply(m,{type:'attack',player:2,name:'Scratch'});settle(m);}assert.ok(locked);
});
test('Special Delivery returns the selected card to the deck top and enforces once per turn',()=>{
 const m=combat(map['basep-5']),p=m.store.state.players[0],before=p.deck.cards[0],hand=p.hand.cards.length;
 M.apply(m,{type:'ability',player:1,name:'Special Delivery',target});drain(m);const q=M.pending(m).find(q=>q.type==='Choose cards');assert.ok(q);assert.equal(p.hand.cards.length,hand+1);assert.ok(p.hand.cards.includes(before));const chosen=p.hand.cards[0];answer(m,q,[0]);settle(m);assert.equal(p.deck.cards[0],chosen);assert.equal(p.hand.cards.length,hand);assert.throws(()=>{M.apply(m,{type:'ability',player:1,name:'Special Delivery',target});settle(m);});
});
test('Cunning reveals only the top opposing card to its owner and permits leaving deck order unchanged',()=>{
 let heads=0;for(const seed of [1,7]){const m=combat(map['neo4-20']),[p,o]=m.store.state.players,deck=[...o.deck.cards];m.randomState=seed;M.apply(m,{type:'ability',player:1,name:'Cunning',target});drain(m);const q=M.pending(m).find(q=>q.type==='Show cards');if(q){heads++;assert.equal(q.playerId,p.id);assert.equal(q.cards.length,1);assert.equal(q.cards[0],deck[0]);}settle(m);assert.equal(JSON.stringify(o.deck.cards.map(c=>c.fullName)),JSON.stringify(deck.map(c=>c.fullName)));assert.throws(()=>{M.apply(m,{type:'ability',player:1,name:'Cunning',target});settle(m);});}assert.ok(heads);
});
test('Dragon Tornado switches a surviving defender and awards a prize only on a knockout',()=>{
 for(const hp of [40,500]){const m=combat(map['neo1-8'],'Charmander BS'),[p,o]=m.store.state.players;attach(m,p.active,'Water Energy BS',4);const defender=o.active.getPokemonCard();defender.hp=hp;const prizes=p.prizes.filter(x=>x.cards.length).length;M.apply(m,{type:'attack',player:1,name:'Dragon Tornado'});settle(m);assert.equal(o.active.getPokemonCard().name,'Bulbasaur');assert.equal(p.prizes.filter(x=>x.cards.length).length,prizes-(hp===40?1:0));assert.equal(o.discard.cards.includes(defender),hp===40);if(hp===500)assert.equal(o.bench[0].damage,100);}
});
test('Psychic Leaf heals damage actually dealt and counts Double Colorless as two Energy',()=>{
 const amounts=new Set();for(const seed of [1,2,3,4,5,6,7,8]){const m=combat(map['neo3-16'],'Blastoise BS'),[p,o]=m.store.state.players;p.active.damage=40;p.active.getPokemonCard().hp=500;o.active.getPokemonCard().hp=500;attach(m,p.active,'Grass Energy BS',2);attach(m,o.active,'Double Colorless Energy BS');m.randomState=seed;M.apply(m,{type:'attack',player:1,name:'Psychic Leaf'});settle(m);assert.equal(p.active.damage,Math.max(0,40-o.active.damage));amounts.add(o.active.damage);}assert.ok([...amounts].some(n=>n===30));
});
test('Poke-Power locks preserve Bodies and Pokemon Powers and expire after the opposing turn',()=>{
 const m=combat('Blastoise BS'),p=m.store.state.players[0],card=p.active.getPokemonCard();
 p.active.marker.addMarker('WOTC_POKEPOWER_LOCK',card);p.active.wotcPokePowerLockUntilTurn=m.store.state.turn; m.store.state.wotcHasPokePowerLocks=true;
 for(const type of [R.PowerType.POKEBODY,R.PowerType.POKEMON_POWER])m.store.reduceEffect(m.store.state,new R.PowerEffect(p,{name:'test',powerType:type,text:''},card));
 assert.throws(()=>m.store.reduceEffect(m.store.state,new R.PowerEffect(p,{name:'test',powerType:R.PowerType.POKEPOWER,text:''},card)));
 m.store.state.turn++;m.store.reduceEffect(m.store.state,new R.PowerEffect(p,{name:'test',powerType:R.PowerType.POKEPOWER,text:''},card));
});
test('Swift bypasses a coin-based damage guard without adding a defensive coin prompt',()=>{
 const m=combat(map['ecard2-115'],'Blastoise BS'),[p,o]=m.store.state.players;attach(m,p.active,'Lightning Energy BS',4);o.active.coinFlipPreventAttackDamageNextTurn=true;
 M.apply(m,{type:'attack',player:1,name:'Swift'});assert.equal(M.pending(m).filter(q=>q.type==='Coin flip').length,0);settle(m);assert.equal(o.active.damage,p.active.getPokemonCard().attacks.find(a=>a.name==='Swift').damage);
});
test('Mean Look blocks retreat, ends when Murkrow switches, and does not return when it switches back',()=>{
 const m=combat(map['neo1-24']);let [p,o]=m.store.state.players;attach(m,p.active,'Darkness Energy N1');attach(m,o.active,'Double Colorless Energy BS',2);M.apply(m,{type:'attack',player:1,name:'Mean Look'});settle(m);assert.throws(()=>M.apply(m,{type:'retreat',player:2,index:0}));[p,o]=m.store.state.players;M.apply(m,{type:'pass',player:2});settle(m);
 for(let i=0;i<2;i++){const c=fixtureCard(m,'Switch BS');M.apply(m,{type:'play',player:1,index:p.hand.cards.indexOf(c),target});settle(m);}assert.equal(p.active.getPokemonCard().name,'Murkrow');M.apply(m,{type:'pass',player:1});settle(m);M.apply(m,{type:'retreat',player:2,index:0});settle(m);assert.equal(o.active.getPokemonCard().name,'Bulbasaur');
});
test('Swift bypasses defensive Powers, attached Metal Energy and attack prevention, retaining PlusPower',()=>{
 const m=combat(map['ecard2-115'],'Mr Mime JU'),[p,o]=m.store.state.players;o.active.getPokemonCard().hp=500;attach(m,p.active,'Lightning Energy BS',4);attach(m,o.active,'Metal Energy N1');o.active.preventDamageNextTurn={};o.active.damageReductionNextTurn=20;o.active.damageReductionBeforeWeaknessNextTurn=20;const plus=fixtureCard(m,'PlusPower BS');M.apply(m,{type:'play',player:1,index:p.hand.cards.indexOf(plus),target});settle(m);const attack=p.active.getPokemonCard().attacks.find(a=>a.name==='Swift');M.apply(m,{type:'attack',player:1,name:'Swift'});settle(m);assert.equal(o.active.damage,attack.damage+10);
 const n=combat(map['ecard2-115'],'Blastoise BS'),[np,no]=n.store.state.players;attach(n,np.active,'Lightning Energy BS',4);M.apply(n,{type:'attack',player:1,name:'Swift'});settle(n);assert.equal(no.active.damage,np.active.getPokemonCard().attacks.find(a=>a.name==='Swift').damage);
});
test('Feint Attack targets a protected Bench Pokemon without applying defensive damage effects',()=>{
 const m=combat(map['neo1-24']),[p,o]=m.store.state.players;attach(m,p.active,'Darkness Energy N1');attach(m,p.active,'Double Colorless Energy BS');o.bench[0].preventDamageNextTurn={};attach(m,o.bench[0],'Metal Energy N1');M.apply(m,{type:'attack',player:1,name:'Feint Attack'});const q=M.pending(m).find(q=>q.type==='Choose pokemon');answer(m,q,[{player:R.PlayerType.TOP_PLAYER,slot:R.SlotType.BENCH,index:0}]);settle(m);assert.equal(o.active.damage,0);assert.equal(o.bench[0].damage,20);
});
test('Discharge counts Energy paid before the attack and does not discard twice',()=>{
 const outcomes=new Set();for(const seed of [1,2,3,4,5,6,7,8]){const m=combat(map['gym1-6'],'Blastoise BS'),[p,o]=m.store.state.players;o.active.getPokemonCard().hp=500;attach(m,p.active,'Lightning Energy BS',3);attach(m,p.active,'Double Colorless Energy BS');m.randomState=seed;M.apply(m,{type:'attack',player:1,name:'Discharge'});settle(m);assert.equal(p.discard.cards.filter(c=>c.name==='Lightning Energy').length,3);assert.ok(p.active.cards.some(c=>c.name==='Double Colorless Energy'));assert.ok(o.active.damage%30===0);outcomes.add(o.active.damage);}assert.ok([...outcomes].some(x=>x>0));
});
test('Dark Drain heals the total actual damage across the opposing field',()=>{
 for(const seed of [1,2,3,4,5,6,7,8]){const m=combat(map['neo4-2']),[p,o]=m.store.state.players;p.active.damage=60;for(const slot of [o.active,...o.bench])if(slot.getPokemonCard())slot.getPokemonCard().hp=500;attach(m,p.active,'Grass Energy BS',4);m.randomState=seed;M.apply(m,{type:'attack',player:1,name:'Dark Drain'});settle(m);const dealt=[o.active,...o.bench].reduce((n,l)=>n+l.damage,0);assert.equal(p.active.damage,60-dealt);}
});
test('Riptide counts discard Water Energy and shuffles it back without moving other cards',()=>{
 const m=combat(map['neo1-5'],'Blastoise BS'),[p,o]=m.store.state.players;attach(m,p.active,'Water Energy BS',3);const water1=fixtureCard(m,'Water Energy BS','discard'),water2=fixtureCard(m,'Water Energy BS','discard'),fire=fixtureCard(m,'Fire Energy BS','discard');M.apply(m,{type:'attack',player:1,name:'Riptide'});settle(m);assert.equal(o.active.damage,30);assert.ok(p.deck.cards.includes(water1));assert.ok(p.deck.cards.includes(water2));assert.ok(p.discard.cards.includes(fire));
});
test('Stadium actions work for either player once per turn and replacement removes the old Stadium',()=>{
 const m=combat('Charmander BS');let [p,o]=m.store.state.players;const lucky=fixtureCard(m,map['neo4-100']);M.apply(m,{type:'play',player:1,index:p.hand.cards.indexOf(lucky),target});settle(m);assert.ok(p.stadium.cards.includes(lucky));
 M.apply(m,{type:'stadium',player:1});settle(m);assert.throws(()=>M.apply(m,{type:'stadium',player:1}));[p,o]=m.store.state.players;M.apply(m,{type:'pass',player:1});settle(m);M.apply(m,{type:'stadium',player:2});settle(m);assert.throws(()=>M.apply(m,{type:'stadium',player:2}));[p,o]=m.store.state.players;
 const radio=fixtureCard(m,map['neo4-95']);p.hand.moveCardTo(radio,o.hand);M.apply(m,{type:'play',player:2,index:o.hand.cards.indexOf(radio),target});settle(m);assert.ok(p.discard.cards.some(c=>c.fullName===lucky.fullName));const deck=[...o.deck.cards];M.apply(m,{type:'stadium',player:2});const prompt=M.pending(m).find(q=>q.type==='Show cards');assert.equal(prompt.playerId,o.id);assert.deepEqual([...prompt.cards],deck.slice(0,2));settle(m);assert.deepEqual([...o.deck.cards],deck);
});
test('Broken Ground Gym changes Basic retreat costs and Sprout Tower reduces damage after Weakness',()=>{
 const m=combat('Charmander BS','Charmeleon BS'),[p,o]=m.store.state.players;const before=new R.CheckRetreatCostEffect(p);m.store.reduceEffect(m.store.state,before);const evolved=new R.CheckRetreatCostEffect(o);m.store.reduceEffect(m.store.state,evolved);const gym=fixtureCard(m,map['neo4-92']);M.apply(m,{type:'play',player:1,index:p.hand.cards.indexOf(gym),target});settle(m);const after=new R.CheckRetreatCostEffect(p);m.store.reduceEffect(m.store.state,after);const afterEvolved=new R.CheckRetreatCostEffect(o);m.store.reduceEffect(m.store.state,afterEvolved);assert.equal(after.cost.length,before.cost.length+1);assert.equal(afterEvolved.cost.length,evolved.cost.length);
 const n=combat('Chansey BS','Blastoise BS'),[np,no]=n.store.state.players;np.active.getPokemonCard().hp=500;attach(n,np.active,'Double Colorless Energy BS',2);const tower=fixtureCard(n,map['neo1-97']);M.apply(n,{type:'play',player:1,index:np.hand.cards.indexOf(tower),target});settle(n);M.apply(n,{type:'attack',player:1,name:'Double-edge'});settle(n);assert.equal(no.active.damage,50);assert.equal(np.active.damage,50);
});
test('Light Screen halves damage after Weakness and Resistance, rounds down, and expires',()=>{
 const m=combat(map['basep-2'],'Charmander BS'),[p,o]=m.store.state.players;p.active.getPokemonCard().hp=500;attach(m,p.active,'Lightning Energy BS');attach(m,o.active,'Fire Energy BS',3);
 M.apply(m,{type:'attack',player:1,name:'Light Screen'});settle(m);M.apply(m,{type:'attack',player:2,name:'Ember'});settle(m);assert.equal(p.active.damage,10);
 M.apply(m,{type:'pass',player:1});settle(m);M.apply(m,{type:'attack',player:2,name:'Ember'});settle(m);assert.equal(p.active.damage,40);
 const n=combat(map['basep-2'],'Machop BS'),[np,no]=n.store.state.players;np.active.getPokemonCard().hp=500;attach(n,np.active,'Lightning Energy BS');attach(n,no.active,'Fighting Energy BS');M.apply(n,{type:'attack',player:1,name:'Light Screen'});settle(n);M.apply(n,{type:'attack',player:2,name:'Low Kick'});settle(n);assert.equal(np.active.damage,20);
});
test('Juxtapose swaps damage simultaneously, bypasses damage modifiers, and respects effect protection',()=>{
 const outcomes=new Set();for(const seed of [1,2,3,4,5,6,7,8]){const m=combat(map['gym2-14']),[p,o]=m.store.state.players;p.active.getPokemonCard().hp=500;p.active.damage=60;o.active.damage=10;attach(m,p.active,'Psychic Energy BS',3);m.randomState=seed;M.apply(m,{type:'attack',player:1,name:'Juxtapose'});settle(m);outcomes.add(p.active.damage+','+o.active.damage);}assert.deepEqual([...outcomes].sort(),['10,60','60,10']);
 const protectedGame=combat(map['gym2-14']),[p,o]=protectedGame.store.state.players;p.active.damage=60;o.active.damage=10;o.active.preventEffectsOfAttacksNextTurn={};attach(protectedGame,p.active,'Psychic Energy BS',3);protectedGame.randomState=1;M.apply(protectedGame,{type:'attack',player:1,name:'Juxtapose'});settle(protectedGame);assert.equal(p.active.damage,60);assert.equal(o.active.damage,10);
});
test('Beedrill Venom Spray applies both conditions only when evolving the Active Pokemon',()=>{
 for(const bench of [false,true]){const m=combat('Kakuna BS'),[p,o]=m.store.state.players;M.apply(m,{type:'pass',player:1});settle(m);M.apply(m,{type:'pass',player:2});settle(m);const slot=bench?p.bench[0]:p.active;if(bench){slot.moveTo(p.discard);put(m,'Kakuna BS',slot);}slot.pokemonPlayedTurn=0;const c=fixtureCard(m,map['ecard3-5']);M.apply(m,{type:'play',player:1,index:p.hand.cards.indexOf(c),target:{player:R.PlayerType.BOTTOM_PLAYER,slot:bench?R.SlotType.BENCH:R.SlotType.ACTIVE,index:0}});settle(m);assert.equal(o.active.specialConditions.includes(R.SpecialCondition.PARALYZED),!bench);assert.equal(o.active.specialConditions.includes(R.SpecialCondition.POISONED),!bench);}
});
test('Forretress coin branches spread only to Bench and switch only on two heads',()=>{
 const hits=new Set();for(const seed of [1,2,3,4,5,6,7,8,19,29]){
  const m=combat(map['ecard3-9']),[p,o]=m.store.state.players;const source=p.active;source.getPokemonCard().hp=500;attach(m,source,'Double Colorless Energy BS',2);m.randomState=seed;
  M.apply(m,{type:'attack',player:1,name:'Spinning Blow'});settle(m);hits.add(o.active.damage);assert.equal(p.active===source,o.active.damage!==40);
  const n=combat(map['ecard3-9']),[np,no]=n.store.state.players;attach(n,np.active,'Double Colorless Energy BS',2);attach(n,np.active,'Metal Energy N1');n.randomState=seed;M.apply(n,{type:'attack',player:1,name:'Scatterbomb'});settle(n);
  assert.equal(np.active.damage,0);assert.equal(no.active.damage,40);assert.equal(np.bench[0].damage+no.bench[0].damage,20);assert.equal(no.bench[0].damage,no.bench[1].damage);assert.equal(np.bench[0].damage,np.bench[1].damage);
 }assert.deepEqual([...hits].sort((a,b)=>a-b),[0,20,40]);
});
test('Primeape subtracts its damage counters and resolves recoil before switching the defender',()=>{
 const m=combat(map['ecard2-29'],'Blastoise BS'),[p,o]=m.store.state.players;p.active.damage=20;attach(m,p.active,'Fighting Energy BS',3);M.apply(m,{type:'attack',player:1,name:'Karate Chop'});settle(m);assert.equal(o.active.damage,parseInt(p.active.getPokemonCard().attacks.find(a=>a.name==='Karate Chop').damage)-20);
 const n=combat(map['ecard2-29'],'Blastoise BS'),[np,no]=n.store.state.players;attach(n,np.active,'Fighting Energy BS',3);const old=no.active;M.apply(n,{type:'attack',player:1,name:'Sudden Charge'});settle(n);assert.equal(np.active.damage,10);assert.notEqual(no.active,old);assert.ok(no.bench.includes(old));
});
test('Sweet Nectar heals a chosen Pokemon completely on heads and leaves it unchanged on tails',()=>{
 const outcomes=new Set();for(const seed of [1,2,3,4,5,6,7,8]){const m=combat(map['neo1-3']),p=m.store.state.players[0];p.active.damage=40;attach(m,p.active,'Grass Energy BS',2);m.randomState=seed;M.apply(m,{type:'attack',player:1,name:'Sweet Nectar'});settle(m);outcomes.add(p.active.damage);}assert.deepEqual([...outcomes].sort((a,b)=>a-b),[0,40]);
});
test('Typed Energy movement uses the Energy actually provided under conversion Powers',()=>{
 const m=combat(map['base5-50']),p=m.store.state.players[0];p.bench[0].moveTo(p.discard);put(m,'Charizard BS',p.bench[0]);attach(m,p.bench[0],'Water Energy BS');
 M.apply(m,{type:'ability',player:1,name:'Energy Burn',target:{player:R.PlayerType.BOTTOM_PLAYER,slot:R.SlotType.BENCH,index:0}});settle(m);
 M.apply(m,{type:'ability',player:1,name:'Gather Fire',target});settle(m);assert.ok(p.active.cards.some(c=>c.name==='Water Energy'));assert.ok(!p.bench[0].cards.some(c=>c.name==='Water Energy'));
 const rainbow=combat(map['base5-50']),rp=rainbow.store.state.players[0],special=put(rainbow,map['base5-80'],rp.bench[0]);M.apply(rainbow,{type:'ability',player:1,name:'Gather Fire',target});settle(rainbow);assert.ok(rp.active.cards.includes(special));
 const n=combat(map['gym1-8']),np=n.store.state.players[0];np.bench[0].moveTo(np.discard);put(n,map['gym1-47'],np.bench[0]);attach(n,np.bench[0],'Lightning Energy BS');
 assert.throws(()=>{M.apply(n,{type:'ability',player:1,name:'Energy Charge',target});settle(n);});
});
test('Crystal Kingdra applies the explicit no-Weakness exception to Aquabomb recoil',()=>{
 const m=combat(map['ecard2-148']),[p,o]=m.store.state.players;attach(m,p.active,'Water Energy BS',2);const c=fixtureCard(m,'Lightning Energy BS');M.apply(m,{type:'play',player:1,index:p.hand.cards.indexOf(c),target});settle(m);
 M.apply(m,{type:'attack',player:1,name:'Aquabomb'});settle(m);assert.equal(o.active.damage,40);assert.equal(p.active.damage,10);
});
test('Previously completed WOTC expansion pools remain complete',()=>{
 for(const [id,total] of [['base1',102],['base2',64],['base3',62],['base4',130],['base5',83],['si1',18],['base6',110]])assert.equal(wotcPlan.bySet.find(s=>s.id===id).available,total,id);
});
test('Discard-powered attacks count cards, retain other Energy, and work with no matching Energy',()=>{
 for(const fires of [0,3]){
  const m=combat(map['ecard1-21']),[p,o]=m.store.state.players;o.active.getPokemonCard().hp=500;attach(m,p.active,'Double Colorless Energy BS',2);attach(m,p.active,'Fire Energy BS',fires);
  M.apply(m,{type:'attack',player:1,name:'Ethereal Flame'});settle(m);assert.equal(o.active.damage,30+20*fires);assert.equal(p.discard.cards.filter(c=>c.name==='Fire Energy').length,fires);assert.equal(p.active.cards.filter(c=>c.name==='Double Colorless Energy').length,2);
 }
});
test('Damage resolves before Poison disables a defending Pokemon Power',()=>{
 const m=combat(map['ecard1-18'],'Mr Mime JU'),[p,o]=m.store.state.players;m.store.state.rules=new R.Rules(M.profiles.wotc2002);attach(m,p.active,'Grass Energy BS',4);
 M.apply(m,{type:'attack',player:1,name:'Poisonpowder'});settle(m);assert.equal(o.active.damage,10);assert.ok(o.active.specialConditions.includes(R.SpecialCondition.POISONED));
});
test('Crystal Type changes on a permitted hand attachment, persists for the turn and expires',()=>{
 const m=combat(map['ecard3-147']),p=m.store.state.players[0];m.store.state.rules=new R.Rules(M.profiles.wotc2002);
 const energy=fixtureCard(m,'Fire Energy BS');M.apply(m,{type:'play',player:1,index:p.hand.cards.indexOf(energy),target});settle(m);
 const check=()=>{const e=new R.CheckPokemonTypeEffect(p.active);m.store.reduceEffect(m.store.state,e);return Array.from(e.cardTypes);};
 assert.deepEqual(check(),[R.CardType.FIRE]);p.active.specialConditions=[R.SpecialCondition.POISONED];assert.deepEqual(check(),[R.CardType.FIRE]);
 M.apply(m,{type:'pass',player:1});settle(m);assert.deepEqual(check(),[R.CardType.COLORLESS]);
});
test('Energy HP and Energy Barrier count eligible cards without repeated-check stacking',()=>{
 const m=combat(map['gym2-97']),p=m.store.state.players[0];attach(m,p.active,'Psychic Energy BS');put(m,map['base5-80'],p.active);attach(m,p.active,'Double Colorless Energy BS');
 for(let i=0;i<2;i++){const hp=new R.CheckHpEffect(p,p.active);m.store.reduceEffect(m.store.state,hp);assert.equal(hp.hp,p.active.getPokemonCard().hp+20);}
 const n=combat('Charmander BS',map['ecard2-95a']),[np,no]=n.store.state.players;attach(n,np.active,'Fire Energy BS',2);attach(n,no.active,'Water Energy BS',3);M.apply(n,{type:'attack',player:1,name:'Ember'});settle(n);assert.equal(no.active.damage,10);
});
test('Defensive Powers use damage after Weakness and preserve the damage threshold',()=>{
 const m=combat('Charmander BS',map['gym2-41']),[p,o]=m.store.state.players;attach(m,p.active,'Fire Energy BS',2);M.apply(m,{type:'attack',player:1,name:'Ember'});settle(m);assert.equal(o.active.damage,30);
 for(const [attacker,attack,energy,damage] of [['Charmander BS','Ember','Fire Energy BS',10],['Scyther JU','Slash','Double Colorless Energy BS',60]]){const n=combat(attacker,map['neo3-51']),[np,no]=n.store.state.players;no.active.getPokemonCard().hp=200;attach(n,np.active,energy,2);M.apply(n,{type:'attack',player:1,name:attack});settle(n);assert.equal(no.active.damage,damage);}
});
test('Juggler pays the selected Energy cost and draws five for two cards',()=>{
 const m=combat('Charmander BS'),p=m.store.state.players[0];fixtureCard(m,'Water Energy BS');fixtureCard(m,'Water Energy BS');const c=fixtureCard(m,map['ecard2-126']);
 M.apply(m,{type:'play',player:1,index:p.hand.cards.indexOf(c),target});drain(m);const q=M.pending(m)[0];assert.equal(q.type,'Choose cards');const count=p.hand.cards.length;
 const selected=q.cards.cards.map((c,i)=>({c,i})).filter(x=>R.matchesPromptFilter(x.c,q.filter)).slice(0,2).map(x=>x.i);answer(m,q,selected);settle(m);assert.equal(p.hand.cards.length,count+3);assert.equal(p.energyPlayedTurn,0);
});
test('Baby protection checks the attack before discards and survives Special Conditions',()=>{
 const outcomes=new Set();
 for(let seed=1;seed<=8;seed++){
  const m=combat('Charmander BS',map['ecard1-17']),[p,o]=m.store.state.players;
  attach(m,p.active,'Fire Energy BS',2);o.active.getPokemonCard().hp=200;o.active.specialConditions=[R.SpecialCondition.POISONED];m.randomState=seed;
  M.apply(m,{type:'attack',player:1,name:'Ember'});settle(m);
  const paid=p.discard.cards.filter(c=>c.name==='Fire Energy').length;outcomes.add(paid);
  assert.equal(o.active.damage,paid?40:10,'Only heads attacks; Poison still advances at turn end');assert.equal(m.store.state.turn,2);
 }
 assert.deepEqual([...outcomes].sort(),[0,1]);
});
test('Damage counters bypass Weakness and attack bonuses, and half-HP damage rounds down',()=>{
 const counter=wotcData.find(r=>r.ops?.some(ops=>ops.some(op=>op.op==='counters'&&op.amount===10)));assert.ok(counter);
 const m=combat(map[counter.d.id],'Mr Mime JU'),[p,o]=m.store.state.players;for(const t of ['Psychic','Grass','Fire','Water','Lightning','Fighting'])attach(m,p.active,t+' Energy BS',4);
 const i=counter.ops.findIndex(ops=>ops.some(op=>op.op==='counters'&&op.amount===10));const card=fixtureCard(m,'PlusPower BS');M.apply(m,{type:'play',player:1,index:p.hand.cards.indexOf(card),target});M.apply(m,{type:'attack',player:1,name:p.active.getPokemonCard().attacks[i].name});settle(m);assert.equal(o.active.damage,10);
 const half=wotcData.find(r=>r.ops?.some(ops=>ops.some(op=>op.op==='halfHpDown')));assert.ok(half);
 const n=combat(map[half.d.id]),[np,no]=n.store.state.players;no.active.damage=10;for(const t of ['Psychic','Grass','Fire','Water','Lightning','Fighting'])attach(n,np.active,t+' Energy BS',4);put(n,map['neo1-19'],np.active);
 const hi=half.ops.findIndex(ops=>ops.some(op=>op.op==='halfHpDown'));M.apply(n,{type:'attack',player:1,name:np.active.getPokemonCard().attacks[hi].name});settle(n);assert.equal(no.active.damage,60);
});
test('Energy movement Powers preserve attachments and distinguish unlimited and once-per-turn use',()=>{
 for(const [id,name,once] of [['ecard1-2','Energy Connect',false],['ecard3-2','Energy Jump',true]]){
  const m=combat(map[id]),p=m.store.state.players[0];attach(m,p.bench[0],'Water Energy BS',2);
  M.apply(m,{type:'ability',player:1,name,target});settle(m);assert.equal(p.bench[0].cards.filter(c=>c.name==='Water Energy').length,1);assert.equal(p.active.cards.filter(c=>c.name==='Water Energy').length,1);assert.equal(p.energyPlayedTurn,0);
  if(once)assert.throws(()=>{M.apply(m,{type:'ability',player:1,name,target});settle(m);});else{M.apply(m,{type:'ability',player:1,name,target});settle(m);assert.equal(p.active.cards.filter(c=>c.name==='Water Energy').length,2);}
 }
});
test('Wild Growth doubles only basic Grass Energy on Grass Pokemon and does not stack',()=>{
 const m=combat(map['neo1-11']),p=m.store.state.players[0];p.bench[2].moveTo(p.discard);put(m,map['neo1-11'],p.bench[2]);attach(m,p.bench[0],'Grass Energy BS');attach(m,p.bench[0],'Double Colorless Energy BS');attach(m,p.bench[1],'Grass Energy BS');
 const check=new R.CheckProvidedEnergyEffect(p,p.bench[0]);m.store.reduceEffect(m.store.state,check);assert.deepEqual(Array.from(check.energyMap,e=>Array.from(e.provides)),[[R.CardType.GRASS,R.CardType.GRASS],[R.CardType.COLORLESS,R.CardType.COLORLESS]]);
 const other=new R.CheckProvidedEnergyEffect(p,p.bench[1]);m.store.reduceEffect(m.store.state,other);assert.equal(other.energyMap[0].provides.length,1);
});
test('Leech healing uses actual damage after defensive effects',()=>{
 const r=wotcData.find(r=>r.ops?.some(ops=>ops.some(op=>op.op==='healDealt'&&op.amount===10)));assert.ok(r);
 const index=r.ops.findIndex(ops=>ops.some(op=>op.op==='healDealt'&&op.amount===10));
 for(const opponent of ['Chansey BS','Mr Mime JU']){
  const m=combat(map[r.d.id],opponent),[p,o]=m.store.state.players;p.active.damage=30;for(const t of ['Grass','Fire','Water','Lightning','Psychic','Fighting'])attach(m,p.active,t+' Energy BS',4);
  M.apply(m,{type:'attack',player:1,name:p.active.getPokemonCard().attacks[index].name});settle(m);assert.equal(p.active.damage,o.active.damage?20:30);
 }
});
test('Every newly available WOTC printing has exact printed stats, costs and evolution requirements',()=>{
 const originals=Object.values(R.sets).filter(Array.isArray).flat();const types=s=>({Fire:R.CardType.FIRE,Water:R.CardType.WATER,Grass:R.CardType.GRASS,Lightning:R.CardType.LIGHTNING,Psychic:R.CardType.PSYCHIC,Fighting:R.CardType.FIGHTING,Darkness:R.CardType.DARK,Metal:R.CardType.METAL,Colorless:R.CardType.COLORLESS})[s];
 for(const {d} of wotcData){
  const c=originals.find(c=>c.fullName===map[d.id]);assert.ok(c,d.id+' mapping');
  if(d.supertype!=='Pokémon')continue;
  for(const [field,printed,engine] of [
   ['hp',+d.hp,c.hp],['types',d.types.map(types),Array.from(c.cardType)],['retreat',(d.retreatCost||[]).map(types),Array.from(c.retreat)],['evolvesFrom',d.evolvesFrom||'',c.evolvesFrom||''],
   ['weakness',(d.weaknesses||[]).map(w=>types(w.type)),Array.from(c.weakness,w=>w.type)],['resistance',(d.resistances||[]).map(w=>[types(w.type),+w.value]),Array.from(c.resistance,w=>[w.type,w.value])],
   ['attacks',(d.attacks||[]).map(a=>[a.name,a.cost.map(types),parseInt(a.damage)||0]),Array.from(c.attacks,a=>[a.name,Array.from(a.cost),a.damage])]
  ])if(JSON.stringify(printed)!==JSON.stringify(engine))wotcAudit.push({id:d.id,field,printed,engine});
 }
 fs.writeFileSync(path.join(root,'work/rules-research/wotc-printing-audit.json'),JSON.stringify(wotcAudit,null,2));assert.equal(wotcAudit.length,0,JSON.stringify(wotcAudit.slice(0,8)));
});
test('All 130 Base Set 2 cards reuse their original implemented effects',()=>{
 const pool=wotcData.filter(x=>x.d.set.id==='base4');assert.equal(pool.length,130);assert.ok(pool.every(x=>x.reuse));
 const m=combat(map['base4-69']),p=m.store.state.players[0];attach(m,p.active,'Fire Energy BS',2);M.apply(m,{type:'attack',player:1,name:'Ember'});settle(m);assert.equal(p.discard.cards.filter(c=>c.name==='Fire Energy').length,1);
});
test('Original and reprinted Trainers share their four-copy limit, and Neo Shining Pokemon are limited to one',()=>{
 const bad={name:'Over limit',cards:{'base1-46':4,'base1-73':4,'base4-102':4,'base1-98':48}};assert.throws(()=>M.create({profile:'wotc',decks:[bad,deck]},map));
 const shining={name:'Shining limit',cards:{'base1-46':4,'neo4-109':2,'base1-98':54}};assert.throws(()=>M.create({profile:'wotc2002',decks:[shining,deck]},map));
 const good={name:'One Shining',cards:{'base1-46':4,'neo4-109':1,'base1-98':55}};assert.ok(M.create({profile:'wotc2002',decks:[good,deck]},map));
});
test('Team Rocket Trainer number corrections preserve prize visibility and hand targeting',()=>{
 assert.ok(map['base5-71']);assert.ok(map['base5-72']);assert.ok(map['base5-80']);
 const m=combat('Charmander BS'),p=m.store.state.players[0];const c=fixtureCard(m,map['base5-71']);M.apply(m,{type:'play',player:1,index:p.hand.cards.indexOf(c),target});settle(m);assert.ok(m.store.state.players.every(p=>p.prizes.every(l=>l.faceUpPrize&&!l.isSecret)));
});
test('New multi-coin damage resolves per head and its state replays exactly',()=>{
 const record=wotcData.find(x=>x.reason==='compiled-effects'&&x.d.attacks.some(a=>(a.text||'').startsWith('Flip 2 coins. This attack')));assert.ok(record);
 const m=combat(map[record.d.id]),p=m.store.state.players[0];const c=p.active.getPokemonCard(),a=c.attacks.find(a=>a.text.startsWith('Flip 2 coins'));for(const t of ['Grass','Fire','Water','Lightning','Psychic','Fighting'])attach(m,p.active,t+' Energy BS',4);M.apply(m,{type:'attack',player:1,name:a.name});settle(m);assert.ok([0,10,20,30,40,60,80].includes(m.store.state.players[1].active.damage));assert.equal(m.store.state.turn,2);
});
test('Unknown clauses and Powers stay out of rules mode rather than using vanilla damage',()=>{
 const pendingCards=JSON.parse(fs.readFileSync(path.join(root,'work/rules-research/wotc-automation-pending.json')));for(const c of pendingCards)assert.ok(!map[c.id],c.id+' incorrectly available');
 assert.equal(wotcPlan.available+wotcPlan.pending,wotcPlan.total);
});
test('Every Southern Islands printing is available, including split healing and Energy-type spread',()=>{
 assert.equal(wotcData.filter(x=>x.d.set.id==='si1').length,18);
 const m=combat(map['si1-1'],'Bulbasaur BS'),[p,o]=m.store.state.players;attach(m,p.active,'Grass Energy BS');attach(m,p.active,'Psychic Energy BS');
 M.apply(m,{type:'attack',player:1,name:'Rainbow Wave'});settle(m);assert.equal(o.active.damage,20);assert.equal(o.bench[0].damage,20);assert.equal(o.bench[1].damage,0);assert.equal(o.bench[2].damage,0);
 const h=combat(map['si1-5']),[hp,ho]=h.store.state.players;attach(h,hp.active,'Grass Energy BS',2);hp.active.damage=30;ho.active.damage=30;M.apply(h,{type:'attack',player:1,name:'Strange Scent'});settle(h);assert.ok([0,30].includes(hp.active.damage));assert.ok([0,30].includes(ho.active.damage));
});
test('Gather Fire moves one eligible Energy without using the free attachment and enforces once per turn',()=>{
 const m=combat(map['base5-50']),p=m.store.state.players[0];attach(m,p.bench[0],'Fire Energy BS',2);
 M.apply(m,{type:'ability',player:1,name:'Gather Fire',target});settle(m);assert.equal(p.active.cards.filter(c=>c.name==='Fire Energy').length,1);assert.equal(p.bench[0].cards.filter(c=>c.name==='Fire Energy').length,1);assert.equal(p.active.getPokemonCard()._wotcPowerTurn?.[0],m.store.state.turn,'Gather Fire usage stamp');assert.throws(()=>{M.apply(m,{type:'ability',player:1,name:'Gather Fire',target});settle(m);});
});
test('Sticky Goo modifies the opponent retreat cost and respects the selected Power-condition era',()=>{
 for(const [profile,poisonBlocked] of [['wotc',false],['wotc2002',true]]){
  const m=combat(map['base5-41']),[p,o]=m.store.state.players;m.store.state.rules=new R.Rules(M.profiles[profile]);p.active.specialConditions=[R.SpecialCondition.POISONED];
  const check=new R.CheckRetreatCostEffect(o);m.store.reduceEffect(m.store.state,check);assert.equal(check.cost.length,o.active.getPokemonCard().retreat.length+(poisonBlocked?0:2));
 }
});
test('WOTC Darkness Energy adds damage after weakness and damages non-Dark holders at every turn end',()=>{
 const m=combat('Charmander BS'),[p,o]=m.store.state.players;attach(m,p.active,'Fire Energy BS');put(m,map['neo1-104'],p.active);M.apply(m,{type:'attack',player:1,name:'Scratch'});settle(m);assert.equal(o.active.damage,20);assert.equal(p.active.damage,10);
 M.apply(m,{type:'pass',player:2});settle(m);assert.equal(p.active.damage,20);
});
test('WOTC Metal Energy reduces incoming damage after weakness and non-Metal outgoing damage',()=>{
 const m=combat('Charmander BS'),[p,o]=m.store.state.players;attach(m,p.active,'Fire Energy BS');put(m,map['neo1-19'],p.active);M.apply(m,{type:'attack',player:1,name:'Scratch'});settle(m);assert.equal(o.active.damage,0);
 const n=combat('Scyther JU','Charmander BS'),[np,no]=n.store.state.players;attach(n,np.active,'Double Colorless Energy BS',2);put(n,map['neo1-19'],no.active);M.apply(n,{type:'attack',player:1,name:'Slash'});settle(n);assert.equal(no.active.damage,20);
});
test('Each newly compiled Trainer resolves its validated choices on both seeded branches',()=>{
 for(const record of wotcData.filter(x=>x.reason==='compiled-trainer'))for(const seed of [1,7]){
  const m=combat('Charmander BS'),p=m.store.state.players[0];m.randomState=seed;for(const owner of m.store.state.players)for(const list of [owner.active,...owner.bench])if(list.getPokemonCard())list.damage=10;
  for(const t of ['Fire','Water','Grass','Lightning','Psychic','Fighting'])fixtureCard(m,t+' Energy BS','discard');fixtureCard(m,'Ivysaur BS','discard');fixtureCard(m,'Charmander BS','deck');
  for(const op of record.trainerOps){if(op.op==='technicalMachine'){const pokemon=wotcData.find(x=>x.d.supertype==='Pokémon'&&(op.energies||[op.energy]).some(t=>x.d.types.includes(t))&&(!op.evolved||x.d.subtypes.some(t=>t.startsWith('Stage')))&&map[x.d.id]);if(pokemon){p.active.moveTo(p.discard);put(m,map[pokemon.d.id],p.active);}}if(op.nameIncludes){const pokemon=wotcData.find(x=>x.d.supertype==='Pokémon'&&x.d.name.includes(op.nameIncludes)&&map[x.d.id]);if(pokemon){p.active.moveTo(p.discard);put(m,map[pokemon.d.id],p.active);p.bench[0].moveTo(p.discard);put(m,map[pokemon.d.id],p.bench[0]);}}}attach(m,p.active,'Fire Energy BS',3);fixtureCard(m,'Fire Energy BS');fixtureCard(m,'Bill BS');fixtureCard(m,'Bill BS');fixtureCard(m,'Charmander BS');
  if(record.trainerOps.some(op=>op.op==='maxRevive')){fixtureCard(m,'Water Energy BS');fixtureCard(m,'Charmander BS','discard');}
  if(record.trainerOps.some(op=>op.op==='finalClause'&&op.kind==='personalityTest'))fixtureCard(m,'Ivysaur BS');
  const c=fixtureCard(m,map[record.d.id]);if(record.trainerOps.some(o=>o.op==='mailFromBill'))p.hand.moveCardsTo(p.hand.cards.filter(x=>x!==c),p.deck);
  try{M.apply(m,{type:'play',player:1,index:p.hand.cards.indexOf(c),target});settle(m);assert.equal(M.pending(m).length,0);}
  catch(error){throw Error(record.d.id+' '+record.d.name+' seed '+seed+': '+(error.stack||JSON.stringify(error)));}
 }
});
test('Historical first-turn Supporters follow the selected profile and retain their once-per-turn limit',()=>{
 for(const profile of ['wotc2002','modern']){
  const m=combat('Charmander BS'),p=m.store.state.players[0];m.store.state.rules=new R.Rules(M.profiles[profile]);
  const c=fixtureCard(m,map['ecard2-123']);
  if(profile==='modern'){assert.throws(()=>M.apply(m,{type:'play',player:1,index:p.hand.cards.indexOf(c),target}));continue;}
  M.apply(m,{type:'play',player:1,index:p.hand.cards.indexOf(c),target});settle(m);assert.ok(p.supporter.cards.includes(c));
  const second=fixtureCard(m,map['ecard2-123']);assert.throws(()=>M.apply(m,{type:'play',player:1,index:p.hand.cards.indexOf(second),target}));
 }
});
test('Fling and Vanish return the correct cards without awarding a knockout prize',()=>{
 const m=combat(map['base5-10']),[p,o]=m.store.state.players;attach(m,p.active,'Fighting Energy BS',4);attach(m,o.active,'Double Colorless Energy BS');const defender=o.active.getPokemonCard(),prizes=p.prizes.filter(x=>x.cards.length).length;
 M.apply(m,{type:'attack',player:1,name:'Fling'});settle(m);assert.ok(o.deck.cards.includes(defender));assert.equal(o.active.getPokemonCard().name,'Bulbasaur');assert.equal(p.prizes.filter(x=>x.cards.length).length,prizes);
 const n=combat(map['base5-49']),np=n.store.state.players[0],abra=np.active.getPokemonCard();attach(n,np.active,'Psychic Energy BS');M.apply(n,{type:'attack',player:1,name:'Vanish'});settle(n);assert.ok(np.deck.cards.includes(abra));assert.ok(np.discard.cards.some(c=>c.name==='Psychic Energy'));assert.equal(np.active.getPokemonCard().name,'Bulbasaur');
});
test('Magnetic Lines moves one basic Energy and Energy Bomb transfers every attached Energy card',()=>{
 const m=combat(map['base5-11']),[p,o]=m.store.state.players;attach(m,p.active,'Lightning Energy BS',2);attach(m,o.active,'Water Energy BS');attach(m,o.active,'Double Colorless Energy BS');M.apply(m,{type:'attack',player:1,name:'Magnetic Lines'});settle(m);assert.ok(o.bench[0].cards.some(c=>c.name==='Water Energy'));assert.ok(o.active.cards.some(c=>c.name==='Double Colorless Energy'));
 const n=combat(map['base5-34']),np=n.store.state.players[0];attach(n,np.active,'Lightning Energy BS',2);attach(n,np.active,'Double Colorless Energy BS');M.apply(n,{type:'attack',player:1,name:'Energy Bomb'});settle(n);assert.equal(np.active.cards.filter(c=>c.superType===R.SuperType.ENERGY).length,0);assert.equal(np.bench[0].cards.filter(c=>c.superType===R.SuperType.ENERGY).length,3);
});
test('Stare disables a targeted Pokemon Power through the opponent turn and clears when switching',()=>{
 const m=combat(map['base5-2'],'Blastoise BS'),[p,o]=m.store.state.players;attach(m,p.active,'Grass Energy BS',2);M.apply(m,{type:'attack',player:1,name:'Stare'});settle(m);
 assert.equal(o.active.damage,10);assert.throws(()=>{M.apply(m,{type:'ability',player:2,name:'Rain Dance',target});settle(m);});
 M.apply(m,{type:'pass',player:2});settle(m);assert.equal(m.store.state.players[1].active.marker.hasMarker('WOTC_STARE_POWER_LOCK'),false);
 const n=combat(map['base5-2'],'Blastoise BS'),[np,no]=n.store.state.players;attach(n,np.active,'Grass Energy BS',2);attach(n,no.active,'Double Colorless Energy BS',2);M.apply(n,{type:'attack',player:1,name:'Stare'});settle(n);M.apply(n,{type:'retreat',player:2,index:0});settle(n);assert.equal(no.bench[0].marker.hasMarker('WOTC_STARE_POWER_LOCK'),false);
});
test('Sinkhole damages only a successful opposing retreat and respects Power conditions',()=>{
 const results=[];for(const seed of [1,7]){
  const m=combat(map['base5-6'],'Charmander BS'),[p,o]=m.store.state.players;attach(m,o.active,'Fire Energy BS');M.apply(m,{type:'pass',player:1});settle(m);m.randomState=seed;M.apply(m,{type:'retreat',player:2,index:0});settle(m);results.push(o.bench[0].damage);assert.equal(o.bench[0].getPokemonCard().name,'Charmander');
 }assert.deepEqual(results.sort((a,b)=>a-b),[0,20]);
 const m=combat(map['base5-6'],'Charmander BS'),[p,o]=m.store.state.players;assert.throws(()=>M.apply(m,{type:'retreat',player:1,index:0}));assert.equal(o.active.damage,0);
});
test('Final Beam responds to attack knockouts with Water weakness, without firing on Poison knockouts',()=>{
 const outcomes=[];for(const seed of [1,2,3,4,5,6,7,8]){
  const m=combat('Charmeleon BS',map['base5-8']),[p,o]=m.store.state.players;p.active.getPokemonCard().hp=500;o.active.damage=20;attach(m,p.active,'Fire Energy BS',3);attach(m,o.active,'Water Energy BS',2);m.randomState=seed;M.apply(m,{type:'attack',player:1,name:'Flamethrower'});settle(m);outcomes.push(p.active.damage);assert.equal(o.active.getPokemonCard().name,'Bulbasaur');
 }assert.deepEqual([...new Set(outcomes)].sort((a,b)=>a-b),[0,80]);
 const simultaneous=combat('Charmeleon BS',map['base5-8']),[sp,so]=simultaneous.store.state.players;so.active.damage=20;attach(simultaneous,sp.active,'Fire Energy BS',3);attach(simultaneous,so.active,'Water Energy BS',2);simultaneous.randomState=1;M.apply(simultaneous,{type:'attack',player:1,name:'Flamethrower'});settle(simultaneous);assert.equal(sp.active.getPokemonCard().name,'Bulbasaur');assert.equal(so.active.getPokemonCard().name,'Bulbasaur');assert.equal(sp.prizes.filter(x=>x.cards.length).length,5);assert.equal(so.prizes.filter(x=>x.cards.length).length,5);
 const m=combat('Charmeleon BS',map['base5-8']),[p,o]=m.store.state.players;o.active.damage=60;o.active.specialConditions=[R.SpecialCondition.POISONED];attach(m,o.active,'Water Energy BS',2);M.apply(m,{type:'pass',player:1});settle(m);assert.equal(p.active.damage,0);
});
let wotcScenarios=0;
test('Every newly compiled distinct WOTC attack completes validated prompts under two seeded coin branches',()=>{
 const seen=new Set();
 for(const record of wotcData.filter(x=>x.reason==='compiled-effects'))for(let i=0;i<(record.d.attacks||[]).length;i++){
  const printed=record.d.attacks[i],key=JSON.stringify(printed);if(seen.has(key))continue;seen.add(key);
  for(const seed of [1,7]){
   const m=combat(map[record.d.id]);m.randomState=seed;const [p,o]=m.store.state.players;
   p.active.getPokemonCard().hp=4000;o.active.getPokemonCard().hp=4000;
   for(const owner of [p,o])for(const list of [owner.active,...owner.bench])if(list.getPokemonCard())list.getPokemonCard().hp=4000;
   for(const t of ['Fire','Water','Grass','Lightning','Psychic','Fighting']){attach(m,p.active,t+' Energy BS',6);fixtureCard(m,t+' Energy BS','discard');fixtureCard(m,t+' Energy BS','deck');}
   attach(m,p.active,'Darkness Energy N1',4);attach(m,p.active,'Metal Energy N1',4);
   if(record.ops[i].some(op=>op.op==='requireEqualEnergy'))for(const c of p.active.cards.filter(c=>c.superType===R.SuperType.ENERGY))attach(m,o.active,c.fullName);
   for(const op of record.ops[i]){if(op.op==='requireDamage')p.active.damage=Math.max(p.active.damage,op.amount);if(op.requireDamaged)o.active.damage=10;}
   if(record.ops[i].some(op=>op.op==='requirePreviousAttack')){p.wotcLastTurnEnded=0;p.active.getPokemonCard()._wotcLastUsedAttack={name:'Lie Low',turn:0};}
   try{M.apply(m,{type:'attack',player:1,name:printed.name});settle(m);assert.equal(M.pending(m).length,0);assert.equal(m.store.state.turn,2);wotcScenarios++;}
   catch(error){throw Error(record.d.id+' '+printed.name+' seed '+seed+': '+(error.stack||JSON.stringify(error)));}
  }
 }
 console.log('New WOTC attack scenarios: '+wotcScenarios);
});
fs.writeFileSync(path.join(root,'work/rules-research/wotc-test-report.json'),JSON.stringify({passed:true,coverage:wotcPlan,printingDifferences:wotcAudit,attackScenarios:wotcScenarios,tests:passed.slice(passed.indexOf('Every distinct Base–Fossil attack resolves its choices under both seeded coin branches')+1)},null,2));








