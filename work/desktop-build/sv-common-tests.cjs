const fs=require('fs'),path=require('path'),vm=require('vm');
let source=fs.readFileSync(path.join(__dirname,'rules-tests.cjs'),'utf8');source=source.slice(0,source.indexOf("test('Limitless import:"));source=source.replace("fs.readFileSync(path.join(ui,file),'utf8')","fs.readFileSync(file==='rules-engine.js'?path.join(root,'work/sv-candidate/rules-engine.js'):path.join(ui,file),'utf8')");
const script=String.raw`
const records=JSON.parse(fs.readFileSync(path.join(root,'work/rules-research/sv-era-candidate-data.json'),'utf8'));
for(const r of records)map[r.d.id]='ILEX DP '+r.d.id;
function fresh(id){const c=R.CardManager.getInstance().getCardByName(map[id]);assert.ok(c,id);return c;}
function field(id){const m=setup('modern',{name:'SV shared fixture',cards:{'bw1-1':4,'bw1-106':56}});m.store.state.turn=4;m.store.state.players[0].active.cards=[fresh(id)];return m;}
function applyAttack(m,name){const [p,o]=m.store.state.players,c=p.active.getPokemonCard(),a=c.attacks.find(a=>a.name===name);assert.ok(a,name);const e=new R.AttackEffect(p,o,a);c.reduceEffect(m.store,m.store.state,e);return e;}
test('Fighting Blaze distinguishes SV ex and Pokemon V from uppercase EX and ordinary Pokemon',()=>{
 const id='sv03.5-136',row=records.find(r=>r.d.id===id),a=row.d.attacks.find(a=>a.name==='Fighting Blaze'),base=parseInt(a.damage)||0;
 for(const [defender,bonus]of [['sv01-086',90],['swsh1-138',90],['xy2-12',0],['bw1-1',0]]){const m=field(id);m.store.state.players[1].active.cards=[fresh(defender)];assert.equal(applyAttack(m,'Fighting Blaze').damage,base+bonus,defender);}
});
const selects=records.filter(r=>!r.reuse&&r.ops?.some(ops=>ops?.some(op=>op.op==='sv'&&op.kind==='conditional')));
for(const condition of ['ownBenchDamaged','moreHand','morePrizes','defenderEvolution','selfEnergyType','ownBenchType'])test('Shared conditional resolves '+condition+' with positive and negative controls',()=>{
 let row,index,plan;for(const r of selects){for(let i=0;i<r.ops.length;i++){const op=r.ops[i].find(op=>op.op==='sv'&&op.kind==='conditional'&&op.condition===condition);if(op){row=r;index=i;plan=op;break;}}if(row)break;}assert.ok(row,condition);
 for(const positive of [false,true]){const m=field(row.d.id),s=m.store.state,[p,o]=s.players;
  p.bench.forEach(l=>{l.cards=[];l.damage=0;});
  if(condition==='ownBenchDamaged'&&positive){p.bench[0].cards=[fresh('bw1-1')];p.bench[0].damage=10;}
  if(condition==='moreHand'){p.hand.cards=[];o.hand.cards=[];if(positive)p.hand.cards=[fresh('bw1-1')];}
  if(condition==='morePrizes'){if(positive)o.prizes[0].cards=[];}
  if(condition==='defenderEvolution')o.active.cards=[fresh(positive?'sv01-086':'bw1-1')];
  if(condition==='selfEnergyType'&&positive){const ids={Water:'bw1-107',Metal:'bw1-112',Grass:'bw1-105',Fire:'bw1-106',Lightning:'bw1-108',Psychic:'bw1-109',Fighting:'bw1-110',Darkness:'bw1-111'};p.active.cards.push(fresh(ids[plan.energy]));}
  if(condition==='ownBenchType'&&positive){p.bench[0].cards=[fresh('bw1-1')];p.bench[0].getPokemonCard().cardType=[({Metal:R.CardType.METAL,Grass:R.CardType.GRASS,Lightning:R.CardType.LIGHTNING})[plan.energy]];}
  const e=applyAttack(m,row.d.attacks[index].name),expected=(parseInt(row.d.attacks[index].damage)||0)+(positive?plan.ops[0].amount:0);assert.equal(e.damage,expected,row.d.id+' '+positive);
 }
});
function powerRecord(action){return records.find(r=>!r.reuse&&r.powers?.some(op=>op.action===action));}
test('Freezing Disaster blocks healing for both players and stops when suppressed',()=>{
 const r=powerRecord('noHealing');assert.ok(r);const m=field('sv01-001'),s=m.store.state,[p,o]=s.players;p.bench[0].cards=[fresh(r.d.id)];
 for(const target of [p.active,o.active]){target.damage=50;m.store.reduceEffect(s,new R.HealEffect(target===p.active?p:o,target,30));assert.equal(target.damage,50);}
 s.wotcHasPowerLocks=true;s.wotcGlobalPowerLockUntilTurn=s.turn;const heal=new R.HealEffect(p,p.active,30);m.store.reduceEffect(s,heal);assert.equal(p.active.damage,20);
});
test('Expanding Body grants HP for Special Energy, not Basic Energy',()=>{
 const r=powerRecord('specialEnergyHp');assert.ok(r);for(const [id,bonus]of [[null,0],['bw1-105',0],['swsh9-151',100]]){const m=field(r.d.id),[p,o]=m.store.state.players;if(id)p.active.cards.push(fresh(id));const e=new R.CheckHpEffect(p,p.active);m.store.reduceEffect(m.store.state,e);assert.equal(e.hp,Number(r.d.hp)+bonus,id);}
});
test('Dual Core changes type only while its named Capsule is attached',()=>{
 const r=records.find(r=>!r.reuse&&r.powers?.some(op=>op.action==='doubleType'&&op.tool)),capsule=records.find(r=>r.d.name==='Future Booster Energy Capsule');assert.ok(r);assert.ok(capsule);
 const m=field(r.d.id),p=m.store.state.players[0];const before=new R.CheckPokemonTypeEffect(p.active);m.store.reduceEffect(m.store.state,before);assert.deepEqual(Array.from(before.cardTypes),r.d.types.map(t=>({Fighting:R.CardType.FIGHTING,Metal:R.CardType.METAL})[t]));
 p.active.tools.push(fresh(capsule.d.id));const after=new R.CheckPokemonTypeEffect(p.active);m.store.reduceEffect(m.store.state,after);assert.deepEqual(Array.from(after.cardTypes),[R.CardType.FIGHTING,R.CardType.METAL]);
 p.active.tools=[];const removed=new R.CheckPokemonTypeEffect(p.active);m.store.reduceEffect(m.store.state,removed);assert.deepEqual(Array.from(removed.cardTypes),Array.from(before.cardTypes));
});
test('SV Item categories exclude Tools while historical profiles retain them',()=>{
 const tool=fresh('sv01-193'),item=fresh(records.find(r=>r.d.name==='Switch').d.id),supporter=fresh('sv01-189'),stadium=fresh('sv01-167');
 for(const modern of [false,true]){const state={rules:{svEraRules:modern}};assert.equal(R.isTrainerItem(tool,state),!modern);assert.equal(R.isTrainerItem(item,state),true);assert.equal(R.isTrainerItem(supporter,state),false);assert.equal(R.isTrainerItem(stadium,state),false);}
});
test('Item-only attack locks allow Tools under SV rules and block them historically',()=>{
 for(const modern of [false,true]){const m=field('sv01-001'),s=m.store.state,p=s.players[0];s.rules.svEraRules=modern;p._dpItemLockUntil=s.turn;const c=fresh('sv01-193');p.hand.cards=[c];const action={type:'play',player:p.id,index:0,target:{player:R.PlayerType.BOTTOM_PLAYER,slot:R.SlotType.ACTIVE,index:0}};
  if(modern){M.apply(m,action);drain(m);assert.ok(p.active.tools.includes(c));}else assert.throws(()=>M.apply(m,action),e=>e.message==='BLOCKED_BY_EFFECT');
 }
});
test('SV Item-only attack locks still block actual Items',()=>{
 const m=field('sv01-001'),s=m.store.state,p=s.players[0];s.rules.svEraRules=true;p._dpItemLockUntil=s.turn;p.bench[0].cards=[fresh('bw1-1')];p.hand.cards=[fresh(records.find(r=>r.d.name==='Switch').d.id)];assert.throws(()=>M.apply(m,{type:'play',player:p.id,index:0,target:{player:R.PlayerType.BOTTOM_PLAYER,slot:R.SlotType.ACTIVE,index:0}}),e=>e.message==='BLOCKED_BY_EFFECT');
});
test('All candidate SV ACE SPEC printings retain the shared deck restriction tag',()=>{
 const ace=records.filter(r=>r.d.subtypes?.includes('ACE SPEC'));assert.ok(ace.length);for(const r of ace)assert.ok(fresh(r.d.id).tags.includes(R.CardTag.ACE_SPEC),r.d.id);
});
test('Come and Get You resolves with no Duskull in discard',()=>{
 const m=field('sv06.5-018'),p=m.store.state.players[0];p.discard.cards=[];p.active.cards.push(fresh('bw1-109'));const turn=m.store.state.turn;M.apply(m,{type:'attack',player:p.id,name:'Come and Get You'});drain(m);assert.equal(M.pending(m).length,0);assert.equal(m.store.state.turn,turn+1);
});
test('Blazing Destruction resolves when there is no Stadium',()=>{
 const m=field('sv06-099'),p=m.store.state.players[0];p.active.cards.push(fresh('bw1-106'));const turn=m.store.state.turn;M.apply(m,{type:'attack',player:p.id,name:'Blazing Destruction'});drain(m);assert.equal(M.pending(m).length,0);assert.equal(m.store.state.turn,turn+1);
});
test('Gaia Punk can discard Lightning Energy from the Bench',()=>{
 const m=field('sv04-100'),s=m.store.state,[p,o]=s.players;p.bench[0].cards=[fresh('bw1-1')];o.active.getPokemonCard().hp=5000;p.active.cards.push(fresh('bw1-108'),fresh('bw1-108'),fresh('bw1-108'));
 for(let i=0;i<3;i++)p.bench[0].cards.push(fresh('bw1-108'));const turn=s.turn;M.apply(m,{type:'attack',player:p.id,name:'Gaia Punk'});drain(m);
 const q=M.pending(m).find(q=>q.type==='Choose cards');assert.ok(q);const indices=q.cards.cards.map((c,i)=>p.bench[0].cards.includes(c)?i:-1).filter(i=>i>=0);assert.equal(indices.length,3);M.apply(m,{type:'prompt',id:q.id,value:indices});drain(m);assert.equal(p.discard.cards.filter(c=>c.name==='Lightning Energy').length,3);assert.equal(p.active.cards.filter(c=>c.name==='Lightning Energy').length,3);assert.equal(s.turn,turn+1);
});
test('Prism Charge resolves with no Tera targets',()=>{
 const m=field('sv08-161'),p=m.store.state.players[0];p.active.cards.push(fresh('bw1-105'));const turn=m.store.state.turn;M.apply(m,{type:'attack',player:p.id,name:'Prism Charge'});drain(m);const q=M.pending(m).find(q=>q.type==='Shuffle deck');if(q)M.apply(m,{type:'prompt',id:q.id,value:Array.from({length:p.deck.cards.length},(_,i)=>i)});drain(m);assert.equal(M.pending(m).length,0);assert.equal(m.store.state.turn,turn+1);
});
for(const mode of ['absent','present','blocked'])test('Festival Lead resolves the proper number of attacks: '+mode,()=>{
 const m=field('sv06-018'),s=m.store.state,[p,o]=s.players;o.active.getPokemonCard().hp=5000;p.bench.forEach(l=>l.cards=[]);p.bench[0].cards=[fresh('bw1-1')];p.active.cards.push(fresh('bw1-105'));
 if(mode!=='absent'){const stadium=records.find(r=>r.d.name==='Festival Grounds');assert.ok(stadium);p.stadium.cards=[fresh(stadium.d.id)];}
 if(mode==='blocked'){s.wotcHasPowerLocks=true;s.wotcGlobalPowerLockUntilTurn=s.turn;}
 const turn=s.turn;M.apply(m,{type:'attack',player:p.id,name:'Do the Wave'});for(let i=0;i<30;i++){drain(m);const q=M.pending(m)[0];if(!q)break;if(q.type==='Confirm')M.apply(m,{type:'prompt',id:q.id,value:true});else throw Error('Unexpected festival prompt '+q.type);}
 assert.equal(M.pending(m).length,0);assert.equal(o.active.damage,mode==='present'?40:20);assert.equal(s.turn,turn+1);
});
fs.writeFileSync(path.join(root,'work/rules-research/sv-common-validation.json'),JSON.stringify({status:'candidate-focused-only',passed:true,tests:passed,engineSha256:require('crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'work/sv-candidate/rules-engine.js'))).digest('hex')},null,2));
`;
vm.runInThisContext('(function(require,__dirname){'+source+script+'})',{filename:__filename})(require,__dirname);
