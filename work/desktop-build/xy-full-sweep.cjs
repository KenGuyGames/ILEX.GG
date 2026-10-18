const fs=require('fs'),vm=require('vm'),path=require('path');
const base=fs.readFileSync(path.join(__dirname,'rules-tests.cjs'),'utf8'),prefix=base.slice(0,base.indexOf("test('Limitless import:"));
const script=String.raw`
vm.runInContext(fs.readFileSync(path.join(ui,'bot-ai.js'),'utf8'),ctx);const B=ctx.BotAI;
const records=JSON.parse(fs.readFileSync(path.join(root,'work/rules-research/xy-full-wave-data.json'),'utf8'));
const failures=[],rejected=[];let scenarios=0;
const reduce=R.Store.prototype.reduceEffect;R.Store.prototype.reduceEffect=function(state,effect){this.dpEffects=(this.dpEffects||0)+1;if(this.dpEffects>15000)throw Error('Effect budget exceeded');return reduce.call(this,state,effect);};
function put(m,id,list){const c=R.CardManager.getInstance().getCardByName(map[id]);if(!c)throw Error('Missing '+id);c._labId=id;c.id=-(1000000+(m.dpSeq=(m.dpSeq||0)+1));list.cards.push(c);return c;}
const blank={name:'DP sweep',cards:{'bw1-1':4,'bw1-106':56}};
function fixture(id,seed){const m=setup('xy',blank),[p,o]=m.store.state.players;m.randomState=seed;m.store.state.turn=4;p.canEvolve=true;
 p.active.cards=[];put(m,id,p.active);for(const owner of [p,o]){owner.hand.cards=[];owner.discard.cards=[];if(process.env.ILEX_BW_FINAL_SMOKE)owner.deck.cards=owner.deck.cards.slice(0,8);for(let i=0;i<5;i++){owner.bench[i].cards=[];put(m,'bw1-1',owner.bench[i]);owner.bench[i].damage=20;}
  for(const slot of [owner.active,...owner.bench])if(slot.getPokemonCard()){slot.getPokemonCard().hp=5000;slot.getPokemonCard().weakness=[];slot.getPokemonCard().resistance=[];slot.pokemonPlayedTurn=1;}
  for(const energy of ['bw1-110','bw1-106','bw1-105','bw1-108','bw1-109','bw1-107','bw1-111','bw1-112','xy1-140']){for(let i=0;i<6;i++)put(m,energy,owner.active);for(let i=0;i<2;i++){put(m,energy,owner.hand);put(m,energy,owner.discard);}}
  for(const card of ['bw1-1','bw1-1','bw1-101','bw1-104','bw1-100']){put(m,card,owner.hand);put(m,card,owner.discard);put(m,card,owner.deck);}
 }
 put(m,'bw8-127',p.active);if(id==='bw6-103'){o.active.cards=o.active.cards.filter(c=>c.superType!==R.SuperType.POKEMON);put(m,'bw1-4',o.active);o.active.getPokemonCard().hp=5000;o.active.getPokemonCard().weakness=[];}if(id==='bw5-24')p.prizes[5].moveTo(p.discard);if(id==='dp7-30')put(m,'bw1-111',p.active);if(id==='dp6-15')for(const prize of o.prizes.slice(3))prize.moveTo(o.hand,prize.cards.length);p.active.damage=20;o.active.damage=10;if(id==='xy11-88')m.store.state.turn=2;if(['dc1-6','dc1-15'].includes(id))for(const list of p.bench.slice(0,4)){list.cards=[];const c=put(m,id==='dc1-6'?'dc1-7':'dc1-1',list);c.hp=5000;c.weakness=[];list.pokemonPlayedTurn=1;}return m;}
function settle(m,positive){for(let n=0;n<160;n++){const q=M.pending(m)[0];if(!q)return;let action;if(q.type==='Select'&&positive&&!q.options.isBlindGuess){let i=q.values.findIndex((value,index)=>index>0&&!q.options.disabled?.[index]&&/^(Use|Discard|Flip|Return|Move|Switch|Place|Remove)/.test(value));if(i>=0&&/start again/.test(q.values[i])){if(m.dpSweepRerolled)i=0;else m.dpSweepRerolled=true;}if(i>=0)action={type:'prompt',id:q.id,value:i};}action??=B.prompt(m,q,'hard');if(!action)throw Error('Unresolved '+q.type+' '+q.message);M.apply(m,action);}throw Error('Prompt budget exceeded');}
const engineShaAtStart=require('crypto').createHash('sha256').update(fs.readFileSync(path.join(ui,'rules-engine.js'))).digest('hex');
const selected=records.filter(r=>r.d.supertype==='Pokémon'&&(!process.env.ILEX_XY_BRANCH||r.reason!=='native-source'&&!r.reuse||['xy2-5','xy2-69','xy8-122','xy1-51'].includes(r.d.id))&&(!process.env.ILEX_BW_IDS||process.env.ILEX_BW_IDS.split(',').includes(r.d.id)));
const shard=process.env.ILEX_BW_SHARD;const shardRecords=selected.filter((record,index)=>shard===undefined||index%3===Number(shard));
for(const record of shardRecords)for(const attack of record.d.attacks||[])for(const seed of process.env.ILEX_BW_FINAL_SMOKE?[7]:[1,7])for(const positive of process.env.ILEX_BW_FINAL_SMOKE?[true]:[false,true]){
 console.log('START '+record.d.id+' '+attack.name+' '+seed+' '+positive);const m=fixture(record.d.id,seed),p=m.store.state.players[0];m.store.dpEffects=0;
 const initialTurn=m.store.state.turn;try{M.apply(m,{type:'attack',player:p.id,name:attack.name});settle(m,positive);assert.equal(M.pending(m).length,0);assert.ok(m.store.state.turn>=initialTurn+1||m.store.state.phase===R.GamePhase.FINISHED,'Attack did not finish turn');scenarios++;}
 catch(error){const failure={id:record.d.id,attack:attack.name,seed,positive,error:error.message||String(error),stack:error.stack};failures.push(failure);console.log('FAIL '+JSON.stringify(failure));}
 if((scenarios+failures.length)%200===0)console.log('Progress '+(scenarios+failures.length));
}
const report={candidate:true,passed:!failures.length,scenarios,failures,rejected,testedPrintings:shardRecords.map(record=>record.d.id),shard:shard??null,scope:'Kalos Starter/XY with BW-onward fixtures; Unlimited deferred',engineSha256:engineShaAtStart};
fs.writeFileSync(path.join(root,'work/rules-research/'+(process.env.ILEX_XY_REPORT||(process.env.ILEX_XY_BRANCH?'xy-full-branch-report':process.env.ILEX_BW_FINAL_SMOKE?'xy-full-smoke-report':process.env.ILEX_BW_IDS?'xy-full-repair-report':'xy-full-sweep-report'))+(shard===undefined?'':'-'+shard)+'.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({scenarios,failures:failures.length}));if(failures.length)process.exitCode=1;
`;
vm.runInNewContext(prefix+script,{require,__dirname,console,setTimeout,clearTimeout,process},{filename:'bw-full-sweep.cjs'});
