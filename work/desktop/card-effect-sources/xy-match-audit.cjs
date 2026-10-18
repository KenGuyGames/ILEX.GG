const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..'),ui=path.join(root,'work/desktop/ui'),ctx={console,Date,setTimeout,clearTimeout};vm.createContext(ctx);
for(const file of ['rules-engine.js','rules-match.js','bot-ai.js','limitless-collection.js'])vm.runInContext(fs.readFileSync(path.join(ui,file),'utf8'),ctx);
vm.runInContext('this.collection=LimitlessCollection',ctx);
const M=ctx.RulesMatch,R=M.R,B=ctx.BotAI,map=JSON.parse(fs.readFileSync(path.join(ui,'rules-card-map.json')));
const rejectedDecks=[];
const decks=[
{name:'Kalos Chespin line',cards:{'xy0-3':4,'xy0-4':4,'xy0-5':3,'xy0-22':4,'xy0-39':4,'xy0-37':4,'xy0-38':3,'bw1-105':24,'xy1-140':10}},
{name:'XY Fairy with BW Items',cards:{'xy1-92':4,'xy1-93':3,'xy1-96':4,'xy0-22':4,'xy0-39':4,'bw1-100':4,'bw1-104':3,'xy1-140':34}},
{name:'BW attackers with Kalos support',cards:{'bw1-1':4,'bw1-3':3,'bw1-5':2,'xy0-3':4,'xy0-39':4,'xy0-37':4,'bw1-104':3,'bw1-105':36}}
];
const failures=[],games=[];
function snapshot(m){return JSON.stringify({turn:m.store.state.turn,phase:m.store.state.phase,active:m.store.state.activePlayer,winner:m.store.state.winner,random:m.randomState,pending:M.pending(m).map(p=>[p.type,p.playerId,p.id]),players:m.store.state.players.map(p=>({zones:[p.deck,p.hand,p.discard,p.lostzone,p.stadium,p.supporter,...p.prizes].map(l=>l.cards.map(c=>[c.id,c.fullName])),board:[p.active,...p.bench].map(l=>({cards:l.cards.map(c=>[c.id,c.fullName]),tools:l.tools.map(c=>[c.id,c.fullName]),energy:l.energies.cards.map(c=>[c.id,c.fullName]),damage:l.damage,conditions:l.specialConditions}))}))});}
for(let index=0;index<decks.length;index++){
 if(process.env.ILEX_MATCH_SHARD!==undefined&&index%3!==Number(process.env.ILEX_MATCH_SHARD))continue;
 if(process.env.ILEX_MATCH_PAIR&&index!==Number(process.env.ILEX_MATCH_PAIR))continue;
 const pair=[decks[index],decks[(index+1)%decks.length]],level=['easy','normal','hard'][index%3];let m,decisions=0,attempted;
 try{
  m=M.create({profile:'xy',seed:37+index,decks:pair},map);
  for(;decisions<35&&m.store.state.phase!==R.GamePhase.FINISHED;decisions++){
   const before=snapshot(m);const pending=M.pending(m)[0],id=pending?.playerId??m.store.state.players[m.store.state.activePlayer].id,a=B.choose(m,id,level);assert.equal(snapshot(m),before,'Bot planning mutated live state');attempted=a;assert.ok(a,'No bot choice: '+pending?.type+' '+pending?.message);M.apply(m,a);
  }
  const restored=M.restore({spec:m.spec,journal:m.journal},map);assert.equal(snapshot(restored),snapshot(m),'Exact saved-game replay');
  if(m.journal.length){M.checkpoint(m,m.journal.length-1);const undo=M.undoAction(m,map);const replay=M.restore({spec:m.spec,journal:m.journal.slice(0,-1)},map);assert.equal(snapshot(undo),snapshot(replay),'Undo replay');}
  games.push({decks:pair.map(d=>d.name),level,decisions,turn:m.store.state.turn,finished:m.store.state.phase===R.GamePhase.FINISHED,replay:true,undo:true});console.log('PASS '+pair.map(d=>d.name).join(' / ')+' '+decisions+' decisions');
 }catch(e){const failure={decks:pair.map(d=>d.name),decisions,reason:e.message||String(e),attempted,saved:m&&{spec:m.spec,journal:m.journal},last:m?.journal.slice(-4),pending:m&&M.pending(m).map(p=>({type:p.type,message:p.message,player:p.playerId}))};failures.push(failure);console.log('FAIL '+JSON.stringify(failure));}
}
fs.writeFileSync(path.join(root,'work/rules-research/xy-match-audit'+(process.env.ILEX_MATCH_SHARD===undefined?'':'-'+process.env.ILEX_MATCH_SHARD)+'.json'),JSON.stringify({passed:!failures.length,engineSha256:require('crypto').createHash('sha256').update(fs.readFileSync(path.join(ui,'rules-engine.js'))).digest('hex'),rejectedDecks,scope:'BW/XY first wave only; three 35-decision bounded fixtures; replay and Undo',games,failures},null,2));console.log(JSON.stringify({games:games.length,failures:failures.length}));
