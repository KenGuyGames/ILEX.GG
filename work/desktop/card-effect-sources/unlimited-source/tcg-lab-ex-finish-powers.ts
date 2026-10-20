import { StateUtils,CardTag,CardType,SuperType,Stage,ChooseCardsPrompt,ChoosePokemonPrompt,SelectPrompt,ShuffleDeckPrompt,ShowCardsPrompt,CardList,PlayerType,SlotType,GameMessage,GameError,SpecialCondition } from './game';
import { CheckHpEffect,AddSpecialConditionsPowerEffect,CheckProvidedEnergyEffect } from './game/store/effects/check-effects';
import { AfterRetreatEffect,KnockOutEffect,HealEffect,EvolveEffect } from './game/store/effects/game-effects';
import { PlayPokemonEffect } from './game/store/effects/play-card-effects';
import { PutDamageEffect } from './game/store/effects/attack-effects';
import { GamePhase } from './game/store/state/state';
import { COIN_FLIP_PROMPT,MOVE_CARDS,DEVOLVE_POKEMON,IS_POKEMON_POWER_BLOCKED } from './game/store/prefabs/prefabs';
import { attachWotcEnergy } from './game/store/prefabs/wotc-energy-attachment';
import { exAttachedEnergy } from './tcg-lab-ex-attachments';

