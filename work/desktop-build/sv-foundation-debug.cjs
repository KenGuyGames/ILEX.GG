const fs=require('fs'),path=require('path'),vm=require('vm');
let base=fs.readFileSync(path.join(__dirname,'rules-tests.cjs'),'utf8');
base=base.slice(0,base.indexOf("test('Limitless import:"));
base=base.replace("fs.readFileSync(path.join(ui,file),'utf8')","fs.readFileSync(file==='rules-engine.js'?path.join(root,'work/sv-candidate/rules-engine.js'):path.join(ui,file),'utf8')");
const script=String.raw`
const records=JSON.parse(fs.readFileSync(path.join(root,'work/rules-research/sv-wave-data.json'),'utf8'));
for(const row of records)map[row.d.id]='ILEX DP '+row.d.id;
function fresh(id){const c=R.CardManager.getInstance().getCardByName(map[id]);assert.ok(c,'Missing candidate '+id);return c;}
function field(){const m=setup('modern',{name:'SV fixture',cards:{'bw1-1':4,'bw1-106':56}});m.store.state.turn=4;return m;}
test('SV candidate printing metadata is installed on every candidate',()=>{
 for(const row of records){const c=fresh(row.d.id);assert.equal(c._svId,row.d.id);assert.equal(c.regulationMark,row.d.regulationMark||'');if(row.d.subtypes.includes('ex'))assert.ok(c.tags.includes(R.CardTag.POKEMON_ex));}
});
test('Modern ex has a Rule Box while legacy ex identity stays separate from uppercase EX',()=>{
 const c=fresh('sv01-086');assert.ok(c.hasRuleBox());assert.ok(c.tags.includes(R.CardTag.POKEMON_ex));assert.ok(!c.tags.includes(R.CardTag.POKEMON_EX));
 const old=R.CardManager.getInstance().getCardByName(map['ex1-96']);assert.ok(old);assert.ok(!old.hasRuleBox());
});
for(const id of ['sv01-032','sv01-045'])for(const own of [false,true])test(id+' Tera blocks '+(own?'own':'opposing')+' attack damage on Bench but allows counters',()=>{
 const m=field(),s=m.store.state,[p,o]=s.players,c=fresh(id);o.bench[0].cards=[c];o.bench[0].damage=0;
 const attacker=own?o:p,attack=new R.AttackEffect(attacker,own?p:o,attacker.active.getPokemonCard().attacks[0]);
 const damage=new R.PutDamageEffect(attack,70);damage.target=o.bench[0];m.store.reduceEffect(s,damage);assert.equal(o.bench[0].damage,0);
 const counters=new R.PutCountersEffect(attack,20);counters.target=o.bench[0];m.store.reduceEffect(s,counters);assert.equal(o.bench[0].damage,20);
});
test('Tera protection does not apply in Active Spot',()=>{
 const m=field(),s=m.store.state,[p,o]=s.players;o.active.cards=[fresh('sv01-045')];o.active.damage=0;
 const e=new R.PutDamageEffect(new R.AttackEffect(p,o,p.active.getPokemonCard().attacks[0]),70);e.target=o.active;m.store.reduceEffect(s,e);assert.equal(o.active.damage,70);
});
test('Tera under an evolution does not protect the top non-Tera Pokemon',()=>{
 const m=field(),s=m.store.state,[p,o]=s.players;o.bench[0].cards=[fresh('sv01-045'),fresh('sv01-001')];o.bench[0].damage=0;
 const e=new R.PutDamageEffect(new R.AttackEffect(p,o,p.active.getPokemonCard().attacks[0]),30);e.target=o.bench[0];m.store.reduceEffect(s,e);assert.equal(o.bench[0].damage,30);
});
test('Blooming Garden removes only its owner field Weakness',()=>{
 const m=field(),s=m.store.state,[p,o]=s.players;p.bench[0].cards=[fresh('sv01-093')];
 for(const target of [p.active,p.bench[0]]){const e=new R.CheckPokemonStatsEffect(target);m.store.reduceEffect(s,e);assert.equal(e.weakness.length,0);}
 const e=new R.CheckPokemonStatsEffect(o.active);m.store.reduceEffect(s,e);assert.ok(e.weakness.length);
});
test('Well-Baked Body blocks opposing Fire damage, allows other types, and rejects Burn only',()=>{
 const m=field(),s=m.store.state,[p,o]=s.players;o.active.cards=[fresh('sv01-099')];o.active.damage=0;p.active.cards=[fresh('sv01-031')];
 const hit=amount=>{const e=new R.PutDamageEffect(new R.AttackEffect(p,o,p.active.getPokemonCard().attacks[0]),amount);e.target=o.active;m.store.reduceEffect(s,e);};
 hit(70);assert.equal(o.active.damage,0);p.active.cards=[fresh('sv01-001')];hit(40);assert.equal(o.active.damage,40);
 const e=new R.AddSpecialConditionsEffect(new R.AttackEffect(p,o,p.active.getPokemonCard().attacks[0]),[R.SpecialCondition.BURNED,R.SpecialCondition.POISONED]);e.target=o.active;m.store.reduceEffect(s,e);assert.ok(!o.active.specialConditions.includes(R.SpecialCondition.BURNED));assert.ok(o.active.specialConditions.includes(R.SpecialCondition.POISONED));
});
test('Maddening Scent counts opposing Bench only',()=>{
 const m=field(),s=m.store.state,[p,o]=s.players,c=fresh('sv01-158');p.active.cards=[c];o.bench.forEach(l=>l.cards=[]);o.bench[0].cards=[fresh('sv01-001')];o.bench[1].cards=[fresh('sv01-002')];
 const e=new R.AttackEffect(p,o,c.attacks[0]);c.reduceEffect(m.store,s,e);assert.equal(e.damage,70);
});
test('Family Attack counts the Active and own Benched Maushold only',()=>{
 const m=field(),s=m.store.state,[p,o]=s.players,c=fresh('sv01-161');p.active.cards=[c];p.bench.forEach(l=>l.cards=[]);p.bench[0].cards=[fresh('sv01-161')];p.bench[1].cards=[fresh('sv01-001')];o.bench[0].cards=[fresh('sv01-161')];
 const e=new R.AttackEffect(p,o,c.attacks.find(a=>a.name==='Family Attack'));c.reduceEffect(m.store,s,e);assert.equal(e.damage,140);
});
test('Sweeping Tackle subtracts twenty per counter and floors damage at zero',()=>{
 const m=field(),s=m.store.state,[p,o]=s.players,c=fresh('sv01-060');p.active.cards=[c];const a=c.attacks.find(a=>a.name==='Sweeping Tackle');
 for(const [damage,expected] of [[0,200],[30,140],[110,0]]){p.active.damage=damage;const e=new R.AttackEffect(p,o,a);c.reduceEffect(m.store,s,e);assert.equal(e.damage,expected);}
});
test('Tandem Unit caps its search at the one available Bench slot',()=>{
 const m=field(),[p,o]=m.store.state.players;p.active.cards=[fresh('sv01-081')];p.bench.forEach((l,i)=>l.cards=i<4?[fresh('sv01-001')]:[]);
 p.deck.cards.push(fresh('sv01-081'),fresh('sv01-081'));
 M.apply(m,{type:'ability',player:p.id,name:'Tandem Unit',target:{player:R.PlayerType.BOTTOM_PLAYER,slot:R.SlotType.ACTIVE,index:0}});
 console.log('TANDEM PROMPTS',M.pending(m).map(q=>({type:q.type,message:q.message,options:q.options,values:q.values})));const q=M.pending(m).find(q=>q.type==='Choose cards');assert.ok(q);assert.equal(q.options.max,1);
});
test('Psychic Embrace exposes only living Psychic targets and one safe attachment per use',()=>{
 const m=field(),[p,o]=m.store.state.players;p.active.cards=[fresh('sv01-086')];p.bench.forEach(l=>l.cards=[]);p.bench[0].cards=[fresh('sv01-001')];p.bench[1].cards=[fresh('sv01-086')];p.bench[1].damage=290;
 const energy=R.CardManager.getInstance().getCardByName(map['bw1-109']);assert.equal(energy.name,'Psychic Energy');p.discard.cards=[energy];
 M.apply(m,{type:'ability',player:p.id,name:'Psychic Embrace',target:{player:R.PlayerType.BOTTOM_PLAYER,slot:R.SlotType.ACTIVE,index:0}});
 const q=M.pending(m).find(q=>q.type==='Attach energy');assert.ok(q);assert.equal(q.options.max,1);assert.ok(q.options.blockedTo.some(t=>t.slot===R.SlotType.BENCH&&t.index===0));assert.ok(q.options.blockedTo.some(t=>t.slot===R.SlotType.BENCH&&t.index===1));
 const before=p.active.damage;M.apply(m,{type:'prompt',id:q.id,value:[{index:0,to:{player:R.PlayerType.BOTTOM_PLAYER,slot:R.SlotType.ACTIVE,index:0}}]});assert.ok(p.active.cards.includes(energy)||p.active.energies.cards.includes(energy));assert.equal(p.active.damage,before+20);
});
const report={status:'focused-candidate-checks-only',checks:passed.length,passed,candidates:records.length,validatedEraPrintings:0,limitations:'Foundation tests only; printed effects, attack sweeps, bot rollouts and release validation remain pending.'};
fs.writeFileSync(path.join(root,'work/rules-research/sv-foundation-validation.json'),JSON.stringify(report,null,2));
`;
vm.runInThisContext('(function(require,__dirname){'+base+script+'})',{filename:__filename})(require,__dirname);

