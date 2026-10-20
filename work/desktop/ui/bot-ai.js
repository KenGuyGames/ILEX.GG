/* Local opponent. Every committed action and prompt uses RulesMatch validation. */
var BotAI=(()=>{
 const R=RulesMatch.R;
 const levels={easy:{label:'Easy',candidates:18,lookahead:0},normal:{label:'Normal',candidates:40,lookahead:0},hard:{label:'Hard',candidates:64,lookahead:3},realistic:{label:'Realistic Player',candidates:36,lookahead:10}};
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
  if(m._botForecast)return {store,spec:m.spec,journal:m._botKeepHistory?copy(m.journal):[],randomState:m.randomState,_botForecast:true,_botTournament:!!m._botTournament,_botPerspective:m._botPerspective,_botKeepHistory:!!m._botKeepHistory};
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
  const spec={...m.spec,decks:m.spec.decks.map((d,i)=>i===store.state.players.indexOf(p)?d:{name:'Unknown opposing list',cards:{}})};
  return {store,spec,journal:m._botKeepHistory?copy(m.journal):[],randomState:visibleSeed(m,id)^0x182b84f5^salt,_botForecast:true,_botTournament:!!m._botTournament,_botPerspective:id,_botForecastSalt:salt,_botKeepHistory:!!m._botKeepHistory};
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
   if(c.superType===R.SuperType.POKEMON){for(const s of slots)if(c.stage===R.Stage.BASIC||c._hgssLegend?!s.list.getPokemonCard()&&(!c._hgssLegend||s.target.slot===R.SlotType.BENCH):s.list.getPokemonCard()&&((m.spec.cubeRules?R.cubeEvolution(s.list.getPokemonCard(),c,false,m.spec.cubeRules):s.list.getPokemonCard().name===c.evolvesFrom)||!c.evolvesFrom||s.list.getPokemonCard()._svRainbowDna&&c.evolvesFrom==='Eevee'&&c.stage===R.Stage.STAGE_1&&c.tags.includes(R.CardTag.POKEMON_ex)&&c.regulationMark))add({type:'play',player:id,index,target:s.target},c.stage===R.Stage.BASIC?35:55);}
   else if(c.superType===R.SuperType.ENERGY||c.trainerType===R.TrainerType.TOOL){const owner=c.trainerType===R.TrainerType.TOOL&&c.attachesToOpponentsPokemon?g.players.find(x=>x!==p):p,side=owner===p?R.PlayerType.BOTTOM_PLAYER:R.PlayerType.TOP_PLAYER,targets=owner===p?slots:[{list:owner.active,target:{player:side,slot:R.SlotType.ACTIVE,index:0}},...owner.bench.map((list,index)=>({list,target:{player:side,slot:R.SlotType.BENCH,index}}))];for(const s of targets)if(s.list.getPokemonCard())add({type:'play',player:id,index,target:s.target},s.target.slot===R.SlotType.ACTIVE?60:20+readyDamage(s.list)*.1);}
   else {add({type:'play',player:id,index,target:slots[0].target},/bill|professor|draw|search|ball/i.test(c.name+' '+c.text)?50:30);if(/fossil|doll|substitute/i.test(c.name))for(const s of slots.slice(1).filter(s=>!s.list.getPokemonCard()))add({type:'play',player:id,index,target:s.target},35);}
  });
  for(const s of slots){const c=s.list.getPokemonCard();if(!c)continue;
   for(const a of (s.target.slot===R.SlotType.ACTIVE?RulesMatch.attacks(m,p):c.attacks.filter(a=>a.useOnBench)))add({type:'attack',player:id,name:a.name,target:s.target},65+(Number(a.damage)||0)*.1);
   for(const a of RulesMatch.powers(m,p,s.list).filter(a=>a.powerType!==R.PowerType.POKEBODY&&a.powerType!==R.PowerType.HOLONS_SPECIAL_ENERGY_EFFECT&&!a._wotcPassive))if(m._botTournament||!history.some(h=>h.type==='ability'&&h.player===id&&h.name===a.name&&JSON.stringify(h.target)===JSON.stringify(s.target)))add({type:'ability',player:id,name:a.name,target:s.target},40);
  }
  if(!history.some(h=>h.type==='retreat'&&h.player===id))for(let index=0;index<p.bench.length;index++)if(p.bench[index].getPokemonCard())add({type:'retreat',player:id,index},readyDamage(p.bench[index])>readyDamage(p.active)?45:5);
  if(g.players.some(owner=>owner.stadium.cards.some(c=>c._wotcStadiumAction!==false))&&!history.some(h=>h.type==='stadium'&&h.player===id))add({type:'stadium',player:id},40);
  add({type:'pass',player:id},-100);return moves.sort((a,b)=>b.priority-a.priority);
 }
 function trial(m,id,action,difficulty){
  const f=fork(m,id);try{
   RulesMatch.apply(f,action);for(let n=0;n<(difficulty==='realistic'?120:45);n++){
    const pending=RulesMatch.pending(f);if(!pending.length)break;
    const p=pending.find(p=>['Coin flip','Shuffle deck','Shuffle hand','WaitPrompt'].includes(p.type))||pending.find(p=>p.playerId===id)||(difficulty==='realistic'?pending[0]:null);
    if(!p)break;if(f._botTournament&&['Choose cards','Order cards','Choose prize','Coin flip','Shuffle deck','Shuffle hand','Show cards','Show pokemon'].includes(p.type))f._botInformationChanged=true;const a=prompt(f,p,difficulty);if(!a)return null;RulesMatch.apply(f,a);
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
 const realPrize=l=>{if(Number.isInteger(l?.getPokemonCard()?._cubePrizeValue))return l.getPokemonCard()._cubePrizeValue;const c=l.getPokemonCard(),tags=c?.tags||[];if(c?._hgssLegend&&Number.isFinite(c._hgssLegendPrizes))return c._hgssLegendPrizes;if(tags.some(t=>[R.CardTag.POKEMON_VMAX,R.CardTag.POKEMON_VUNION,R.CardTag.TAG_TEAM,R.CardTag.POKEMON_SV_MEGA].includes(t)))return 3;return tags.some(t=>[R.CardTag.POKEMON_V,R.CardTag.POKEMON_VSTAR,R.CardTag.POKEMON_EX,R.CardTag.POKEMON_ex,R.CardTag.POKEMON_GX,R.CardTag.DUAL_LEGEND].includes(t))?2:1;};
 function realEnergy(m,p,list){
  const memo=realMemo(m).energy;if(memo.has(list))return memo.get(list);let map;try{const e=new R.CheckProvidedEnergyEffect(p,list);m.store.reduceEffect(m.store.state,e);map=e.energyMap;}catch{map=energyMap(list);}memo.set(list,map);return map;
 }
 function realMissing(map,cost){
  // One multitype entry is ONE flexible unit; homogeneous repeats and explicit
  // providedGroups are independent units. Maximum matching handles overlap.
  const units=map.flatMap(e=>(e.providedGroups||[e.provides]).flatMap(g=>new Set(g).size>1?[g]:g.map(t=>[t]))),needs=cost.filter(t=>t!==R.CardType.NONE&&t!==R.CardType.ANY),assigned=new Map();
  const match=(u,t)=>t===R.CardType.COLORLESS||u.includes(t)||u.includes(R.CardType.ANY);
  needs.sort((a,b)=>units.filter(u=>match(u,a)).length-units.filter(u=>match(u,b)).length);
  function assign(n,seen){for(let i=0;i<units.length;i++){if(seen.has(i)||!match(units[i],needs[n]))continue;seen.add(i);if(!assigned.has(i)||assign(assigned.get(i),seen)){assigned.set(i,n);return true;}}return false;}
  let matched=0;for(let n=0;n<needs.length;n++)if(assign(n,new Set()))matched++;return needs.length-matched;
 }
 function realAttacks(m,p,list){
  const memo=realMemo(m).attacks;if(memo.has(list))return memo.get(list);
  const card=list.getPokemonCard();if(!card)return [];
  if(list!==p.active&&card.powers?.some(a=>/use the attacks|use any attack/i.test(a.text||''))){
   const f=fork(m,p.id),fp=actor(f,p.id),i=p.bench.indexOf(list);if(i>=0){const old=fp.active;fp.active=fp.bench[i];fp.bench[i]=old;const result=realAttacks(f,fp,fp.active);memo.set(list,result);return result;}
  }
  const map=realEnergy(m,p,list);let available=card.attacks;
  if(list===p.active)try{available=RulesMatch.attacks(m,p);}catch{}
  if(card.powers?.some(a=>/use the attacks of any of your Basic/i.test(a.text||'')))available=[...available,...realSlots(p).filter(l=>l!==list&&l.getPokemonCard()?.stage===R.Stage.BASIC).flatMap(l=>l.getPokemonCard().attacks)];
  const attacks=available.filter(a=>!(a.gxAttack&&p.usedGX)&&!(a._swshVstar&&p.usedVSTAR)&&!(a._swshLostZoneMinimum>p.lostzone.cards.length)).map(a=>{let cost=a.cost;try{const e=new R.CheckAttackCostEffect(p,a,list);m.store.reduceEffect(m.store.state,e);cost=e.cost;}catch{}return {attack:a,missing:realMissing(map,cost),cost};});memo.set(list,attacks);return attacks;
 }
 function realCountDamage(m,p,attack,base){
  const text=attack.text||'',match=text.match(/(\d+)\s+(more\s+)?damage\s+(?:for each|times(?: the number of)?|for every)\s+([^.!]+)/i);if(!match)return null;
  const subject=match[3];if(!/Pok[eé]mon/i.test(subject)||!/(?:Bench|in play)/i.test(subject))return null;
  if(/different|Evolved|Stage\s*\d/i.test(subject))return null;
  if(/\bthat\b|\bwith\b/i.test(subject)&&!/damage counters|Energy attached|Abilities/i.test(subject))return null;
  const op=m.store.state.players.find(x=>x!==p),owners=/both|each player/i.test(subject)?[p,op]:/opponent/i.test(subject)?[op]:/your/i.test(subject)?[p]:[];if(!owners.length)return null;
  let lists=owners.flatMap(owner=>/Bench/i.test(subject)?owner.bench.filter(l=>l.getPokemonCard()&&!l.isSecret):realSlots(owner));
  const type=subject.match(/\b(Grass|Fire|Water|Lightning|Psychic|Fighting|Darkness|Metal|Colorless|Dragon|Fairy)\s+Pok[eé]mon/i);
  if(type){const t=({grass:R.CardType.GRASS,fire:R.CardType.FIRE,water:R.CardType.WATER,lightning:R.CardType.LIGHTNING,psychic:R.CardType.PSYCHIC,fighting:R.CardType.FIGHTING,darkness:R.CardType.DARK,metal:R.CardType.METAL,colorless:R.CardType.COLORLESS,dragon:R.CardType.DRAGON,fairy:R.CardType.FAIRY})[type[1].toLowerCase()];lists=lists.filter(l=>{let types=realMemo(m).types.get(l);if(!types){types=l.getPokemonCard().cardType;try{const e=new R.CheckPokemonTypeEffect(l);m.store.reduceEffect(m.store.state,e);types=e.cardTypes;}catch{}realMemo(m).types.set(l,types);}return types.includes(t);});}
  const tags=[];if(/Pok[eé]mon[- ]GX/.test(subject))tags.push(R.CardTag.POKEMON_GX);if(/Pok[eé]mon[- ]EX/.test(subject))tags.push(R.CardTag.POKEMON_EX);if(/Pok[eé]mon[- ]ex/.test(subject))tags.push(R.CardTag.POKEMON_ex);if(/Pok[eé]mon V\b/.test(subject))tags.push(R.CardTag.POKEMON_V,R.CardTag.POKEMON_VMAX,R.CardTag.POKEMON_VSTAR,R.CardTag.POKEMON_VUNION);if(/Pok[eé]mon VMAX/.test(subject))tags.push(R.CardTag.POKEMON_VMAX);if(/Pok[eé]mon VSTAR/.test(subject))tags.push(R.CardTag.POKEMON_VSTAR);for(const [word,tag]of [['Ancient',R.CardTag.ANCIENT],['Future',R.CardTag.FUTURE],['Ultra Beast',R.CardTag.ULTRA_BEAST],['Team Plasma',R.CardTag.TEAM_PLASMA],['Fusion Strike',R.CardTag.FUSION_STRIKE],['Rapid Strike',R.CardTag.RAPID_STRIKE],['Single Strike',R.CardTag.SINGLE_STRIKE],['TAG TEAM',R.CardTag.TAG_TEAM]])if(subject.includes(word))tags.push(tag);if(tags.length)lists=lists.filter(l=>l.getPokemonCard().tags.some(t=>tags.includes(t)));
  if(/Basic Pok[eé]mon/i.test(subject))lists=lists.filter(l=>l.getPokemonCard().stage===R.Stage.BASIC);
  if(/with Abilities/i.test(subject))lists=lists.filter(l=>l.getPokemonCard().powers.some(p=>p.powerType===R.PowerType.ABILITY));
  if(/damage counters/i.test(subject))lists=lists.filter(l=>l.damage>0);if(/Energy attached/i.test(subject))lists=lists.filter(l=>realEnergy(m,owners.find(o=>realSlots(o).includes(l)),l).length>0);
  return (match[2]?base:0)+Number(match[1])*lists.length;
 }
 function realOwnDraw(card){
  return (card.text||'').split(/[.!]/).some(text=>/\bdraws?\b/i.test(text)&&(!/your opponent\b[^.!]*\bdraws?\b/i.test(text)||/each player|both players|you and your opponent|\byou (?:may )?draw\b/i.test(text)));
 }
 function realResourceDamage(m,p,list,attack,override){
  const text=attack.text||'',base=Number(attack.damage)||0,op=m.store.state.players.find(x=>x!==p);
  const counter=text.match(/(\d+)\s+(more\s+)?damage\s+(?:for each|times(?: the number of)?)\s+damage counters?\s+on\s+([^.!]+)/i);
  if(counter){const target=/opponent|Defending/i.test(counter[3])?op.active:list;return (counter[2]?base:0)+Number(counter[1])*Math.floor(target.damage/10);}
  const match=text.match(/(\d+)\s+(more\s+)?damage\s+(?:for each|times(?: the (?:amount|number) of)?)\s+([^.!]+)/i);
  if(!match||!(/Energy(?: cards?)? attached/i.test(match[3])))return null;
  const subject=match[3],symbol=subject.match(/\[([GRWLPFDMNCY])\]/i),word=subject.match(/\b(Grass|Fire|Water|Lightning|Psychic|Fighting|Darkness|Metal|Colorless|Dragon|Fairy)\s+Energy/i),types={g:R.CardType.GRASS,r:R.CardType.FIRE,w:R.CardType.WATER,l:R.CardType.LIGHTNING,p:R.CardType.PSYCHIC,f:R.CardType.FIGHTING,d:R.CardType.DARK,m:R.CardType.METAL,c:R.CardType.COLORLESS,n:R.CardType.DRAGON,y:R.CardType.FAIRY,grass:R.CardType.GRASS,fire:R.CardType.FIRE,water:R.CardType.WATER,lightning:R.CardType.LIGHTNING,psychic:R.CardType.PSYCHIC,fighting:R.CardType.FIGHTING,darkness:R.CardType.DARK,metal:R.CardType.METAL,colorless:R.CardType.COLORLESS,dragon:R.CardType.DRAGON,fairy:R.CardType.FAIRY},type=symbol?types[symbol[1].toLowerCase()]:word?types[word[1].toLowerCase()]:undefined;
  const units=map=>map.flatMap(e=>(e.providedGroups||[e.provides]).flatMap(g=>new Set(g).size>1?[g]:g.map(t=>[t]))),matches=g=>type===undefined||g.includes(type)||g.includes(R.CardType.ANY),count=map=>/Energy cards? attached/i.test(subject)?map.filter(e=>units([e]).some(matches)).length:units(map).filter(matches).length;
  let maps;if(/both Active|this Pok[eé]mon and (?:the |your opponent.s )?(?:Defending|Active)/i.test(subject))maps=[override||realEnergy(m,p,list),realEnergy(m,op,op.active)];
  else if(/(?:all|each) (?:of )?(?:the )?Pok[eé]mon in play|both players/i.test(subject))maps=m.store.state.players.flatMap(owner=>realSlots(owner).map(l=>l===list&&override?override:realEnergy(m,owner,l)));
  else if(/opponent|Defending/i.test(subject))maps=[realEnergy(m,op,op.active)];
  else if(/(?:all|each) (?:of )?your Pok[eé]mon/i.test(subject))maps=realSlots(p).map(l=>l===list&&override?override:realEnergy(m,p,l));
  else if(/this Pok[eé]mon|but not used|attached to (?:it|[A-Z][a-z]+)/i.test(subject))maps=[override||realEnergy(m,p,list)];else return null;
  const basic=/\bBasic(?:\s+(?:\[[A-Z]\]|[A-Za-z]+))?\s+Energy/i.test(subject),distinct=/\bdifferent\b|\btypes? of\b/i.test(subject);if(distinct&&!basic)return null;
  if(basic)maps=maps.map(map=>map.filter(e=>e.card?.energyType===R.EnergyType.BASIC));
  let n=distinct?new Set(maps.flatMap(map=>map.flatMap(e=>(e.card.provides||e.provides).filter(t=>t!==R.CardType.ANY&&t!==R.CardType.NONE)))).size:maps.reduce((sum,map)=>sum+count(map),0);
  if(/but not used to pay/i.test(subject)){let cost=attack.cost;try{const e=new R.CheckAttackCostEffect(p,attack,list);m.store.reduceEffect(m.store.state,e);cost=e.cost;}catch{}const other=units(maps[0]).filter(g=>!matches(g)).map(provides=>({provides}));n=Math.max(0,n-realMissing(other,cost));const limit=text.match(/Extra[\s\S]*?after (?:the )?(\d+)(?:st|nd|rd|th)/i);if(limit)n=Math.min(n,Number(limit[1]));}
  let bonus=Number(match[1])*n;const cap=text.match(/can(?:not|'t) add more than (\d+) damage/i);if(cap)bonus=Math.min(bonus,Number(cap[1]));return (match[2]?base:0)+bonus;
 }
 function realPrintedDamage(m,p,list,attack,planning=false,override){
  let damage=Number(attack.damage)||0;const text=attack.text||'',discard=p.discard.cards;
  if(attack.name==='Night March')return 20*Math.max(planning?2:0,discard.filter(c=>c.attacks?.some(a=>a.name==='Night March')).length);
  if(/Vengeance|Bee Revenge/.test(attack.name))return damage+10*discard.filter(c=>c.superType===R.SuperType.POKEMON).length;
  const resourceDamage=realResourceDamage(m,p,list,attack,override);if(resourceDamage!==null)return resourceDamage;
  const counted=realCountDamage(m,p,attack,damage);return counted===null?damage:counted;
 }
 function realDamage(m,attacker,target,attack,override){
  const owner=m.store.state.players.find(p=>realSlots(p).includes(attacker));let n=owner?realPrintedDamage(m,owner,attacker,attack,false,override):Number(attack.damage)||0,types=realMemo(m).types.get(attacker);if(!types){types=attacker.getPokemonCard()?.cardType||[];try{const e=new R.CheckPokemonTypeEffect(attacker);m.store.reduceEffect(m.store.state,e);types=e.cardTypes;}catch{}realMemo(m).types.set(attacker,types);}
  for(const w of target.getPokemonCard()?.weakness||[])if(types.includes(w.type))n=w.value===undefined?n*2:w.value<0?n:w.value===2?n*2:n+w.value;
  for(const r of target.getPokemonCard()?.resistance||[])if(types.includes(r.type))n+=r.value||-20;
  return Math.max(0,n);
 }
 function realisticCardValue(m,p,c){
  const slots=realSlots(p),cards=p.hand.cards,bench=p.bench.filter(l=>l.getPokemonCard()).length;
  if(c.superType===R.SuperType.ENERGY){const energy=cards.filter(x=>x.superType===R.SuperType.ENERGY).length;return 20+(energy<2?24:0)+(slots.some(l=>realAttacks(m,p,l).some(a=>a.missing===1))?12:0);}
  if(c.superType===R.SuperType.POKEMON){
   if(c._hgssLegend)return 25+Math.min(20,(c.hp||0)*.1)+(cards.some(x=>x.name===c.name&&x._hgssLegend&&x._hgssLegendHalf!==c._hgssLegendHalf)?100:0);
   if(c._swshUnionGroup!==undefined){if(p.assembledVUNIONs?.includes(c.name))return 2;const parts=new Set([...cards,...p.discard.cards].filter(x=>x._swshUnionGroup===c._swshUnionGroup).map(x=>x._swshUnionPart));return 25+parts.size*18+(!parts.has(c._swshUnionPart)&&parts.size===3?100:0);}
   if(c.stage!==R.Stage.BASIC)return 12+(slots.some(l=>m.spec.cubeRules?R.cubeEvolution(l.getPokemonCard(),c,false,m.spec.cubeRules):l.getPokemonCard()?.name===c.evolvesFrom)?85:0)+(cards.some(x=>x.name===c.evolvesFrom)?14:0);
   const useful=cards.some(x=>x.evolvesFrom===c.name),duplicate=slots.filter(l=>l.getPokemonCard()?.name===c.name).length,copies=m.spec.decks[m.store.state.players.indexOf(p)]?.cards[c._labId]||0;
   const synergy=c.attacks.some(a=>/Night March|Vengeance|Bee Revenge/.test(a.name)),support=c.tags?.includes(R.CardTag.POKEMON_EX)&&c.powers?.length&&Math.max(0,...c.attacks.map(a=>Number(a.damage)||0))<50;
   const drawText=(c.powers||[]).map(a=>a.text||'').join(' '),until=drawText.match(/draw cards until you have (\d+)/i),onPlay=/(?:when|whenever) you (?:play|put) this/i.test(drawText);
   const postPlayHand=Math.max(0,cards.length-(cards.some(x=>x.id===c.id)?1:0)),fixedDraw=drawText.match(/discard your hand and draw (\d+) cards/i),availableBench=bench<p.bench.length;
   const drawBonus=onPlay&&availableBench?Math.max(0,Number((until||fixedDraw)?.[1]||0)-postPlayHand)*22:0;
   const supporterAvailable=p.supporterTurn!==m.store.state.turn&&!cards.some(x=>x.trainerType===R.TrainerType.SUPPORTER),supporterSearch=onPlay&&availableBench&&supporterAvailable&&/search your deck for (?:a|1) Supporter/i.test(drawText)?60:0;
   return supporterSearch+drawBonus+12+(bench===0?38:0)+(useful?28:0)+Math.min(20,(c.hp||60)*.1)+(c.powers?.length?12:0)+copies*6+(synergy?25:0)-(support?28:0)-duplicate*15-(bench>=3&&!useful?25:0);
  }
  const text=(c.name+' '+c.text).toLowerCase();let value=20;
  if(realOwnDraw(c))value+=cards.length<4?30:8;
  if(/search|ultra ball|computer search|rare candy/.test(text))value+=18;
  if(/lysandre|gust of wind|pokémon catcher|pokemon catcher/.test(text))value+=22+(prizeCount(p)<=2?18:0);
  if(/switch|float stone|escape rope/.test(text))value+=realHp(p.active)<50?18:4;
  if(/super rod|sacred ash|energy retrieval|vs seeker/.test(text))value+=p.discard.cards.length>8?14:0;
  return value;
 }
 function damagePriority(m,owner,row,damage){
  const hp=Math.max(10,realHp(row.list)+row.list.damage),prizes=realPrize(row.list),enemy=row.target.player===R.PlayerType.TOP_PLAYER,active=row.list===owner.active;
  if(enemy)return Math.min(damage,hp)*.6+(damage>=hp?1200*prizes:0);
  return -Math.min(damage,hp)*(active?2:.45)-(damage>=hp?1800*prizes:0)-(active&&hp-damage<50?80:0);
 }
 function realCounterPrompt(m,q,owner,out){
  if(!['Put damage','Move damage','Remove damage'].includes(q.type))return null;
  const rows=targets(m,q),key=t=>JSON.stringify(t),caps=new Map((q.maxAllowedDamage||[]).map(x=>[key(x.target),x.damage]));
  if(q.type==='Put damage'){
   const step=q.options.damageMultiple||10,enemy=rows.filter(x=>x.target.player===R.PlayerType.TOP_PLAYER).slice(0,12);let best,bestValue=-Infinity;
   const limit=x=>Math.max(0,Math.floor((caps.has(key(x.target))?caps.get(key(x.target))-x.list.damage:q.damage)/step)*step);
   for(let mask=0;mask<2**enemy.length;mask++){
    const assigned=new Map(),selected=[];let left=q.damage,okay=true;
    for(let i=0;i<enemy.length;i++)if(mask&(1<<i)){const x=enemy[i],n=Math.ceil(realHp(x.list)/step)*step;if(n>left||n>limit(x)){okay=false;break;}assigned.set(key(x.target),n);selected.push(x);left-=n;}if(!okay)continue;
    const order=enemy.filter(x=>!selected.includes(x)).sort((a,b)=>realPrize(b.list)/Math.max(1,realHp(b.list))-realPrize(a.list)/Math.max(1,realHp(a.list))).concat(selected);
    for(const x of order){const n=Math.min(left,limit(x)-(assigned.get(key(x.target))||0));if(n>0){assigned.set(key(x.target),(assigned.get(key(x.target))||0)+n);left-=n;}if(left===0)break;}
    if(left&&!q.options.allowPlacePartialDamage)continue;const value=enemy.reduce((sum,x)=>sum+damagePriority(m,owner,x,x.list.damage+(assigned.get(key(x.target))||0))-damagePriority(m,owner,x,x.list.damage),0),moves=enemy.filter(x=>assigned.get(key(x.target))>0).map(x=>({target:x.target,damage:assigned.get(key(x.target))}));
    if(value>bestValue&&valid(m,q,moves)){bestValue=value;best=moves;}
   }return best===undefined?null:out(best);
  }
  const blocked=(t,items)=>(items||[]).some(x=>key(t)===key(x)),damage=new Map(rows.map(x=>[key(x.target),x.list.damage])),moves=[],minimum=q.options.min??0,maximum=q.options.max??rows.reduce((n,x)=>n+Math.floor(x.list.damage/10),0);let source,destination;
  while(moves.length<maximum){let best;
   for(const from of rows){const fk=key(from.target);if(blocked(from.target,q.options.blockedFrom)||q.options.singleSourceTarget&&source&&source!==fk)continue;
    for(const to of rows){const tk=key(to.target);if(fk===tk||blocked(to.target,q.options.blockedTo)||(q.options.singleDestinationTarget||q.options.sameTarget)&&destination&&destination!==tk)continue;
     const available=Math.min(Math.floor(damage.get(fk)/10),maximum-moves.length,caps.has(tk)?Math.floor((caps.get(tk)-damage.get(tk))/10):maximum-moves.length);
     for(let n=1;n<=available;n++){const gain=damagePriority(m,owner,from,damage.get(fk)-n*10)+damagePriority(m,owner,to,damage.get(tk)+n*10)-damagePriority(m,owner,from,damage.get(fk))-damagePriority(m,owner,to,damage.get(tk));if(!best||gain>best.gain)best={from,to,fk,tk,n,gain};}
    }
   }
   if(!best||best.gain<=0&&moves.length>=minimum)break;
   for(let i=0;i<best.n;i++)moves.push({from:best.from.target,to:best.to.target});source=best.fk;destination=best.tk;damage.set(source,damage.get(source)-best.n*10);damage.set(destination,damage.get(destination)+best.n*10);
  }
  return moves.length>=minimum?out(moves):null;
 }
 function powerDamageHint(m,owner,origin){
  if(origin?.player!==owner.id||origin.type!=='ability')return null;
  const cards=[...realSlots(owner).map(l=>l.getPokemonCard()),...owner.hand.cards,...owner.discard.cards],card=cards.find(c=>c.powers?.some(p=>p.name===origin.name)),text=card?.powers.find(p=>p.name===origin.name)?.text||'';
  const counters=text.match(/(?:put|place)\s+(\d+)\s+damage counters?\s+on\s+(?:1 of |one of |each of )?(?:your opponent|the opponent|the Defending)/i),hit=text.match(/(?:do|does|put)\s+(\d+)\s+damage\s+(?:to|on)\s+(?:1 of |one of |each of )?(?:your opponent|the opponent|the Defending)/i);
  return counters?Number(counters[1])*10:hit?Number(hit[1]):null;
 }
 function realDiscardPrompt(m,q,owner,origin,out){
  if(!['Choose cards','Discard energy'].includes(q.type)||origin?.player!==owner.id||!/DISCARD/i.test(String(q.message)))return null;
  const source=origin.target?.slot===R.SlotType.BENCH?owner.bench[origin.target.index]:owner.active,card=source?.getPokemonCard();if(!card)return null;
  let attack=origin.type==='attack'?realAttacks(m,owner,source).find(a=>a.attack.name===origin.name)?.attack:null;
  if(!attack&&origin.type==='ability'&&/use[\s\S]*attacks?/i.test(card.powers.find(p=>p.name===origin.name)?.text||'')&&origin.copiedAttackName){const options=m.store.state.players.flatMap(p=>[...realSlots(p).map(l=>l.getPokemonCard()),...p.discard.cards]).flatMap(c=>c.attacks||[]).filter(a=>a.name===origin.copiedAttackName),unique=new Map(options.map(a=>[a.text+'|'+a.damage,a]));if(unique.size===1)attack=[...unique.values()][0];}
  if(!attack)return null;const text=attack.text||'',match=text.match(/(\d+)\s+(more\s+)?damage\s+for each\s+(?:\w+\s+){0,4}(?:cards?|Energy)\s+(?:you\s+)?(?:discard(?:ed)?|put (?:in|into))/i);if(!match||/to each|each of your opponent.s|all of your opponent.s/i.test(text))return null;
  const rows=q.type==='Choose cards'?q.cards.cards.map((c,i)=>({c,value:i})).filter(x=>!q.options.blocked.includes(x.value)&&R.matchesPromptFilter(x.c,q.filter)):RulesMatch.targets(m,q).flatMap(x=>x.list.cards.map((c,index)=>({c,list:x.list,value:{from:x.target,index}}))).filter(x=>x.c.superType===R.SuperType.ENERGY&&R.matchesPromptFilter(x.c,q.filter));
  if(!rows.length)return null;const min=q.options.count??q.options.min??0,max=Math.min(q.options.count??q.options.max??rows.length,rows.length),op=m.store.state.players.find(p=>p!==owner),base=match[2]?Number(attack.damage)||0:0,coefficient=Number(match[1]);
  const maps=new Map(),ordered=[],remaining=rows.slice();
  while(remaining.length){let best;
   for(const row of remaining){let cost=realisticCardValue(m,owner,row.c)*.2,next;
    if(row.list){const map=maps.get(row.list)||realEnergy(m,owner,row.list);next=map.filter(e=>e.card.id!==row.c.id);const costs=row.list===source?[attack.cost]:realAttacks(m,owner,row.list).map(a=>a.cost),before=Math.min(6,...costs.map(c=>realMissing(map,c))),after=Math.min(6,...costs.map(c=>realMissing(next,c)));cost+=Math.max(0,after-before)*(row.list===source?35:22);}
    if(!best||cost<best.cost)best={row,cost,next};
   }ordered.push(best.row);if(best.next)maps.set(best.row.list,best.next);remaining.splice(remaining.indexOf(best.row),1);
  }
  let best;
  for(let n=min;n<=max;n++){const value=ordered.slice(0,n).map(x=>x.value),action=out(value);if(!action)continue;const damage=realDamage(m,source,op.active,{...attack,damage:base+n*coefficient,text:''}),ko=damage>=realHp(op.active),score=Math.min(damage,realHp(op.active))*.35+(ko?1200*realPrize(op.active):0)-n*(q.type==='Choose cards'?8:20);if(!best||score>best.score)best={action,score};if(ko)return action;}
  return best?.action||null;
 }
 function realisticPrompt(m,q){
  const previous=m.journal.slice().reverse(),last=previous.find(a=>a.type!=='prompt'),origin=last&&{...last,copiedAttackName:previous.find(a=>a.type==='prompt'&&a.value?.attack)?.value.attack};let owner=actor(m,q.getPerspectivePlayerId?.()??q.playerId);if(!owner)return null;m=fork(m,owner.id);owner=actor(m,owner.id);const out=v=>valid(m,q,v)?{type:'prompt',id:q.id,value:v}:null;
  if(q.type==='Choose attack'){
   const enemy=m.store.state.players.find(p=>p!==owner),energy=realEnergy(m,owner,owner.active);
   const choices=q.cards.flatMap((c,index)=>c.attacks.map(attack=>{let cost=attack.cost;try{const e=new R.CheckAttackCostEffect(owner,attack,owner.active);m.store.reduceEffect(m.store.state,e);cost=e.cost;}catch{}const missing=realMissing(energy,cost);return {index,attack:attack.name,score:realDamage(m,owner.active,enemy.active,attack)-missing*1000};})).sort((a,b)=>b.score-a.score);
   for(const c of choices){const a=out({index:c.index,attack:c.attack});if(a)return a;}
  }
  const discarded=realDiscardPrompt(m,q,owner,origin,out);if(discarded)return discarded;
  const tactical=realCounterPrompt(m,q,owner,out);if(tactical)return tactical;
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
    if(x.c._swshUnionGroup!==undefined&&!owner.assembledVUNIONs?.includes(x.c.name))v-=150;
    if(x.c.superType===R.SuperType.ENERGY&&realSlots(owner).some(l=>l.getPokemonCard().attacks.some(a=>/Oblivion Wing|Junk Hunt/i.test(a.name))))v-=8;return v;};
   rows.sort((a,b)=>discard?losing(a)-losing(b):realisticCardValue(m,owner,b.c)-realisticCardValue(m,owner,a.c));
   if(q.type==='Order cards')return out(rows.map(x=>x.i));
   const min=q.options.min??0,max=Math.min(q.options.max??rows.length,rows.length),planCards=[...realSlots(owner).map(l=>l.getPokemonCard()),...owner.hand.cards],march=planCards.some(c=>c.attacks?.some(a=>a.name==='Night March')),revenge=planCards.some(c=>c.attacks?.some(a=>/Vengeance|Bee Revenge/.test(a.name)));
   const unionGroups=new Set([...planCards,...owner.discard.cards,...owner.deck.cards,...owner.prizes.flatMap(l=>l.cards)].filter(c=>c._swshUnionGroup!==undefined&&!owner.assembledVUNIONs?.includes(c.name)).map(c=>c._swshUnionGroup));
   const setupDiscards=discard&&!rows.every(x=>owner.hand.cards.some(c=>c.id===x.c.id))?rows.filter(x=>unionGroups.has(x.c._swshUnionGroup)|| (march?x.c.attacks?.some(a=>a.name==='Night March'):revenge&&x.c.superType===R.SuperType.POKEMON)).length:0;
   const wanted=setupDiscards?Math.max(min,Math.min(max,setupDiscards)):/BENCH|SEARCH|DRAW|HAND|RECOVER/.test(String(q.message))&&!discard?max:min;
   const value=subsets(rows.map(x=>x.i),wanted,wanted,v=>valid(m,q,v),1500)||subsets(rows.map(x=>x.i),min,max,v=>valid(m,q,v),3000);return value===undefined?null:out(value);
  }
  if(q.type==='Choose pokemon'){
   const rows=targets(m,q),op=m.store.state.players.find(p=>p!==owner),harm=/DAMAGE|DISCARD|PICK_UP/.test(String(q.message));
   const value=x=>{if(x.target.player===R.PlayerType.TOP_PLAYER){const hint=powerDamageHint(m,owner,origin),damage=hint??Math.max(0,...realAttacks(m,owner,owner.active).filter(a=>a.missing===0).map(a=>realDamage(m,owner.active,x.list,a.attack)));return (harm?1:1)*(damage>=realHp(x.list)?300*realPrize(x.list):0)+realPrize(x.list)*12+(x.list.getPokemonCard()?.powers.length?20:0)-realHp(x.list)*.1;}
    const attacks=realAttacks(m,owner,x.list);return Math.max(0,...attacks.map(a=>realPrintedDamage(m,owner,x.list,a.attack,true)/(a.missing+1)))*2+realHp(x.list)*.15-(harm?realPrize(x.list)*50:0)-(op&&prizeCount(op)<=realPrize(x.list)?55:0);};
   rows.sort((a,b)=>value(b)-value(a));const v=subsets(rows.map(x=>x.target),q.options.min??1,q.options.max??1,v=>valid(m,q,v));return v===undefined?null:out(v);
  }
  if(q.type==='Attach energy'){
   const ts=targets(m,q).filter(x=>x.target.player===R.PlayerType.BOTTOM_PLAYER),maps=new Map(ts.map(x=>[JSON.stringify(x.target),realEnergy(m,owner,x.list)]));
   const cards=q.cardList.cards.map((card,index)=>({card,index})).filter(x=>x.card.superType===R.SuperType.ENERGY&&!q.options.blocked.includes(x.index)&&R.matchesPromptFilter(x.card,q.filter));
   const min=q.options.count??q.options.min??0,max=q.options.count??q.options.max??cards.length,moves=[],used=new Set(),usedTargets=new Set();
   while(moves.length<max){let best;for(const row of cards){if(used.has(row.index)||q.options.validCardTypes&&!row.card.provides.some(t=>q.options.validCardTypes.includes(t)))continue;
    for(const x of ts){const key=JSON.stringify(x.target);if(q.options.differentTargets&&usedTargets.has(key))continue;const map=maps.get(key),next=map.concat({card:row.card,provides:row.card.provides||[]});
     const gain=Math.max(0,...realAttacks(m,owner,x.list).map(a=>{const before=realMissing(map,a.cost),after=realMissing(next,a.cost);const op=m.store.state.players.find(p=>p!==owner),hp=realHp(op.active),oldDamage=realDamage(m,x.list,op.active,a.attack,map),newDamage=realDamage(m,x.list,op.active,a.attack,next),boost=Math.max(0,Math.min(hp,newDamage)-Math.min(hp,oldDamage));return Math.max(before>after?(before-after)*20+(after===0?55:0)+(x.list===owner.active?20:5):0,boost+(newDamage>=hp&&oldDamage<hp?80:0));}));
     if(!best||gain>best.gain)best={row,x,key,next,gain};}}
    if(!best||best.gain===0&&moves.length>=min)break;moves.push({index:best.row.index,to:best.x.target});used.add(best.row.index);usedTargets.add(best.key);maps.set(best.key,best.next);
   }
   if(moves.length>=min){const selected=out(moves);if(selected)return selected;}
  }
  return null;
 }
 function realisticScore(m,id){
  const g=m.store.state,p=actor(m,id),op=g.players.find(x=>x!==p);if(g.phase===R.GamePhase.FINISHED)return g.winner===R.GameWinner.DRAW?0:g.players[g.winner]?.id===id?1000000:-1000000;
  const own=realSlots(p),enemy=realSlots(op),threats=enemy.flatMap(l=>realAttacks(m,op,l).filter(a=>a.missing<=1).map(a=>({list:l,...a}))),hand=p.hand.cards;
  let value=(prizeCount(op)-prizeCount(p))*1200;
  const ready=own.map(l=>({list:l,attacks:realAttacks(m,p,l)}));
  for(const [i,row] of ready.entries()){
   const l=row.list,c=l.getPokemonCard(),damage=Math.max(0,...row.attacks.map(a=>realPrintedDamage(m,p,l,a.attack,true)/(a.missing+1))),missing=Math.min(6,...row.attacks.map(a=>a.missing));
   value+=Math.min(realHp(l),180)*.13+Math.min(damage,Math.max(60,...enemy.map(realHp)))*(l===p.active?1.1:.55)+Math.max(0,3-missing)*13;
   if(c.powers.some(a=>!/(?:when|whenever) you play (?:this )?Pok[eé]mon[\s\S]*(?:hand|Bench)|when you put this[\s\S]*Bench/i.test(a.text||'')))value+=12;
   const units=realEnergy(m,p,l).reduce((n,e)=>n+R.StateUtils.getProvidesUnitCount(e.provides,e),0),cost=Math.max(0,...row.attacks.map(a=>a.cost.length));const scales=row.attacks.some(a=>/Energy[\s\S]*attached/i.test(a.attack.text||'')&&realResourceDamage(m,p,l,a.attack)!==null);value+=Math.min(units,cost)*5-(scales?0:Math.max(0,units-cost)*12);
   if(l===p.active){const incoming=Math.max(0,...threats.map(t=>realDamage(m,t.list,l,t.attack)*(t.missing? .5:1)));if(incoming>=realHp(l)){value-=realPrize(l)*65;if(prizeCount(op)<=realPrize(l))value-=210;}}
   else if(realPrize(l)>1&&damage<30&&op.prizes.length){value-=42+(prizeCount(op)<=realPrize(l)?35:0);}
  }
  if(own.length===1)value-=55;else if(ready.slice(1).some(x=>x.attacks.some(a=>a.missing<=1)))value+=35;
  if(own.length>4)value-=(own.length-4)*12;
  /* Do not reward playing every available card. Keep useful resources in hand. */
  value+=hand.reduce((n,c)=>n+Math.min(50,realisticCardValue(m,p,c))*.22,0);
  value-=Math.min(op.hand.cards.length,10)*4;
  if(op.deck.cards.length<4)value+=(4-op.deck.cards.length)*45;
  const draw=hand.some(c=>c.superType===R.SuperType.TRAINER&&realOwnDraw(c));if(!draw&&hand.length<2)value-=28;
  const deck=p.deck.cards.length;value-=deck===0?450:deck<4?(4-deck)*75:0;
  for(const l of enemy){value-=Math.min(realHp(l),240)*.14;if(l===op.active)value-=realHp(l)*.35;else value+=Math.min(l.damage,realHp(l))*.08;}
  return value;
 }
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
 return {levels,decks,choose,prompt,valid,copy,score,fork,candidates,strategy:{evaluate:(m,id)=>realisticScore(fork(m,id),id),cardValue:(m,id,c)=>{const f=fork(m,id);return realisticCardValue(f,actor(f,id),c);},diagnostics:()=>copy(realisticLast),energyDeficit:realMissing,availableAttacks:(m,id,index=0)=>{const f=fork(m,id),p=actor(f,id);return realAttacks(f,p,[p.active,...p.bench][index]).map(a=>({name:a.attack.name,missing:a.missing}));},prizeValue:realPrize,printedPotential:(m,id,index=0,attack=0)=>{const f=fork(m,id),p=actor(f,id),l=[p.active,...p.bench][index];return realPrintedDamage(f,p,l,l.getPokemonCard().attacks[attack]);},clearPlan:()=>{realPlan=null;}}};
})();