export function finishPowerTrigger(op:any,e:any,p:any,list:any,card:any,state:any){
 switch(op.kind){
 case 'finishBedhead':return e.type==='EX_CHECKUP_COMPLETE_EFFECT'&&list.specialConditions.includes(SpecialCondition.ASLEEP);
 case 'finishHardRock':return e instanceof PutDamageEffect&&StateUtils.findOwner(state,e.target)===p&&e.target.getPokemonCard()?.name==='Groudon ex';
 case 'finishPsychicProtector':return e instanceof PutDamageEffect&&e.target===list&&e.player!==p&&e.damage>0&&!e._finishProtector?.includes(card.id);
 case 'finishMetalGravity':return e instanceof AfterRetreatEffect&&e.player!==p;
 case 'finishTimeTravel':return e instanceof KnockOutEffect&&e.target===list&&state.phase===GamePhase.ATTACK&&state.players[state.activePlayer]!==p&&!e._finishTravel;
 case 'finishBlueRay':return e instanceof PlayPokemonEffect&&e.pokemonCard===card&&p.bench.includes(list);
 default:return false;
 }
}
export function finishPower(card:any,op:any,store:any,state:any,e:any,p:any,list:any,use:()=>void){
 const o=StateUtils.getOpponent(state,p),slots=(owner:any)=>{const player=owner===p?PlayerType.BOTTOM_PLAYER:PlayerType.TOP_PLAYER;return [{player,slot:SlotType.ACTIVE,index:0,list:owner.active},...owner.bench.map((list:any,index:number)=>({player,slot:SlotType.BENCH,index,list}))];};
 const select=(eligible:any[],done:(target:any)=>void,any=false)=>{const all=any?[...slots(p),...slots(o)]:slots(p);return store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS,any?PlayerType.ANY:PlayerType.BOTTOM_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{allowCancel:false,blocked:all.filter((s:any)=>!eligible.includes(s.list)).map(({list,...target}:any)=>target)}),(chosen:any)=>done(chosen[0]));};
 const optional=(done:()=>void)=>store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,['Skip Power','Use Power'],{allowCancel:false}),(choice:any)=>{if(choice===1)done();});
 const shuffle=()=>store.prompt(state,new ShuffleDeckPrompt(p.id),(order:any)=>p.deck.applyOrder(order));
 const hit=(target:any,amount:number)=>{const counters:any={type:'EX_POWER_COUNTERS_EFFECT',player:p,source:list,target,damage:amount,preventDefault:false};store.reduceEffect(state,counters);if(!counters.preventDefault)target.damage+=counters.damage;};
 switch(op.kind){
 case 'finishBedhead':if(o.active.getPokemonCard())hit(o.active,20);break;
 case 'activatedFinishTransport':if(!p.active.getPokemonCard()?.tags.includes(CardTag.DELTA_SPECIES))throw new GameError(GameMessage.CANNOT_USE_POWER);use();select(p.bench.filter((l:any)=>l.getPokemonCard()),target=>p.switchPokemon(target,store,state));break;
 case 'activatedFinishPoison':if(StateUtils.getStadiumCard(state)?.name!=="Sidney's Stadium")throw new GameError(GameMessage.CANNOT_USE_POWER);use();store.reduceEffect(state,new AddSpecialConditionsPowerEffect(p,card,o.active,[SpecialCondition.POISONED]));break;
 case 'activatedFinishShady':{const all=[p.active,...p.bench,o.active,...o.bench].filter((l:any)=>l.getPokemonCard()),damaged=all.filter((l:any)=>l.damage>=10);if(!damaged.length||all.length<2)throw new GameError(GameMessage.CANNOT_USE_POWER);use();select(damaged,from=>select(all.filter((l:any)=>l!==from),to=>{const probe:any={type:'EX_POWER_COUNTERS_EFFECT',player:p,source:list,target:to,damage:10,preventDefault:false};store.reduceEffect(state,probe);if(!probe.preventDefault){from.damage-=10;to.damage+=10;}},true),true);break;}
 case 'onEvolutionFinishChilling':if(p.hand.cards.includes(card)&&!e._wotcFromDeck)optional(()=>{o.applyPlayLocks({item:true,supporter:true,stadium:true,tool:true},1);});break;
 case 'onEvolutionFinishTopEnergy':if(p.hand.cards.includes(card)&&!e._wotcFromDeck)optional(()=>{const top=new CardList();top.cards=p.deck.cards.slice(0,5);const eligible=top.cards.filter((c:any)=>c.superType===SuperType.ENERGY),finish=(chosen:any[],target?:any)=>{const attach=(i:number)=>{if(i>=chosen.length){MOVE_CARDS(store,state,p.deck,p.discard,{cards:top.cards.filter((c:any)=>!chosen.includes(c)),sourceCard:card,sourceEffect:e});return;}attachWotcEnergy(store,state,p,p.deck,target,chosen[i],{sourceCard:card,sourceEffect:e});if(store.hasPrompts())store.waitPrompt(state,()=>attach(i+1));else attach(i+1);};attach(0);};store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_ATTACH,top,{superType:SuperType.ENERGY},{min:0,max:eligible.length,allowCancel:false}),(chosen:any)=>{if(!chosen.length){finish([]);return;}select([p.active,...p.bench].filter((l:any)=>l.getPokemonCard()),target=>finish(chosen,target));});});break;
 case 'activatedFinishVolunteer':{if(list.getPokemons().length<2||list.getPokemons()[list.getPokemons().length-2].name!=='Vulpix')throw new GameError(GameMessage.CANNOT_USE_POWER);use();store.reduceEffect(state,new HealEffect(p,list,40));DEVOLVE_POKEMON(store,state,list,p.discard);for(const tool of [...list.tools])if(tool._exToolPlan?.evolved&&!list.isEvolved())MOVE_CARDS(store,state,list,p.discard,{cards:[tool],sourceCard:card,sourceEffect:e});const eligible=p.deck.cards.filter((c:any)=>['Ninetales','Ninetales ex'].includes(c.name)&&c.evolvesFrom==='Vulpix');if(!eligible.length){shuffle();break;}store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_HAND,p.deck,{superType:SuperType.POKEMON},{min:0,max:1,allowCancel:false,blocked:p.deck.cards.map((c:any,i:number)=>eligible.includes(c)?-1:i).filter((i:number)=>i>=0)}),(chosen:any)=>{if(chosen.length){p.deck.moveCardsTo(chosen,p.hand);const evolve:any=new EvolveEffect(p,list,chosen[0]);evolve._wotcFromDeck=true;store.reduceEffect(state,evolve);}if(store.hasPrompts())store.waitPrompt(state,shuffle);else shuffle();});break;}
 case 'finishHardRock':{const count=exAttachedEnergy(store,state,p,list).reduce((n:number,x:any)=>n+StateUtils.getProvidesUnitCount(x.provides,x),0);if(count<=1&&!e.attackEffect.wotcBypassDefender&&!e._finishHardRock){e._finishHardRock=true;e.damage=Math.max(0,e.damage-20);}break;}
 case 'finishPsychicProtector':if(!e.attackEffect.wotcBypassDefender){e._finishProtector??=[];e._finishProtector.push(card.id);const original=e.damage;e.preventDefault=true;store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_DISCARD,p.hand,{}, {min:0,max:Math.min(4,p.hand.cards.length),allowCancel:false}),(chosen:any)=>{MOVE_CARDS(store,state,p.hand,p.discard,{cards:chosen,sourceCard:card,sourceEffect:e});e.damage=Math.max(0,original-10*chosen.length);e.preventDefault=false;store.reduceEffect(state,e);});}break;
 case 'finishMetalGravity':{const hp=new CheckHpEffect(o,e.target);store.reduceEffect(state,hp);if(hp.hp-e.target.damage>=40&&p._finishGravityTurn!==state.turn){p._finishGravityTurn=state.turn;hit(e.target,30);}break;}
 case 'finishBlueRay':optional(()=>{for(const owner of [p,o]){owner.active.specialConditions=[];owner.active.poisonDamage=10;owner.active.burnDamage=20;store.reduceEffect(state,new HealEffect(owner,owner.active,30));}});break;
 case 'finishTimeTravel':{const hp=new CheckHpEffect(p,list);store.reduceEffect(state,hp);if(list.damage<hp.hp||list._exLethalAttackDamage?.card!==card||list._exLethalAttackDamage?.turn!==state.turn)break;e.preventDefault=true;e._finishTravel=true;store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,['Decline Time Travel','Flip for Time Travel'],{allowCancel:false}),(choice:any)=>{const resume=()=>{e.preventDefault=false;store.reduceEffect(state,e);};if(choice!==1){resume();return;}COIN_FLIP_PROMPT(store,state,p,heads=>{if(!heads){resume();return;}const others=list.cards.filter((c:any)=>c!==card);MOVE_CARDS(store,state,list,p.discard,{cards:others,sourceCard:card,sourceEffect:e});if(list.tools.length)MOVE_CARDS(store,state,list,p.discard,{cards:[...list.tools],sourceCard:card,sourceEffect:e});if(list.energies.cards.length)MOVE_CARDS(store,state,list.energies,p.discard,{sourceCard:card,sourceEffect:e});MOVE_CARDS(store,state,list,p.deck,{cards:[card],toBottom:true,sourceCard:card,sourceEffect:e});});});break;}
 }
 return state;
}

