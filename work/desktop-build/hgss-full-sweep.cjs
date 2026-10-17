const fs=require('fs'),vm=require('vm'),path=require('path');
const base=fs.readFileSync(path.join(__dirname,'rules-tests.cjs'),'utf8'),prefix=base.slice(0,base.indexOf("test('Limitless import:"));
const script=String.raw`
vm.runInContext(fs.readFileSync(path.join(ui,'bot-ai.js'),'utf8'),ctx);const B=ctx.BotAI;
const raw=fs.readFileSync(path.join(root,'work/rules-research/twinleafgg-main/ptcg-server/src/tcg-lab-hgss-data.ts'),'utf8'),records=JSON.parse(raw.match(/^export const hgssData:any = (.*);$/m)[1]);
const failures=[],rejected=[];let scenarios=0;
const reduce=R.Store.prototype.reduceEffect;R.Store.prototype.reduceEffect=function(state,effect){this.dpEffects=(this.dpEffects||0)+1;if(this.dpEffects>15000)throw Error('Effect budget exceeded');return reduce.call(this,state,effect);};
function put(m,id,list){const c=R.CardManager.getInstance().getCardByName(map[id]);if(!c)throw Error('Missing '+id);c._labId=id;c.id=-(1000000+(m.dpSeq=(m.dpSeq||0)+1));list.cards.push(c);return c;}
const blank={name:'DP sweep',cards:{'dp1-76':4,'tk-dp-m-12':56}};
function fixture(id,seed){const m=setup('hgss',blank),[p,o]=m.store.state.players;m.randomState=seed;m.store.state.turn=4;p.canEvolve=true;
 p.active.cards=[];put(m,id,p.active);for(const owner of [p,o]){owner.hand.cards=[];owner.discard.cards=[];if(process.env.ILEX_HGSS_FINAL_SMOKE)owner.deck.cards=owner.deck.cards.slice(0,8);for(let i=0;i<5;i++){owner.bench[i].cards=[];put(m,'dp1-76',owner.bench[i]);owner.bench[i].damage=20;}
  for(const slot of [owner.active,...owner.bench])if(slot.getPokemonCard()){slot.getPokemonCard().hp=5000;slot.getPokemonCard().weakness=[];slot.getPokemonCard().resistance=[];slot.pokemonPlayedTurn=1;}
  for(const energy of ['base1-97','base1-98','base1-99','base1-100','base1-101','base1-102','dp1-129','dp1-130']){for(let i=0;i<4;i++)put(m,energy,owner.active);for(let i=0;i<2;i++){put(m,energy,owner.hand);put(m,energy,owner.discard);}}
  for(const card of ['dp1-76','pl1-47','pl1-110','dp1-113','pl4-90']){put(m,card,owner.hand);put(m,card,owner.discard);put(m,card,owner.deck);}
 }
 if(id==='dp7-30')put(m,'dp1-129',p.active);if(id==='dp6-15')for(const prize of o.prizes.slice(3))prize.moveTo(o.hand,prize.cards.length);p.active.damage=20;o.active.damage=10;return m;}
function settle(m,positive){for(let n=0;n<160;n++){const q=M.pending(m)[0];if(!q)return;let action;if(q.type==='Select'&&positive&&!q.options.isBlindGuess){let i=q.values.findIndex((value,index)=>index>0&&!q.options.disabled?.[index]&&/^(Use|Discard|Flip|Return|Move|Switch|Place|Remove)/.test(value));if(i>=0&&/start again/.test(q.values[i])){if(m.dpSweepRerolled)i=0;else m.dpSweepRerolled=true;}if(i>=0)action={type:'prompt',id:q.id,value:i};}action??=B.prompt(m,q,'hard');if(!action)throw Error('Unresolved '+q.type+' '+q.message);M.apply(m,action);}throw Error('Prompt budget exceeded');}
const engineShaAtStart=require('crypto').createHash('sha256').update(fs.readFileSync(path.join(ui,'rules-engine.js'))).digest('hex');
const selected=records.filter(r=>r.d.supertype==='Pokémon'&&(!process.env.ILEX_HGSS_IDS||process.env.ILEX_HGSS_IDS.split(',').includes(r.d.id)));
const shard=process.env.ILEX_HGSS_SHARD;const shardRecords=selected.filter((record,index)=>shard===undefined||index%3===Number(shard));
for(const record of shardRecords)for(const attack of record.d.attacks||[])for(const seed of process.env.ILEX_HGSS_FINAL_SMOKE?[7]:[1,7])for(const positive of process.env.ILEX_HGSS_FINAL_SMOKE?[true]:[false,true]){
 console.log('START '+record.d.id+' '+attack.name+' '+seed+' '+positive);const m=fixture(record.d.id,seed),p=m.store.state.players[0];m.store.dpEffects=0;
 try{M.apply(m,{type:'attack',player:p.id,name:attack.name});settle(m,positive);assert.equal(M.pending(m).length,0);assert.ok(m.store.state.turn>=5||m.store.state.phase===R.GamePhase.FINISHED,'Attack did not finish turn');scenarios++;}
 catch(error){const failure={id:record.d.id,attack:attack.name,seed,positive,error:error.message||String(error),stack:error.stack};failures.push(failure);console.log('FAIL '+JSON.stringify(failure));}
 if((scenarios+failures.length)%200===0)console.log('Progress '+(scenarios+failures.length));
}
const report={candidate:true,passed:!failures.length,scenarios,failures,rejected,testedPrintings:shardRecords.map(record=>record.d.id),shard:shard??null,scope:'HGSS/Call of Legends and supplements; Holon Phantoms-onward interoperability focused checks follow separately',engineSha256:engineShaAtStart};
fs.writeFileSync(path.join(root,'work/rules-research/'+(process.env.ILEX_HGSS_FINAL_SMOKE?'hgss-final-smoke-report':'hgss-full-sweep-report')+(shard===undefined?'':'-'+shard)+'.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({scenarios,failures:failures.length}));if(failures.length)process.exitCode=1;
`;
vm.runInNewContext(prefix+script,{require,__dirname,console,setTimeout,clearTimeout,process},{filename:'hgss-full-sweep.cjs'});
