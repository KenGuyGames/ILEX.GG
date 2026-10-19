const fs=require('fs'),path=require('path'),vm=require('vm');
let source=fs.readFileSync(path.join(__dirname,'rules-tests.cjs'),'utf8');source=source.slice(0,source.indexOf("test('Limitless import:"));source=source.replace("fs.readFileSync(path.join(ui,file),'utf8')","fs.readFileSync(file==='rules-engine.js'?path.join(root,'work/sv-candidate/rules-engine.js'):path.join(ui,file),'utf8')");
const script=String.raw`
const records=JSON.parse(fs.readFileSync(path.join(root,'work/rules-research/sv-era-candidate-data.json'),'utf8'));for(const r of records)map[r.d.id]='ILEX DP '+r.d.id;
function fresh(id){const c=R.CardManager.getInstance().getCardByName(map[id]);assert.ok(c,id);return c;}
function field(id='sv01-001'){const m=setup('sv',{name:'SV effects',cards:{'bw1-1':4,'bw1-106':56}});m.store.state.turn=4;const [p,o]=m.store.state.players;p.active.cards=[fresh(id)];p.bench.forEach(l=>l.cards=[]);o.active.getPokemonCard().hp=5000;o.active.getPokemonCard().weakness=[];return m;}
function direct(m,name){const [p,o]=m.store.state.players,c=p.active.getPokemonCard(),a=c.attacks.find(a=>a.name===name),e=new R.AttackEffect(p,o,a);assert.ok(a,name);c.reduceEffect(m.store,m.store.state,e);return e;}
function byPlan(condition){for(const r of records.filter(r=>!r.reuse)){for(let i=0;i<(r.ops||[]).length;i++){const plan=r.ops[i].find(op=>op.op==='sv'&&op.kind==='conditional'&&op.condition===condition);if(plan)return {r,index:i,plan};}}throw Error('Missing '+condition);}
for(const condition of ['defenderDamaged','selfConfused','defenderBurned','selfCountersBelow','equalEnergy','opponentHandMaximum','opponentPrizeCount','notEvolvedThisTurn','selfEnergyMinimum'])test('Printed attack condition: '+condition,()=>{
 const {r,index,plan}=byPlan(condition);
 for(const positive of [false,true]){const m=field(r.d.id),s=m.store.state,[p,o]=s.players;
  if(condition==='defenderDamaged')o.active.damage=positive?10:0;
  if(condition==='selfConfused')p.active.specialConditions=positive?[R.SpecialCondition.CONFUSED]:[];
  if(condition==='defenderBurned')o.active.specialConditions=positive?[R.SpecialCondition.BURNED]:[];
  if(condition==='selfCountersBelow')p.active.damage=(positive?plan.amount-1:plan.amount)*10;
  if(condition==='equalEnergy'){p.active.cards.push(fresh('bw1-106'));if(positive)o.active.cards.push(fresh('bw1-106'));}
  if(condition==='opponentHandMaximum')o.hand.cards=Array.from({length:positive?plan.amount:plan.amount+1},()=>fresh('bw1-106'));
  if(condition==='opponentPrizeCount'){o.prizes.forEach((l,i)=>l.cards=i<(positive?plan.counts[0]:1)?[fresh('bw1-106')]:[]);}
  if(condition==='notEvolvedThisTurn'){p.active.pokemonPlayedTurn=s.turn;p.active._dpEvolutionHistory=positive?undefined:{turn:s.turn,from:'Fixture'};}
  if(condition==='selfEnergyMinimum'){const ids={Grass:'bw1-105',Fire:'bw1-106',Water:'bw1-107',Lightning:'bw1-108',Psychic:'bw1-109',Fighting:'bw1-110',Darkness:'bw1-111',Metal:'bw1-112'};for(let n=0;n<(positive?plan.amount:plan.amount-1);n++)p.active.cards.push(fresh(ids[plan.energy]));}
  const e=direct(m,r.d.attacks[index].name),base=parseInt(r.d.attacks[index].damage)||0;assert.equal(e.damage,plan.failZero?(positive?base:0):base+(positive?(plan.ops[0]?.amount||0):0),r.d.id+' '+positive);
 }
});
test('Budew attacks with no Energy attached',()=>{const m=field('sv08.5-004'),[p,o]=m.store.state.players;assert.equal(p.active.getPokemonCard().attacks[0].cost.length,0);M.apply(m,{type:'attack',player:p.id,name:'Itchy Pollen'});drain(m);assert.equal(o.active.damage,10);assert.equal(m.store.state.turn,5);});
test('Suction heals actual damage after opposing reduction',()=>{const m=field('sv06.5-009'),[p,o]=m.store.state.players;p.active.damage=80;p.active.cards.push(fresh('bw1-106'),fresh('bw1-106'));o.active.damageReductionNextTurn=10;M.apply(m,{type:'attack',player:p.id,name:'Suction'});drain(m);assert.equal(o.active.damage,20);assert.equal(p.active.damage,60);});
test('Suction does not heal when attack damage is prevented',()=>{const m=field('sv06.5-009'),[p,o]=m.store.state.players;p.active.damage=80;p.active.cards.push(fresh('bw1-106'),fresh('bw1-106'));o.active.preventDamageNextTurn={};M.apply(m,{type:'attack',player:p.id,name:'Suction'});drain(m);assert.equal(o.active.damage,0);assert.equal(p.active.damage,80);});
test('Rika keeps the unchosen remainder on the bottom without shuffling the rest',()=>{const r=records.find(r=>r.d.name==='Rika'),m=field(),[p,o]=m.store.state.players;const c=fresh(r.d.id);p.hand.cards=[c];const before=p.deck.cards.slice(),tail=before.slice(4);M.apply(m,{type:'play',player:p.id,index:0,target});let q=M.pending(m)[0];assert.equal(q.type,'Choose cards');M.apply(m,{type:'prompt',id:q.id,value:[0,2]});q=M.pending(m)[0];assert.equal(q.type,'Shuffle deck');M.apply(m,{type:'prompt',id:q.id,value:p.deck.cards.map((_,i)=>i).reverse()});drain(m);assert.deepEqual(Array.from(p.deck.cards.slice(0,tail.length)),Array.from(tail));assert.deepEqual(Array.from(p.deck.cards.slice(-2)),[before[3],before[1]]);assert.ok(p.hand.cards.includes(before[0])&&p.hand.cards.includes(before[2]));});
test('Dendra pays a real hand card and draws up to five',()=>{const r=records.find(r=>r.d.name==='Dendra'),m=field(),p=m.store.state.players[0],paid=fresh('bw1-106');p.hand.cards=[fresh(r.d.id),paid];M.apply(m,{type:'play',player:p.id,index:0,target});const q=M.pending(m)[0];assert.equal(q.type,'Choose cards');M.apply(m,{type:'prompt',id:q.id,value:[0]});drain(m);assert.equal(p.hand.cards.length,5);assert.equal(p.deck.cards.at(-1),paid);});
fs.writeFileSync(path.join(root,'work/rules-research/sv-wave3-validation.json'),JSON.stringify({status:'candidate-focused-only',passed:true,tests:passed,engineSha256:require('crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'work/sv-candidate/rules-engine.js'))).digest('hex')},null,2));
`;
vm.runInThisContext('(function(require,__dirname){'+source+script+'})',{filename:__filename})(require,__dirname);

