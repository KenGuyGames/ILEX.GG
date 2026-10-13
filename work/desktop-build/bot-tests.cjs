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
const games=[];
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
