const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path'),ui=path.resolve('work/desktop/ui');
globalThis.crypto??=require('crypto').webcrypto;
for(const f of [ui+'/rules-engine.js',ui+'/new-rule-data.js',ui+'/new-rule-engine.js',ui+'/rules-match.js',ui+'/bot-ai.js'])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const R=TCGRules,M=RulesMatch,N=IlexNewRules,map=JSON.parse(fs.readFileSync(ui+'/rules-card-map.json'));
const deck={name:'Fixture',cards:{'base1-44':4,'base1-30':3,'base1-15':2,'base1-45':4,'base1-29':3,'base1-4':2,'base1-58':4,'base1-51':4,'base1-91':4,'base1-99':18,'base1-98':12}};
function create(mode=true){const m=M.create({profile:'modern',seed:101,newRules:mode?{version:1}:undefined,decks:[deck,deck]},map);assert(m.store.state.newRules||!mode,'New Rule state survived construction');return m;}
function auto(m,limit=1000){for(let n=0;n<limit;n++){const p=M.pending(m)[0];if(!p)return n;const action=BotAI.prompt(m,p,'normal');if(!action)throw Error('No prompt response '+p.type+' '+p.message);M.apply(m,action);}throw Error('Prompt loop');}
function setup(){const m=create();auto(m);assert.equal(m.store.state.phase,R.GamePhase.PLAYER_TURN);return m;}
const results=[];
let m=setup();console.log('Setup',m.store.state.turn,m.store.state.newRules.active.map(x=>x.id));
assert.equal(m.store.state.newRules.active.length,1);assert.equal(m.store.state.newRules.deck.length,95);
const restored=M.restore({spec:m.spec,journal:m.journal},map);assert.deepEqual(N.publicView(restored.store.state),N.publicView(m.store.state));results.push('setup, first reveal and journal restore');
function fixture(){const m=setup(),s=m.store.state,p=s.players[s.activePlayer],o=s.players.find(x=>x!==p);s.newRules.active=[];s.newRules.hex=[];s.newRules.knockouts[p.id]=o.wotcLastTurnEnded;
 for(const x of [p,o]){const pool=[x.active,...x.bench].flatMap(l=>l.getPokemons()).concat(x.hand.cards,x.deck.cards,x.discard.cards);x.hand.cards=[];x.deck.cards=[];x.discard.cards=[];x.active.cards=[];for(const b of x.bench)b.cards=[];const make=id=>M.prototypes?null:null;
 const template=pool.find(c=>c.name==='Bulbasaur')||pool.find(c=>c.superType===R.SuperType.POKEMON&&c.stage===R.Stage.BASIC),e=pool.find(c=>c.superType===R.SuperType.ENERGY),tr=pool.find(c=>c.superType===R.SuperType.TRAINER),stage1=pool.find(c=>c.name==='Ivysaur'),stage2=pool.find(c=>c.name==='Venusaur');
 const clone=c=>{const n=Object.assign(Object.create(Object.getPrototypeOf(c)),c);n.id=Math.floor(Math.random()*1e8);return n;};
 x.active.cards=[clone(template)];x.active.damage=0;x.active.pokemonPlayedTurn=-1;x.active.tools=[];x.active.energies.cards=[];x.active.specialConditions=[];
 for(const b of x.bench){b.cards=[clone(template)];b.damage=0;b.tools=[];b.energies.cards=[];b.pokemonPlayedTurn=-1;}
 x.hand.cards=[clone(e),clone(e),clone(template),clone(stage1),clone(stage2),clone(tr),clone(tr)];
 for(let i=0;i<40;i++)x.deck.cards.push(clone([e,template,stage1,stage2,tr][i%5]));
 x.discard.cards=[clone(e),clone(e),clone(stage1),clone(tr),clone(tr)];
 const special=new R.EnergyCard();Object.assign(special,{name:'Double Colorless Energy',energyType:R.EnergyType.SPECIAL,provides:[R.CardType.COLORLESS,R.CardType.COLORLESS]});x.hand.cards.push(special);x.deck.cards.push(Object.assign(new R.EnergyCard(),special));
 }
 s.turn=5;s.phase=R.GamePhase.PLAYER_TURN;return m;
}
for(const d of IlexNewRuleCards.filter(c=>c.mode==='action')){try{const m=fixture(),s=m.store.state,p=s.players[s.activePlayer],entry={id:d.id,instance:1,used:{},facing:p.id};s.newRules.active=[entry];if(d.id==='flip-the-script')s.newRules.knockouts[p.id]=s.players.find(x=>x!==p).wotcLastTurnEnded;if(d.id==='delinquent'){const c=new R.TrainerCard();c.trainerType=R.TrainerType.STADIUM;p.stadium.cards=[c];}if(d.id==='cedric-juniper'){s.players[s.activePlayer].hand.cards.find(c=>c.superType===R.SuperType.POKEMON)._labId='base1-44';N.verifiedHeights['base1-44']=28;}
 // Exercise the resolver even if the fixture lacks a qualified target; activation eligibility is separately covered.
 N.test.run(m.store,s,N.test.effect(m.store,s,p,d.id,entry),()=>N.test.finish(m.store,s));auto(m);results.push(d.id);console.log('OK',d.id);
 }catch(e){results.push({id:d.id,error:e.stack});console.log('FAIL',d.id,e.message);}}
fs.writeFileSync('work/new-rule-audit/test-results.json',JSON.stringify(results,null,2));
if(results.some(x=>typeof x==='object'))process.exitCode=1;
module.exports={fixture,create,auto,setup,R,M,N,map,results};
