const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),ui=path.join(root,'work/desktop/ui'),ctx={console,Date,setTimeout,clearTimeout};vm.createContext(ctx);
for(const file of ['rules-engine.js','rules-match.js','bot-ai.js'])vm.runInContext(fs.readFileSync(path.join(ui,file),'utf8'),ctx,{filename:file});
const M=ctx.RulesMatch,R=M.R,B=ctx.BotAI,map=JSON.parse(fs.readFileSync(path.join(ui,'rules-card-map.json'))),results=[];
const test=(name,fn)=>{fn();results.push(name);console.log('PASS '+name);};
function start(difficulty='normal',profile='wotc',seed=23){
 const m=M.create({profile,seed,opponent:{type:'bot',difficulty,humanPlayer:1,botPlayer:2},decks:[B.decks[0],B.decks[1]]},map);
 for(let n=0;n<180;n++){const p=M.pending(m)[0];if(!p)break;const a=B.choose(m,p.playerId,difficulty);assert.ok(a,'Setup choice '+p.type+' '+p.message);M.apply(m,a);}
 assert.equal(m.store.state.phase,R.GamePhase.PLAYER_TURN);return m;
}
const snapshot=m=>JSON.stringify({turn:m.store.state.turn,phase:m.store.state.phase,winner:m.store.state.winner,activePlayer:m.store.state.activePlayer,opponent:m.spec.opponent,players:m.store.state.players.map(p=>({hand:p.hand.cards.map(c=>c._labId),deck:p.deck.cards.map(c=>c._labId),board:[p.active,...p.bench].map(l=>({cards:l.cards.map(c=>c._labId),damage:l.damage})),prizes:p.prizes.map(l=>l.cards.map(c=>c._labId))}))});
test('Three starter decks contain 60 mapped cards and satisfy enforced construction',()=>{for(const d of B.decks){assert.equal(Object.values(d.cards).reduce((a,b)=>a+b,0),60);assert.ok(Object.keys(d.cards).every(id=>map[id]));M.create({profile:'wotc',seed:1,decks:[d,d]},map);}});
test('Bot resolves setup and historical first-turn choices on every difficulty',()=>{for(const level of Object.keys(B.levels))for(const profile of ['wotc','modern'])start(level,profile);});
test('Thinking leaves the live cards, journal and engine randomness unchanged',()=>{const m=start('hard'),id=m.store.state.players[m.store.state.activePlayer].id,before=snapshot(m),journal=JSON.stringify(m.journal),random=m.randomState;assert.ok(B.choose(m,id,'hard'));assert.equal(snapshot(m),before);assert.equal(JSON.stringify(m.journal),journal);assert.equal(m.randomState,random);});
test('A bot waits during the human turn and cannot answer the human prompt',()=>{const m=start(),human=m.store.state.players[m.store.state.activePlayer].id,other=m.store.state.players.find(p=>p.id!==human).id;assert.equal(B.choose(m,other,'hard'),null);const p=new R.ConfirmPrompt(human,R.GameMessage.CHOOSE_NEW_ACTIVE_POKEMON);m.store.prompt(m.store.state,p,()=>{});assert.equal(B.choose(m,other,'hard'),null);});
test('Bot decisions do not depend on hidden opponent hand or actual own deck/prize order',()=>{
 const a=start('normal'),id=a.store.state.players[a.store.state.activePlayer].id,b=M.restore({spec:a.spec,journal:a.journal},map),owner=b.store.state.players.find(p=>p.id===id),op=b.store.state.players.find(p=>p.id!==id);
 op.hand.cards.reverse();owner.deck.cards.reverse();const prize=owner.prizes.find(l=>l.cards.length);[prize.cards[0],owner.deck.cards[0]]=[owner.deck.cards[0],prize.cards[0]];
 op.hand.cards=op.hand.cards.map((old,i)=>{const c=R.CardManager.getInstance().getCardByName(map[i%2?'base1-91':'base1-98']);c.id=old.id;return c;});
 const concealed=m=>B.fork(m,id).store.state.players.find(p=>p.id!==id).hand.cards.map(c=>c.fullName);assert.deepEqual(Array.from(concealed(a)),Array.from(concealed(b)));
 assert.equal(JSON.stringify(B.choose(a,id,'normal')),JSON.stringify(B.choose(b,id,'normal')));
});
let fixtureCardId=10000;
function card(id){const c=R.CardManager.getInstance().getCardByName(map[id]);c._labId=id;c.id=fixtureCardId++;return c;}
test('Hard prioritizes a guaranteed knockout; Easy can choose the weaker attack',()=>{
 const m=start(),p=m.store.state.players[m.store.state.activePlayer],op=m.store.state.players.find(x=>x!==p);p.hand.cards=[];p.bench.forEach(l=>l.cards=[]);p.active.cards=[card('base3-10'),card('base1-102'),card('base1-102'),card('base1-102')];op.active.cards=[card('base1-45')];op.active.damage=10;
 assert.equal(B.choose(m,p.id,'hard').name,'Water Gun');let weaker=false;for(let seed=1;seed<20;seed++){m.spec.seed=seed;if(B.choose(m,p.id,'easy').name==='Confuse Ray')weaker=true;}assert.ok(weaker,'Easy makes a different, less optimal decision');
});
test('Bot uses Rain Dance and assigns multiple Energy cards through the actual prompt',()=>{
 const m=start(),p=m.store.state.players[m.store.state.activePlayer];p.active.cards=[card('base1-2')];p.bench.forEach(l=>l.cards=[]);p.hand.cards=Array.from({length:5},()=>card('base1-102'));
 const action=B.choose(m,p.id,'normal');assert.equal(action.type,'ability');assert.equal(action.name,'Rain Dance');M.apply(m,action);for(const wait of M.pending(m).filter(p=>p.type==='WaitPrompt'))M.apply(m,B.prompt(m,wait));const pending=M.pending(m)[0];assert.equal(pending.type,'Attach energy');M.apply(m,B.choose(m,p.id,'normal'));assert.equal(p.active.cards.filter(c=>c.superType===R.SuperType.ENERGY).length,5);
});
test('WOTC required attack-cost prompts are assigned to the attacking player',()=>{
 const m=start(),p=m.store.state.players[m.store.state.activePlayer];p.active.cards=[card('base1-36'),card('base1-98'),card('base1-98'),card('base1-98')];M.apply(m,{type:'attack',player:p.id,name:'Flamethrower'});const pending=M.pending(m)[0];assert.equal(pending.playerId,p.id);if(!B.choose(m,p.id,'normal'))console.log({filter:pending.filter,options:pending.options,cards:pending.cards.cards.map(c=>[c.name,R.matchesPromptFilter(c,pending.filter)]),valid:[1,2,3].map(i=>B.valid(m,pending,[i]))});assert.ok(B.choose(m,p.id,'normal'));M.apply(m,B.choose(m,p.id,'normal'));
});
test('Bot resolves Jirachi Wishing Star top-five selection and continues its turn',()=>{
 for(const level of Object.keys(B.levels)){
 const m=start(level,'exlate'),p=m.store.state.players[m.store.state.activePlayer];p.active.cards=[card('ex8-9')];p.active.specialConditions=[];p.bench.forEach(l=>l.cards=[]);p.bench[0].cards=[card('ex13-11')];p.bench[1].cards=[card('ex13-12')];const beforeThink=snapshot(m),journal=JSON.stringify(m.journal);assert.ok(B.choose(m,p.id,level));assert.equal(snapshot(m),beforeThink);assert.equal(JSON.stringify(m.journal),journal);p.deck.cards=[card('base1-91'),card('base1-98'),card('base1-44'),card('base1-95'),card('base1-94'),card('base1-98')];
 M.apply(m,{type:'ability',player:p.id,name:'Wishing Star',target:{player:R.PlayerType.BOTTOM_PLAYER,slot:R.SlotType.ACTIVE,index:0}});
 for(const wait of M.pending(m).filter(p=>p.type==='WaitPrompt'))M.apply(m,B.prompt(m,wait,level));const pending=M.pending(m)[0];assert.equal(pending.type,'Choose cards');assert.equal(pending.playerId,p.id);const before=p.hand.cards.length;const action=B.choose(m,p.id,level);assert.ok(action,'Wishing Star choice '+level);M.apply(m,action);
 for(let n=0;n<20&&M.pending(m).length;n++){const wait=M.pending(m)[0];const next=B.prompt(m,wait,level);assert.ok(next);M.apply(m,next);}
 assert.equal(p.hand.cards.length,before+1);assert.equal(M.pending(m).length,0);assert.ok(B.choose(m,p.id,level));
 }
});
test('Prize choices use remaining-card indexes while labels retain table slots',()=>{
 const m=start(),p=m.store.state.players[m.store.state.activePlayer];p.prizes[1].cards=[];p.prizes[4].cards=[];
 ctx.rulesMatch=m;const source=fs.readFileSync(path.join(ui,'rules-ui.js'),'utf8');vm.runInContext(source.slice(source.indexOf('function promptRows('),source.indexOf('function drawRulePrompt(')),ctx);
 for(const opponent of [false,true]){const owner=opponent?m.store.state.players.find(x=>x!==p):p;owner.prizes[1].cards=[];owner.prizes[4].cards=[];const q=new R.ChoosePrizePrompt(p.id,R.GameMessage.CHOOSE_PRIZE,{count:2,useOpponentPrizes:opponent,blocked:[0,1]});
 const rows=ctx.promptRows(q);assert.deepEqual(Array.from(rows,r=>r.value),[0,1,2,3]);assert.deepEqual(Array.from(rows,r=>r.label),['Prize 1','Prize 3','Prize 4','Prize 6']);assert.equal(rows[2].blocked,false);let selected;m.store.prompt(m.store.state,q,v=>selected=v);const action=B.prompt(m,q,'easy');assert.deepEqual(Array.from(action.value),[2,3]);M.apply(m,action);assert.deepEqual(Array.from(selected),[owner.prizes[3],owner.prizes[5]]);
 }
 p.prizes.slice(0,5).forEach(l=>l.cards=[]);const q=new R.ChoosePrizePrompt(p.id,R.GameMessage.CHOOSE_PRIZE,{count:2});assert.equal(ctx.promptRows(q)[0].value,0);assert.equal(ctx.promptRows(q)[0].label,'Prize 6');let selected;m.store.prompt(m.store.state,q,v=>selected=v);M.apply(m,B.prompt(m,q,'hard'));assert.deepEqual(Array.from(selected),[p.prizes[5]]);
});
test('Bot forecasts preserve EX printing overrides and reject Fan Club on a full Bench',()=>{for(const profile of ['ex','exlate']){const m=start('normal',profile),p=m.store.state.players[m.store.state.activePlayer];m.store.state.turn=2;p.supporter.cards=[];p.supporterTurn=0;p.hand.cards=[card('ecard2-130')];p.bench.forEach(l=>l.cards=[card('base1-44')]);const f=B.fork(m,p.id);assert.equal(f.store.handler.gameSettings.format,m.store.handler.gameSettings.format);assert.throws(()=>M.apply(f,{type:'play',player:p.id,index:0,target:{player:R.PlayerType.BOTTOM_PLAYER,slot:R.SlotType.ACTIVE,index:0}}),e=>e.message==='NO_BENCH_SLOTS_AVAILABLE');const before=snapshot(m),chosen=B.choose(m,p.id,'normal');assert.ok(chosen);assert.notEqual(chosen.type,'play');assert.equal(snapshot(m),before);}});
const games=[];
test('Saved unfinished unpaid Baby attack recovers the preceding turn exactly',()=>{
 const saved=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/unpaid-baby-attack.json'))),expected=M.restore({...saved,journal:saved.journal.slice(0,31)},map),recovered=M.restore(saved,map);
 assert.equal(recovered.recoveredInvalidAttack,true);assert.equal(recovered.journal.length,31);assert.equal(snapshot(recovered),snapshot(expected));assert.equal(M.pending(recovered).length,0);
 const chosen=B.choose(recovered,2,'normal');assert.ok(chosen);assert.doesNotThrow(()=>M.apply(recovered,chosen));
});
test('Unaffordable attacks are rejected before Baby flips on every bot difficulty',()=>{
 for(const level of Object.keys(B.levels))for(const defender of ['neo1-20','base1-44'])for(const seed of [1,7,23]){
  const m=start(level),p=m.store.state.players[m.store.state.activePlayer],o=m.store.state.players.find(x=>x!==p);
  p.active.cards=[card('base1-36')];p.hand.cards=[];p.bench.forEach(l=>l.cards=[]);o.active.cards=[card(defender)];m.randomState=seed;
  const before=snapshot(m),journal=m.journal.length;
  assert.throws(()=>M.apply(m,{type:'attack',player:p.id,name:'Flamethrower'}),e=>e.message==='NOT_ENOUGH_ENERGY');
  assert.equal(M.pending(m).length,0);assert.equal(m.journal.length,journal);assert.equal(snapshot(m),before);
  assert.notEqual(B.choose(m,p.id,level).type,'attack');assert.equal(snapshot(m),before);
 }
});
test('Baby targets still allow attacks paid with Special Energy',()=>{
 for(const level of Object.keys(B.levels)){
  const m=start(level),p=m.store.state.players[m.store.state.activePlayer],o=m.store.state.players.find(x=>x!==p);
  p.active.cards=[card('base1-36'),card('base1-98'),card('base1-98'),card('base1-96')];p.hand.cards=[];p.bench.forEach(l=>l.cards=[]);o.active.cards=[card('neo1-20')];
  assert.equal(B.choose(m,p.id,level).type,'attack');
  p.active.cards=[card('neo1-20'),card('base1-96')];assert.doesNotThrow(()=>M.apply(m,{type:'attack',player:p.id,name:'Eeeeeeek'}));
 }
});
for(const level of Object.keys(B.levels))test(level+' completes a full rules-enforced starter game',()=>{
 const m=start(level,'wotc',41);let decisions=0;
 for(;decisions<1800&&m.store.state.phase!==R.GamePhase.FINISHED;decisions++){
  const p=M.pending(m)[0],id=p?.playerId??m.store.state.players[m.store.state.activePlayer].id,a=B.choose(m,id,level);
  if(!a)console.log(JSON.stringify({turn:m.store.state.turn,players:m.store.state.players.map(p=>({id:p.id,name:p.name})),latest:m.journal.slice(-5),keys:Object.keys(p||{}),prompt:p?.type,message:p?.message,player:p?.playerId,filter:p?.filter,options:p?.options,cards:p?.cards?.cards?.map(c=>({name:c.name,type:c.superType,cardType:c.cardType})),pending:M.pending(m).map(p=>({id:p.id,player:p.playerId,type:p.type}))},null,2));
  assert.ok(a,'No action at turn '+m.store.state.turn+' prompt '+p?.type+' '+p?.message);try{M.apply(m,a);}catch(e){throw Error('Turn '+m.store.state.turn+' '+JSON.stringify(a)+' '+e.message);}
 }
 assert.equal(m.store.state.phase,R.GamePhase.FINISHED,'Game must finish');games.push({level,decisions,turns:m.store.state.turn,winner:m.store.state.winner});
 assert.equal(snapshot(M.restore({spec:m.spec,journal:m.journal},map)),snapshot(m),'Bot match replays exactly');
});
fs.writeFileSync(path.join(root,'work/rules-research/bot-test-report.json'),JSON.stringify({passed:true,checks:results,games},null,2));




