/* Optional shared New Rule environment. All decisions use the engine's journalled prompts. */
globalThis.IlexNewRules=(()=>{
 'use strict';
 const R=()=>globalThis.TCGRules, defs=()=>globalThis.IlexNewRuleCards,
  def=id=>defs().find(c=>c.id===id), env=s=>s.newRules,
  has=(s,id)=>!!env(s)?.active.some(c=>c.id===id),
  board=p=>[p.active,...p.bench].filter(l=>l.getPokemonCard()),
  opp=(s,p)=>s.players.find(x=>x!==p),
  pokemon=c=>c?.superType===R().SuperType.POKEMON,
  energy=c=>c?.superType===R().SuperType.ENERGY,
  basic=c=>energy(c)&&c.energyType===R().EnergyType.BASIC,
  special=c=>energy(c)&&!basic(c),
  trainer=c=>c?.superType===R().SuperType.TRAINER,
  item=c=>trainer(c)&&c.trainerType===R().TrainerType.ITEM,
  tool=c=>trainer(c)&&c.trainerType===R().TrainerType.TOOL,
  supporter=c=>trainer(c)&&c.trainerType===R().TrainerType.SUPPORTER,
  stadium=c=>trainer(c)&&c.trainerType===R().TrainerType.STADIUM,
  occupied=l=>!!l.getPokemonCard(), basicSlot=l=>l.getPokemonCard()?.stage===R().Stage.BASIC;
 const synthetic=id=>{const c=new (R().TrainerCard)(),d=def(id);Object.assign(c,{id:-100000-defs().indexOf(d),name:d.name,fullName:'New Rule '+d.name,set:'NEW-RULE',setNumber:id,_newRule:id,_labId:'new-rule-'+id,trainerType:R().TrainerType.TOOL});return c;};
 function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 function init(store,spec){if(!spec.newRules)return;if(spec.newRules.version!==1)throw Error('Unsupported New Rule version');const ids=defs().map(c=>c.id);if(spec.newRules.deck&&(spec.newRules.deck.length!==ids.length||new Set(spec.newRules.deck).size!==ids.length||spec.newRules.deck.some(id=>!ids.includes(id))))throw Error('New Rule deck must contain each of the 96 rules once');
  // Independent deterministic shuffle: enabling this mode does not change opening hands.
  let n=(spec.seed^0x4e52554c)>>>0;const order=ids.slice();for(let i=order.length-1;i>0;i--){n=(Math.imul(n,1664525)+1013904223)>>>0;const j=n%(i+1);[order[i],order[j]]=[order[j],order[i]];}
  store.state.newRules={version:1,actionIndex:-1,interactionFixesFromAction:spec.newRules.interactionFixesFromAction,deck:spec.newRules.interactionFixesFromAction===0&&spec.newRules.deck?spec.newRules.deck.slice():order,active:[],discard:[],serial:0,hex:[],knockouts:{},initialPrizes:{},reveals:[]};
 }
 function correctedInteractions(s){const n=env(s);return !!n&&n.actionIndex>=(n.interactionFixesFromAction??Infinity);}
 function finishReplay(m){const n=env(m.store.state);if(!n)return;const at=Math.min(m.spec.newRules.interactionFixesFromAction,m.journal.length);m.spec.newRules.interactionFixesFromAction=at;n.interactionFixesFromAction=at;n.actionIndex=m.journal.length;}
 function beforeAction(m){if(env(m.store.state))env(m.store.state).actionIndex=m.journal.length;}
 function benchSpace(s,p){const st=s._nrStore,e=new (R().CheckTableStateEffect)(s.players.map(()=>5));if(st)st.reduceEffect(s,e);const cap=e.benchSizes[s.players.indexOf(p)];return Math.max(0,Math.min(p.bench.filter(l=>!occupied(l)).length,cap-p.bench.filter(occupied).length));}
 function preventsStadium(s,p,c){return correctedInteractions(s)&&has(s,'barrier-shrine')&&stadium(c)&&p.hand.cards.includes(c);}
 function run(st,s,g,done=()=>{}){const step=v=>{const next=g.next(v);if(next.done){if(st.hasPrompts())st.waitPrompt(s,done);else done();return;}const p=next.value;if(p)p.newRule=true;if(!p){step();return;}st.prompt(s,p,result=>step(result));};step();return s;}
 function* pick(p,msg,cards,predicate=()=>true,min=0,max=1,opts={}){
  const eligible=cards.cards.filter(predicate);if(!eligible.length)return [];
  const a=yield new (R().ChooseCardsPrompt)(p,msg,cards,{}, {min:Math.min(min,eligible.length),max:Math.min(max,eligible.length),blocked:cards.cards.map((c,i)=>predicate(c)?-1:i).filter(i=>i>=0),allowCancel:false,isSecret:false,...opts});return a||[];
 }
 function* select(p,msg,values){if(!values.length)return null;return yield new (R().SelectPrompt)(p.id,msg,values,{allowCancel:false,isBlindGuess:/Guess its printed/.test(msg)});}
 function* chooseSlot(p,msg,slots){const i=yield*select(p,msg,slots.map(l=>(l===p.active?'Active':'Bench '+(p.bench.indexOf(l)+1))+' · '+l.getPokemonCard().name));return i===null?null:slots[i];}
 function* reveal(p,cards,msg='Revealed cards'){if(cards.length)yield new (R().ShowCardsPrompt)(p.id,msg,cards);}
 function* coin(st,s,p){let result;st.reduceEffect(s,new (R().CoinFlipEffect)(p,x=>{result=x}));if(st.hasPrompts())yield new (R().WaitPrompt)(p.id,0,undefined,false);return !!result;}
 function draw(st,s,p,n){if(n>0)R().MOVE_CARDS(st,s,p.deck,p.hand,{count:Math.min(n,p.deck.cards.length)});}
 function move(st,s,from,to,cards){if(cards.length)R().MOVE_CARDS(st,s,from,to,{cards});}
 function shuffleDeck(p){shuffle(p.deck.cards);}
 function* search(st,s,p,predicate,max=1,min=0,source=p.deck,options={}){const cards=yield*pick(p,'Choose cards',source,predicate,min,max,options);yield*reveal(opp(s,p),cards);move(st,s,source,p.hand,cards);if(source===p.deck)shuffleDeck(p);return cards;}
 function* discard(st,s,p,n,predicate=()=>true){const cards=yield*pick(p,'Choose cards to discard',p.hand,predicate,n,n);move(st,s,p.hand,p.discard,cards);return cards;}
 function* takeTop(st,s,p,count,n,destination){const pile=new (R().CardList)();move(st,s,p.deck,pile,p.deck.cards.slice(0,count));const cards=yield*pick(p,'Choose cards to put into your hand',pile,()=>true,Math.min(n,pile.cards.length),n);move(st,s,pile,p.hand,cards);move(st,s,pile,destination,pile.cards.slice());}
 function attach(st,s,p,source,c,target){if(!source.cards.includes(c)||!occupied(target))return false;const e=new (R().AttachEnergyEffect)(p,c,target);e.source=source;e.origin='new-rule';st.reduceEffect(s,e);return target.cards.includes(c)||target.energies.cards.includes(c);}
 function* attachChosen(st,s,p,source,predicate,max=1,{same=false,slots=board(p),min=0,differentTypes=false}={}){const cards=yield*pick(p,'Choose Energy to attach',source,predicate,min,max,{differentTypes});if(!slots.length)return 0;let target=null,count=0;for(const c of cards){if(!same||!target)target=yield*chooseSlot(p,'Choose the Pokémon receiving Energy',slots);if(target&&attach(st,s,p,source,c,target))count++;}return count;}
 function hp(st,s,p,l){const e=new (R().CheckHpEffect)(p,l);st.reduceEffect(s,e);return e.hp;}
 function finish(st,s,done=()=>{}){const check=()=>{if(s.phase!==R().GamePhase.FINISHED)R().checkState(st,s,done);else done();};if(st.hasPrompts())st.waitPrompt(s,check);else check();}
 function* gust(st,s,p,chooser=p){const o=opp(s,p),slots=o.bench.filter(occupied),i=yield*select(chooser,'Choose opponent’s new Active Pokémon',slots.map(l=>l.getPokemonCard().name));if(i===null)return false;o.switchPokemon(slots[i],st,s);return true;}
 function evolutionAllowed(s,p,l,c,skip=false){const from=l.getPokemonCard();if(!from||!pokemon(c)||c===from)return false;const rules=s.rules.cubeRules;if(rules?.twoPrizeEvolutionOnly&&(R().cubeBasePrizes(from,rules)===2)!==(R().cubeBasePrizes(c,rules)===2))return false;if(rules?.mutantEvolution)return R().cubeEvolution(from,c,skip,rules);
  if(!skip)return c.evolvesFrom===from.name&&c.stage!==R().Stage.BASIC;
  if(c.stage!==R().Stage.STAGE_2)return false;return [...globalThis.RulesMatch?.prototypes?.values?.()||[]].some(m=>m.stage===R().Stage.STAGE_1&&m.evolvesFrom===from.name&&m.name===c.evolvesFrom)||knownEvolutions.some(m=>m[0]===from.name&&m[1]===c.evolvesFrom);
 }
 // Printed intermediate evolution names, populated from the regular catalog by RulesMatch.
 let knownEvolutions=[];
 function botPrompt(m,p,difficulty){if(!p.newRule)return null;const s=m.store.state,owner=s.players.find(x=>x.id===p.playerId),valid=value=>{try{return p.validate(p.decode(value,s),s)}catch{return false}},out=value=>valid(value)?{type:'prompt',id:p.id,value}:null;
  if(p.type==='Choose cards'){const discard=/discard/i.test(p.message),eligible=p.cards.cards.map((c,i)=>({c,i})).filter(x=>!p.options.blocked.includes(x.i)),score=c=>(pokemon(c)?(c.hp||0)/10+10:energy(c)?15:supporter(c)?20:12);eligible.sort((a,b)=>(discard?1:-1)*(score(a.c)-score(b.c)));const desired=Math.min(p.options.max,eligible.length);let tries=0;
   function choose(at,cards){if(++tries>4000)return null;if(cards.length===desired)return out(cards);for(let i=at;i<eligible.length;i++){const found=choose(i+1,[...cards,eligible[i].i]);if(found)return found;}return null;}
   return choose(0,[])||out(eligible.slice(0,p.options.min).map(x=>x.i))||out([]);
  }
  if(p.type==='Select'){if(p.options.isBlindGuess){const hash=[...p.message+':'+p.id+':'+p.playerId].reduce((n,c)=>Math.imul(n^c.charCodeAt(0),16777619)>>>0,2166136261);return out(hash%p.values.length);}return out(0);}
  return null;
 }

 function evolve(st,s,p,l,c,source){const e=new (R().EvolveEffect)(p,l,c);e._xyEvolutionSource=source;st.reduceEffect(s,e);return l.getPokemonCard()===c;}
 function off(st,s,p,l,dest){R().MOVE_POKEMON_OFF_BOARD(st,s,l,{pokemonDestination:dest,attachedDestination:dest});}
 function* revealed(st,s,p,id){const o=opp(s,p),nr=env(s);
  if(id==='hex-maniac'){nr.hex.push({opponent:o.id,started:false});return;}
  if(['iono','lucian','marnie'].includes(id)){const any=s.players.some(x=>x.hand.cards.length);for(const x of s.players){shuffle(x.hand.cards);move(st,s,x.hand,x.deck,x.hand.cards.slice());}if(any)for(const x of [p,o])draw(st,s,x,id==='iono'?x.prizes.filter(z=>z.cards.length).length:id==='marnie'?(x===p?5:4):(yield*coin(st,s,x))?6:3);return;}
  if(id==='colress'){move(st,s,p.hand,p.deck,p.hand.cards.slice());shuffleDeck(p);draw(st,s,p,s.players.reduce((n,x)=>n+x.bench.filter(occupied).length,0));return;}
  if(id==='hugh'){for(const x of [o,p]){if(x.hand.cards.length>5)yield*discard(st,s,x,x.hand.cards.length-5);else draw(st,s,x,5-x.hand.cards.length);}return;}
  if(id==='jessie-and-james'){for(const x of [o,p])yield*discard(st,s,x,Math.min(2,x.hand.cards.length));return;}
  if(id==='karen'||id==='lysandre-s-trump-card'){for(const x of s.players){move(st,s,x.discard,x.deck,x.discard.cards.filter(id==='karen'?pokemon:()=>true));shuffleDeck(x);}return;}
 }
 function beforeTurn(st,s,next){const nr=env(s);if(!nr){next();return;}
  const p=s.players[s.activePlayer];for(const x of s.players)nr.initialPrizes[x.id]??=x.prizes.filter(z=>z.cards.length).length;
  nr.hex=nr.hex.filter(h=>!(h.started&&h.opponent!==p.id));for(const h of nr.hex)if(h.opponent===p.id)h.started=true;
  run(st,s,(function*(){
   if(!nr.deck.length&&nr.discard.length){nr.deck=shuffle(nr.discard.splice(0));}
   if(!nr.deck.length)return;
   const id=nr.deck.shift();nr.reveals.push({turn:s.turn,player:p.id,id});
   yield*reveal(opp(s,p),[synthetic(id)],'New Rule · '+def(id).name);
   if(nr.active.length===5){const at=yield*select(p,'Choose the New Rule to replace',nr.active.map(c=>def(c.id).name));nr.discard.push(nr.active.splice(at,1)[0].id);}
   if(['parallel-city','collapsed-stadium'].includes(id))nr.lastResizePlayer=p.id;
   const entry={id,instance:++nr.serial,used:{},facing:p.id};nr.active.push(entry);
   if(id==='parallel-city'){const side=yield*select(p,'Who faces the three-Pokémon Bench limit?',s.players.map(x=>x.name));entry.facing=s.players[side].id;}
   yield*revealed(st,s,p,id);
  })(),()=>{s.phase=R().GamePhase.BETWEEN_TURNS;finish(st,s,()=>{if(s.phase!==R().GamePhase.FINISHED)next();});});
 }
 function canUse(s,p,e){if(!e||!occupied(p.active))return false;const d=def(e.id);if(d.mode!=='action')return false;if(!d.repeat&&e.used[p.id]===s.turn)return false;
  const hand=p.hand.cards,deck=p.deck.cards,dis=p.discard.cards,own=board(p),o=opp(s,p),id=e.id;
  if(['trade','spiritborne-evolution'].includes(id)&&hand.length<(id==='trade'?1:3))return false;
  if(['giant-water-shuriken','double-gunner'].includes(id)&&!hand.some(energy))return false;
  if(id==='double-gunner'&&o.bench.filter(occupied).length<2)return false;
  if(id==='heat-factory'&&!hand.some(basic))return false;
  if(['crazy-code','ripening-charge','teal-dance','underworld-door'].includes(id)&&!hand.some(id==='crazy-code'?special:basic))return false;
  if(id==='underworld-door'&&!p.bench.some(occupied))return false;
  if(['charging-up','psychic-embrace','welder','dino-cry'].includes(id)&&!dis.some(basic))return false;
  if(id==='psychic-embrace'&&!own.some(l=>l.damage+20<hpFor(s,p,l)))return false;
  if(id==='dino-cry'&&!own.some(basicSlot))return false;
  if(['vanishing-wings','hyper-blower'].includes(id)&&!p.bench.some(occupied))return false;
  if(['hyper-blower','guzma'].includes(id)&&!o.bench.some(occupied))return false;
  if(id==='guzma'&&!p.bench.some(occupied))return false;
  if(id==='delinquent'&&!s.players.some(x=>x.stadium.cards.length))return false;
  if(['tyme','cedric-juniper'].includes(id)&&!hand.some(c=>pokemon(c)&&(id==='tyme'||verifiedHeights[c._labId]!==undefined)))return false;
  if(id==='flip-the-script'&&(!Number.isInteger(env(s).knockouts[p.id])||env(s).knockouts[p.id]!==o.wotcLastTurnEnded))return false;
  if(id==='green-s-exploration'&&own.some(l=>{const e=new (R().CheckPokemonPowersEffect)(p,l.getPokemonCard());s._nrStore?.reduceEffect(s,e);return e.powers.some(a=>abilityType(s,a));}))return false;
  if(id==='vessel-of-life'&&!own.some(l=>l.tools.length<R().smToolCapacity(s._nrStore,s,p,l)))return false;
  if(id==='run-away-draw'&&!own.some(l=>correctedInteractions(s)||!has(s,'scoop-up-block')||!l.damage))return false;
  if(id==='tandem-unit'&&correctedInteractions(s)&&benchSpace(s,p)===0)return false;
  if(['industrious-incisors','tropical-beach'].includes(id)&&hand.length>=(id==='tropical-beach'?7:5))return false;
  return true;
 }
 function hpFor(s,p,l){const st=s._nrStore;if(st)return hp(st,s,p,l);return l.getPokemonCard().hp;}
 function actions(m,p){const s=m.store.state;Object.defineProperty(s,'_nrStore',{value:m.store,writable:true,configurable:true,enumerable:false});if(!env(s)||s.phase!==R().GamePhase.PLAYER_TURN||m.store.hasPrompts()||s.players[s.activePlayer]!==p)return [];return env(s).active.filter(e=>canUse(s,p,e)).map(e=>({type:'new-rule',player:p.id,instance:e.instance,name:def(e.id).name}));}
 function activate(m,a){const st=m.store,s=st.state,p=s.players[s.activePlayer],e=env(s)?.active.find(x=>x.instance===a.instance);if(!p||a.player!==p.id||!canUse(s,p,e))throw Error('This New Rule cannot be used now');e.used[p.id]=s.turn;return run(st,s,effect(st,s,p,e.id,e),()=>finish(st,s));}
 function* effect(st,s,p,id,entry){const o=opp(s,p),nr=env(s);
  const simpleDraw={'concealed-cards':2,'instant-charge':3,'flip-the-script':3};if(simpleDraw[id]){draw(st,s,p,simpleDraw[id]);if(id==='instant-charge')st.reduceEffect(s,new (R().EndTurnEffect)(p));return;}
  if(['phantom-star','sprint'].includes(id)){move(st,s,p.hand,p.discard,p.hand.cards.slice());draw(st,s,p,id==='sprint'?4:7);return;}
  if(['industrious-incisors','tropical-beach','fusion-strike-system'].includes(id)){const n=id==='fusion-strike-system'?board(p).length:Math.max(0,(id==='tropical-beach'?7:5)-p.hand.cards.length),before=p.hand.cards.length;draw(st,s,p,n);if(id==='tropical-beach'&&p.hand.cards.length>before)st.reduceEffect(s,new (R().EndTurnEffect)(p));return;}
  if(id==='conversion-star'){const cards=yield*pick(p,'Choose cards to discard',p.hand,()=>true,0,p.hand.cards.length);move(st,s,p.hand,p.discard,cards);draw(st,s,p,cards.length);return;}
  if(id==='trade'||id==='heat-factory'){yield*discard(st,s,p,1,id==='trade'?()=>true:basic);draw(st,s,p,id==='trade'?2:3);return;}
  if(id==='nest-stash'){const n=p.hand.cards.length;shuffle(p.hand.cards);move(st,s,p.hand,p.deck,p.hand.cards.slice());if(n)draw(st,s,p,1);return;}
  if(id==='colress-experiment'||id==='flower-selecting'||id==='explorer-s-guidance'){yield*takeTop(st,s,p,id==='colress-experiment'?5:id==='flower-selecting'?2:6,id==='colress-experiment'?3:id==='flower-selecting'?1:2,id==='explorer-s-guidance'?p.discard:p.lostzone);return;}
  if(['attract-customers','mysterious-tail','candice'].includes(id)){const pile=new (R().CardList)();move(st,s,p.deck,pile,p.deck.cards.slice(0,id==='candice'?7:6));const cards=yield*pick(p,'Choose cards to put into your hand',pile,id==='candice'?c=>pokemon(c)||energy(c):id==='attract-customers'?supporter:item,0,id==='candice'?7:1);yield*reveal(o,cards);move(st,s,pile,p.hand,cards);move(st,s,pile,p.deck,pile.cards.slice());shuffleDeck(p);return;}
  if(id==='clay'||id==='pokestop'){const cards=p.deck.cards.slice(0,id==='clay'?7:3);move(st,s,p.deck,p.discard,cards);move(st,s,p.discard,p.hand,cards.filter(c=>item(c)&&p.discard.cards.includes(c)));return;}
  if(id==='legacy-star'){move(st,s,p.deck,p.discard,p.deck.cards.slice(0,7));yield*search(st,s,p,()=>true,2,0,p.discard);return;}
  if(id==='star-abyss'||id==='lusamine'){yield*search(st,s,p,id==='star-abyss'?item:c=>supporter(c)||stadium(c),2,id==='lusamine'?2:0,p.discard);return;}
  if(id==='illuminate'||id==='town-store'||id==='star-perfume'||id==='ball-guy'||id==='green-s-exploration'){yield*search(st,s,p,id==='illuminate'?pokemon:id==='town-store'?tool:id==='star-perfume'?c=>pokemon(c)||basic(c):id==='ball-guy'?c=>item(c)&&/\bball\b/i.test(c.name):trainer,id==='star-perfume'?5:id==='ball-guy'?3:id==='green-s-exploration'?2:1,0,p.deck,id==='ball-guy'?{differentNames:true}:{});return;}
  if(id==='arven'){yield*search(st,s,p,item,1);yield*search(st,s,p,tool,1);return;}
  if(id==='premonition'){const pile=new (R().CardList)();move(st,s,p.deck,pile,p.deck.cards.slice(0,5));const cards=[];while(pile.cards.length){const [c]=yield*pick(p,'Choose the next card, top first',pile,()=>true,1,1);pile.cards.splice(pile.cards.indexOf(c),1);cards.push(c);}p.deck.cards.unshift(...cards);return;}
  if(id==='primate-wisdom'){if(!p.deck.cards.length||!p.hand.cards.length)return;const [c]=yield*pick(p,'Choose a card to exchange with the top of your deck',p.hand,()=>true,1,1);const top=p.deck.cards.shift();p.hand.cards.splice(p.hand.cards.indexOf(c),1,top);p.deck.cards.unshift(c);return;}
  if(id==='search-the-premises'){yield*reveal(p,p.hand===o.hand?[]:o.hand.cards.slice(),'Opponent’s hand');return;}
  if(id==='miss-fortune-sisters'){const pile=new (R().CardList)();move(st,s,o.deck,pile,o.deck.cards.slice(0,5));const cards=yield*pick(p,'Choose opponent’s Items to discard',pile,item,0,5);move(st,s,pile,o.discard,cards);move(st,s,pile,o.deck,pile.cards.slice());shuffleDeck(o);return;}
  if(id==='delinquent'){for(const x of s.players)move(st,s,x.stadium,x.discard,x.stadium.cards.slice());yield*discard(st,s,o,Math.min(3,o.hand.cards.length));return;}
  if(['crazy-code','charging-up','ripening-charge','teal-dance','underworld-door','psychic-embrace'].includes(id)){const source=['charging-up','psychic-embrace'].includes(id)?p.discard:p.hand,slots=(id==='underworld-door'?p.bench.filter(occupied):board(p)).filter(l=>id!=='psychic-embrace'||l.damage+20<hp(st,s,p,l));const [c]=yield*pick(p,'Choose Energy to attach',source,id==='crazy-code'?special:basic,1,1);const l=yield*chooseSlot(p,'Choose a Pokémon',slots);if(c&&l&&attach(st,s,p,source,c,l)){if(id==='psychic-embrace')st.reduceEffect(s,new (R().PlaceDamageCountersEffect)(p,l,20));if(id==='ripening-charge')st.reduceEffect(s,new (R().HealEffect)(p,l,30));if(id==='teal-dance')draw(st,s,p,1);if(id==='underworld-door')draw(st,s,p,2);}return;}
  if(['welder','dino-cry','primal-turbo','strong-charge'].includes(id)){const source=['primal-turbo','strong-charge'].includes(id)?p.deck:p.discard;const n=yield*attachChosen(st,s,p,source,id==='primal-turbo'?special:basic,2,{same:['welder','primal-turbo'].includes(id),slots:board(p).filter(l=>id!=='dino-cry'||basicSlot(l)),differentTypes:id==='strong-charge'});if(source===p.deck)shuffleDeck(p);if(id==='welder'&&n)draw(st,s,p,3);if(id==='dino-cry')st.reduceEffect(s,new (R().EndTurnEffect)(p));return;}
  if(['metal-maker','intrepid-sword','shining-arcana','tri-howl'].includes(id)){const pile=new (R().CardList)();move(st,s,p.deck,pile,p.deck.cards.slice(0,id==='metal-maker'?4:id==='shining-arcana'?2:3));yield*attachChosen(st,s,p,pile,id==='tri-howl'?energy:basic,pile.cards.length,{same:id==='intrepid-sword'});if(id==='metal-maker'){shuffle(pile.cards);move(st,s,pile,p.deck,pile.cards.slice());}else move(st,s,pile,id==='tri-howl'?p.discard:p.hand,pile.cards.slice());if(id==='intrepid-sword')st.reduceEffect(s,new (R().EndTurnEffect)(p));return;}
  if(['feather-arrow','giant-water-shuriken','double-gunner','cursed-blast'].includes(id)){if(id==='giant-water-shuriken'||id==='double-gunner')yield*discard(st,s,p,1,energy);if(id==='double-gunner'){const slots=o.bench.filter(occupied),first=yield*chooseSlotFor(p,o,'Choose the first opposing Benched Pokémon',slots),second=yield*chooseSlotFor(p,o,'Choose a different opposing Benched Pokémon',slots.filter(l=>l!==first));if(first)st.reduceEffect(s,new (R().PlaceDamageCountersEffect)(p,first,20));if(second)st.reduceEffect(s,new (R().PlaceDamageCountersEffect)(p,second,20));}else{const target=yield*chooseSlotFor(p,o,'Choose an opponent’s Pokémon',board(o));if(target)st.reduceEffect(s,new (R().PlaceDamageCountersEffect)(p,target,id==='feather-arrow'?20:id==='cursed-blast'?130:60));if(id==='cursed-blast'){const own=yield*chooseSlot(p,'Choose your Pokémon to Knock Out',board(p));if(own)own.damage=hp(st,s,p,own);}}return;}
  if(id==='goodnight-babies'){for(const x of s.players){const e=new (R().AddSpecialConditionsPowerEffect)(x,synthetic(id),x.active,[R().SpecialCondition.ASLEEP]);st.reduceEffect(s,e);}return;}
  if(id==='guzma'){if(yield*gust(st,s,p)){const l=yield*chooseSlot(p,'Choose your new Active Pokémon',p.bench.filter(occupied));if(l)p.switchPokemon(l,st,s);}return;}
  if(id==='hyper-blower'){const l=yield*chooseSlot(p,'Choose your Benched Pokémon to discard',p.bench.filter(occupied));if(l)off(st,s,p,l,p.discard);yield*gust(st,s,p,o);return;}
  if(id==='vanishing-wings'||id==='run-away-draw'){let drawn=true;if(id==='run-away-draw'){const n=p.hand.cards.length;draw(st,s,p,3);drawn=p.hand.cards.length>n;}if(drawn){const l=yield*chooseSlot(p,'Choose your Pokémon to shuffle into the deck',(id==='vanishing-wings'?p.bench.filter(occupied):board(p)).filter(l=>correctedInteractions(s)||!has(s,'scoop-up-block')||!l.damage));if(l)off(st,s,p,l,p.deck);shuffleDeck(p);}return;}
  if(id==='tandem-unit'){const cards=yield*pick(p,'Choose Basic Pokémon for your Bench',p.deck,c=>pokemon(c)&&c.stage===R().Stage.BASIC,0,Math.min(2,correctedInteractions(s)?benchSpace(s,p):p.bench.filter(l=>!occupied(l)).length));yield*reveal(o,cards);for(const c of cards){const l=p.bench.find(l=>!occupied(l));if(l){move(st,s,p.deck,l,[c]);l.pokemonPlayedTurn=s.turn;}}shuffleDeck(p);return;}
  if(['grand-tree','spiritborne-evolution','quick-ripening-herb'].includes(id)){if(id==='spiritborne-evolution')yield*discard(st,s,p,3);const skip=id==='quick-ripening-herb',source=skip?p.hand:p.deck,slots=board(p).filter(l=>(id==='spiritborne-evolution'||basicSlot(l))&&(skip||s.turn>2&&l.pokemonPlayedTurn!==s.turn)&&source.cards.some(c=>evolutionAllowed(s,p,l,c,skip)));const l=yield*chooseSlot(p,'Choose your Pokémon to evolve',slots);if(l){const [c]=yield*pick(p,'Choose an Evolution Pokémon',source,c=>evolutionAllowed(s,p,l,c,skip),0,1);if(c){yield*reveal(o,[c]);if(evolve(st,s,p,l,c,source)&&id==='grand-tree'){const [stage2]=yield*pick(p,'Choose a Stage 2 Pokémon',source,c=>evolutionAllowed(s,p,l,c)&&c.stage===R().Stage.STAGE_2,0,1);if(stage2){yield*reveal(o,[stage2]);evolve(st,s,p,l,stage2,source);}}}}if(source===p.deck)shuffleDeck(p);return;}
  if(id==='parallel-city'){nr.lastResizePlayer=p.id;entry.facing=opp(s,s.players.find(x=>x.id===entry.facing)).id;return;}
  if(id==='vessel-of-life'){const l=yield*chooseSlot(p,'Attach Vessel of Life as a Pokémon Tool',board(p).filter(l=>l.tools.length<R().smToolCapacity(st,s,p,l)));if(l){const c=synthetic(id);c._newRuleInstance=entry.instance;c.id=-100000-entry.instance;l.tools.push(c);nr.active.splice(nr.active.indexOf(entry),1);}return;}
  if(id==='tyme'||id==='cedric-juniper'){const [c]=yield*pick(p,'Choose a Pokémon face down',p.hand,c=>pokemon(c)&&(id==='tyme'||verifiedHeights[c._labId]!==undefined),1,1);if(!c)return;const value=id==='tyme'?c.hp:verifiedHeights[c._labId];let guess;
   if(id==='tyme'){const values=Array.from({length:100},(_,i)=>(i+1)*10),at=yield*select(o,c.name+' · Guess its printed HP',values.map(String));guess=values[at];}
   else {const feet=yield*select(o,c.name+' · Guess its printed height: feet',Array.from({length:101},(_,i)=>String(i))),inches=yield*select(o,c.name+' · Guess its printed height: inches',Array.from({length:12},(_,i)=>String(i)));guess=feet*12+inches;}
   yield*reveal(o,[c]);draw(st,s,guess===value?o:p,id==='tyme'?4:3);return;}
  throw Error('Unimplemented New Rule: '+id);
 }
 function* chooseSlotFor(chooser,owner,msg,slots){const i=yield*select(chooser,msg,slots.map(l=>(l===owner.active?'Active':'Bench '+(owner.bench.indexOf(l)+1))+' · '+l.getPokemonCard().name));return i===null?null:slots[i];}
 const verifiedHeights={"base1-1":59,"base1-2":63,"base1-3":43,"base1-4":67,"base1-5":24,"base1-6":256,"base1-7":55,"base1-8":63,"base1-9":39,"base1-10":79,"base1-11":55,"base1-12":43,"base1-13":51,"base1-14":31,"base1-15":79,"base1-16":63,"base1-17":39,"base1-18":157,"base1-19":28,"base1-20":43,"base1-21":47,"base1-22":43,"base1-23":75,"base1-24":43,"base1-25":67,"base1-26":71,"base1-27":31,"base1-28":28,"base1-29":63,"base1-30":39,"base1-31":55,"base1-32":51,"base1-33":24,"base1-34":59,"base1-35":35,"base1-36":51,"base1-37":35,"base1-38":40,"base1-39":31,"base1-40":28,"base1-41":43,"base1-42":39,"base1-43":35,"base1-44":28,"base1-45":12,"base1-46":24,"base1-47":8,"base1-48":55,"base1-49":39,"base1-50":51,"base1-51":24,"base1-52":31,"base1-53":12,"base1-54":28,"base1-55":16,"base1-56":346,"base1-57":12,"base1-58":16,"base1-59":24,"base1-60":39,"base1-61":12,"base1-62":24,"base1-63":20,"base1-64":43,"base1-65":31,"base1-66":39,"base1-67":20,"base1-68":24,"base1-69":12};
 function abilityType(s,power){return power?.powerType===R().PowerType.ABILITY||!!s.rules.cubeRules?.unifiedAbilities&&[R().PowerType.POKEPOWER,R().PowerType.POKEBODY].includes(power?.powerType);}
 function blocked(s,p,c,power){if(!env(s)||!c||power?.exemptFromAbilityLock||power?.powerType!==undefined&&!abilityType(s,power))return false;const inPlay=board(p).some(l=>l.getPokemonCard()===c),inHandOrDiscard=p.hand.cards.includes(c)||p.discard.cards.includes(c);if(!inPlay&&!inHandOrDiscard)return false;
  return !!env(s).hex.length||(has(s,'silent-lab')||has(s,'power-of-alchemy'))&&c.stage===R().Stage.BASIC||has(s,'path-to-the-peak')&&inPlay&&((c.tags||[]).some(t=>['POKEMON_EX','POKEMON_ex','POKEMON_GX','POKEMON_V','POKEMON_VMAX','POKEMON_VSTAR','POKEMON_VUNION','RADIANT','PRISM_STAR','LEGEND','BREAK','POKEMON_TERA','MEGA','POKEMON_SV_MEGA'].some(k=>R().CardTag[k]===t))||c.ruleBox);
 }
 function before(st,s,e){if(!env(s))return null;Object.defineProperty(s,'_nrStore',{value:st,writable:true,configurable:true,enumerable:false});const p=e.player,token={card:e.pokemonCard,fromHand:p?.hand?.cards.includes(e.pokemonCard),old:e.target?.getPokemonCard?.(),owner:s.players.find(x=>x.active===e.target||x.bench.includes(e.target)),active:s.players.some(x=>x.active===e.target),vessel:e.target?.tools?.filter(c=>c._newRule==='vessel-of-life'&&!R().IS_TOOL_BLOCKED(st,s,p||s.players[s.activePlayer],c)).length||0,vesselCards:e.target?.tools?.filter(c=>c._newRule==='vessel-of-life')||[]};
  if((e.type==='APPLY_WEAKNESS_EFFECT'||e.type==='PUT_DAMAGE_EFFECT'&&!e.weaknessApplied&&e.target!==opp(s,p).active)&&e.attackEffect&&!e.attackEffect._wotcTrainer){const parallel=env(s).active.find(c=>c.id==='parallel-city');if(parallel&&p.id!==parallel.facing)e.damage=Math.max(0,e.damage-20);}
  if(e.type==='POWER_EFFECT'&&blocked(s,p,e.card,e.power))throw Error('Abilities are disabled by a New Rule');
  if(['PLAY_STADIUM_EFFECT','TRAINER_EFFECT'].includes(e.type)&&stadium(e.trainerCard)&&p.hand.cards.includes(e.trainerCard)&&has(s,'barrier-shrine'))throw Error('Barrier Shrine prevents playing Stadium cards');
  if(e.type==='KNOCK_OUT_EFFECT'&&has(s,'lost-city')){e.target.marker.addMarker('LOST_CITY_MARKER');for(const c of [...e.target.tools,...e.target.energies.cards])if(!e.target.cards.includes(c))e.target.cards.push(c);}
  if(has(s,'daunting-pose')&&e.target&&token.owner&&e.target!==token.owner.active&&p&&p!==token.owner&&((e.attackEffect&&!e.attackEffect._wotcTrainer)||e.sourceEffect?.power&&abilityType(s,e.sourceEffect.power)||e.power&&abilityType(s,e.power)||(R().CardList.wotcMovementContext?.kind==='power'&&R().CardList.wotcMovementContext?.sourceCard?.powers?.some(a=>abilityType(s,a))))&&['PUT_DAMAGE_EFFECT','DEAL_DAMAGE_EFFECT','PUT_COUNTERS_EFFECT','PUT_DAMAGE_COUNTERS_EFFECT','PLACE_DAMAGE_COUNTERS_EFFECT','AFTER_WEAKNESS_AND_RESISTANCE_EFFECT','KO_EFFECT','EFFECT_OF_ABILITY_EFFECT'].includes(e.type)){e.preventDefault=true;token.skip=true;}
  return token;
 }
 function after(st,s,e,t){if(!env(s)||!t)return;const nr=env(s),p=e.player;
  if(e.type==='CHECK_POKEMON_POWERS_EFFECT'&&blocked(s,p,e.target))e.powers=e.powers.filter(a=>!abilityType(s,a));
  if(e.type==='CHECK_POKEMON_STATS_EFFECT'&&has(s,'ancient-way')&&s.players.some(x=>x.active===e.target))e.weakness=e.weakness.map(w=>({type:w.type,multiplier:4}));
  if(e.type==='CHECK_RETREAT_COST_EFFECT'&&has(s,'skyliner')&&basicSlot(e.target))e.cost=[];
  if(e.type==='CHECK_ATTACK_COST_EFFECT'){if(has(s,'excited-heart')&&e.source===p.active){const o=opp(s,p),taken=(nr.initialPrizes[o.id]??s.rules.prizes)-o.prizes.filter(z=>z.cards.length).length;for(let i=0;i<taken;i++){const at=e.cost.indexOf(R().CardType.COLORLESS);if(at>=0)e.cost.splice(at,1);}}
   if(has(s,'thunder-mountain')){let type=(e.source||p.active).getPokemonCard()?.cardType||[];if(correctedInteractions(s)){const check=new (R().CheckPokemonTypeEffect)(e.source||p.active);st.reduceEffect(s,check);type=check.cardTypes;}const at=e.cost.findIndex(c=>type.includes(c));if(at>=0)e.cost.splice(at,1);}}
  if(e.type==='CHECK_TABLE_STATE_EFFECT'){const parallel=nr.active.find(c=>c.id==='parallel-city');for(let i=0;i<e.benchSizes.length;i++){const limit=parallel?.facing===s.players[i].id?3:has(s,'collapsed-stadium')?4:Infinity;e.benchSizes[i]=Math.min(e.benchSizes[i],limit);}if(nr.lastResizePlayer)e.benchResizeOrder=[nr.lastResizePlayer,...s.players.filter(p=>p.id!==nr.lastResizePlayer).map(p=>p.id)];e.benchOverflowToHand=false;}
  if(e.type==='CHECK_POKEMON_ATTACKS_EFFECT'&&has(s,'shadow-hunt'))for(const c of p.discard.cards.filter(c=>pokemon(c)&&c.stage===R().Stage.BASIC))for(const a of c.attacks){const attack={...a,cost:a.cost.slice(),name:a.name+' · '+c.name+' (Shadow Hunt)',_wotcOriginalAttack:a};e.attacks.push(attack);e.attackSources.set(attack,c);}
  
  if(e.type==='KNOCK_OUT_EFFECT'&&!e.preventDefault&&t.owner){nr.knockouts[t.owner.id]=s.turn;if(t.vessel)e.prizeCount=Math.max(0,e.prizeCount-t.vessel);for(const c of t.vesselCards||[])if(!s.players.some(x=>board(x).some(l=>l.tools.includes(c)))){if(!nr.discard.includes(c._newRule))nr.discard.push(c._newRule);}if(t.active&&has(s,'wonder-kiss')){const receiver=opp(s,t.owner);st.reduceEffect(s,new (R().CoinFlipEffect)(receiver,heads=>{if(heads)e.prizeCount++;}));}}
  if(s.phase===R().GamePhase.PLAYER_TURN&&(e.type==='EVOLVE_EFFECT'||e.type==='PLAY_POKEMON_EFFECT'&&!t.old)&&t.fromHand&&!e.preventDefault&&e.target?.getPokemonCard()===t.card){const evolved=t.old&&t.old!==t.card,ids=nr.active.filter(c=>def(c.id).mode==='trigger'&&(evolved?c.id!=='happy-match':c.id==='happy-match'&&p.bench.includes(e.target))).map(c=>c.instance);if(ids.length){const go=()=>run(st,s,(function*(){for(const instance of ids){const entry=nr.active.find(x=>x.instance===instance);if(!entry||entry.id==='bloodthirsty-eyes'&&entry.used[p.id]===s.turn)continue;const yes=yield new (R().ConfirmPrompt)(p.id,'Use '+def(entry.id).name+'?');if(!yes)continue;entry.used[p.id]=s.turn;yield*trigger(st,s,p,entry.id);}})(),()=>{});if(st.hasPrompts())st.waitPrompt(s,go);else go();}}
 }
 function* trigger(st,s,p,id){const o=opp(s,p);if(id==='bloodthirsty-eyes'){yield*gust(st,s,p);return;}if(id==='happy-match'||id==='treasure-hunt'){yield*search(st,s,p,id==='happy-match'?supporter:item,1,0,p.discard);return;}if(id==='shady-dealings'||id==='mysterious-guidance'){yield*search(st,s,p,id==='shady-dealings'?trainer:item,2);return;}if(id==='queenly-majesty'){yield*reveal(p,o.hand.cards.slice(),'Opponent’s hand');const cards=yield*pick(p,'Choose an opponent’s card to discard',o.hand,()=>true,1,1);move(st,s,o.hand,o.discard,cards);return;}if(id==='initialize'){for(const l of board(o)){const cards=l.getPokemons(),top=l.getPokemonCard();if(top?.stage!==R().Stage.BASIC&&cards.length>1)R().DEVOLVE_POKEMON(st,s,l,o.hand);}return;}}
 function finalDamage(st,s,e,damage){if(!env(s)||!has(s,'resolute-heart')||!e.attackEffect||e.attackEffect._wotcTrainer||e.target.damage!==0)return damage;const p=s.players.find(x=>x.active===e.target||x.bench.includes(e.target));if(!p)return damage;const n=hp(st,s,p,e.target);return damage>=n?Math.max(0,n-10):damage;}
 function moveAllowed(s,slot,destination){const actual=s.players.flatMap(board).find(l=>l===slot||l.energies===slot)||slot;if(!env(s)||!has(s,'scoop-up-block')||!actual?.damage)return true;return !s.players.some(p=>p.hand===destination);}
 function destination(source,dest,c,context){if(c._newRule&&source!==dest&&!('energies' in dest)){const s=context?.state;if(s&&env(s)){env(s).discard.push(c._newRule);return env(s).removed??=new (R().CardList)();}}return dest;}
 function publicView(s){const n=env(s);return n?{active:n.active.map(e=>({id:e.id,instance:e.instance,facing:e.facing,used:{...e.used}})),deckCount:n.deck.length,discard:n.discard.slice(),latest:n.reveals.at(-1)}:null;}
 return {finishReplay,correctedInteractions,beforeAction,preventsStadium,init,botPrompt,beforeTurn,before,after,blocked,finalDamage,moveAllowed,destination,activate,actions,publicView,synthetic,def,verifiedHeights,registerEvolutions:p=>{knownEvolutions=[...p.values()].filter(c=>c.stage===R().Stage.STAGE_1).map(c=>[c.evolvesFrom,c.name]);},test:{effect,run,canUse,shuffle,finish}};
})();
