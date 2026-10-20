/* Local opponent. Every committed action and prompt uses RulesMatch validation. */
var BotAI=(()=>{
 const R=RulesMatch.R;
 const levels={easy:{label:'Easy',candidates:18,lookahead:0},normal:{label:'Normal',candidates:40,lookahead:0},hard:{label:'Hard',candidates:64,lookahead:3},realistic:{label:'Realistic Player',candidates:56,lookahead:3}};
 const decks=[
  {id:'bot-forest',name:'Forest starter · Venusaur',format:'wotc-base-fossil',cards:{'base1-44':4,'base1-30':3,'base1-15':2,'base1-45':4,'base1-54':3,'base2-33':2,'base2-10':2,'base1-91':4,'base1-88':3,'base1-94':3,'base1-95':3,'base1-93':2,'base1-92':2,'base1-99':23}},
  {id:'bot-fire',name:'Fire starter · Charizard',format:'wotc-base-fossil',cards:{'base1-46':4,'base1-24':3,'base1-4':2,'base1-68':4,'base1-12':3,'base1-60':2,'base1-36':2,'base1-91':4,'base1-88':3,'base1-94':3,'base1-95':3,'base1-93':2,'base1-92':2,'base1-98':23}},
  {id:'bot-water',name:'Water starter · Blastoise',format:'wotc-base-fossil',cards:{'base1-63':4,'base1-42':3,'base1-2':2,'base1-59':4,'base1-38':3,'base1-13':2,'base3-10':2,'base1-91':4,'base1-88':3,'base1-94':3,'base1-95':3,'base1-93':2,'base1-92':2,'base1-102':23}}
 ];
 const rng=seed=>()=>{seed=(seed+0x6D2B79F5)>>>0;let t=seed;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
 const hash=s=>{let n=2166136261;for(const c of String(s))n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;};
 function copy(value,seen=new WeakMap()){
  if(value===null||typeof value!=='object')return value;if(seen.has(value))return seen.get(value);
  const result=Array.isArray(value)?[]:value instanceof Map?new Map():value instanceof Set?new Set():Object.create(Object.getPrototypeOf(value));seen.set(value,result);
  if(value instanceof Map){for(const [k,v] of value)result.set(copy(k,seen),copy(v,seen));}
  else if(value instanceof Set){for(const v of value)result.add(copy(v,seen));}
  else for(const k of Object.keys(value))result[k]=copy(value[k],seen);return result;
 }
 const actor=(m,id)=>m.store.state.players.find(p=>p.id===id);
 function unknown(card,index){
  /* A neutral forecast mix, independent of the actual concealed card. These
     placeholders exist only in disposable trials, never in the live match. */
  const kind=index%4,c=kind<2?new R.EnergyCard():kind===2?new R.TrainerCard():new R.PokemonCard();
  c.id=card.id;c.name=c.fullName=kind<2?'Unknown Energy':kind===2?'Unknown Trainer':'Unknown Pokémon';
  if(kind<2)c.provides=[R.CardType.COLORLESS];else if(kind===3){c.hp=60;c.stage=R.Stage.BASIC;c.cardType=[R.CardType.COLORLESS];}return c;
 }
 const prizeCount=p=>p.prizes.filter(l=>l.cards.length).length;
 const energyMap=list=>list.cards.filter(c=>c.superType===R.SuperType.ENERGY||c.provides?.length).map(card=>({card,provides:card.provides||card.cardType||[]}));
 const readyDamage=list=>{const c=list.getPokemonCard();if(!c)return 0;return Math.max(0,...c.attacks.filter(a=>R.StateUtils.checkEnoughEnergy(energyMap(list),a.cost)).map(a=>Number(a.damage)||0));};
 const pokemonValue=list=>{const c=list.getPokemonCard();return c?Math.max(0,((Number.isFinite(c.hp)?c.hp:50)+list.hpBonus-list.damage))*.12+readyDamage(list)*1.7+Math.max(0,...c.attacks.map(a=>Number(a.damage)||0))*.25-list.specialConditions.length*18:0;};
 function cardValue(c,p){
  if(c.superType===R.SuperType.ENERGY)return p.hand.cards.filter(x=>x.superType===R.SuperType.ENERGY).length<3?22:6;
  if(c.superType===R.SuperType.POKEMON){const basic=c.stage===R.Stage.BASIC;return 15+(c.hp||0)*.1+(basic&&!p.bench.some(l=>l.getPokemonCard())?25:0)+(!basic&&[p.active,...p.bench].some(l=>l.getPokemonCard()?.name===c.evolvesFrom)?35:0);}
  return /bill|professor|draw|search|ball/i.test(c.name+' '+c.text)?30:/potion|heal/i.test(c.name)?12:20;
 }
 function visibleSeed(m,id){const p=actor(m,id),op=m.store.state.players.find(x=>x!==p);return hash([m.spec.seed,m.store.state.turn,id,p.hand.cards.map(c=>c.fullName).join(','),[p,op].flatMap(x=>[x.active,...x.bench].map(l=>l.isSecret?'hidden':l.cards.map(c=>c.fullName).join(',')+':'+l.damage)).join('|')].join('|'));}
 function fork(m,id,salt=m._botForecastSalt||0){
  const store=new R.Store({gameSettings:{format:RulesMatch.profiles[m.spec.profile].format},onStateChange:s=>{store.state=s}});store.state=copy(m.store.state);store.state.prompts=[];store.state.logs=store.state.logs.slice(-15);
  const random=rng(visibleSeed(m,id)^0x6f49ac31^salt);
  /* Own unseen deck and prizes form one unknown pool. Trial draws cannot peek at
     real deck order or prize identities. Opponent hidden identities are never scored. */
  const p=store.state.players.find(x=>x.id===id),unseen=[...p.deck.cards,...p.prizes.filter(l=>!l.isPublic).flatMap(l=>l.cards)].sort((a,b)=>a.fullName.localeCompare(b.fullName));
  for(let i=unseen.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[unseen[i],unseen[j]]=[unseen[j],unseen[i]];}
  let at=p.deck.cards.length;p.deck.cards=unseen.slice(0,at);for(const prize of p.prizes){if(prize.isPublic)continue;const n=prize.cards.length;prize.cards=unseen.slice(at,at+n);at+=n;}
  const opponent=store.state.players.find(x=>x!==p);
  for(const slot of [opponent.active,...opponent.bench])if(slot.isSecret&&slot.getPokemonCard()?._wotcConcealedCard){const hidden=new R.PokemonCard();hidden.id=slot.getPokemonCard().id;hidden.name='Unknown Pokémon';hidden.fullName='Unknown Pokémon';hidden.hp=60;hidden.stage=R.Stage.BASIC;hidden.cardType=[R.CardType.COLORLESS];slot.getPokemonCard()._wotcConcealedCard=hidden;}
  if(!opponent.hand.isPublic)opponent.hand.cards=opponent.hand.cards.map(unknown);
  if(!opponent.deck.isPublic)opponent.deck.cards=opponent.deck.cards.map(unknown);
  for(const prize of opponent.prizes)if(!prize.isPublic)prize.cards=prize.cards.map(unknown);
  return {store,spec:m.spec,journal:m._botKeepHistory?copy(m.journal):[],randomState:visibleSeed(m,id)^0x182b84f5^salt,_botForecastSalt:salt,_botKeepHistory:!!m._botKeepHistory};
 }
 function valid(m,p,value){try{const decoded=p.decode(value,m.store.state);return p.validate(decoded,m.store.state);}catch{return false;}}
 function subsets(items,min,max,accept,limit=4000){
  let attempts=0,answer;const visit=(start,chosen,n)=>{if(answer!==undefined||attempts>=limit)return;if(chosen.length===n){attempts++;if(accept(chosen))answer=chosen.slice();return;}for(let i=start;i<=items.length-(n-chosen.length);i++){chosen.push(items[i]);visit(i+1,chosen,n);chosen.pop();if(answer!==undefined||attempts>=limit)break;}};
  for(let n=min;n<=Math.min(max,items.length);n++){visit(0,[],n);if(answer!==undefined||attempts>=limit)break;}return answer;
 }
 function targets(m,p){return RulesMatch.targets(m,p).filter(x=>!(p.options?.blocked||[]).some(b=>JSON.stringify(b)===JSON.stringify(x.target)));}
 function prompt(m,p,difficulty='normal'){
  if(difficulty==='realistic'){const selected=realisticPrompt(m,p);if(selected)return selected;}
  const g=m.store.state,owner=actor(m,p.getPerspectivePlayerId?.()??p.playerId),random=rng(visibleSeed(m,owner.id)^p.id^(m._botForecastSalt||0)),out=value=>valid(m,p,value)?{type:'prompt',id:p.id,value}:null;
  if(p.type==='Coin flip')return out(random()>=.5);
  if(p.type==='Confirm')return out(true)||out(false);
  if(['Alert','WaitPrompt','Show cards','Confirm cards','ShowMulligan','Show mulligan'].includes(p.type))return out(true);
  if(p.type.startsWith('Shuffle')){const n=p.type==='Shuffle hand'?owner.hand.cards.length:owner.deck.cards.length,a=Array.from({length:n},(_,i)=>i);for(let i=n-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return out(a);}
  if(p.type==='Choose cards'){
   const eligible=p.cards.cards.map((c,i)=>({c,i})).filter(x=>!p.options.blocked.includes(x.i)&&R.matchesPromptFilter(x.c,p.filter));
   const payment=p.energyPayment;if(payment){const colored=payment.requirements.filter(t=>t!==R.CardType.COLORLESS);if(!payment.requirements.includes(R.CardType.COLORLESS))for(let i=eligible.length-1;i>=0;i--){const entry=payment.entries.find(e=>e.card===eligible[i].c);if(!entry||!colored.some(t=>R.StateUtils.providesMatchesType(entry.provides,t)))eligible.splice(i,1);}}const discard=/DISCARD|PUT.*BOTTOM|PUT.*BACK|RETURN.*DECK/.test(String(p.message));
   eligible.sort((a,b)=>difficulty==='easy'?hash(a.c.fullName+p.id)-hash(b.c.fullName+p.id):(discard?-1:1)*(cardValue(b.c,owner)-cardValue(a.c,owner)));
   const max=p.options.max??eligible.length,min=p.options.min??0;
   const desired=p.options._ilexAttackPayment?Math.min(max,eligible.length):payment?Math.min(payment.requirements.length,max,eligible.length):/BENCH|SEARCH|DRAW|HAND|RECOVER/.test(String(p.message))&&!discard?Math.min(max,eligible.length):min;
   const indexes=eligible.map(x=>x.i),value=subsets(indexes,desired,desired,v=>valid(m,p,v),500)||subsets(indexes,min,max,v=>valid(m,p,v));return value===undefined?(p.options.allowCancel?out(null):null):out(value);
  }
  if(p.type==='Choose energy'){const indexes=p.energy.map((e,i)=>i).sort((a,b)=>(p.energy[a].provides.length-p.energy[b].provides.length));const value=subsets(indexes,0,indexes.length,v=>valid(m,p,v),12000);return value===undefined?(p.options.allowCancel?out(null):null):out(value);}
  if(p.type==='Choose pokemon'){
   const list=targets(m,p),harm=/DAMAGE|DISCARD|PICK_UP/.test(String(p.message));list.sort((a,b)=>{
    const score=x=>(x.target.player===R.PlayerType.BOTTOM_PLAYER?1:-1)*(harm?-1:1)*pokemonValue(x.list);return score(b)-score(a);
   });const value=subsets(list.map(x=>x.target),p.options.min??1,p.options.max??1,v=>valid(m,p,v));return value===undefined?(p.options.allowCancel?out(null):null):out(value);
  }
  if(p.type==='Choose prize'){const prizeOwner=p.options.useOpponentPrizes?g.players.find(x=>x!==owner):owner,indexes=prizeOwner.prizes.filter(list=>list.cards.length).map((list,i)=>i).filter(i=>!p.options.blocked.includes(i));const value=subsets(indexes,0,indexes.length,v=>valid(m,p,v));return value===undefined?null:out(value);}
  if(p.type==='Choose attack'){const choices=p.cards.flatMap((c,index)=>c.attacks.map(a=>({index,attack:a.name,damage:Number(a.damage)||0}))).sort((a,b)=>b.damage-a.damage);for(const c of choices){const a=out({index:c.index,attack:c.attack});if(a)return a;}}
  if(['Select','SelectOption'].includes(p.type)){const indexes=p.values.map((v,i)=>i).filter(i=>!p.options.disabled?.[i]);if(p.values.length===3&&['Rock','Paper','Scissors'].every(v=>p.values.includes(v))){indexes.sort((a,b)=>hash(String(m.spec?.seed)+':rps:'+p.playerId+':'+p.id+':'+a)-hash(String(m.spec?.seed)+':rps:'+p.playerId+':'+p.id+':'+b));for(const i of indexes){const action=out(i);if(action)return action;}return null;}if(p.options.isBlindGuess){indexes.sort((a,b)=>hash(String(m.spec?.seed)+':blind:'+p.id+':'+a)-hash(String(m.spec?.seed)+':blind:'+p.id+':'+b));for(const i of indexes){const action=out(i);if(action)return action;}return null;}const types=owner.hand.cards.filter(c=>c.superType===R.SuperType.ENERGY).flatMap(c=>(c.provides||[]).map(t=>R.CardType[t]?.toLowerCase()));indexes.sort((a,b)=>Number(types.includes(String(p.values[b]).toLowerCase()))-Number(types.includes(String(p.values[a]).toLowerCase())));for(const i of indexes){const a=out(i);if(a)return a;}}
  if(p.type==='Order cards')return out(p.cards.cards.map((c,i)=>({c,i})).sort((a,b)=>cardValue(b.c,owner)-cardValue(a.c,owner)).map(x=>x.i));
  if(['Attach energy','Move energy','Discard energy'].includes(p.type)){
   const ts=targets(m,p),rows=p.type==='Attach energy'?p.cardList.cards.map((card,index)=>({card,index})).filter(x=>x.card.superType===R.SuperType.ENERGY&&!p.options.blocked.includes(x.index)&&R.matchesPromptFilter(x.card,p.filter)&&(!p.options.validCardTypes||x.card.provides.some(t=>p.options.validCardTypes.includes(t)))):RulesMatch.targets(m,p).flatMap(x=>x.list.cards.map((card,index)=>({card,index,from:x.target}))).filter(x=>x.card.superType===R.SuperType.ENERGY&&R.matchesPromptFilter(x.card,p.filter));
   const destinationValue=x=>(x.list===owner.active?100:25)+Math.max(0,...(x.list.getPokemonCard()?.attacks||[]).map(a=>Number(a.damage)||0))*.2-energyMap(x.list).length*8;
   ts.sort((a,b)=>destinationValue(b)-destinationValue(a));
   const choices=rows.map(row=>p.type==='Discard energy'?{from:row.from,index:row.index}:p.type==='Attach energy'?{to:ts[0]?.target,index:row.index}:{from:row.from,to:ts.find(x=>JSON.stringify(x.target)!==JSON.stringify(row.from))?.target,index:row.index}).filter(x=>p.type==='Discard energy'||x.to);
   const max=p.options.count??p.options.max??choices.length,minimum=p.options.count??p.options.min??0;
   const need=ts[0]?Math.max(1,Math.max(0,...ts[0].list.getPokemonCard().attacks.map(a=>a.cost.length))+2-energyMap(ts[0].list).length):1;
   const wanted=p.options.count??Math.min(max,choices.length,Math.max(minimum,p.type==='Attach energy'?need:1));
   let value=subsets(choices,wanted,wanted,v=>valid(m,p,v),500);
   if(value===undefined&&p.type==='Attach energy'&&p.options.differentTargets&&ts.length){
    const eligible=choices.filter(x=>!p.options.validCardTypes||p.cardList.cards[x.index].provides.some(t=>p.options.validCardTypes.includes(t)));
    for(let offset=0;offset<ts.length;offset++){const distributed=eligible.map((x,i)=>({...x,to:ts[(i+offset)%ts.length].target})),count=Math.min(wanted,eligible.length,ts.length);value=subsets(distributed,count,count,v=>valid(m,p,v),500);if(value!==undefined)break;}
   }
   if(value===undefined)value=subsets(choices,minimum,max,v=>valid(m,p,v),500);
   if(value===undefined)for(const t of ts){const alt=choices.map(x=>p.type==='Discard energy'?x:{...x,to:t.target});value=subsets(alt,wanted,max,v=>valid(m,p,v),200);if(value!==undefined)break;}
   return value===undefined?(p.options.allowCancel?out(null):null):out(value);
  }
  if(p.type==='Put damage'){
   const ts=targets(m,p).sort((a,b)=>(b.target.player===R.PlayerType.TOP_PLAYER)-(a.target.player===R.PlayerType.TOP_PLAYER)||((a.list.hp||0)-a.list.damage)-((b.list.hp||0)-b.list.damage));
   for(const x of ts){const a=out([{target:x.target,damage:p.damage}]);if(a)return a;}
   const step=p.options.damageMultiple||10,assigned=[];let left=p.damage;for(const x of ts){const damage=Math.min(left,Math.max(step,Math.ceil(((x.list.hp||0)-x.list.damage)/step)*step));assigned.push({target:x.target,damage});left-=damage;if(left<=0)break;}if(left===0){const a=out(assigned);if(a)return a;}
  }
  if(p.type==='Move damage'||p.type==='Remove damage'){
   const ts=RulesMatch.targets(m,p),key=t=>JSON.stringify(t),blocked=(target,rows)=>(rows||[]).some(t=>key(t)===key(target)),damage=new Map(ts.map(x=>[key(x.target),x.list.damage])),caps=new Map((p.maxAllowedDamage||[]).map(x=>[key(x.target),x.damage]));
   const sources=ts.filter(x=>x.list.damage>0&&!blocked(x.target,p.options.blockedFrom)).sort((a,b)=>b.list.damage-a.list.damage),destinations=ts.filter(x=>!blocked(x.target,p.options.blockedTo)).sort((a,b)=>Number(b.target.player===R.PlayerType.TOP_PLAYER)-Number(a.target.player===R.PlayerType.TOP_PLAYER));
   const moves=[],max=p.options.max??sources.reduce((n,x)=>n+Math.floor(x.list.damage/10),0);let chosenSource,chosenDestination;
   for(const from of sources){if(p.options.singleSourceTarget&&chosenSource&&chosenSource!==key(from.target))continue;while(damage.get(key(from.target))>=10&&moves.length<max){const to=destinations.find(x=>key(x.target)!==key(from.target)&&(!(p.options.singleDestinationTarget||p.options.sameTarget)||!chosenDestination||chosenDestination===key(x.target))&&(!caps.has(key(x.target))||damage.get(key(x.target))+10<=caps.get(key(x.target))));if(!to)break;moves.push({from:from.target,to:to.target});chosenSource=key(from.target);chosenDestination=key(to.target);damage.set(chosenSource,damage.get(chosenSource)-10);damage.set(chosenDestination,damage.get(chosenDestination)+10);}}
   const full=out(moves);if(full)return full;for(let n=p.options.min??0;n<moves.length;n++){const a=out(moves.slice(0,n));if(a)return a;}return p.options.allowCancel?out(null):null;
  }
  if(p.type==='Remove damage'){
   const ts=RulesMatch.targets(m,p),moves=[];for(const from of ts.filter(x=>x.list.damage>0)){const to=ts.find(x=>JSON.stringify(x.target)!==JSON.stringify(from.target));if(!to)continue;for(let i=0;i<from.list.damage/10;i++)moves.push({from:from.target,to:to.target});}
   const full=out(moves);if(full)return full;
   const value=subsets(moves,0,Math.min(moves.length,p.options?.max??moves.length),v=>valid(m,p,v),200);if(value!==undefined)return out(value);
  }
  return p.options?.allowCancel?out(null):null;
 }
 function score(m,id){
  const g=m.store.state,p=actor(m,id),op=g.players.find(x=>x!==p);if(g.phase===R.GamePhase.FINISHED)return g.players[g.winner]?.id===id?100000:-100000;
  let value=(prizeCount(op)-prizeCount(p))*1000+pokemonValue(p.active)+p.bench.reduce((n,l)=>n+(l.getPokemonCard()?7+pokemonValue(l)*.25:0),0);
  const opposingHp=op.active.getPokemonCard()?.hp||0;
  value-=Math.max(0,(Number.isFinite(opposingHp)?opposingHp:60)+op.active.hpBonus-op.active.damage)*.45;
  value+=op.active.specialConditions.length*12+Math.min(p.hand.cards.length,12)*3+Math.min(p.deck.cards.length,15)*.3;
  if(p.deck.cards.length<5)value-=(5-p.deck.cards.length)*30;
  for(const list of [p.active,...p.bench]){const c=list.getPokemonCard();if(!c)continue;const n=energyMap(list).reduce((n,e)=>n+R.StateUtils.getProvidesUnitCount(e.provides,e),0),max=Math.max(0,...c.attacks.map(a=>a.cost.length));value+=Math.min(n,max+1)*7-Math.max(0,n-max-1)*5;}
  return value;
 }
 function recent(m){let at=m.journal.length-1;for(;at>=0;at--)if(['attack','pass'].includes(m.journal[at].type))break;return m.journal.slice(at+1);}
 function candidates(m,id){
  const p=actor(m,id),g=m.store.state,history=recent(m),moves=[],add=(action,priority)=>moves.push({action,priority});
  const slots=[{list:p.active,target:{player:R.PlayerType.BOTTOM_PLAYER,slot:R.SlotType.ACTIVE,index:0}},...p.bench.map((list,index)=>({list,target:{player:R.PlayerType.BOTTOM_PLAYER,slot:R.SlotType.BENCH,index}}))];
  for(const slot of [R.SlotType.HAND,R.SlotType.DISCARD]){const zone=slot===R.SlotType.HAND?p.hand:p.discard;zone.cards.forEach((c,index)=>{for(const action of RulesMatch.zoneAbilities(m,p,slot,index))add(action,45);});}
  p.hand.cards.forEach((c,index)=>{
   const holon=RulesMatch.handEnergyAction(p,index);if(holon&&p.energyPlayedTurn!==g.turn)add(holon,60);
   if(c.trainerType===R.TrainerType.SUPPORTER&&(p.supporter.cards.length||p.supporterTurn>0))return;
   if(c.superType===R.SuperType.POKEMON){for(const s of slots)if(c.stage===R.Stage.BASIC||c._hgssLegend?!s.list.getPokemonCard()&&(!c._hgssLegend||s.target.slot===R.SlotType.BENCH):s.list.getPokemonCard()&&(s.list.getPokemonCard().name===c.evolvesFrom||!c.evolvesFrom||s.list.getPokemonCard()._svRainbowDna&&c.evolvesFrom==='Eevee'&&c.stage===R.Stage.STAGE_1&&c.tags.includes(R.CardTag.POKEMON_ex)&&c.regulationMark))add({type:'play',player:id,index,target:s.target},c.stage===R.Stage.BASIC?35:55);}
   else if(c.superType===R.SuperType.ENERGY||c.trainerType===R.TrainerType.TOOL){const owner=c.trainerType===R.TrainerType.TOOL&&c.attachesToOpponentsPokemon?g.players.find(x=>x!==p):p,side=owner===p?R.PlayerType.BOTTOM_PLAYER:R.PlayerType.TOP_PLAYER,targets=owner===p?slots:[{list:owner.active,target:{player:side,slot:R.SlotType.ACTIVE,index:0}},...owner.bench.map((list,index)=>({list,target:{player:side,slot:R.SlotType.BENCH,index}}))];for(const s of targets)if(s.list.getPokemonCard())add({type:'play',player:id,index,target:s.target},s.target.slot===R.SlotType.ACTIVE?60:20+readyDamage(s.list)*.1);}
   else {add({type:'play',player:id,index,target:slots[0].target},/bill|professor|draw|search|ball/i.test(c.name+' '+c.text)?50:30);if(/fossil|doll|substitute/i.test(c.name))for(const s of slots.slice(1).filter(s=>!s.list.getPokemonCard()))add({type:'play',player:id,index,target:s.target},35);}
  });
  for(const s of slots){const c=s.list.getPokemonCard();if(!c)continue;
   for(const a of (s.target.slot===R.SlotType.ACTIVE?RulesMatch.attacks(m,p):c.attacks.filter(a=>a.useOnBench)))add({type:'attack',player:id,name:a.name,target:s.target},65+(Number(a.damage)||0)*.1);
   for(const a of RulesMatch.powers(m,p,s.list).filter(a=>a.powerType!==R.PowerType.POKEBODY&&a.powerType!==R.PowerType.HOLONS_SPECIAL_ENERGY_EFFECT&&!a._wotcPassive))if(!history.some(h=>h.type==='ability'&&h.player===id&&h.name===a.name&&JSON.stringify(h.target)===JSON.stringify(s.target)))add({type:'ability',player:id,name:a.name,target:s.target},40);
  }
  if(!history.some(h=>h.type==='retreat'&&h.player===id))for(let index=0;index<p.bench.length;index++)if(p.bench[index].getPokemonCard())add({type:'retreat',player:id,index},readyDamage(p.bench[index])>readyDamage(p.active)?45:5);
  if(g.players.some(owner=>owner.stadium.cards.some(c=>c._wotcStadiumAction!==false))&&!history.some(h=>h.type==='stadium'&&h.player===id))add({type:'stadium',player:id},40);
  add({type:'pass',player:id},-100);return moves.sort((a,b)=>b.priority-a.priority);
 }
 function trial(m,id,action,difficulty){
  const f=fork(m,id);try{
   RulesMatch.apply(f,action);for(let n=0;n<45;n++){
    const pending=RulesMatch.pending(f);if(!pending.length)break;
    const p=pending.find(p=>['Coin flip','Shuffle deck','Shuffle hand','WaitPrompt'].includes(p.type))||pending.find(p=>p.playerId===id)||(difficulty==='realistic'?pending[0]:null);
    if(!p)break;const a=prompt(f,p,difficulty);if(!a)return null;RulesMatch.apply(f,a);
   }return f;
  }catch{return null;}
 }
 /* Realistic Player is a bounded, local policy inspired by tournament reports,
    not an imitation-trained model. All search runs on concealed forecasts. */
 let realisticLast={trials:0,depth:0};
 const realCache=new WeakMap();
 const realMemo=m=>{if(!realCache.has(m))realCache.set(m,{energy:new WeakMap(),attacks:new WeakMap(),cards:new WeakMap(),types:new WeakMap()});return realCache.get(m);};
 const realSlots=p=>[p.active,...p.bench].filter(l=>l.getPokemonCard()&&!l.isSecret);
 const realHp=l=>Math.max(0,(Number(l.getPokemonCard()?.hp)||60)+(l.hpBonus||0)-l.damage);
 const realPrize=l=>{const c=l.getPokemonCard();return c?.tags?.some(t=>[R.CardTag.POKEMON_EX,R.CardTag.POKEMON_ex,R.CardTag.POKEMON_GX,R.CardTag.LEGEND,R.CardTag.DUAL_LEGEND].includes(t))||c?._hgssLegend?2:1;};
 function realEnergy(m,p,list){
  const memo=realMemo(m).energy;if(memo.has(list))return memo.get(list);let map;try{const e=new R.CheckProvidedEnergyEffect(p,list);m.store.reduceEffect(m.store.state,e);map=e.energyMap;}catch{map=energyMap(list);}memo.set(list,map);return map;
 }
 function realMissing(map,cost){
  /* Match colored requirements before Colorless, retaining Rainbow choices. */
  let best=cost.length;const units=map.flatMap(e=>e.provides.map(t=>t));
  function visit(at,left,missing){if(missing>=best)return;if(at===cost.length){best=missing;return;}const type=cost[at];const choices=[...new Set(left.filter(t=>type===R.CardType.COLORLESS||t===type||t===R.CardType.ANY))];for(const t of choices){const next=left.slice();next.splice(next.indexOf(t),1);visit(at+1,next,missing);}visit(at+1,left,missing+1);}
  const ordered=cost.filter(t=>t!==R.CardType.COLORLESS).concat(cost.filter(t=>t===R.CardType.COLORLESS));cost=ordered;visit(0,units,0);return best;
 }
 function realAttacks(m,p,list){
  const memo=realMemo(m).attacks;if(memo.has(list))return memo.get(list);
  const map=realEnergy(m,p,list),card=list.getPokemonCard();if(!card)return [];
  const attacks=card.attacks.map(a=>{let cost=a.cost;try{const e=new R.CheckAttackCostEffect(p,a);m.store.reduceEffect(m.store.state,e);cost=e.cost;}catch{}return {attack:a,missing:realMissing(map,cost),cost};});memo.set(list,attacks);return attacks;
 }
 function realPrintedDamage(m,p,list,attack,planning=false){
  let damage=Number(attack.damage)||0;const text=attack.text||'',discard=p.discard.cards;
  if(attack.name==='Night March')return 20*Math.max(planning?2:0,discard.filter(c=>c.attacks?.some(a=>a.name==='Night March')).length);
  if(/Vengeance|Bee Revenge/.test(attack.name))return damage+10*discard.filter(c=>c.superType===R.SuperType.POKEMON).length;
  if(/Energy attached to both|Energy attached to this Pok[eé]mon and the Defending/i.test(text)){
   const opponent=m.store.state.players.find(x=>x!==p),units=realEnergy(m,p,list).reduce((n,e)=>n+R.StateUtils.getProvidesUnitCount(e.provides,e),0)+realEnergy(m,opponent,opponent.active).reduce((n,e)=>n+R.StateUtils.getProvidesUnitCount(e.provides,e),0);return Math.max(damage,20*units);
  }
  return damage;
 }
 function realDamage(m,attacker,target,attack){
  const owner=m.store.state.players.find(p=>realSlots(p).includes(attacker));let n=owner?realPrintedDamage(m,owner,attacker,attack):Number(attack.damage)||0,types=realMemo(m).types.get(attacker);if(!types){types=attacker.getPokemonCard()?.cardType||[];try{const e=new R.CheckPokemonTypeEffect(attacker);m.store.reduceEffect(m.store.state,e);types=e.cardTypes;}catch{}realMemo(m).types.set(attacker,types);}
  for(const w of target.getPokemonCard()?.weakness||[])if(types.includes(w.type))n=w.value===undefined?n*2:w.value<0?n:w.value===2?n*2:n+w.value;
  for(const r of target.getPokemonCard()?.resistance||[])if(types.includes(r.type))n+=r.value||-20;
  return Math.max(0,n);
 }
 function realisticCardValue(m,p,c){
  const slots=realSlots(p),cards=p.hand.cards,bench=p.bench.filter(l=>l.getPokemonCard()).length;
  if(c.superType===R.SuperType.ENERGY){const energy=cards.filter(x=>x.superType===R.SuperType.ENERGY).length;return 20+(energy<2?24:0)+(slots.some(l=>realAttacks(m,p,l).some(a=>a.missing===1))?12:0);}
  if(c.superType===R.SuperType.POKEMON){
   if(c.stage!==R.Stage.BASIC)return 12+(slots.some(l=>l.getPokemonCard()?.name===c.evolvesFrom)?85:0)+(cards.some(x=>x.name===c.evolvesFrom)?14:0);
   const useful=cards.some(x=>x.evolvesFrom===c.name),duplicate=slots.filter(l=>l.getPokemonCard()?.name===c.name).length,copies=m.spec.decks[m.store.state.players.indexOf(p)]?.cards[c._labId]||0;
   const synergy=c.attacks.some(a=>/Night March|Vengeance|Bee Revenge/.test(a.name)),support=c.tags?.includes(R.CardTag.POKEMON_EX)&&c.powers?.length&&Math.max(0,...c.attacks.map(a=>Number(a.damage)||0))<50;
   return 12+(bench===0?38:0)+(useful?28:0)+Math.min(20,(c.hp||60)*.1)+(c.powers?.length?12:0)+copies*6+(synergy?25:0)-(support?28:0)-duplicate*15-(bench>=3&&!useful?25:0);
  }
  const text=(c.name+' '+c.text).toLowerCase();let value=20;
  if(/draw|professor|colress|\bbill\b|\bn\b/.test(text))value+=cards.length<4?30:8;
  if(/search|ultra ball|computer search|rare candy/.test(text))value+=18;
  if(/lysandre|gust of wind|pokémon catcher|pokemon catcher/.test(text))value+=22+(prizeCount(p)<=2?18:0);
  if(/switch|float stone|escape rope/.test(text))value+=realHp(p.active)<50?18:4;
  if(/super rod|sacred ash|energy retrieval|vs seeker/.test(text))value+=p.discard.cards.length>8?14:0;
  return value;
 }
 function realisticPrompt(m,q){
  let owner=actor(m,q.getPerspectivePlayerId?.()??q.playerId);if(!owner)return null;m=fork(m,owner.id);owner=actor(m,owner.id);const out=v=>valid(m,q,v)?{type:'prompt',id:q.id,value:v}:null;
  if(q.type==='Choose prize'){
   const p=q.options.useOpponentPrizes?m.store.state.players.find(p=>p!==owner):owner;
   const choices=p.prizes.filter(l=>l.cards.length).map((l,i)=>({l,i})).filter(x=>!q.options.blocked.includes(x.i));
   /* Public prizes can be selected intelligently; concealed identities are ignored. */
   choices.sort((a,b)=>(b.l.isPublic?realisticCardValue(m,owner,b.l.cards[0]):0)-(a.l.isPublic?realisticCardValue(m,owner,a.l.cards[0]):0)||a.i-b.i);
   const value=subsets(choices.map(x=>x.i),0,choices.length,v=>valid(m,q,v));return value===undefined?null:out(value);
  }
  if(q.type==='Choose cards'||q.type==='Order cards'){
   const discard=/DISCARD|PUT.*BOTTOM|PUT.*BACK|RETURN.*DECK/.test(String(q.message));
   const rows=q.cards.cards.map((c,i)=>({c,i})).filter(x=>q.type==='Order cards'||!q.options.blocked.includes(x.i)&&R.matchesPromptFilter(x.c,q.filter));
   const losing=x=>{let v=realisticCardValue(m,owner,x.c);const duplicate=owner.hand.cards.filter(c=>c.fullName===x.c.fullName).length;if(duplicate>1)v-=12;
    /* Discard is part of the damage engine for these printed attack families. */
    if(realSlots(owner).some(l=>l.getPokemonCard().attacks.some(a=>/Night March|Vengeance|Bee Revenge/i.test(a.name)))&&x.c.attacks?.some(a=>a.name==='Night March'))v-=75;
    if(x.c.superType===R.SuperType.ENERGY&&realSlots(owner).some(l=>l.getPokemonCard().attacks.some(a=>/Oblivion Wing|Junk Hunt/i.test(a.name))))v-=8;return v;};
   rows.sort((a,b)=>discard?losing(a)-losing(b):realisticCardValue(m,owner,b.c)-realisticCardValue(m,owner,a.c));
   if(q.type==='Order cards')return out(rows.map(x=>x.i));
   const min=q.options.min??0,max=Math.min(q.options.max??rows.length,rows.length),planCards=[...realSlots(owner).map(l=>l.getPokemonCard()),...owner.hand.cards],march=planCards.some(c=>c.attacks?.some(a=>a.name==='Night March')),revenge=planCards.some(c=>c.attacks?.some(a=>/Vengeance|Bee Revenge/.test(a.name)));
   const setupDiscards=discard&&!rows.every(x=>owner.hand.cards.some(c=>c.id===x.c.id))?rows.filter(x=>march?x.c.attacks?.some(a=>a.name==='Night March'):revenge&&x.c.superType===R.SuperType.POKEMON).length:0;
   const wanted=setupDiscards?Math.max(min,Math.min(max,setupDiscards)):/BENCH|SEARCH|DRAW|HAND|RECOVER/.test(String(q.message))&&!discard?max:min;
   const value=subsets(rows.map(x=>x.i),wanted,wanted,v=>valid(m,q,v),1500)||subsets(rows.map(x=>x.i),min,max,v=>valid(m,q,v),3000);return value===undefined?null:out(value);
  }
  if(q.type==='Choose pokemon'){
   const rows=targets(m,q),op=m.store.state.players.find(p=>p!==owner),harm=/DAMAGE|DISCARD|PICK_UP/.test(String(q.message));
   const value=x=>{if(x.target.player===R.PlayerType.TOP_PLAYER){const damage=Math.max(0,...realAttacks(m,owner,owner.active).filter(a=>a.missing===0).map(a=>realDamage(m,owner.active,x.list,a.attack)));return (harm?1:1)*(damage>=realHp(x.list)?300*realPrize(x.list):0)+realPrize(x.list)*12+(x.list.getPokemonCard()?.powers.length?20:0)-realHp(x.list)*.1;}
    const attacks=realAttacks(m,owner,x.list);return Math.max(0,...attacks.map(a=>(Number(a.attack.damage)||0)/(a.missing+1)))*2+realHp(x.list)*.15-(harm?realPrize(x.list)*50:0)-(op&&prizeCount(op)<=realPrize(x.list)?55:0);};
   rows.sort((a,b)=>value(b)-value(a));const v=subsets(rows.map(x=>x.target),q.options.min??1,q.options.max??1,v=>valid(m,q,v));return v===undefined?null:out(v);
  }
  if(q.type==='Attach energy'){
   const ts=targets(m,q).filter(x=>x.target.player===R.PlayerType.BOTTOM_PLAYER),maps=new Map(ts.map(x=>[JSON.stringify(x.target),realEnergy(m,owner,x.list)]));
   const cards=q.cardList.cards.map((card,index)=>({card,index})).filter(x=>x.card.superType===R.SuperType.ENERGY&&!q.options.blocked.includes(x.index)&&R.matchesPromptFilter(x.card,q.filter));
   const min=q.options.count??q.options.min??0,max=q.options.count??q.options.max??cards.length,moves=[],used=new Set(),usedTargets=new Set();
   while(moves.length<max){let best;for(const row of cards){if(used.has(row.index)||q.options.validCardTypes&&!row.card.provides.some(t=>q.options.validCardTypes.includes(t)))continue;
    for(const x of ts){const key=JSON.stringify(x.target);if(q.options.differentTargets&&usedTargets.has(key))continue;const map=maps.get(key),next=map.concat({card:row.card,provides:row.card.provides||[]});
     const gain=Math.max(0,...realAttacks(m,owner,x.list).map(a=>{const before=realMissing(map,a.cost),after=realMissing(next,a.cost);return before>after?(before-after)*20+(after===0?55:0)+(x.list===owner.active?20:5):0;}));
     if(!best||gain>best.gain)best={row,x,key,next,gain};}}
    if(!best||best.gain===0&&moves.length>=min)break;moves.push({index:best.row.index,to:best.x.target});used.add(best.row.index);usedTargets.add(best.key);maps.set(best.key,best.next);
   }
   if(moves.length>=min){const selected=out(moves);if(selected)return selected;}
  }
  return null;
 }
 function realisticScore(m,id){
  const g=m.store.state,p=actor(m,id),op=g.players.find(x=>x!==p);if(g.phase===R.GamePhase.FINISHED)return g.players[g.winner]?.id===id?1000000:-1000000;
  const own=realSlots(p),enemy=realSlots(op),threats=enemy.flatMap(l=>realAttacks(m,op,l).filter(a=>a.missing<=1).map(a=>({list:l,...a}))),hand=p.hand.cards;
  let value=(prizeCount(op)-prizeCount(p))*1200;
  const ready=own.map(l=>({list:l,attacks:realAttacks(m,p,l)}));
  for(const [i,row] of ready.entries()){
   const l=row.list,c=l.getPokemonCard(),damage=Math.max(0,...row.attacks.map(a=>realPrintedDamage(m,p,l,a.attack,true)/(a.missing+1))),missing=Math.min(6,...row.attacks.map(a=>a.missing));
   value+=Math.min(realHp(l),180)*.13+Math.min(damage,160)*(l===p.active?1.1:.55)+Math.max(0,3-missing)*13;
   if(c.powers.length)value+=12;
   const units=realEnergy(m,p,l).reduce((n,e)=>n+R.StateUtils.getProvidesUnitCount(e.provides,e),0),cost=Math.max(0,...row.attacks.map(a=>a.cost.length));value+=Math.min(units,cost)*5-Math.max(0,units-cost)*12;
   if(l===p.active){const incoming=Math.max(0,...threats.map(t=>realDamage(m,t.list,l,t.attack)*(t.missing? .5:1)));if(incoming>=realHp(l)){value-=realPrize(l)*65;if(prizeCount(op)<=realPrize(l))value-=210;}}
   else if(realPrize(l)>1&&damage<30&&op.prizes.length){value-=18+(prizeCount(op)<=2?25:0);}
  }
  if(own.length===1)value-=55;else if(ready.slice(1).some(x=>x.attacks.some(a=>a.missing<=1)))value+=35;
  if(own.length>4)value-=(own.length-4)*12;
  /* Do not reward playing every available card. Keep useful resources in hand. */
  value+=hand.reduce((n,c)=>n+Math.min(50,realisticCardValue(m,p,c))*.22,0);
  const draw=hand.some(c=>c.superType===R.SuperType.TRAINER&&/draw|professor|colress/i.test(c.name+' '+c.text));if(!draw&&hand.length<2)value-=28;
  const deck=p.deck.cards.length;value-=deck===0?450:deck<4?(4-deck)*75:0;
  for(const l of enemy){value-=Math.min(realHp(l),240)*.14;if(l===op.active)value-=realHp(l)*.35;else value+=Math.min(l.damage,realHp(l))*.08;}
  return value;
 }
 function realisticChoose(m,id){
  const original=recent(m);if(original.length>65)return {type:'pass',player:id};
  const root=fork(m,id);root.journal=copy(original);root._botKeepHistory=true;const turn=root.store.state.activePlayer,budget=104;let trials=0,maxDepth=1;const cache=new WeakMap();
  const evaluate=f=>{if(!cache.has(f))cache.set(f,realisticScore(f,id));return cache.get(f);};
  const done=f=>f.store.state.phase===R.GamePhase.FINISHED||f.store.state.activePlayer!==turn||RulesMatch.pending(f).length>0;
  const order=f=>{const p=actor(f,id);return candidates(f,id).map(x=>{let priority=x.priority;if(x.action.type==='play'){const c=p.hand.cards[x.action.index];if(c)priority+=realisticCardValue(f,p,c)*.4;if(c?.superType===R.SuperType.ENERGY&&x.action.target?.slot===R.SlotType.BENCH)priority+=15;}
   return {...x,priority};}).sort((a,b)=>b.priority-a.priority);};
  const pick=(f,n)=>{const all=order(f),ends=all.filter(x=>['attack','pass'].includes(x.action.type)),others=all.filter(x=>!['attack','pass'].includes(x.action.type)),seen=new Set();return [...ends,...others].filter(x=>{const p=actor(f,id),c=x.action.type==='play'?p.hand.cards[x.action.index]:null,key=c?JSON.stringify({...x.action,index:c.fullName}):JSON.stringify(x.action);if(seen.has(key))return false;seen.add(key);return true;}).slice(0,n+ends.length);};
  const base=evaluate(root),roots=[],expand=(parent,item,depth)=>{if(trials>=budget)return null;trials++;const f=trial(parent.f,id,item.action,'realistic');if(!f)return null;const row={f,first:parent.first||item.action,depth,value:evaluate(f)-base,ended:['attack','pass'].includes(item.action.type)||done(f)};if(item.action.type==='pass')row.value-=35;return row;};
  const parent={f:root};for(const item of pick(root,levels.realistic.candidates)){const node=expand(parent,item,1);if(node)roots.push(node);}
  const leaves=roots.slice();let beam=roots.filter(x=>!x.ended).sort((a,b)=>b.value-a.value).slice(0,3);
  for(let depth=2;depth<=3&&beam.length&&trials<budget;depth++){maxDepth=depth;const next=[];for(const node of beam)for(const item of pick(node.f,8)){const child=expand(node,item,depth);if(child){leaves.push(child);if(!child.ended)next.push(child);}}beam=next.sort((a,b)=>b.value-a.value).slice(0,3);}
  /* Recheck leading first moves in another concealed-world/coin sample. A single
     lucky forecast must not decide the action. No live RNG is read or advanced. */
  const firsts=new Map();for(const row of leaves){const key=JSON.stringify(row.first),previous=firsts.get(key);if(!previous||row.value>previous.value)firsts.set(key,row);}
  const ranked=[...firsts.values()].sort((a,b)=>b.value-a.value);
  for(const row of ranked.slice(0,4)){const alternate=fork(m,id,0x45d9f3b);alternate.journal=copy(original);alternate._botKeepHistory=true;const f=trial(alternate,id,row.first,'realistic');if(f){row.value=Math.min(row.value,row.value*.7+(evaluate(f)-evaluate(alternate))*.3);trials++;}}
  ranked.sort((a,b)=>b.value-a.value);const best=ranked[0];realisticLast={trials,depth:maxDepth,alternatives:ranked.length,action:best?.first||{type:'pass',player:id},expectedGain:best?.value||0};return realisticLast.action;
 }
 function choose(m,id,difficulty='normal'){
  const config=levels[difficulty]||levels.normal,pending=RulesMatch.pending(m),p=pending.find(p=>p.playerId===id);
  if(p)return prompt(m,p,difficulty);
  const g=m.store.state;if(pending.length||g.phase!==R.GamePhase.PLAYER_TURN||g.players[g.activePlayer].id!==id)return null;
  if(difficulty==='realistic')return realisticChoose(m,id);
  const history=recent(m);if(history.length>75)return {type:'pass',player:id};
  const base=score(m,id),ranked=[],random=rng(visibleSeed(m,id)),start=Date.now();
  /* Reserve room for every attack and pass even with a very large hand. */
  const all=candidates(m,id),picked=all.filter(x=>['attack','pass'].includes(x.action.type)).concat(all.filter(x=>!['attack','pass'].includes(x.action.type)).slice(0,config.candidates));
  const used=new Set();for(const item of picked){
   const key=JSON.stringify(item.action);if(used.has(key))continue;used.add(key);
   const f=trial(m,id,item.action,difficulty);if(!f)continue;
   let value=score(f,id)-base;
   if(item.action.type==='play'&&value>=-2)value+=8;
   if(item.action.type==='ability'&&value<=.01)continue;
   if(item.action.type==='retreat'&&value<5)continue;
   if(item.action.type==='stadium'&&value<=.01)continue;
   if(item.action.type==='pass')value-=40;
   if(difficulty==='easy')value=item.priority*.25+random()*25+(item.action.type==='attack'?8:0);
   ranked.push({...item,value,f});if(Date.now()-start>350&&ranked.length>2)break;
  }
  ranked.sort((a,b)=>b.value-a.value);
  if(config.lookahead){for(const item of ranked.filter(x=>!['attack','pass'].includes(x.action.type)).slice(0,config.lookahead)){
   if(RulesMatch.pending(item.f).length||item.f.store.state.activePlayer!==g.activePlayer)continue;
   for(const next of candidates(item.f,id).filter(x=>['attack','play'].includes(x.action.type)).slice(0,10)){
    const f=trial(item.f,id,next.action,difficulty);if(f)item.value=Math.max(item.value,score(f,id)-base+5);
   }if(Date.now()-start>700)break;
  }ranked.sort((a,b)=>b.value-a.value);}
  return ranked[0]?.action||{type:'pass',player:id};
 }
 return {levels,decks,choose,prompt,valid,copy,score,fork,candidates,strategy:{evaluate:(m,id)=>realisticScore(fork(m,id),id),cardValue:(m,id,c)=>{const f=fork(m,id);return realisticCardValue(f,actor(f,id),c);},diagnostics:()=>copy(realisticLast)}};
})();


