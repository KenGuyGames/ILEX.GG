/* ILEX.GG adapter: all mutations go through the reducer and validated prompts. */
var RulesMatch=(()=>{
  const R=TCGRules;
  const profiles={
    wotc:{name:'WOTC: Base–Neo (1999–2001)',format:R.Format.UNLIMITED,firstTurnDrawCard:true,firstTurnUseSupporter:true,attackFirstTurn:true,forceFirst:true,legacyBurn:true,supporterCleanupAtEndTurn:true,wotcRules:true,wotcEarlyPowers:true,unlimitedRetreat:true,mulliganBonus:2},
    wotc2002:{name:'WOTC: 2002–Skyridge',format:R.Format.UNLIMITED,firstTurnDrawCard:true,firstTurnUseSupporter:true,attackFirstTurn:true,forceFirst:true,legacyBurn:true,supporterCleanupAtEndTurn:true,wotcRules:true,wotcPowerConditions:true,unlimitedRetreat:true,mulliganBonus:2},
    modern:{name:'Sword & Shield onward',format:R.Format.UNLIMITED,firstTurnDrawCard:true,firstTurnUseSupporter:false,attackFirstTurn:false,legacyBurn:false},
    sm:{name:'Sun & Moon (2017–2019)',format:R.Format.SM,firstTurnDrawCard:true,firstTurnUseSupporter:true,attackFirstTurn:false,legacyBurn:false,dpEraRules:true,exEraRules:true,bwEraRules:true,pokemonCatcherErrata:true,xyEraRules:true},
    xy:{name:'XY (2013–2016)',format:R.Format.XY,firstTurnDrawCard:true,firstTurnUseSupporter:true,attackFirstTurn:false,forceFirst:true,legacyBurn:true,dpEraRules:true,exEraRules:true,bwEraRules:true,pokemonCatcherErrata:true,xyEraRules:true},
    expanded:{name:'Expanded (BW onward)',format:R.Format.EXPANDED,firstTurnDrawCard:true,firstTurnUseSupporter:false,attackFirstTurn:false,legacyBurn:false,dpEraRules:true,exEraRules:true,bwEraRules:true,pokemonCatcherErrata:true,xyEraRules:true},
    bw:{name:'Black & White (2011–2013)',format:R.Format.BW,firstTurnDrawCard:true,firstTurnUseSupporter:true,attackFirstTurn:true,forceFirst:true,legacyBurn:true,dpEraRules:true,exEraRules:true,hgssEraRules:true,bwEraRules:true},
    dp:{name:'Diamond & Pearl / HGSS (2007–2010)',format:R.Format.UNLIMITED,firstTurnDrawCard:true,firstTurnUseSupporter:false,attackFirstTurn:true,firstTurnNoTrainers:true,forceFirst:true,legacyBurn:true,supporterCleanupAtEndTurn:true},
    hgss:{name:'HeartGold & SoulSilver–Call of Legends (2010–2011)',format:R.Format.RSPK,firstTurnDrawCard:true,firstTurnUseSupporter:false,attackFirstTurn:true,firstTurnNoTrainers:true,forceFirst:true,legacyBurn:true,supporterCleanupAtEndTurn:true,dpEraRules:true,exEraRules:true,hgssEraRules:true},
    dppl:{name:'Diamond & Pearl–Platinum Arceus (2007–2009)',format:R.Format.RSPK,firstTurnDrawCard:true,firstTurnUseSupporter:false,attackFirstTurn:true,firstTurnNoTrainers:true,forceFirst:true,legacyBurn:true,supporterCleanupAtEndTurn:true,dpEraRules:true,exEraRules:true},
    exlate:{name:'EX: FireRed & LeafGreen–Power Keepers',format:R.Format.RSPK,firstTurnDrawCard:false,firstTurnUseSupporter:false,attackFirstTurn:true,forceFirst:true,legacyBurn:true,supporterCleanupAtEndTurn:true,exEraRules:true},
    ex:{name:'EX: early / legacy saved-match rules',format:R.Format.RSPK,firstTurnDrawCard:false,firstTurnUseSupporter:true,attackFirstTurn:true,forceFirst:true,legacyBurn:true,supporterCleanupAtEndTurn:true,exEraRules:true}
  };
  const manager=R.CardManager.getInstance();
  const prototypes=new Map();
  for(const set of Object.values(R.sets).filter(Array.isArray))for(const c of set)if(!prototypes.has(c.fullName)){prototypes.set(c.fullName,c);manager.defineCard(c);}
  function create(spec,map,custom=[]){
    spec=JSON.parse(JSON.stringify(spec));
    spec.seed??=(typeof crypto!=='undefined'?crypto.getRandomValues(new Uint32Array(1))[0]:Math.floor(Math.random()*4294967296));
    const profile=profiles[spec.profile];if(!profile)throw Error('Choose a supported historical rules profile.');
    const store=new R.Store({gameSettings:{format:profile.format},onStateChange:s=>{store.state=s}});
    store.state.rules=new R.Rules(profile);
    store.state.gameSettings=new R.GameSettings();store.state.gameSettings.rules=store.state.rules;store.state.gameSettings.format=profile.format;
    const namesFor=id=>{
      if(map[id])return map[id];
      const c=custom.find(x=>x.id===id);
      if(!c)throw Error('No automated card implementation: '+id);
      const name='Custom '+id;
      if(!prototypes.has(name)){
        if(c.category!=='Pokemon'||!c.hp||(c.effect&&!c.automation)||c.attacks?.some(a=>!Number.isFinite(Number(a.damage))))throw Error(c.name+': custom automation requires a Pokémon with numeric damage and structured effects.');
        const p=new R.PokemonCard();Object.assign(p,{name:c.name,fullName:name,set:'CUSTOM',setNumber:id,hp:c.hp,stage:({Basic:R.Stage.BASIC,Stage1:R.Stage.STAGE_1,Stage2:R.Stage.STAGE_2})[c.stage],evolvesFrom:c.evolveFrom,cardType:(c.types||[]).map(typeCode),retreat:Array.from({length:c.retreat??1},()=>R.CardType.COLORLESS),attacks:(c.attacks||[]).map(a=>({name:a.name,cost:(a.cost||[]).map(typeCode),damage:Number(a.damage),text:a.effect||''}))});
        p._labId=id;
        p.reduceEffect=function(st,s,e){
          if(e instanceof R.AttackEffect&&e.attack===this.attacks[0]&&c.automation?.condition){
            const sc=new R.AddSpecialConditionsEffect(e,[R.SpecialCondition[c.automation.condition]]);st.reduceEffect(s,sc);
          }
          return s;
        };
        prototypes.set(name,p);manager.defineCard(p);
      }
      return name;
    };
    for(let i=0;i<2;i++){
      const ids=Object.entries(spec.decks[i].cards).flatMap(([id,n])=>{if(!Number.isInteger(n)||n<1||n>200)throw Error('Invalid deck quantity');return Array(n).fill(id)});
      const names=ids.map(namesFor);
      store.dispatch(new R.AddPlayerAction(i+1,spec.decks[i].name,names));
      if(store.state.phase===R.GamePhase.FINISHED)throw Error('Deck does not satisfy 60-card construction rules, copy limits, rule-box limits, or Basic Pokémon requirements.');
      const player=store.state.players[i];player.wotcEarlyPowers=!!profile.wotcEarlyPowers;player.deck.cards.forEach((c,k)=>c._labId=ids[k]);
    }
    return {store,spec,journal:[],randomState:spec.seed>>>0};
  }
  function typeCode(s){return ({Fire:R.CardType.FIRE,Water:R.CardType.WATER,Grass:R.CardType.GRASS,Lightning:R.CardType.LIGHTNING,Psychic:R.CardType.PSYCHIC,Fighting:R.CardType.FIGHTING,Darkness:R.CardType.DARK,Metal:R.CardType.METAL,Fairy:R.CardType.FAIRY,Dragon:R.CardType.DRAGON,Colorless:R.CardType.COLORLESS})[s]??R.CardType.COLORLESS;}
  const pending=m=>m.store.state.prompts.filter(p=>p.result===undefined);
  function targets(m,p){
    const s=m.store.state,owner=p.getPerspectivePlayerId?.()??p.playerId;
    const result=[];
    for(const player of s.players){
      const side=player.id===owner?R.PlayerType.BOTTOM_PLAYER:R.PlayerType.TOP_PLAYER;
      if(p.playerType!==undefined&&p.playerType!==R.PlayerType.ANY&&p.playerType!==side)continue;
      for(const [slot,index,list] of [[R.SlotType.ACTIVE,0,player.active],...player.bench.map((l,i)=>[R.SlotType.BENCH,i,l])]){
        if(p.slots&&!p.slots.includes(slot))continue;
        if(!list.getPokemonCard())continue;
        result.push({target:{player:side,slot,index},list,label:player.name+' · '+(slot===R.SlotType.ACTIVE?'Active':'Bench '+(index+1))+' · '+list.getPokemonCard().name});
      }
    }return result;
  }
  function apply(m,a){
    const s=m.store.state;let action;
    if(a.type==='prompt'){
      const p=pending(m).find(p=>p.id===a.id);if(!p)throw Error('This choice is no longer pending.');
      if(a.value!==null){
        if(Array.isArray(a.value)&&['Choose cards','Choose energy','Choose prize','Choose pokemon','Order cards','Shuffle deck','Shuffle hand'].includes(p.type)&&new Set(a.value.map(v=>JSON.stringify(v))).size!==a.value.length)throw Error('Choose each card or target only once.');
        if(['Choose cards','Choose energy','Choose prize','Order cards','Shuffle deck','Shuffle hand'].includes(p.type)){
          const size=p.type==='Choose energy'?p.energy.length:p.type==='Choose prize'?s.players.find(x=>x.id===(p.options.useOpponentPrizes?s.players.find(x=>x.id!==p.getPerspectivePlayerId()).id:p.getPerspectivePlayerId())).prizes.filter(x=>x.cards.length).length:p.type==='Shuffle deck'?s.players.find(x=>x.id===p.getPerspectivePlayerId()).deck.cards.length:p.type==='Shuffle hand'?s.players.find(x=>x.id===p.getPerspectivePlayerId()).hand.cards.length:p.cards.cards.length;
          if(!Array.isArray(a.value)||a.value.some(v=>!Number.isInteger(v)||v<0||v>=size))throw Error('Invalid selection index.');
        }
        if(['Select','SelectOption'].includes(p.type)&&(!Number.isInteger(a.value)||a.value<0||a.value>=p.values.length||p.options.disabled?.[a.value]))throw Error('Invalid option.');
        if(['Confirm','Coin flip'].includes(p.type)&&typeof a.value!=='boolean')throw Error('Choose yes or no.');
        if(p.type==='Choose pokemon'){
          const eligible=targets(m,p).filter(x=>!p.options.blocked.some(b=>JSON.stringify(b)===JSON.stringify(x.target)));
          if(!Array.isArray(a.value)||a.value.some(t=>!eligible.some(x=>JSON.stringify(t)===JSON.stringify(x.target))))throw Error('Invalid Pokémon target.');
        }
      }
      const value=p.decode(a.value,s);if(!p.validate(value,s))throw Error('That selection does not meet the effect’s requirements.');
      action=new R.ResolvePromptAction(p.id,value);
    }else{
      if(s.phase!==R.GamePhase.PLAYER_TURN)throw Error('Finish the pending setup or effect first.');
      if(pending(m).length)throw Error('Resolve the pending effect first.');
      const player=s.players[s.activePlayer];if(a.player!==player.id)throw Error('It is not that player’s turn.');
      if(a.type==='play'&&player.hand.cards[a.index]?.trainerType===R.TrainerType.SUPPORTER&&(player.supporter.cards.length||player.supporterTurn>0))throw Error('SUPPORTER_ALREADY_PLAYED');
      if(a.type==='play'){
        const card=player.hand.cards[a.index];if(!card)throw Error('Card not in hand.');
        if(s.turn===1&&s.rules.firstTurnNoTrainers&&card.superType===R.SuperType.TRAINER)throw Error('The first player cannot play Trainers under the Diamond & Pearl rules.');
        if(!Number.isInteger(a.index)||!a.target||a.target.player!==R.PlayerType.BOTTOM_PLAYER||![R.SlotType.ACTIVE,R.SlotType.BENCH].includes(a.target.slot)||!Number.isInteger(a.target.index)||a.target.index<0||(a.target.slot===R.SlotType.ACTIVE?a.target.index!==0:a.target.index>=player.bench.length))throw Error('Invalid play target.');
        action=new R.PlayCardAction(a.player,a.index,a.target);
      }else if(a.type==='attack')action=new R.AttackAction(a.player,a.name);
      else if(a.type==='ability')action=new R.UseAbilityAction(a.player,a.name,a.target);
      else if(a.type==='stadium')action=new R.UseStadiumAction(a.player);
      else if(a.type==='retreat')action=new R.RetreatAction(a.player,a.index);
      else if(a.type==='pass')action=new R.PassTurnAction(a.player);
      else if(a.type==='concede')action=new R.ConcedeAction(a.player);
      else throw Error('Unknown game action.');
    }
    const originalRandom=Math.random;
    Math.random=()=>{m.randomState=(m.randomState+0x6D2B79F5)>>>0;let t=m.randomState;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
    try{m.store.dispatch(action)}finally{Math.random=originalRandom}
    m.journal.push(JSON.parse(JSON.stringify(a)));return m;
  }
  function handEnergyAction(player,index){
    const card=player.hand.cards[index],power=card?.powers?.find(p=>p.useFromHand&&p.powerType===R.PowerType.HOLONS_SPECIAL_ENERGY_EFFECT);
    return power?{type:'ability',player:player.id,name:power.name,target:{player:R.PlayerType.BOTTOM_PLAYER,slot:R.SlotType.HAND,index}}:null;
  }
  function undoPoints(m){
    if(Array.isArray(m.undoHistory))return m.undoHistory.filter((n,i,a)=>Number.isInteger(n)&&n>=0&&n<m.journal.length&&(i===0||n>a[i-1]));
    const bot=m.spec.opponent?.type==='bot'?m.spec.opponent.botPlayer:null;
    return m.journal.map((a,i)=>a.type!=='prompt'&&a.player!==bot?i:-1).filter(i=>i>=0);
  }
  function checkpoint(m,index){const points=undoPoints(m).filter(n=>n<index);if(Number.isInteger(index)&&index>=0&&index<m.journal.length)points.push(index);m.undoHistory=points;}
  function restore(saved,map,custom){
    const m=create(saved.spec,map,custom),journal=saved.journal||[];
    for(let i=0;i<journal.length;i++){
      try{apply(m,journal[i]);}catch(error){
        // Older builds could journal an unpaid attack before the Baby-rule flip.
        // Recover only an unfinished terminal attempt; other replay errors remain errors.
        if(error.message!=='NOT_ENOUGH_ENERGY'||journal[i].type!=='attack'||journal.slice(i+1).some(a=>a.type!=='prompt'))throw error;
        const recovered=restore({...saved,journal:journal.slice(0,i)},map,custom);
        recovered.recoveredInvalidAttack=true;return recovered;
      }
    }
    if(Array.isArray(saved.undoHistory))m.undoHistory=undoPoints({journal:m.journal,undoHistory:saved.undoHistory});return m;
  }
  function undoAction(m,map,custom){const points=undoPoints(m);if(!points.length)throw Error('No action to undo.');const index=points.pop();return restore({spec:m.spec,journal:m.journal.slice(0,index),undoHistory:points},map,custom);}

  function attacks(m,p){const effect=new R.CheckPokemonAttacksEffect(p);m.store.reduceEffect(m.store.state,effect);return [...new Map([...(p.active.getPokemonCard()?.attacks||[]),...effect.attacks].map(a=>[a.name,a])).values()];}
  function powers(m,p,list){const card=list.getPokemonCard();if(!card)return [];const effect=new R.CheckPokemonPowersEffect(p,card);m.store.reduceEffect(m.store.state,effect);return [...new Map(effect.powers.map(power=>[power.name,power])).values()];}
  function zoneAbilities(m,p,slot,index){const zone=slot===R.SlotType.HAND?p.hand:slot===R.SlotType.DISCARD?p.discard:null,card=zone?.cards[index],flag=slot===R.SlotType.HAND?'useFromHand':'useFromDiscard';return (card?.powers||[]).filter(power=>power[flag]&&!power._wotcPassive&&power.powerType!==R.PowerType.HOLONS_SPECIAL_ENERGY_EFFECT).map(power=>({type:'ability',player:p.id,name:power.name,target:{player:R.PlayerType.BOTTOM_PLAYER,slot,index}}));}
  function withAliases(map,collection){const result={...map},basic={'Grass Energy':'bw1-105','Fire Energy':'bw1-106','Water Energy':'bw1-107','Lightning Energy':'bw1-108','Psychic Energy':'bw1-109','Fighting Energy':'bw1-110','Darkness Energy':'bw1-111','Metal Energy':'bw1-112','Fairy Energy':'xy1-140'};for(const [alias,base]of Object.entries(collection.ruleAliases||{})){const d=collection.metadata?.[alias],normal=d?.category==='Energy'&&(d.energyType==='Normal'||d.subtypes?.includes('Basic')),exact=/A$/i.test(alias)&&map[base+'a']?base+'a':base,target=normal?(basic[d.name.replace(/^Basic /,'')]||exact):exact;if(map[target])result[alias]=map[target];}return result;}
  return {R,profiles,prototypes,create,apply,restore,pending,targets,attacks,powers,handEnergyAction,zoneAbilities,undoPoints,checkpoint,undoAction,withAliases};
})();

