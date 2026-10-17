/* Local opponent. Every committed action and prompt uses RulesMatch validation. */
var BotAI=(()=>{
 const R=RulesMatch.R;
 const levels={easy:{label:'Easy',candidates:18,lookahead:0},normal:{label:'Normal',candidates:40,lookahead:0},hard:{label:'Hard',candidates:64,lookahead:3}};
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
 function fork(m,id){
  const store=new R.Store({gameSettings:{format:RulesMatch.profiles[m.spec.profile].format},onStateChange:s=>{store.state=s}});store.state=copy(m.store.state);store.state.prompts=[];store.state.logs=store.state.logs.slice(-15);
  const random=rng(visibleSeed(m,id)^0x6f49ac31);
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
  return {store,spec:m.spec,journal:[],randomState:visibleSeed(m,id)^0x182b84f5};
 }
 function valid(m,p,value){try{const decoded=p.decode(value,m.store.state);return p.validate(decoded,m.store.state);}catch{return false;}}
 function subsets(items,min,max,accept,limit=4000){
  let attempts=0,answer;const visit=(start,chosen,n)=>{if(answer!==undefined||attempts>=limit)return;if(chosen.length===n){attempts++;if(accept(chosen))answer=chosen.slice();return;}for(let i=start;i<=items.length-(n-chosen.length);i++){chosen.push(items[i]);visit(i+1,chosen,n);chosen.pop();if(answer!==undefined||attempts>=limit)break;}};
  for(let n=min;n<=Math.min(max,items.length);n++){visit(0,[],n);if(answer!==undefined||attempts>=limit)break;}return answer;
 }
 function targets(m,p){return RulesMatch.targets(m,p).filter(x=>!(p.options?.blocked||[]).some(b=>JSON.stringify(b)===JSON.stringify(x.target)));}
 function prompt(m,p,difficulty='normal'){
  const g=m.store.state,owner=actor(m,p.getPerspectivePlayerId?.()??p.playerId),random=rng(visibleSeed(m,owner.id)^p.id),out=value=>valid(m,p,value)?{type:'prompt',id:p.id,value}:null;
  if(p.type==='Coin flip')return out(random()>=.5);
  if(p.type==='Confirm')return out(true)||out(false);
  if(['Alert','WaitPrompt','Show cards','Confirm cards','ShowMulligan','Show mulligan'].includes(p.type))return out(true);
  if(p.type.startsWith('Shuffle')){const n=p.type==='Shuffle hand'?owner.hand.cards.length:owner.deck.cards.length,a=Array.from({length:n},(_,i)=>i);for(let i=n-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return out(a);}
  if(p.type==='Choose cards'){
   const eligible=p.cards.cards.map((c,i)=>({c,i})).filter(x=>!p.options.blocked.includes(x.i)&&R.matchesPromptFilter(x.c,p.filter));
   const discard=/DISCARD|PUT.*BOTTOM|PUT.*BACK|RETURN.*DECK/.test(String(p.message));
   eligible.sort((a,b)=>difficulty==='easy'?hash(a.c.fullName+p.id)-hash(b.c.fullName+p.id):(discard?-1:1)*(cardValue(b.c,owner)-cardValue(a.c,owner)));
   const max=p.options.max??eligible.length,min=p.options.min??0;
   const desired=/BENCH|SEARCH|DRAW|HAND|RECOVER/.test(String(p.message))&&!discard?Math.min(max,eligible.length):min;
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
  if(['Select','SelectOption'].includes(p.type)){const indexes=p.values.map((v,i)=>i).filter(i=>!p.options.disabled?.[i]);if(p.options.isBlindGuess){indexes.sort((a,b)=>hash(String(m.spec?.seed)+':blind:'+p.id+':'+a)-hash(String(m.spec?.seed)+':blind:'+p.id+':'+b));for(const i of indexes){const action=out(i);if(action)return action;}return null;}const types=owner.hand.cards.filter(c=>c.superType===R.SuperType.ENERGY).flatMap(c=>(c.provides||[]).map(t=>R.CardType[t]?.toLowerCase()));indexes.sort((a,b)=>Number(types.includes(String(p.values[b]).toLowerCase()))-Number(types.includes(String(p.values[a]).toLowerCase())));for(const i of indexes){const a=out(i);if(a)return a;}}
  if(p.type==='Order cards')return out(p.cards.cards.map((c,i)=>({c,i})).sort((a,b)=>cardValue(b.c,owner)-cardValue(a.c,owner)).map(x=>x.i));
  if(['Attach energy','Move energy','Discard energy'].includes(p.type)){
   const ts=targets(m,p),rows=p.type==='Attach energy'?p.cardList.cards.map((card,index)=>({card,index})).filter(x=>x.card.superType===R.SuperType.ENERGY&&!p.options.blocked.includes(x.index)&&R.matchesPromptFilter(x.card,p.filter)):RulesMatch.targets(m,p).flatMap(x=>x.list.cards.map((card,index)=>({card,index,from:x.target}))).filter(x=>x.card.superType===R.SuperType.ENERGY&&R.matchesPromptFilter(x.card,p.filter));
   const destinationValue=x=>(x.list===owner.active?100:25)+Math.max(0,...(x.list.getPokemonCard()?.attacks||[]).map(a=>Number(a.damage)||0))*.2-energyMap(x.list).length*8;
   ts.sort((a,b)=>destinationValue(b)-destinationValue(a));
   const choices=rows.map(row=>p.type==='Discard energy'?{from:row.from,index:row.index}:p.type==='Attach energy'?{to:ts[0]?.target,index:row.index}:{from:row.from,to:ts.find(x=>JSON.stringify(x.target)!==JSON.stringify(row.from))?.target,index:row.index}).filter(x=>p.type==='Discard energy'||x.to);
   const max=p.options.count??p.options.max??choices.length,minimum=p.options.count??p.options.min??0;
   const need=ts[0]?Math.max(1,Math.max(0,...ts[0].list.getPokemonCard().attacks.map(a=>a.cost.length))+2-energyMap(ts[0].list).length):1;
   const wanted=p.options.count??Math.min(max,choices.length,Math.max(minimum,p.type==='Attach energy'?need:1));
   let value=subsets(choices,wanted,wanted,v=>valid(m,p,v),500)||subsets(choices,minimum,max,v=>valid(m,p,v),500);
   if(value===undefined)for(const t of ts){const alt=choices.map(x=>p.type==='Discard energy'?x:{...x,to:t.target});value=subsets(alt,wanted,max,v=>valid(m,p,v),200);if(value!==undefined)break;}
   return value===undefined?(p.options.allowCancel?out(null):null):out(value);
  }
  if(p.type==='Put damage'){
   const ts=targets(m,p).sort((a,b)=>(b.target.player===R.PlayerType.TOP_PLAYER)-(a.target.player===R.PlayerType.TOP_PLAYER)||((a.list.hp||0)-a.list.damage)-((b.list.hp||0)-b.list.damage));
   for(const x of ts){const a=out([{target:x.target,damage:p.damage}]);if(a)return a;}
   const step=p.options.damageMultiple||10,assigned=[];let left=p.damage;for(const x of ts){const damage=Math.min(left,Math.max(step,Math.ceil(((x.list.hp||0)-x.list.damage)/step)*step));assigned.push({target:x.target,damage});left-=damage;if(left<=0)break;}if(left===0){const a=out(assigned);if(a)return a;}
  }
  if(p.type==='Move damage'){
   const ts=RulesMatch.targets(m,p),key=t=>JSON.stringify(t),blocked=(target,rows)=>(rows||[]).some(t=>key(t)===key(target)),damage=new Map(ts.map(x=>[key(x.target),x.list.damage])),caps=new Map((p.maxAllowedDamage||[]).map(x=>[key(x.target),x.damage]));
   const sources=ts.filter(x=>x.list.damage>0&&!blocked(x.target,p.options.blockedFrom)).sort((a,b)=>b.list.damage-a.list.damage),destinations=ts.filter(x=>!blocked(x.target,p.options.blockedTo)).sort((a,b)=>Number(b.target.player===R.PlayerType.TOP_PLAYER)-Number(a.target.player===R.PlayerType.TOP_PLAYER));
   const moves=[],max=p.options.max??sources.reduce((n,x)=>n+Math.floor(x.list.damage/10),0);let chosenSource,chosenDestination;
   for(const from of sources){if(p.options.singleSourceTarget&&chosenSource&&chosenSource!==key(from.target))continue;while(damage.get(key(from.target))>=10&&moves.length<max){const to=destinations.find(x=>key(x.target)!==key(from.target)&&(!p.options.singleDestinationTarget||!chosenDestination||chosenDestination===key(x.target))&&(!caps.has(key(x.target))||damage.get(key(x.target))+10<=caps.get(key(x.target))));if(!to)break;moves.push({from:from.target,to:to.target});chosenSource=key(from.target);chosenDestination=key(to.target);damage.set(chosenSource,damage.get(chosenSource)-10);damage.set(chosenDestination,damage.get(chosenDestination)+10);}}
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
  for(const list of [p.active,...p.bench]){const c=list.getPokemonCard();if(!c)continue;const n=energyMap(list).reduce((n,e)=>n+R.StateUtils.getProvidesUnitCount(e.provides),0),max=Math.max(0,...c.attacks.map(a=>a.cost.length));value+=Math.min(n,max+1)*7-Math.max(0,n-max-1)*5;}
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
   if(c.superType===R.SuperType.POKEMON){for(const s of slots)if(c.stage===R.Stage.BASIC||c._hgssLegend?!s.list.getPokemonCard()&&(!c._hgssLegend||s.target.slot===R.SlotType.BENCH):s.list.getPokemonCard()&&(s.list.getPokemonCard().name===c.evolvesFrom||!c.evolvesFrom))add({type:'play',player:id,index,target:s.target},c.stage===R.Stage.BASIC?35:55);}
   else if(c.superType===R.SuperType.ENERGY||c.trainerType===R.TrainerType.TOOL){for(const s of slots)if(s.list.getPokemonCard())add({type:'play',player:id,index,target:s.target},s.target.slot===R.SlotType.ACTIVE?60:20+readyDamage(s.list)*.1);}
   else {add({type:'play',player:id,index,target:slots[0].target},/bill|professor|draw|search|ball/i.test(c.name+' '+c.text)?50:30);if(/fossil|doll|substitute/i.test(c.name))for(const s of slots.slice(1).filter(s=>!s.list.getPokemonCard()))add({type:'play',player:id,index,target:s.target},35);}
  });
  for(const s of slots){const c=s.list.getPokemonCard();if(!c)continue;
   if(s.target.slot===R.SlotType.ACTIVE)for(const a of RulesMatch.attacks(m,p))add({type:'attack',player:id,name:a.name},65+(Number(a.damage)||0)*.1);
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
    const p=pending.find(p=>['Coin flip','Shuffle deck','Shuffle hand','WaitPrompt'].includes(p.type))||pending.find(p=>p.playerId===id);
    if(!p)break;const a=prompt(f,p,difficulty);if(!a)return null;RulesMatch.apply(f,a);
   }return f;
  }catch{return null;}
 }
 function choose(m,id,difficulty='normal'){
  const config=levels[difficulty]||levels.normal,pending=RulesMatch.pending(m),p=pending.find(p=>p.playerId===id);
  if(p)return prompt(m,p,difficulty);
  const g=m.store.state;if(pending.length||g.phase!==R.GamePhase.PLAYER_TURN||g.players[g.activePlayer].id!==id)return null;
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
 return {levels,decks,choose,prompt,valid,copy,score,fork,candidates};
})();


