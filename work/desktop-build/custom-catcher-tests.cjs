const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..'),ui=path.join(root,'work/desktop/ui'),ctx={console,setTimeout,clearTimeout};vm.createContext(ctx);
for(const n of ['rules-engine.js','rules-match.js','bot-ai.js'])vm.runInContext(fs.readFileSync(path.join(ui,n),'utf8'),ctx);
const M=ctx.RulesMatch,R=M.R,B=ctx.BotAI,map=JSON.parse(fs.readFileSync(path.join(ui,'rules-card-map.json'))),checks=[];let serial=900000;
const target={player:R.PlayerType.BOTTOM_PLAYER,slot:R.SlotType.ACTIVE,index:0};
function card(id){const c=R.CardManager.getInstance().getCardByName(map[id]);c._labId=id;c.id=serial++;return c;}
function start(ids=['sm8-171','sm8-231']){
 const m=M.create({profile:'sm',seed:37,decks:[B.decks[0],B.decks[1]]},map);for(let i=0;i<180&&M.pending(m).length;i++){const q=M.pending(m)[0];M.apply(m,B.choose(m,q.playerId,'normal'));}
 const g=m.store.state,p=g.players[g.activePlayer],o=g.players.find(q=>q!==p);g.turn=5;p.hand.cards=ids.map(card);p.discard.cards=[];p.supporter.cards=[];p.active.cards=[card('base1-46')];o.active.cards=[card('base1-45')];for(const l of p.bench)l.cards=[];o.bench[0].cards=[card('base1-44')];for(const l of o.bench.slice(1))l.cards=[];return {m,p,o};
}
function play(t){M.apply(t.m,{type:'play',player:t.p.id,index:0,target});}
function choose(t,value){const q=M.pending(t.m)[0];assert(q);M.apply(t.m,{type:'prompt',id:q.id,value});}
function pair(t){const q=M.pending(t.m)[0];assert.equal(q?.type,'Select','Two copies must offer a play mode');assert.match(q.values[1],/2 Custom Catcher/);choose(t,1);const pick=M.pending(t.m)[0];assert.equal(pick?.type,'Choose pokemon');assert.equal(pick.playerType,R.PlayerType.TOP_PLAYER);choose(t,[{player:R.PlayerType.TOP_PLAYER,slot:R.SlotType.BENCH,index:0}]);}
function test(name,fn){fn();checks.push(name);console.log('PASS '+name);}
test('Exactly two mixed printings switch only the opponent and discard both, with no own Bench',()=>{const t=start(),own=t.p.active,op=t.o.bench[0],deck=t.p.deck.cards.length;play(t);pair(t);assert.equal(t.p.active,own);assert.equal(t.o.active,op);assert.equal(t.p.deck.cards.length,deck);assert.equal(t.p.discard.cards.filter(c=>c.name==='Custom Catcher').length,2);assert.equal(t.p.supporter.cards.length,0);assert.equal(M.pending(t.m).length,0);});
for(const id of ['sm8-171','sm8-231'])test(id+' alone draws to three and cleans up',()=>{const t=start([id]);play(t);assert.equal(t.p.hand.cards.length,3);assert.equal(t.p.discard.cards.length,1);assert.equal(t.p.supporter.cards.length,0);assert.equal(M.pending(t.m).length,0);});
test('With two copies, playing one draws to three and leaves the other in hand',()=>{const t=start();play(t);choose(t,0);assert.equal(t.p.hand.cards.length,3);assert.equal(t.p.hand.cards.filter(c=>c.name==='Custom Catcher').length,1);assert.equal(t.p.discard.cards.length,1);assert.equal(M.pending(t.m).length,0);});
test('Playing two is available when the draw effect is unavailable',()=>{const t=start(['sm8-171','sm8-231','base1-98','base1-98','base1-98']);play(t);assert(M.pending(t.m)[0].options.disabled[0]);assert.throws(()=>choose(t,0));pair(t);assert.equal(t.p.hand.cards.length,3);});
test('Three copies consume exactly two and leave one',()=>{const t=start(['sm8-171','sm8-171','sm8-231']);play(t);pair(t);assert.equal(t.p.hand.cards.length,1);assert.equal(t.p.discard.cards.length,2);});
test('No opponent Bench allows only the draw effect',()=>{const t=start();t.o.bench[0].cards=[];play(t);assert.equal(t.p.hand.cards.length,3);assert.equal(t.p.discard.cards.length,1);assert.equal(M.pending(t.m).length,0);});
test('No legal draw and no opponent Bench rejects play',()=>{const t=start(['sm8-171','sm8-231','base1-98','base1-98','base1-98']);t.o.bench[0].cards=[];assert.throws(()=>play(t));});
test('Empty deck rejects the single effect',()=>{const t=start(['sm8-171']);t.p.deck.cards=[];assert.throws(()=>play(t));});
test('One remaining deck card draws only that card',()=>{const t=start(['sm8-171']);t.p.deck.cards=[card('base1-98')];play(t);assert.equal(t.p.hand.cards.length,1);assert.equal(t.p.deck.cards.length,0);});
test('Two copies can switch even with an empty deck',()=>{const t=start();t.p.deck.cards=[];play(t);pair(t);assert.equal(t.p.discard.cards.length,2);});
test('Item lock still rejects Custom Catcher',()=>{const t=start();t.p.cannotPlayItemCards=true;assert.throws(()=>play(t));assert.equal(t.p.hand.cards.length,2);});
test('Two-card play restores exactly and Undo returns both copies',()=>{
 const deck={name:'Catcher replay',cards:{'base1-46':4,'base1-44':4,'base1-45':4,'base1-43':4,'base1-63':4,'sm8-171':2,'sm8-231':2,'base1-98':36}};let t;
 for(let seed=1;seed<=300;seed++){const m=M.create({profile:'sm',seed:(seed*2654435761)>>>0,decks:[deck,deck]},map);for(let i=0;i<180&&M.pending(m).length;i++){const q=M.pending(m)[0];M.apply(m,B.choose(m,q.playerId,'normal'));}const g=m.store.state,p=g.players[g.activePlayer],o=g.players.find(q=>q!==p);if(p.hand.cards.filter(c=>c.name==='Custom Catcher').length>=2){t={m,p,o};break;}}
 assert(t,'Seeded pair fixture');
 if(!t.o.bench[0].getPokemonCard()){
  M.apply(t.m,{type:'pass',player:t.p.id});for(let i=0;i<80&&M.pending(t.m).length;i++){const q=M.pending(t.m)[0];M.apply(t.m,B.choose(t.m,q.playerId,'normal'));}
  const basic=t.o.hand.cards.findIndex(c=>c.superType===R.SuperType.POKEMON&&c.stage===R.Stage.BASIC);assert(basic>=0,'Opponent has a Basic to Bench');
  M.apply(t.m,{type:'play',player:t.o.id,index:basic,target:{player:R.PlayerType.BOTTOM_PLAYER,slot:R.SlotType.BENCH,index:0}});
  M.apply(t.m,{type:'pass',player:t.o.id});for(let i=0;i<80&&M.pending(t.m).length;i++){const q=M.pending(t.m)[0];M.apply(t.m,B.choose(t.m,q.playerId,'normal'));}
 }
 const snap=m=>JSON.stringify({random:m.randomState,phase:m.store.state.phase,turn:m.store.state.turn,players:m.store.state.players.map(p=>({hand:p.hand.cards.map(c=>c._labId),deck:p.deck.cards.map(c=>c._labId),discard:p.discard.cards.map(c=>c._labId),board:[p.active,...p.bench].map(l=>({cards:l.cards.map(c=>c._labId),damage:l.damage}))}))});
 fs.writeFileSync(path.resolve('work/catcher-replay-fixture.json'),JSON.stringify({spec:t.m.spec,journal:t.m.journal,undoHistory:M.undoPoints(t.m)}));
 const before=snap(t.m),index=t.m.journal.length;
 M.apply(t.m,{type:'play',player:t.p.id,index:t.p.hand.cards.findIndex(c=>c.name==='Custom Catcher'),target});M.checkpoint(t.m,index);pair(t);
 const restored=M.restore({spec:t.m.spec,journal:t.m.journal,undoHistory:M.undoPoints(t.m)},map);assert.equal(snap(restored),snap(t.m));assert.equal(snap(M.undoAction(restored,map)),before);
});
const report={passed:true,checks,engineSha256:require('crypto').createHash('sha256').update(fs.readFileSync(path.join(ui,'rules-engine.js'))).digest('hex')};
fs.writeFileSync(path.resolve('outputs/custom-catcher-tests.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:true,checks:checks.length}));
