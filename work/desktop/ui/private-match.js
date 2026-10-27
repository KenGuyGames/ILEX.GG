/* Host-authoritative private matches. Network callers receive only view(), never save(). */
var PrivateMatch=(()=>{
 const VERSION=1, LIMIT=1024*1024, automatic=new Set(['Coin flip','Shuffle deck','Shuffle hand','WaitPrompt']);
 const clone=x=>JSON.parse(JSON.stringify(x)),fail=s=>{throw Error(s);},own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 function cleanFormat(f){if(f?.cubeRules)fail('Cube draft matches currently support local and bot play.');if(!f||typeof f!=='object')fail('Choose a format.');const out={};for(const k of ['id','name','sets','banned'])out[k]=String(f[k]||'').slice(0,k==='banned'?20000:4000);for(const k of ['size','copies','prizes'])out[k]=Number(f[k]);for(const k of ['custom','allowEquivalentPrintings','allowBasicEnergy'])out[k]=!!f[k];out.allowedPrintingIds=Array.isArray(f.allowedPrintingIds)?f.allowedPrintingIds.slice(0,30000).filter(id=>typeof id==='string'&&/^[\w.-]{1,100}$/.test(id)):[];out.allowedBasicEnergyTypes=Array.isArray(f.allowedBasicEnergyTypes)?f.allowedBasicEnergyTypes.slice(0,32).map(s=>String(s).slice(0,30)):[];if(JSON.stringify(out).length>400000)fail('Format definition is too large.');if(out.size!==60||out.prizes!==6||!Number.isInteger(out.copies)||out.copies<1||out.copies>60)fail('Private matches require 60-card decks and six Prizes.');return out;}
 function validateDeck(deck,format,{map,metadata,allowed}){
  if(!deck||typeof deck!=='object'||!deck.cards||Array.isArray(deck.cards)||Object.keys(deck.cards).length>60)fail('Invalid deck list.');let total=0;const counts=new Map(),cards={};
  for(const [id,n]of Object.entries(deck.cards)){if(!/^[\w.-]{1,100}$/.test(id)||['__proto__','constructor','prototype'].includes(id)||!own(map,id)||!own(metadata,id))fail('Deck contains an unavailable card: '+String(id).slice(0,100));if(!Number.isInteger(n)||n<1||n>60)fail('Invalid card quantity.');const c=metadata[id];if(allowed&&!allowed(id,c,format))fail(c.name+' is outside the selected format.');const bans=format.banned.split(',').map(s=>s.trim().toLowerCase());if(bans.includes(id.toLowerCase())||bans.includes(c.name.toLowerCase()))fail(c.name+' is banned.');total+=n;cards[id]=n;
   const basicEnergy=c.category==='Energy'&&(['Normal','Basic'].includes(c.energyType)||c.subtypes?.includes('Basic'));if(!basicEnergy)counts.set(c.name,(counts.get(c.name)||0)+n);
  }
  if(total!==60)fail('Deck must contain exactly 60 cards.');for(const [name,n]of counts)if(n>format.copies)fail(name+' exceeds the format copy limit.');return {name:String(deck.name||'Player').slice(0,80),cards};
 }
 function room(options){
  const {map,metadata,allowed}=options,M=options.rules||RulesMatch,R=M.R,format=cleanFormat(options.format),profile=options.profile;if(!own(M.profiles,profile))fail('Unsupported rules profile.');
  const hostDeck=validateDeck(options.hostDeck,format,{map,metadata,allowed}),random=options.random||(()=>crypto.getRandomValues(new Uint32Array(1))[0]),clock=options.clock||Date.now;
  M.create({profile,seed:1,decks:[hostDeck,hostDeck]},map);
  let guestDeck=null,ready=[false,false],match=null,revision=0,connected=false,undo=null,decisions=[],events=[],cryCue=null,caps=[new Map(),new Map()],cached=[null,null],seen=[new Map(),new Map()];
  const roomId=options.roomId||crypto.randomUUID(),engine=options.engine||'',touch=()=>{revision++;caps=[new Map(),new Map()];cached=[null,null];},note=s=>{events.push(String(s));events=events.slice(-24);},pending=()=>match?M.pending(match):[];
  const restore=saved=>M.restore(saved,map),saved=()=>({spec:clone(match.spec),journal:clone(match.journal),undoHistory:M.undoPoints(match)});
  const shuff=n=>{const a=Array.from({length:n},(_,i)=>i);for(let i=n-1;i>0;i--){const range=i+1,bound=Math.floor(4294967296/range)*range;let v;do{v=random()>>>0;}while(v>=bound);const j=v%range;[a[i],a[j]]=[a[j],a[i]];}return a;};
  function auto(){for(let i=0;i<1000;i++){const p=pending().find(p=>automatic.has(p.type));if(!p)return;let value=true;if(p.type==='Coin flip'){value=!!(random()&1);note('Coin flip: '+(value?'Heads':'Tails'));}else if(p.type.startsWith('Shuffle')){const id=p.getPerspectivePlayerId?.()??p.playerId,pl=match.store.state.players.find(x=>x.id===id);value=shuff(p.type==='Shuffle hand'?pl.hand.cards.length:pl.deck.cards.length);}M.apply(match,{type:'prompt',id:p.id,value});}fail('Effect resolution limit exceeded.');}
  function connectedTo(value){if(connected===!!value)return;connected=!!value;if(!connected&&undo){undo=null;note('Undo request canceled by disconnect.');}touch();}
  function expire(){if(undo&&clock()>=undo.expires){undo=null;note('Undo request expired; game unchanged.');touch();}}
  function start(){const candidate=M.create({version:1,profile,format:{id:format.id,name:format.name,markerRules:format},opponent:{type:'private'},newRules:options.saved?.newRules||options.newRules,kenGuy:options.saved?.kenGuy||options.kenGuy,decks:[hostDeck,guestDeck]},map);match=candidate;try{auto();}catch(e){match=null;throw e;}note('Private match started.');}
  function receive(player,message){
   expire();if(![1,2].includes(player)||!message||typeof message!=='object'||JSON.stringify(message).length>LIMIT)fail('Invalid private-match message.');const id=message.requestId;if(typeof id!=='string'||!/^[\w-]{1,80}$/.test(id))fail('Invalid request identifier.');if(seen[player-1].has(id))return {duplicate:true};
   if(!connected)fail('Match paused: opponent disconnected.');if(message.revision!==revision)fail('The game changed. Use the refreshed table.');
   if(message.type==='deck'){if(player!==2||match)fail('Deck selection is closed.');const next=validateDeck(message.deck,format,{map,metadata,allowed});/* Engine construction also checks Basic/Rule Box limits. */M.create({profile,seed:1,decks:[hostDeck,next]},map);guestDeck=next;ready=[false,false];note('Guest deck selected.');}
   else if(message.type==='ready'){if(match||!guestDeck)fail('Both players must select a deck first.');const before=ready.slice();ready[player-1]=!!message.value;try{if(ready.every(Boolean))start();}catch(e){ready=before;throw e;}}
   else if(message.type==='undo-request'){if(!match||!decisions.length||undo)fail('No action is available to undo.');undo={id:crypto.randomUUID(),requester:player,revision:revision+1,index:decisions.at(-1).index,expires:clock()+90000};note('Player '+player+' requested Undo.');}
   else if(message.type==='undo-response'){if(!undo||message.id!==undo.id||typeof message.approve!=='boolean'||player===undo.requester)fail('Only the opponent can answer this Undo request.');if(message.approve){const d=decisions.at(-1);if(!d||d.index!==undo.index)fail('Undo is no longer available.');match=restore({spec:match.spec,journal:match.journal.slice(0,d.index),undoHistory:decisions.slice(0,-1).map(d=>d.index)});decisions.pop();note('Undo approved by Player '+player+'.');}else note('Undo denied by Player '+player+'; game unchanged.');undo=null;}
   else if(message.type==='undo-cancel'){if(!undo||player!==undo.requester||message.id!==undo.id)fail('No Undo request to withdraw.');undo=null;note('Undo request withdrawn.');}
   else if(message.type==='action'||message.type==='prompt'){
    if(!match)fail('Match has not started.');if(undo)fail('Resolve the Undo request before continuing.');let action;
    if(message.type==='action'){view(player);action=caps[player-1].get(message.actionId);if(!action)fail('That action is unavailable.');}
    else{const p=pending().find(p=>p.id===message.promptId);if(!p||p.playerId!==player||automatic.has(p.type))fail('That choice belongs to the other player.');action={type:'prompt',id:p.id,value:clone(message.value)};}
    const before=saved(),at=match.journal.length,priorField=publicFieldCards(),priorTops=publicFieldTops(),logTail=match.store.state.logs.at(-1),logCount=match.store.state.logs.length,cryNames=new Map();for(const p of match.store.state.players){cryNames.set(p.id+':active',cryActor(p.active.getPokemonCard()));for(const [i,l]of p.bench.entries())cryNames.set(p.id+':'+R.SlotType.BENCH+':'+i,cryActor(l.getPokemonCard()));for(const [slot,l]of [[R.SlotType.HAND,p.hand],[R.SlotType.DISCARD,p.discard]])l.cards.forEach((c,i)=>cryNames.set(p.id+':'+slot+':'+i,cryActor(c)));}try{M.apply(match,action);auto();}catch(e){match=restore(before);throw Error('Action rejected: '+(e.message||String(e)));}cryCue={revision:revision+1,names:match.journal.slice(at).filter(a=>a.type==='attack'||a.type==='ability').map(a=>a.target&&a.target.slot!==R.SlotType.ACTIVE?cryNames.get(a.player+':'+a.target.slot+':'+a.target.index):cryNames.get(a.player+':active')).filter(Boolean).concat(arrivingActors(priorField),knockedOutActors(priorTops,logTail,logCount))};M.checkpoint(match,at);decisions.push({index:at,player});note('Player '+player+': '+({play:'played a card',attack:'used '+action.name,ability:'used '+action.name,pass:'ended the turn',retreat:'retreated',stadium:'used the Stadium',concede:'conceded',prompt:'resolved a choice'}[action.type]||'acted')+'.');
   }else fail('Unknown private-match request.');
   seen[player-1].set(id,true);while(seen[player-1].size>256)seen[player-1].delete(seen[player-1].keys().next().value);touch();return {accepted:true};
  }
  const reverse=new Map();for(const [id,name]of Object.entries(map))if(!reverse.has(name))reverse.set(name,id);
  function card(c){if(!c||c._dpFaceDownEnergyRole)return null;if(c._newRule)return {id:'new-rule-'+c._newRule,name:c.name,newRule:c._newRule,hp:0};return {id:c._labId||reverse.get(c.fullName)||'',name:c.name,hp:c.hp||0};}
  const fieldKey=c=>Number.isInteger(c.id)&&c.id>=0?'id:'+c.id:c;
  function publicFieldCards(){return new Set(match.store.state.players.flatMap(p=>[p.active,...p.bench].filter(l=>l&&!l.isSecret).flatMap(l=>l.cards.map(fieldKey))));}
  function arrivingActors(before){return match.store.state.players.flatMap(p=>[p.active,...p.bench].filter(l=>l&&!l.isSecret).flatMap(l=>{const c=l.getPokemonCard();return c&&!before.has(fieldKey(c))?[cryActor(c)]:[];}));}
  function publicFieldTops(){return match.store.state.players.flatMap(p=>[p.active,...p.bench].filter(l=>l&&!l.isSecret).flatMap(l=>{const c=l.getPokemonCard();return c?[{key:fieldKey(c),actor:cryActor(c)}]:[];}));}
  function knockedOutActors(before,tail,count){const logs=match.store.state.logs,at=logs.indexOf(tail),added=at>=0?logs.slice(at+1):logs.slice(count),current=new Set(publicFieldTops().map(row=>row.key)),available=before.slice(),out=[];for(const log of added){if(log.message!=='LOG_POKEMON_KO'||!log.params?.name)continue;let i=available.findIndex(row=>row.actor?.name===log.params.name&&!current.has(row.key));if(i<0)i=available.findIndex(row=>row.actor?.name===log.params.name);out.push(i>=0?available.splice(i,1)[0].actor:{name:log.params.name});}return out;}
  function cryActor(c){const info=card(c);return info?{name:info.name,printing:info.id}:null;}
  function list(l){const secret=!!l.isSecret;return {card:secret?null:card(l.getPokemonCard()),occupied:!!l.cards.length,secret,damage:secret?0:l.damage||0,conditions:secret?[]:(l.specialConditions||[]).map(x=>R.SpecialCondition[x]),cards:secret?[]:l.cards.map(card),tools:secret?[]:(l.tools||[]).map(card),energies:secret?[]:(l.energies?.cards||[]).map(card)};}
  function targets(p){return M.targets(match,p).map(x=>({target:clone(x.target),label:x.list.isSecret?'Face-down Pokémon · '+(x.target.slot===R.SlotType.ACTIVE?'Active':'Bench '+(x.target.index+1)):x.label}));}
  function prompt(p,player){
   if(p.playerId!==player)return null;const o=p.options||{},out={id:p.id,type:p.type,message:String(p.message||p.type),source:p.sourceCard?.name||'',min:o.min,max:o.max,count:o.count,allowCancel:!!o.allowCancel,rows:[],targets:[],options:{}};
   const row=(value,label,c,blocked=false)=>({value:clone(value),label:String(label),card:c?card(c):null,blocked:!!blocked});
   if(p.type==='Choose cards')out.rows=p.cards.cards.map((c,i)=>row(i,o.isSecret?'Face-down card '+(i+1):c.name,o.isSecret?null:c,(o.blocked||[]).includes(i)||!R.matchesPromptFilter(c,p.filter)));
   else if(p.type==='Choose pokemon'){out.targets=targets(p);out.rows=out.targets.map(x=>row(x.target,x.label,null,(o.blocked||[]).some(b=>JSON.stringify(b)===JSON.stringify(x.target))));}
   else if(p.type==='Choose prize'){const perspective=p.getPerspectivePlayerId?.()??p.playerId,owner=match.store.state.players.find(x=>o.useOpponentPrizes?x.id!==perspective:x.id===perspective);out.rows=owner.prizes.map((l,i)=>({l,i})).filter(x=>x.l.cards.length).map((x,index)=>row(index,'Prize '+(x.i+1),x.l.faceUpPrize?x.l.cards[0]:null,(o.blocked||[]).includes(index)));}
   else if(p.type==='Choose energy')out.rows=p.energy.map((e,i)=>row(i,e.card.name+' · '+e.provides.map(t=>R.CardType[t]).join('/'),e.card));
   else if(p.type==='Choose attack')out.rows=p.cards.flatMap((c,index)=>c.attacks.map(a=>row({index,attack:a.name},c.name+' · '+a.name,null,(o.blocked||[]).some(b=>b.index===index&&b.attack===a.name))));
   else if(['Select','SelectOption'].includes(p.type))out.rows=p.values.map((label,i)=>row(i,label,null,o.disabled?.[i]));
   else if(p.type==='Order cards')out.rows=p.cards.cards.map((c,i)=>row(i,c.name,c));
   else if(['Show cards','Confirm cards','ShowMulligan','Show mulligan','Alert'].includes(p.type)){const cs=Array.isArray(p.cards)?p.cards:p.cards?.cards||p.hands?.flat()||[];out.rows=cs.map((c,i)=>row(i,c.name,c));}
   else if(['Attach energy','Move energy','Discard energy'].includes(p.type)){
    out.targets=targets(p);out.options=clone({blockedFrom:o.blockedFrom||[],blockedTo:o.blockedTo||[],sameTarget:!!o.sameTarget});
    if(p.type==='Attach energy')out.rows=p.cardList.cards.map((c,index)=>({c,index})).filter(x=>x.c.superType===R.SuperType.ENERGY&&!(o.blocked||[]).includes(x.index)&&R.matchesPromptFilter(x.c,p.filter)).map(x=>({...row(x.index,x.c.name,x.c),index:x.index}));
    else out.rows=M.targets(match,p).flatMap(x=>x.list.cards.map((c,index)=>({c,index,from:x.target,label:x.label}))).filter(x=>x.c.superType===R.SuperType.ENERGY&&R.matchesPromptFilter(x.c,p.filter)).map(x=>({...row(x.index,x.c.name+' · '+x.label,x.c),index:x.index,from:clone(x.from)}));
   }else if(['Put damage','Move damage','Remove damage'].includes(p.type)){out.targets=targets(p);out.damage=p.damage;out.options=clone({damageMultiple:o.damageMultiple||10,blockedFrom:o.blockedFrom||[],blockedTo:o.blockedTo||[],sameTarget:!!o.sameTarget});}
   return out;
  }
  function view(player){
   expire();if(![1,2].includes(player))fail('Invalid viewer.');if(cached[player-1])return clone(cached[player-1]);
   const out={protocol:VERSION,roomId,revision,viewer:player,newRuleMode:!!(options.saved?.newRules||options.newRules),kenGuyMode:!!(options.saved?.kenGuy||options.kenGuy),connected,format:clone(format),profile,engine,lobby:!match,guestSelected:!!guestDeck,ready:ready.slice(),undo:undo?clone(undo):null,canUndo:!!match&&!!decisions.length&&!undo&&connected,events:events.slice(),cryCue:cryCue?clone(cryCue):null,actions:[]};
   if(match){const g=match.store.state;out.kenGuy=globalThis.IlexKenGuy?.publicView(g);out.newRules=globalThis.IlexNewRules?.publicView(g);out.phase=R.GamePhase[g.phase];out.turn=g.turn;out.active=g.players[g.activePlayer]?.id;out.winner=g.winner;out.players=g.players.map(p=>({id:p.id,name:p.id===1?'Host':'Guest',hand:p.hand.cards.map(c=>p.id===player||p.hand.isPublic?card(c):null),deckCount:p.deck.cards.length,discard:p.discard.cards.map(card),lostzone:p.lostzone.cards.map(card),prizes:p.prizes.filter(l=>l.cards.length).map(l=>l.faceUpPrize?card(l.cards[0]):null),active:list(p.active),bench:p.bench.map(list),stadium:p.stadium.cards.map(card)}));
    out.players.forEach((p,i)=>{p.usedGX=!!g.players[i].usedGX;p.usedVSTAR=!!g.players[i].usedVSTAR;});
    out.prompt=prompt(pending().find(p=>p.playerId===player)||{},player);if(!pending().some(p=>p.playerId===player))out.prompt=null;out.waiting=pending().length&&!out.prompt;
    const p=g.players.find(p=>p.id===player),enabled=connected&&!undo&&!pending().length&&g.phase===R.GamePhase.PLAYER_TURN&&g.players[g.activePlayer]===p;
    const add=(action,label,group,where)=>{const id=revision+':'+player+':'+caps[player-1].size;caps[player-1].set(id,action);out.actions.push({id,label,group,...where});};
    if(globalThis.IlexKenGuy?.canInterrupt(match,player)&&connected&&!undo)add({type:'ken-gx',player},'Go Fuck Yourself GX','ken-gx',{player});
    if(enabled){
     if(globalThis.IlexNewRules)for(const action of IlexNewRules.actions(match,p))add(action,action.name,'new-rule',{instance:action.instance});
     for(const [i,c]of p.hand.cards.entries()){
      const foreign=c.trainerType===R.TrainerType.TOOL&&c.attachesToOpponentsPokemon,owner=foreign?g.players.find(x=>x!==p):p,side=foreign?R.PlayerType.TOP_PLAYER:R.PlayerType.BOTTOM_PLAYER,slots=[{l:owner.active,slot:R.SlotType.ACTIVE,index:0},...owner.bench.map((l,index)=>({l,slot:R.SlotType.BENCH,index}))];
      for(const s of slots){if(foreign&&!s.l.getPokemonCard())continue;if(c.superType===R.SuperType.TRAINER&&c.trainerType!==R.TrainerType.TOOL&&s.slot!==R.SlotType.ACTIVE&&!/fossil|doll|substitute/i.test(c.name))continue;add({type:'play',player,index:i,target:{player:side,slot:s.slot,index:s.index}},'Play → '+(foreign?'opponent ':'')+(s.slot===R.SlotType.ACTIVE?'Active':'Bench '+(s.index+1)),'hand',{hand:i,owner:owner.id,slot:s.slot,index:s.index});}
      const energy=M.handEnergyAction(p,i);if(energy)add(energy,'Attach as Energy','hand',{hand:i});for(const a of M.zoneAbilities(match,p,R.SlotType.HAND,i))add(a,a.name,'hand',{hand:i});
     }
     for(const [l,slot,index]of [[p.active,R.SlotType.ACTIVE,0],...p.bench.map((l,i)=>[l,R.SlotType.BENCH,i])]){
      const c=l.getPokemonCard();if(!c)continue;const target={player:R.PlayerType.BOTTOM_PLAYER,slot,index},where={owner:player,slot,index};
      if(l.isSecret){if(c._wotcRevealAction)add({type:'ability',player,name:'Reveal face-down card',target},'Reveal face-down card','field',where);continue;}
      for(const power of M.powers(match,p,l).filter(a=>!a._wotcPassive&&a.powerType!==R.PowerType.POKEBODY&&a.powerType!==R.PowerType.HOLONS_SPECIAL_ENERGY_EFFECT))add({type:'ability',player,name:power.name,target},power.name,'field',{...where,kind:'ability',text:power.text||''});
      for(const attack of (slot===R.SlotType.ACTIVE?M.attacks(match,p):c.attacks.filter(a=>a.useOnBench)))add({type:'attack',player,name:attack.name,target},attack.name,'field',{...where,kind:'attack',text:attack.text||''});
     }
     p.bench.forEach((l,index)=>{if(l.getPokemonCard())add({type:'retreat',player,index},'Retreat → Bench '+(index+1),'retreat',{owner:player,slot:R.SlotType.BENCH,index});});
     if(g.players.some(x=>x.stadium.cards.length))add({type:'stadium',player},'Use Stadium','stadium',{});add({type:'pass',player},'End turn','turn',{});if(!g.kenGuy)add({type:'concede',player},'Concede','turn',{});
     p.discard.cards.forEach((c,index)=>{for(const a of M.zoneAbilities(match,p,R.SlotType.DISCARD,index))add(a,a.name,'discard',{index});});
    }
   }
   cached[player-1]=out;return clone(out);
  }
  function save(){return {version:VERSION,engine,roomId,format,profile,hostDeck,guestDeck,ready,revision,newRules:options.saved?.newRules||options.newRules,kenGuy:options.saved?.kenGuy||options.kenGuy,match:match?saved():null,decisions,events};}
  if(options.saved){const s=clone(options.saved);if(s.version!==VERSION||s.engine!==engine||s.roomId!==roomId)fail('Saved private match requires the same build.');if(s.guestDeck)guestDeck=validateDeck(s.guestDeck,format,{map,metadata,allowed});ready=s.ready;revision=s.revision;decisions=s.decisions;events=s.events;if(s.match)match=restore(s.match);}
  return {receive,view,connected:connectedTo,expire,save};
 }
 return {VERSION,LIMIT,cleanFormat,validateDeck,room};
})();
