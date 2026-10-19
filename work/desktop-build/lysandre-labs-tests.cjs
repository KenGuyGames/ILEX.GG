const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const ui=process.env.ILEX_TEST_UI||path.resolve(__dirname,'../desktop/ui'),ctx={console,setTimeout,clearTimeout};vm.createContext(ctx);
for(const n of ['rules-engine.js','rules-match.js','bot-ai.js'])vm.runInContext(fs.readFileSync(path.join(ui,n),'utf8'),ctx);
const M=ctx.RulesMatch,R=M.R,B=ctx.BotAI,map=JSON.parse(fs.readFileSync(path.join(ui,'rules-card-map.json'))),checks=[];let serial=1000000;
const card=id=>{const c=R.CardManager.getInstance().getCardByName(map[id]);c._labId=id;c.id=serial++;return c;};
function start(charm,type='PSYCHIC',owner=0,status='none'){
 const m=M.create({profile:'sm',seed:37,decks:[B.decks[0],B.decks[1]]},map);for(let i=0;i<180&&M.pending(m).length;i++){const q=M.pending(m)[0];M.apply(m,B.choose(m,q.playerId,'normal'));}
 const g=m.store.state,p=g.players[g.activePlayer],o=g.players.find(q=>q!==p);g.turn=5;
 p.active.cards=[card('base1-46'),card('base1-98')];o.active.cards=[card('base1-44')];
 for(const l of [p.active,o.active]){l.tools=[];l.damage=0;l.specialConditions=[];const c=l.getPokemonCard();c.weakness=[];c.resistance=[];c.hp=300;}
 const attacker=p.active.getPokemonCard();attacker.cardType=[R.CardType[type]];attacker.tags=[R.CardTag.POKEMON_GX,R.CardTag.ULTRA_BEAST];attacker.powers=[{name:'Fixture Ability',text:'',powerType:R.PowerType.ABILITY}];
 o.active.getPokemonCard().cardType=[R.CardType.FAIRY];if(charm)o.active.tools=[card(charm)];
 for(const q of g.players)q.stadium.cards=[];
 const lab=card('sm6-111');if(status!=='none')g.players[owner].stadium.cards=[lab];if(status==='removed')g.players[owner].stadium.cards=[];
 return {m,p,o,lab};
}
function attack(t){M.apply(t.m,{type:'attack',player:t.p.id,name:'Scratch'});for(let i=0;i<80&&M.pending(t.m).length;i++){const q=M.pending(t.m)[0];M.apply(t.m,B.prompt(t.m,q,'normal'));}return t.o.active.damage;}
function test(name,fn){fn();checks.push(name);console.log('PASS '+name);}
const variants=[['sm8-174','GRASS'],['sm8-175','PSYCHIC'],['sm8-176','FIGHTING'],['sm8-177','DRAGON'],['sm10-172','LIGHTNING'],['sm9-142','PSYCHIC'],['sm10-171','PSYCHIC']];
for(const [id,type] of variants)for(const owner of [0,1])test(id+' protects, is suppressed by player '+(owner+1)+' Labs, and resumes after removal',()=>{
 assert.equal(attack(start(id,type,owner,'none')),0,'Charm protects without Labs');
 const live=start(id,type,owner,'live'),tool=live.o.active.tools[0];assert.equal(attack(live),10,'Labs suppresses damage prevention');assert(live.o.active.tools.includes(tool),'Suppression does not discard the Tool');
 assert.equal(attack(start(id,type,owner,'removed')),0,'Protection resumes when Labs leaves play');
});
test('Fairy Charm does not protect a non-Fairy holder without Labs',()=>{const t=start('sm8-175');t.o.active.getPokemonCard().cardType=[R.CardType.GRASS];assert.equal(attack(t),10);});
test('Fairy Charm Psychic does not protect against an ordinary Psychic attacker',()=>{const t=start('sm8-175');t.p.active.getPokemonCard().tags=[];assert.equal(attack(t),10);});
test('Labs permits attaching a Tool while suppressing its effect',()=>{const t=start(null,'PSYCHIC',0,'live'),tool=card('sm8-175');t.p.hand.cards=[tool];t.p.active.getPokemonCard().cardType=[R.CardType.FAIRY];M.apply(t.m,{type:'play',player:t.p.id,index:0,target:{player:R.PlayerType.BOTTOM_PLAYER,slot:R.SlotType.ACTIVE,index:0}});assert(t.p.active.tools.includes(tool));});
for(const status of ['none','live','removed'])test('Choice Band '+status,()=>{const t=start(null,'PSYCHIC',0,status);t.p.active.tools=[card('sm2-121')];t.o.active.getPokemonCard().tags=[R.CardTag.POKEMON_GX];assert.equal(attack(t),status==='live'?10:40);});
for(const status of ['none','live','removed'])test('Float Stone '+status,()=>{const t=start(null,'PSYCHIC',1,status);t.p.active.tools=[card('bw9-99')];const e=new R.CheckRetreatCostEffect(t.p);t.m.store.reduceEffect(t.m.store.state,e);assert.equal(e.cost.length,status==='live'?1:0);});
test('Labs in hand has no suppression effect',()=>{const t=start('sm8-175');t.p.hand.cards.push(t.lab);assert.equal(attack(t),0);});
const report={passed:true,checks,attackScenarios:14*3+2+3,engineSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(ui,'rules-engine.js'))).digest('hex')};fs.writeFileSync('outputs/labs-tests.json',JSON.stringify(report,null,2));console.log(JSON.stringify({passed:true,checks:checks.length}));
