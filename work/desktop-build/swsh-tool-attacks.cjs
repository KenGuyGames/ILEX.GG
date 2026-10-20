const fs=require('fs'),path=require('path'),vm=require('vm');
const base=fs.readFileSync(path.join(__dirname,'rules-tests.cjs'),'utf8'),prefix=base.slice(0,base.indexOf("test('Limitless import:"));
const sweep=fs.readFileSync(path.join(__dirname,'swsh-full-sweep.cjs'),'utf8'),start=sweep.indexOf('const script=String.raw`')+'const script=String.raw`'.length,helpers=sweep.slice(start,sweep.indexOf('const selected=',start));
const body=String.raw`
const tools=records.filter(r=>r.d.supertype==='Trainer'&&r.d.attacks?.length),results=[];
for(const {d}of tools){try{
 const m=fixture(d.subtypes?.includes('Rapid Strike')?'swsh5-88':'swsh5-85',7),[p,o]=m.store.state.players;
 const card=put(m,d.id,p.hand);assert.deepEqual(Array.from(card.attacks,a=>a.name),d.attacks.map(a=>a.name));p.hand.cards=p.hand.cards.filter(c=>c!==card);p.active.tools=[];p.active.tools.push(card);o.active.damage=0;
 for(let i=0;i<d.attacks.length;i++){assert.equal(card.attacks[i].damage,parseInt(d.attacks[i].damage)||0);assert.deepEqual(Array.from(card.attacks[i].cost).sort(),d.attacks[i].cost.map(t=>R.CardType[t.toUpperCase()]).sort());}
 if(d.id==='swsh12-154'){o.active.cards=[];const c=put(m,'swsh5-85',o.active);c.hp=310;o.active.damage=20;}
 for(const l of [p.active,...p.bench]){l.damage=40;}
 for(const a of d.attacks){M.apply(m,{type:'attack',player:p.id,name:a.name});settle(m,true);}
 assert.equal(M.pending(m).length,0);
 if(d.id==='swsh12-154'){assert.equal(o.active.damage,210);assert.equal(p.usedVSTAR,true);assert.equal(o.bench[0].damage,20);}
 if(d.id==='swsh7-158'){const e=new R.CheckProvidedEnergyEffect(p,p.active);m.store.reduceEffect(m.store.state,e);assert.equal(e.energyMap.length,0);assert.equal(o.active.damage,300);}
 const wrong=fixture('bw1-1',7),wp=wrong.store.state.players[0],wt=put(wrong,d.id,wp.hand);wp.hand.cards=[];wp.active.tools=[wt];const check=new R.CheckPokemonAttacksEffect(wp);wrong.store.reduceEffect(wrong.store.state,check);assert.ok(!check.attacks.some(a=>a.name===d.attacks[0].name),'Ineligible holder must not gain Tool attack');
 results.push({id:d.id,attacks:d.attacks.map(a=>a.name),resolved:true,ineligibleHolderRejected:true});
}catch(e){failures.push({id:d.id,error:e.message||String(e)});}}
const powers=[];
if(process.env.ILEX_TOOL_TRACE){const reduce=R.Store.prototype.reduceEffect;R.Store.prototype.reduceEffect=function(state,e){if(e.power?.name==='Star Alchemy')console.log('TRACE '+e.type+' used='+e.player.usedVSTAR+' '+new Error().stack);return reduce.call(this,state,e);};}
for(const blocked of [false,true]){try{const m=fixture('swsh5-85',7),[p,o]=m.store.state.players,tool=put(m,'swsh12-156',p.hand);p.hand.cards=[];p.active.tools=[tool];if(blocked)put(m,'sm6-111',o.stadium);const e=new R.CheckPokemonPowersEffect(p,p.active.getPokemonCard());m.store.reduceEffect(m.store.state,e);assert.equal(e.powers.some(a=>a.name==='Star Alchemy'),!blocked);if(!blocked){const before=p.deck.cards.length;M.apply(m,{type:'ability',player:p.id,name:'Star Alchemy',target:{player:R.PlayerType.BOTTOM_PLAYER,slot:R.SlotType.ACTIVE,index:0}});settle(m,true);assert.equal(p.usedVSTAR,true);assert.equal(p.deck.cards.length,before-1);assert.throws(()=>M.apply(m,{type:'ability',player:p.id,name:'Star Alchemy',target:{player:R.PlayerType.BOTTOM_PLAYER,slot:R.SlotType.ACTIVE,index:0}}));}powers.push({name:'Star Alchemy',blocked,passed:true});}catch(e){failures.push({name:'Star Alchemy',blocked,error:e.message||String(e),stack:e.stack});}}
const report={passed:!failures.length,engineSha256:engineShaAtStart,tools:results,powers,failures};fs.writeFileSync(path.join(root,'work/rules-research/swsh-tool-attacks.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(failures.length)process.exitCode=1;
`;
vm.runInNewContext(prefix+helpers+body,{require,__dirname,console,setTimeout,clearTimeout,process});
