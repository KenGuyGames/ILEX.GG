 let realPlan=null;
 function publicPosition(m,id){
  const g=m.store.state,zone=l=>({count:l.cards.length,isPublic:l.isPublic,cards:l.isPublic?l.cards:undefined});
  return JSON.stringify([m.spec.profile,m.spec.seed,id,g.phase,g.turn,g.activePlayer,g.players.map(p=>({...p,gameStats:undefined,deck:zone(p.deck),hand:p.id===id?p.hand:zone(p.hand),prizes:p.prizes.map(zone)}))],(k,v)=>k==='__uniqueId'||k==='gameStats'?undefined:v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(key=>[key,v[key]])):v);
 }
 function realisticChoose(m,id){
  const original=recent(m);if(original.length>250)return {type:'pass',player:id};
  const root=fork(m,id);root.journal=copy(original);root._botKeepHistory=true;root._botTournament=true;
  const position=publicPosition(root,id),cached=realPlan?.steps.find(x=>x.before===position);
  if(cached&&trial(root,id,cached.action,'realistic')){realisticLast={...realPlan.diagnostics,trials:1,cacheReuse:true,action:cached.action,plannedActions:cached.remaining};return copy(cached.action);}
  realPlan=null;
  const turn=root.store.state.activePlayer,budget=420,reserve=200,searchLimit=budget-reserve;let trials=0,maxDepth=0,replies=0,samples=1,inferredAttachments=0,returnAttacks=0;
  const cache=new WeakMap(),evaluate=f=>{if(!cache.has(f))cache.set(f,realisticScore(f,id));return cache.get(f);},base=evaluate(root);
  const utility=f=>f.store.state.phase===R.GamePhase.FINISHED?(f.store.state.winner===R.GameWinner.DRAW?0:f.store.state.players[f.store.state.winner]?.id===id?12000:-12000):Math.max(-9000,Math.min(9000,evaluate(f)-base));
  const done=f=>f.store.state.phase===R.GamePhase.FINISHED||f.store.state.activePlayer!==turn||RulesMatch.pending(f).length>0;
  const ended=f=>f.store.state.phase===R.GamePhase.FINISHED||f.store.state.activePlayer!==turn;
  function family(f,a){if(a.type!=='play')return a.type;const c=actor(f,id).hand.cards[a.index];return c?.superType===R.SuperType.POKEMON?(c.stage===R.Stage.BASIC?'basic':'evolution'):c?.superType===R.SuperType.ENERGY?'energy':c?.trainerType===R.TrainerType.SUPPORTER?'supporter':c?.trainerType===R.TrainerType.TOOL?'tool':'item';}
  function pick(f,n){
   const p=actor(f,id),seen=new Set(),groups=new Map(),ends=[];
   const ordered=candidates(f,id).map(x=>{let priority=x.priority;const c=x.action.type==='play'?p.hand.cards[x.action.index]:null;if(c)priority+=realisticCardValue(f,p,c)*.4;
    if(c?.superType===R.SuperType.ENERGY){const l=x.action.target?.slot===R.SlotType.ACTIVE?p.active:p.bench[x.action.target?.index];if(l?.getPokemonCard()&&c.provides?.length){const before=realEnergy(f,p,l),after=before.concat({card:c,provides:c.provides}),gain=Math.max(0,...realAttacks(f,p,l).map(a=>{const old=realMissing(before,a.cost),next=realMissing(after,a.cost),target=f.store.state.players.find(x=>x!==p).active,hp=realHp(target),boost=Math.max(0,Math.min(hp,realDamage(f,l,target,a.attack,after))-Math.min(hp,realDamage(f,l,target,a.attack,before)));return Math.max(old>next?25+(next===0?50:0):0,boost*.75);}));priority+=gain||-12;}}
    return {...x,priority};}).sort((a,b)=>b.priority-a.priority);
   for(const x of ordered){const c=x.action.type==='play'?p.hand.cards[x.action.index]:null,key=c?JSON.stringify({...x.action,index:c.fullName}):JSON.stringify(x.action);if(seen.has(key))continue;seen.add(key);
    if(['attack','pass'].includes(x.action.type)){ends.push(x);continue;}const k=family(f,x.action),g=groups.get(k)||[];g.push(x);groups.set(k,g);}
   const out=[];while(out.length<n&&groups.size){for(const [k,g]of groups){out.push(g.shift());if(!g.length)groups.delete(k);if(out.length>=n)break;}}
   return [...ends,...out];
  }
  function key(f){return hash(JSON.stringify([publicPosition(f,id),actor(f,id).deck.cards.map(c=>c.id),f.randomState]));}
  const visited=new Map(),leaves=[];
  function expand(parent,item,depth){
   if(trials>=searchLimit)return null;trials++;const f=trial(parent.f,id,item.action,'realistic');if(!f)return null;
   const value=evaluate(f)-base,k=key(f),seen=visited.get(k);if(seen!==undefined&&seen>=value)return null;visited.set(k,value);
   const row={f,prev:parent,action:item.action,first:parent.first||item.action,sequence:[...(parent.sequence||[]),item.action],depth,value:value-depth*.12,ended:done(f)};maxDepth=Math.max(maxDepth,depth);leaves.push(row);return row;
  }
  let beam=[];for(const item of pick(root,levels.realistic.candidates)){const row=expand({f:root},item,1);if(row&&!row.ended)beam.push(row);}
  beam.sort((a,b)=>b.value-a.value);beam=beam.slice(0,3);
  for(let depth=2;depth<=10&&beam.length&&trials<searchLimit;depth++){
   const next=[];for(const node of beam)for(const item of pick(node.f,7)){const row=expand(node,item,depth);if(row&&!row.ended)next.push(row);}next.sort((a,b)=>b.value-a.value);beam=next.slice(0,3);
  }
  // Stress-test a completed turn using actual engine-resolved visible replies.
  // Unknown hands/decks remain neutral: this is not access to the opponent list.
  function response(position,limit=22){
   let start=position;if(start.store.state.phase===R.GamePhase.FINISHED)return utility(start);
   if(!ended(start)&&trials<budget){trials++;start=trial(start,id,{type:'pass',player:id},'realistic')||start;}
   if(!ended(start)||RulesMatch.pending(start).length)return utility(start);
   if(start.store.state.phase===R.GamePhase.FINISHED)return utility(start);
   const op=start.store.state.players[start.store.state.activePlayer];if(op.id===id)return utility(start);
   let worst=utility(start),frontier=[start];const stop=Math.min(budget,trials+limit),endings=[];
   for(let depth=0;depth<2&&frontier.length&&trials<stop;depth++){
    const next=[];for(const f of frontier){const all=candidates(f,op.id),options=all.filter(x=>['attack','retreat','ability'].includes(x.action.type)).slice(0,9).concat(all.filter(x=>x.action.type==='pass'));
     for(const x of options){if(trials>=stop)break;trials++;replies++;const r=trial(f,op.id,x.action,'realistic');if(!r)continue;const value=utility(r);if(r.store.state.phase===R.GamePhase.FINISHED||r.store.state.activePlayer!==start.store.state.activePlayer)endings.push({f:r,value});else if(!RulesMatch.pending(r).length)next.push({f:r,value});}}
    next.sort((a,b)=>a.value-b.value);frontier=next.slice(0,2).map(x=>x.f);
   }
   // Consider the return attack too: an efficient Prize trade must not be
   // rejected merely because the first attacker can be Knocked Out.
   endings.sort((a,b)=>a.value-b.value);for(const row of endings.slice(0,2)){let value=row.value;const g=row.f.store.state;if(g.phase!==R.GamePhase.FINISHED&&g.players[g.activePlayer]?.id===id&&!RulesMatch.pending(row.f).length){let best=value;for(const x of candidates(row.f,id).filter(x=>x.action.type==='attack').slice(0,2)){if(trials>=budget)break;trials++;returnAttacks++;const r=trial(row.f,id,x.action,'realistic');if(r)best=Math.max(best,utility(r));}value+=Math.max(0,best-value)*.5;}worst=Math.min(worst,value);}
   // A plausible one-Energy reply is inferred from visible attack costs and
   // public hand size, never from concealed card identities or the deck list.
   // Discount this hypothetical line; guaranteed visible replies remain worst-case.
   if(!op.hand.isPublic&&op.hand.cards.length&&trials+4<budget){
    const targets=[{list:op.active,index:-1},...op.bench.map((list,index)=>({list,index}))].filter(x=>x.list.getPokemonCard());
    const options=targets.flatMap(x=>realAttacks(start,op,x.list).filter(a=>a.missing===1).map(a=>({...x,...a,damage:realDamage(start,x.list,actor(start,id).active,a.attack)}))).sort((a,b)=>b.damage-a.damage).slice(0,2);
    for(const option of options){if(trials+4>=budget)break;const map=realEnergy(start,op,option.list),types=[...new Set(option.cost.filter(t=>![R.CardType.NONE,R.CardType.ANY].includes(t)))],type=types.find(t=>realMissing(map.concat({provides:[t]}),option.cost)===0);if(type===undefined)continue;
     const world=fork(start,op.id),enemy=actor(world,op.id),card=new R.EnergyCard();card.id=enemy.hand.cards[0].id;card.name=card.fullName='Inferred Basic Energy';card.provides=[type];enemy.hand.cards[0]=card;
     trials++;replies++;const target={player:R.PlayerType.BOTTOM_PLAYER,slot:option.index<0?R.SlotType.ACTIVE:R.SlotType.BENCH,index:Math.max(0,option.index)};let f=trial(world,op.id,{type:'play',player:op.id,index:0,target},'realistic');if(!f)continue;inferredAttachments++;
     if(option.index>=0&&!option.attack.useOnBench){trials++;replies++;f=trial(f,op.id,{type:'retreat',player:op.id,index:option.index},'realistic');if(!f)continue;}
     trials++;replies++;const r=trial(f,op.id,{type:'attack',player:op.id,name:option.attack.name,target:option.attack.useOnBench?target:undefined},'realistic');if(r){const before=utility(start),after=utility(r);worst=Math.min(worst,before+(after-before)*.55);}
    }
   }return worst;
  }
  const firsts=new Map();for(const row of leaves){const k=JSON.stringify(row.first),previous=firsts.get(k);if(!previous||row.value>previous.value)firsts.set(k,row);}
  const ranked=[...firsts.values()].sort((a,b)=>b.value-a.value);
  // Compare whole planned lines in independent concealed worlds, not a deep
  // winning line against a one-action alternate. One lucky draw cannot dominate.
  const shortlist=ranked.slice(0,2),immediate=ranked.find(x=>x.first.type==='attack')||ranked.find(x=>x.first.type==='pass');if(immediate&&!shortlist.includes(immediate))shortlist.push(immediate);else if(ranked[2])shortlist.push(ranked[2]);
  const reviewed=[];for(const row of shortlist){
   if(trials>=budget)break;const mainReply=response(row.f,16);let total=mainReply,count=1,worst=mainReply;
   const chain=[];for(let node=row;node.prev;node=node.prev)chain.unshift(node);
   if(trials+row.sequence.length<budget-20){const a=fork(m,id,0x45d9f3b);a.journal=copy(original);a._botKeepHistory=true;a._botTournament=true;let f=a;
    for(const node of chain){if(trials>=budget-16)break;let action=node.action;if(action.type==='play'){const name=actor(node.prev.f,id).hand.cards[action.index]?.fullName,index=actor(f,id).hand.cards.findIndex(c=>c.fullName===name);if(index<0)break;action={...action,index};}trials++;const next=trial(f,id,action,'realistic');if(!next)break;f=next;if(done(f)||f._botInformationChanged)break;}
    // Replan after new information rather than following hand indexes belonging
    // to a different sampled draw. This is a small adaptive continuation search.
    if(!done(f)&&trials<budget-12){let beam=[f],best=f;for(let depth=0;depth<2&&beam.length;depth++){const next=[];for(const parent of beam)for(const x of pick(parent,3)){if(trials>=budget-12)break;trials++;const n=trial(parent,id,x.action,'realistic');if(n){if(utility(n)>utility(best))best=n;if(!done(n))next.push(n);}}next.sort((a,b)=>utility(b)-utility(a));beam=next.slice(0,2);}f=best;}
    const value=response(f,12);total+=value;worst=Math.min(worst,value);count++;samples++;
   }
   row.value=total/count*.8+worst*.2-(!ended(row.f)||row.sequence.at(-1)?.type==='pass'?35:0)-row.depth*.12;if(mainReply<=-11999&&worst<=-11999)row.value=-12000;reviewed.push(row);
  }
  // Unreviewed optimistic candidates must not bypass the stress-tested leaders.
  reviewed.sort((a,b)=>b.value-a.value);const best=reviewed[0]||ranked[0];
  realisticLast={version:2,trials,budget,depth:maxDepth,cacheReuse:false,opponentReplies:replies,returnAttacks,inferredAttachments,concealedSamples:samples,alternatives:ranked.length,plannedActions:best?.sequence.length||0,plan:best?.sequence.map(a=>({type:a.type,name:a.name})),action:best?.first||{type:'pass',player:id},expectedGain:best?.value||0};
  if(best&&ended(best.f)){const chain=[];for(let node=best;node.prev;node=node.prev)chain.unshift(node);const steps=[];for(const [i,node]of chain.entries()){steps.push({before:publicPosition(node.prev.f,id),action:copy(node.action),remaining:chain.length-i});if(node.f._botInformationChanged)break;}realPlan={diagnostics:copy(realisticLast),steps};}
  return realisticLast.action;
 }