// Runtime tags follow Holon Veil in these zones and restore exact printed tags
// when the Body leaves play or is suppressed. Prizes are deliberately excluded.
export function syncHolonVeil(store:any,state:any){
 if(!state.rules.exEraRules||(store as any)._syncingHolonVeil)return;
 (store as any)._syncingHolonVeil=true;
 try{for(const p of state.players){const aura=[p.active,...p.bench].map((l:any)=>l.getPokemonCard()).find((c:any)=>c?._wotcFinalPlans?.some((op:any)=>op.kind==='finishHolonVeil'));
 if(!aura&&!p._holonVeilWasActive)continue;
 const enabled=!!aura&&!IS_POKEMON_POWER_BLOCKED(store,state,p,aura)&&!(state.wotcGlobalPowerLockUntilTurn>=state.turn)&&state.wotcIgnoreBodiesUntilTurn!==state.turn;
 p._holonVeilWasActive=enabled;
 const eligible=new Set([p.deck,p.hand,p.discard,p.active,...p.bench].flatMap((l:any)=>l.cards));
 const cards=[...eligible,...p.prizes.flatMap((l:any)=>l.cards)];for(const c of cards){if(c.superType!==SuperType.POKEMON)continue;if(enabled&&eligible.has(c)){if(!c.tags.includes(CardTag.DELTA_SPECIES)){c._holonVeilDelta=true;c.tags.push(CardTag.DELTA_SPECIES);}}else if(c._holonVeilDelta){c.tags=c.tags.filter((t:any)=>t!==CardTag.DELTA_SPECIES);delete c._holonVeilDelta;}}
 }}finally{(store as any)._syncingHolonVeil=false;}
}
