const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),ui=path.join(root,'work/desktop/ui');
const ctx={console,setTimeout,clearTimeout};vm.createContext(ctx);
for(const file of ['rules-engine.js','rules-match.js','deck-text.js'])vm.runInContext(fs.readFileSync(path.join(ui,file),'utf8'),ctx,{filename:file});
const M=ctx.RulesMatch,R=M.R,T=ctx.DeckText;
const map=JSON.parse(fs.readFileSync(path.join(ui,'rules-card-map.json'))),metadata=JSON.parse(fs.readFileSync(path.join(ui,'card-details.json'))),cards=JSON.parse(fs.readFileSync(path.join(ui,'cards.json'))),codes=JSON.parse(fs.readFileSync(path.join(ui,'deck-set-codes.json')));
const passed=[];function test(name,fn){fn();passed.push(name);console.log('PASS '+name)}
const deck={name:'Rules test',cards:{'base1-46':4,'base1-44':4,'base1-91':4,'base1-94':4,'base1-95':4,'base1-24':4,'base1-98':36}};
const target={player:R.PlayerType.BOTTOM_PLAYER,slot:R.SlotType.ACTIVE,index:0};
function answer(m,p,value){M.apply(m,{type:'prompt',id:p.id,value});}
function drain(m){for(let i=0;i<100;i++){const p=M.pending(m).find(p=>['WaitPrompt','Coin flip'].includes(p.type));if(!p)break;answer(m,p,true)}}
function setup(profile='modern',fixture=deck){
  const m=M.create({profile,seed:7,decks:[fixture,fixture]},map);
  for(let i=0;i<300;i++){
    const p=M.pending(m)[0];if(!p)break;
    if(p.type==='Coin flip')answer(m,p,true);
    else if(p.type==='Shuffle deck'){const pl=m.store.state.players.find(x=>x.id===p.playerId);answer(m,p,Array.from({length:pl.deck.cards.length},(_,i)=>i));}
    else if(p.type==='Confirm')answer(m,p,true);
    else if(p.type==='Choose cards'){
      const indexes=p.cards.cards.map((c,i)=>({c,i})).filter(x=>!p.options.blocked.includes(x.i)&&R.matchesPromptFilter(x.c,p.filter)).slice(0,p.options.min).map(x=>x.i);answer(m,p,indexes);
    }else if(p.type==='Select')answer(m,p,0);
    else if(['WaitPrompt','ShowMulligan','Show mulligan','Alert','Show cards','Confirm cards'].includes(p.type))answer(m,p,true);
    else throw Error('Unexpected setup prompt '+p.type);
  }
  assert.equal(m.store.state.phase,R.GamePhase.PLAYER_TURN);return m;
}
function inHand(m,id,player=0){const p=m.store.state.players[player];let i=p.hand.cards.findIndex(c=>c._labId===id);if(i>=0)return i;const list=[p.deck,...p.prizes].find(l=>l.cards.some(c=>c._labId===id));assert.ok(list,'Missing fixture '+id);const c=list.cards.find(c=>c._labId===id);list.moveCardTo(c,p.hand);return p.hand.cards.indexOf(c);}
function energy(m,player=0){const p=m.store.state.players[player];return M.apply(m,{type:'play',player:p.id,index:inHand(m,'base1-98',player),target});}
test('Limitless import: exact printings, headers, repeated quantities, CRLF',()=>{
  const parsed=T.parse('Pokémon: 8\r\n4 Charmander BS 46\r\n4 Bulbasaur BS 44\r\nTrainer: 4\r\n4 Bill BS 91\r\nEnergy: 48\r\n48 Fire Energy BS 98\r\nTotal Cards: 60',cards,metadata,codes);
  assert.equal(parsed.errors.length,0);assert.equal(parsed.count,60);assert.equal(parsed.cards['base1-46'],4);
});
test('Limitless import refuses mismatched names, unknown cards and totals',()=>{
  assert.equal(T.parse('4 Charizard BS 46',cards,metadata,codes).errors.length,1);
  assert.equal(T.parse('4 Unknown OBF 999',cards,metadata,codes).errors.length,1);
  assert.equal(T.parse('4 Charmander BS 46\nTotal Cards: 60',cards,metadata,codes).errors.length,1);
});
test('Limitless export round trips without changing printings',()=>{
  const exported=T.format(deck,cards,metadata,codes),parsed=T.parse(exported,cards,metadata,codes);
  assert.equal(parsed.errors.length,0);assert.deepEqual(JSON.parse(JSON.stringify(parsed.cards)),deck.cards);
});
test('Setup draws hands, enforces Basics, places six prizes, automatically draws first turn',()=>{
  const m=setup();assert.equal(m.store.state.turn,1);for(const p of m.store.state.players){assert.equal(p.prizes.filter(l=>l.cards.length).length,6);assert.equal(p.active.getPokemonCard().stage,R.Stage.BASIC)}assert.equal(m.store.state.players[0].hand.cards.length,7);
});
test('Modern attack restriction and opponent turn rejection',()=>{
  const m=setup();energy(m);assert.throws(()=>M.apply(m,{type:'attack',player:1,name:'Scratch'}));assert.throws(()=>M.apply(m,{type:'pass',player:2}));
});
test('One Energy attachment per turn; opponent attachment and early evolution refused',()=>{
  const m=setup();energy(m);assert.throws(()=>energy(m));assert.throws(()=>M.apply(m,{type:'play',player:1,index:inHand(m,'base1-98'),target:{...target,player:R.PlayerType.TOP_PLAYER}}));assert.throws(()=>M.apply(m,{type:'play',player:1,index:inHand(m,'base1-24'),target}));
});
test('Black & White permits first-turn attack and automatically ends it',()=>{
  const m=setup('bw');energy(m);M.apply(m,{type:'attack',player:1,name:'Scratch'});drain(m);assert.equal(m.store.state.players[1].active.damage,10);assert.equal(m.store.state.activePlayer,1);assert.equal(m.store.state.turn,2);
});
test('ex profile skips the first draw; Diamond & Pearl disallows first-turn Trainers',()=>{
  const ex=setup('ex');assert.equal(ex.store.state.players[0].hand.cards.length,6);
  const dp=setup('dp');assert.throws(()=>M.apply(dp,{type:'play',player:1,index:inHand(dp,'base1-91'),target}),/Diamond/);
});
test('Historical WOTC Bill draws two as a Trainer and moves to discard',()=>{
  const m=setup('wotc');const p=m.store.state.players[0],i=inHand(m,'base1-91'),before=p.hand.cards.length;M.apply(m,{type:'play',player:1,index:i,target});assert.equal(p.hand.cards.length,before+1);assert.equal(p.discard.cards.at(-1).name,'Bill');
});
test('Evolving on a subsequent turn preserves damage and attachments and clears conditions',()=>{
  const m=setup();energy(m);const p=m.store.state.players[0];p.active.damage=10;p.active.specialConditions=[R.SpecialCondition.POISONED];m.store.state.turn=3;
  M.apply(m,{type:'play',player:1,index:inHand(m,'base1-24'),target});assert.equal(p.active.getPokemonCard().name,'Charmeleon');assert.equal(p.active.damage,10);assert.equal(p.active.specialConditions.length,0);assert.ok(p.active.cards.some(c=>c.superType===R.SuperType.ENERGY));
});
test('Invalid and duplicate setup choices are rejected before mutation',()=>{
  const m=M.create({profile:'modern',decks:[deck,deck]},map);const p=M.pending(m)[0];assert.throws(()=>answer(m,p,'heads'));assert.equal(p.result,undefined);
});
test('Saved action journal restores exact setup, turn, deck order and pending choices',()=>{
  const m=setup();const saved=JSON.parse(JSON.stringify({spec:m.spec,journal:m.journal}));const copy=M.restore(saved,map,[]);assert.equal(copy.store.state.turn,m.store.state.turn);assert.equal(copy.store.state.activePlayer,m.store.state.activePlayer);assert.deepEqual(copy.store.state.players.map(p=>p.deck.cards.map(c=>c._labId)),m.store.state.players.map(p=>p.deck.cards.map(c=>c._labId)));
});
test('Weakness doubles attack damage before damage counters are placed',()=>{
  const m=setup('bw'),op=m.store.state.players[1];op.active.moveTo(op.bench[0]);const bulba=op.hand.cards.find(c=>c.name==='Bulbasaur');op.hand.moveCardTo(bulba,op.active);
  energy(m);M.apply(m,{type:'attack',player:1,name:'Scratch'});drain(m);assert.equal(op.active.damage,20);
});
test('Knockouts discard the stack, award a prize, and require a legal replacement',()=>{
  const m=setup('bw'),op=m.store.state.players[1],p=m.store.state.players[0];const bulba=op.hand.cards.find(c=>c.name==='Bulbasaur');op.hand.moveCardTo(bulba,op.bench[0]);op.active.damage=40;energy(m);M.apply(m,{type:'attack',player:1,name:'Scratch'});drain(m);
  for(let i=0;i<20;i++){const pending=M.pending(m)[0];if(!pending)break;if(pending.type==='Choose prize')answer(m,pending,[0]);else if(pending.type==='Choose pokemon')answer(m,pending,[M.targets(m,pending)[0].target]);else if(pending.type==='WaitPrompt')answer(m,pending,true);else throw Error('Unexpected KO prompt '+pending.type)}
  assert.ok(op.discard.cards.some(c=>c.name==='Charmander'));assert.equal(p.prizes.filter(l=>l.cards.length).length,5);assert.equal(op.active.getPokemonCard().name,'Bulbasaur');
});
test('No Pokémon remaining is an automatic loss',()=>{
  const m=setup('bw'),op=m.store.state.players[1];op.active.damage=40;energy(m);M.apply(m,{type:'attack',player:1,name:'Scratch'});drain(m);
  for(let i=0;i<10;i++){const p=M.pending(m)[0];if(!p)break;if(p.type==='Choose prize')answer(m,p,[0]);else if(p.type==='WaitPrompt')answer(m,p,true);else break}
  assert.equal(m.store.state.phase,R.GamePhase.FINISHED);assert.equal(m.store.state.winner,0);
});
test('Deck-out is checked on mandatory turn draw',()=>{
  const m=setup(),op=m.store.state.players[1];op.deck.moveTo(op.discard);M.apply(m,{type:'pass',player:1});drain(m);assert.equal(m.store.state.phase,R.GamePhase.FINISHED);assert.equal(m.store.state.winner,0);
});
test('Historical Burn: XY heads causes no damage and remains; SM heads deals 20 then clears',()=>{
  for(const profile of ['xy','sm']){const m=setup(profile),p=m.store.state.players[0];p.active.specialConditions=[R.SpecialCondition.BURNED];M.apply(m,{type:'pass',player:1});drain(m);assert.equal(p.active.damage,profile==='xy'?0:20);assert.equal(p.active.specialConditions.includes(R.SpecialCondition.BURNED),profile==='xy');}
});
test('Poison checkup applies automatically and Sleep prevents attacking',()=>{
  const m=setup('bw'),p=m.store.state.players[0];p.active.specialConditions=[R.SpecialCondition.POISONED];M.apply(m,{type:'pass',player:1});drain(m);assert.equal(p.active.damage,10);
  const sleep=setup('bw');energy(sleep);sleep.store.state.players[0].active.specialConditions=[R.SpecialCondition.ASLEEP];assert.throws(()=>M.apply(sleep,{type:'attack',player:1,name:'Scratch'}));
});
test('TCG Live symbolic Basic Energy, name-only Trainers, and padded collector numbers import',()=>{
  for(const text of ['4 Basic {R} Energy BS 098','4 Basic Fire Energy BS 98','4 Bill'])assert.equal(T.parse(text,cards,metadata,codes).errors.length,0);
  assert.ok(T.parse('4 Charizard',cards,metadata,codes).errors.length);
});
test('An engine-generated coin flip replays identically across saved matches',()=>{
  const fixture={name:'Coin replay',cards:{'base1-45':4,'base1-99':36,'base1-44':4,'base1-91':4,'base1-94':4,'base1-95':4,'base1-24':4}};
  const m=setup('bw',fixture),p=m.store.state.players[0];M.apply(m,{type:'play',player:1,index:p.hand.cards.findIndex(c=>c.superType===R.SuperType.ENERGY),target});M.apply(m,{type:'attack',player:1,name:'String Shot'});drain(m);
  const copy=M.restore(JSON.parse(JSON.stringify({spec:m.spec,journal:m.journal})),map,[]);
  assert.equal(copy.randomState,m.randomState);assert.deepEqual(copy.store.state.players.map(p=>p.active.damage),m.store.state.players.map(p=>p.active.damage));
});
test('Path to the Peak suppresses Crobat V on-play draw while it is in the environment',()=>{
  for(const locked of [false,true]){
    const m=setup(),p=m.store.state.players[0];p.hand.moveTo(p.discard);
    if(locked){const stadium=R.CardManager.getInstance().getCardByName('Path to the Peak CRE');p.stadium.cards.push(stadium);}
    const bat=R.CardManager.getInstance().getCardByName('Crobat V DAA');p.hand.cards.push(bat);
    M.apply(m,{type:'play',player:1,index:0,target:{...target,slot:R.SlotType.BENCH,index:0}});
    const prompt=M.pending(m).find(p=>p.type==='Confirm');
    assert.equal(!!prompt,!locked);if(prompt)answer(m,prompt,true);assert.equal(p.hand.cards.length,locked?0:6);
  }
});
function fixtureCard(m,name,zone='hand'){const p=m.store.state.players[0],c=R.CardManager.getInstance().getCardByName(name);c.id=m.fixtureId=(m.fixtureId||1000)+1;p[zone].cards.push(c);return c;}
test('WOTC starts with a mandatory first draw and permits Trainers and attacks',()=>{
 const m=setup('wotc');assert.equal(m.store.state.players[0].hand.cards.length,7);energy(m);M.apply(m,{type:'play',player:1,index:inHand(m,'base1-91'),target});M.apply(m,{type:'attack',player:1,name:'Scratch'});drain(m);assert.equal(m.store.state.players[1].active.damage,10);
});
test('WOTC Confusion tails deals 20 self-damage and ends the turn',()=>{
 const m=setup('wotc'),p=m.store.state.players[0];energy(m);p.active.specialConditions=[R.SpecialCondition.CONFUSED];m.randomState=1;M.apply(m,{type:'attack',player:1,name:'Scratch'});drain(m);assert.equal(p.active.damage,20);assert.equal(m.store.state.players[1].active.damage,0);assert.equal(m.store.state.turn,2);
});
test('WOTC Confusion applies self-Weakness and PlusPower after Weakness',()=>{
 const m=setup('wotc'),p=m.store.state.players[0];p.active.moveTo(p.discard);const c=fixtureCard(m,'Mewtwo BS');p.hand.moveCardTo(c,p.active);for(let i=0;i<2;i++){const e=fixtureCard(m,'Psychic Energy BS');p.hand.moveCardTo(e,p.active)}
 fixtureCard(m,'PlusPower BS');M.apply(m,{type:'play',player:1,index:p.hand.cards.findIndex(c=>c.name==='PlusPower'),target});p.active.specialConditions=[R.SpecialCondition.CONFUSED];m.randomState=1;
 M.apply(m,{type:'attack',player:1,name:'Psychic'});drain(m);assert.equal(p.active.damage,50);
});
test('WOTC Defender attaches, reduces Confusion damage, and expires after the opposing turn',()=>{
 const m=setup('wotc'),p=m.store.state.players[0];energy(m);fixtureCard(m,'Defender BS');M.apply(m,{type:'play',player:1,index:p.hand.cards.findIndex(c=>c.name==='Defender'),target});const q=M.pending(m)[0];answer(m,q,[target]);assert.ok(p.active.cards.some(c=>c.name==='Defender'));
 p.active.specialConditions=[R.SpecialCondition.CONFUSED];m.randomState=1;M.apply(m,{type:'attack',player:1,name:'Scratch'});drain(m);assert.equal(p.active.damage,0);assert.ok(p.active.cards.some(c=>c.name==='Defender'));M.apply(m,{type:'pass',player:2});drain(m);assert.ok(p.discard.cards.some(c=>c.name==='Defender'));
});
test('WOTC required Energy discards are paid before the Confusion flip, including on tails',()=>{
 for(const seed of [1,7]){const m=setup('wotc'),p=m.store.state.players[0];for(let i=0;i<2;i++){const e=fixtureCard(m,'Fire Energy BS');p.hand.moveCardTo(e,p.active)}p.active.specialConditions=[R.SpecialCondition.CONFUSED];m.randomState=seed;M.apply(m,{type:'attack',player:1,name:'Ember'});const q=M.pending(m)[0];assert.equal(q.type,'Choose cards');const idx=q.cards.cards.findIndex(c=>c.superType===R.SuperType.ENERGY);answer(m,q,[idx]);assert.equal(p.active.cards.filter(c=>c.superType===R.SuperType.ENERGY).length,1);drain(m);assert.equal(p.discard.cards.filter(c=>c.name==='Fire Energy').length,1);assert.equal(m.store.state.players[1].active.damage,seed===1?0:30);}
});
test('WOTC permits multiple paid normal retreats in a turn; modern permits one',()=>{
 for(const profile of ['wotc','modern']){const m=setup(profile),p=m.store.state.players[0];const b=p.hand.cards.find(c=>c.name==='Bulbasaur');p.hand.moveCardTo(b,p.bench[0]);for(const l of [p.active,p.bench[0]]){const e=fixtureCard(m,'Fire Energy BS');p.hand.moveCardTo(e,l)}M.apply(m,{type:'retreat',player:1,index:0});if(profile==='modern')assert.throws(()=>M.apply(m,{type:'retreat',player:1,index:0}));else{M.apply(m,{type:'retreat',player:1,index:0});assert.equal(p.active.getPokemonCard().name,'Charmander');assert.equal(p.discard.cards.filter(c=>c.name==='Fire Energy').length,2);}}
});
test('WOTC Confusion retreat pays first, tails retains conditions and blocks retry, recovery permits retry',()=>{
 const m=setup('wotc'),p=m.store.state.players[0];const b=p.hand.cards.find(c=>c.name==='Bulbasaur');p.hand.moveCardTo(b,p.bench[0]);for(let i=0;i<2;i++){const e=fixtureCard(m,'Fire Energy BS');p.hand.moveCardTo(e,p.active)}p.active.specialConditions=[R.SpecialCondition.CONFUSED];m.randomState=1;M.apply(m,{type:'retreat',player:1,index:0});assert.equal(p.discard.cards.filter(c=>c.name==='Fire Energy').length,1);drain(m);assert.equal(p.active.getPokemonCard().name,'Charmander');assert.ok(p.active.specialConditions.includes(R.SpecialCondition.CONFUSED));assert.throws(()=>M.apply(m,{type:'retreat',player:1,index:0}));m.store.state.players[0].active.removeSpecialCondition(R.SpecialCondition.CONFUSED);M.apply(m,{type:'retreat',player:1,index:0});assert.equal(m.store.state.players[0].active.getPokemonCard().name,'Bulbasaur');
});
test('WOTC Confusion retreat heads switches and clears conditions after paying',()=>{
 const m=setup('wotc'),p=m.store.state.players[0];const b=p.hand.cards.find(c=>c.name==='Bulbasaur');p.hand.moveCardTo(b,p.bench[0]);energy(m);p.active.specialConditions=[R.SpecialCondition.CONFUSED,R.SpecialCondition.POISONED];m.randomState=7;M.apply(m,{type:'retreat',player:1,index:0});drain(m);assert.equal(p.active.getPokemonCard().name,'Bulbasaur');assert.equal(p.bench[0].specialConditions.length,0);
});
test('WOTC 2002 Power erratum shuts down poisoned powers; early WOTC permits them',()=>{
 for(const profile of ['wotc','wotc2002']){const m=setup(profile),p=m.store.state.players[0];p.active.moveTo(p.discard);const c=fixtureCard(m,'Blastoise BS');p.hand.moveCardTo(c,p.active);fixtureCard(m,'Water Energy BS');p.active.specialConditions=[R.SpecialCondition.POISONED];if(profile==='wotc2002')assert.throws(()=>M.apply(m,{type:'ability',player:1,name:'Rain Dance',target}));else{M.apply(m,{type:'ability',player:1,name:'Rain Dance',target});drain(m);assert.equal(M.pending(m)[0].type,'Attach energy');}}
});
test('WOTC flips for first player after concealed setup and offers two cards per opposing mulligan',()=>{
 for(const profile of ['wotc','modern']){
  const m=M.create({profile,seed:7,decks:[deck,deck]},map),shuffles={};let bonus=false,lateCoin=false;
  if(profile==='wotc')assert.equal(M.pending(m)[0].type,'Shuffle deck');
  for(let i=0;i<300;i++){const q=M.pending(m)[0];if(!q)break;
   if(q.type==='Shuffle deck'){const p=m.store.state.players.find(p=>p.id===q.playerId);let order=Array.from({length:p.deck.cards.length},(_,i)=>i);if(q.playerId===2&&!shuffles[2]){const energies=order.filter(i=>p.deck.cards[i].superType===R.SuperType.ENERGY).slice(0,7);order=[...energies,...order.filter(i=>!energies.includes(i))]}shuffles[q.playerId]=(shuffles[q.playerId]||0)+1;answer(m,q,order);}
   else if(q.type==='Coin flip'){if(profile==='wotc'){assert.ok(m.store.state.players.every(p=>p.active.getPokemonCard()&&p.active.isSecret&&p.prizes.filter(l=>l.cards.length).length===6));lateCoin=true}answer(m,q,true)}
   else if(q.type==='Select'){assert.equal(q.values[0],profile==='wotc'?'Draw 2 card(s)':'Draw 1 card(s)');bonus=true;answer(m,q,0)}
   else if(q.type==='Choose cards'){const v=q.cards.cards.map((c,i)=>({c,i})).filter(x=>!q.options.blocked.includes(x.i)&&R.matchesPromptFilter(x.c,q.filter)).slice(0,q.options.min).map(x=>x.i);answer(m,q,v)}
   else if(['Confirm','Show mulligan','WaitPrompt'].includes(q.type))answer(m,q,true);else throw Error(q.type);
  }assert.ok(bonus);if(profile==='wotc')assert.ok(lateCoin);assert.equal(m.store.state.phase,R.GamePhase.PLAYER_TURN);
 }
});
test('Neo Baby Rule still applies under Poison and precedes attack discard costs',()=>{
 const m=setup('wotc2002'),p=m.store.state.players[0],op=m.store.state.players[1];op.active.moveTo(op.discard);op.active.cards.push(R.CardManager.getInstance().getCardByName('Cleffa N1'));op.active.specialConditions=[R.SpecialCondition.POISONED];for(let i=0;i<2;i++){const e=fixtureCard(m,'Fire Energy BS');p.hand.moveCardTo(e,p.active)}m.randomState=1;M.apply(m,{type:'attack',player:1,name:'Ember'});drain(m);assert.equal(p.active.cards.filter(c=>c.superType===R.SuperType.ENERGY).length,2);assert.equal(m.store.state.turn,2);
});
test('WOTC Fire Spin charges two Energy cards even without Confusion',()=>{
 const m=setup('wotc'),p=m.store.state.players[0];p.active.moveTo(p.discard);p.active.cards.push(R.CardManager.getInstance().getCardByName('Charizard BS'));for(let i=0;i<4;i++){const e=fixtureCard(m,'Fire Energy BS');p.hand.moveCardTo(e,p.active)}M.apply(m,{type:'attack',player:1,name:'Fire Spin'});const q=M.pending(m)[0];assert.equal(q.type,'Choose cards');answer(m,q,q.cards.cards.map((c,i)=>({c,i})).filter(x=>x.c.superType===R.SuperType.ENERGY).slice(0,2).map(x=>x.i));drain(m);assert.equal(p.discard.cards.filter(c=>c.name==='Fire Energy').length,2);
});
test('WOTC pays required discards before a Smokescreen tails cancels the attack',()=>{
 const m=setup('wotc'),p=m.store.state.players[0];for(let i=0;i<2;i++){const e=fixtureCard(m,'Fire Energy BS');p.hand.moveCardTo(e,p.active)}p.active.coinFlipCancelAttackNextTurn=1;m.randomState=1;M.apply(m,{type:'attack',player:1,name:'Ember'});const q=M.pending(m)[0];assert.equal(q.type,'Choose cards');answer(m,q,[q.cards.cards.findIndex(c=>c.superType===R.SuperType.ENERGY)]);drain(m);assert.equal(p.discard.cards.filter(c=>c.name==='Fire Energy').length,1);assert.equal(m.store.state.players[1].active.damage,0);assert.equal(m.store.state.turn,2);
});
fs.writeFileSync(path.join(root,'work/rules-research/rules-test-report.json'),JSON.stringify({passed:true,tests:passed,mappedPrintings:Object.keys(map).length},null,2));



