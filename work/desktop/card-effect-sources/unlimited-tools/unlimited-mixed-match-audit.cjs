const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..'),ui=path.join(root,'work/unlimited-candidate/ui'),ctx={console,Date,setTimeout,clearTimeout};vm.createContext(ctx);
for(const file of ['rules-engine.js','rules-match.js','bot-ai.js','limitless-collection.js'])vm.runInContext(fs.readFileSync(file==='rules-engine.js'?path.join(root,'work/unlimited-candidate/ui/rules-engine.js'):path.join(ui,file),'utf8'),ctx);
vm.runInContext('this.collection=LimitlessCollection',ctx);
const M=ctx.RulesMatch,R=M.R,B=ctx.BotAI,map=JSON.parse(fs.readFileSync(path.join(ui,'rules-card-map.json')));
Object.assign(map,M.withAliases(map,ctx.collection));const rejectedDecks=[];
const sourceDecks=JSON.parse(fs.readFileSync(path.join(root,'work/rules-research/unlimited-mixed-fixture-decks.json'),'utf8'));
const fixtureAdjustments=[];
const decks=sourceDecks.map(d=>JSON.parse(JSON.stringify(d)));
for(const deck of decks){for(const [id,n]of Object.entries(deck.cards)){if(!map[id]){const alias=ctx.collection.ruleAliases?.[id];if(alias&&map[alias]){delete deck.cards[id];deck.cards[alias]=(deck.cards[alias]||0)+n;fixtureAdjustments.push({deck:deck.name,from:id,to:alias,quantity:n,reason:'Existing imported alias resolved in cloned fixture'});}else throw Error('Unmapped fixture '+id);}}}
const failures=[],games=[];
function snapshot(m){return JSON.stringify({turn:m.store.state.turn,phase:m.store.state.phase,active:m.store.state.activePlayer,winner:m.store.state.winner,random:m.randomState,pending:M.pending(m).map(p=>[p.type,p.playerId,p.id]),players:m.store.state.players.map(p=>({usedVSTAR:p.usedVSTAR,usedGX:p.usedGX,assembledVUNIONs:p.assembledVUNIONs,attackHistory:p._swshAttackHistory,zones:[p.deck,p.hand,p.discard,p.lostzone,p.stadium,p.supporter,...p.prizes].map(l=>l.cards.map(c=>[c.id,c.fullName])),board:[p.active,...p.bench].map(l=>({cards:l.cards.map(c=>[c.id,c.fullName,c.name,c.hp,c.stage,c.cardType,c.tags,c.powers?.map(p=>p.name)]),tools:l.tools.map(c=>[c.id,c.fullName]),energy:l.energies.cards.map(c=>[c.id,c.fullName]),damage:l.damage,conditions:l.specialConditions}))}))});}
for(let index=0;index<decks.length;index++){
 if(process.env.ILEX_MATCH_SHARD!==undefined&&index%3!==Number(process.env.ILEX_MATCH_SHARD))continue;
 if(process.env.ILEX_MATCH_PAIR&&index!==Number(process.env.ILEX_MATCH_PAIR))continue;
 const pair=[decks[index],decks[(index+Number(process.env.ILEX_MATCH_OFFSET||1))%decks.length]],level=['easy','normal','normal','hard'][index%4];let m,decisions=0,attempted;
 try{
  m=M.create({profile:'unlimited',seed:37+index,decks:pair},map);
  for(;decisions<120&&m.store.state.phase!==R.GamePhase.FINISHED;decisions++){
   const before=snapshot(m);const pending=M.pending(m)[0],id=pending?.playerId??m.store.state.players[m.store.state.activePlayer].id,a=B.choose(m,id,level);assert.equal(snapshot(m),before,'Bot planning mutated live state');attempted=a;assert.ok(a,'No bot choice: '+pending?.type+' '+pending?.message);M.apply(m,a);
  }
  const restored=M.restore({spec:m.spec,journal:m.journal},map);assert.equal(snapshot(restored),snapshot(m),'Exact saved-game replay');
  if(m.journal.length){M.checkpoint(m,m.journal.length-1);const undo=M.undoAction(m,map);const replay=M.restore({spec:m.spec,journal:m.journal.slice(0,-1)},map);assert.equal(snapshot(undo),snapshot(replay),'Undo replay');}
  games.push({decks:pair.map(d=>d.name),level,decisions,turn:m.store.state.turn,finished:m.store.state.phase===R.GamePhase.FINISHED,replay:true,undo:true});console.log('PASS '+pair.map(d=>d.name).join(' / ')+' '+decisions+' decisions');
 }catch(e){const failure={decks:pair.map(d=>d.name),decisions,reason:e.message||String(e),attempted,saved:m&&{spec:m.spec,journal:m.journal},last:m?.journal.slice(-4),pending:m&&M.pending(m).map(p=>({type:p.type,message:p.message,player:p.playerId}))};failures.push(failure);console.log('FAIL '+JSON.stringify(failure));}
}
fs.writeFileSync(path.join(root,'work/rules-research/unlimited-mixed-match-audit'+(process.env.ILEX_MATCH_PAIR?'-pair-'+process.env.ILEX_MATCH_PAIR:process.env.ILEX_MATCH_SHARD===undefined?'':'-'+process.env.ILEX_MATCH_SHARD)+'.json'),JSON.stringify({passed:!failures.length,engineSha256:require('crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'work/unlimited-candidate/ui/rules-engine.js'))).digest('hex'),rejectedDecks,fixtureAdjustments,scope:'Unlimited all ten era fixtures with mixed Trainer reprints and Fossil Ditto; bounded120 decisions with replay/Undo. Constructed fixtures are not tournament lists.',games,failures},null,2));console.log(JSON.stringify({games:games.length,failures:failures.length}));
