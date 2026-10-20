import { CardList,PowerType,CardTag,SuperType,StateUtils,SelectPrompt,ChooseCardsPrompt,GameMessage,GameError } from './game';
import { PowerEffect } from './game/store/effects/game-effects';
import { TrainerEffect } from './game/store/effects/play-card-effects';
import { EndTurnEffect } from './game/store/effects/game-phase-effects';
import { IS_POKEPOWER_BLOCKED,MOVE_CARDS } from './game/store/prefabs/prefabs';

function usageKey(card:any,power:any){return (card._dpEntryId||card.id)+':'+power.name;}
function shared(power:any){return /can't use more than (?:1|one) .+?Poké-Power (?:each|per) turn/i.test(power.text);}
function once(power:any){return /^Once /i.test(power.text);}
function game(power:any){return /Once during a game|more than (?:1|one) .+?each game/i.test(power.text);}
export function dpPowerAlreadyUsed(state:any,p:any,card:any,power:any){return game(power)&&p._dpPowerGames?.[power.name]||once(power)&&p._dpPowerTurns?.[usageKey(card,power)]===state.turn||shared(power)&&p._dpSharedPowerTurns?.[power.name]===state.turn;}
function claim(state:any,p:any,card:any,power:any){p._dpPowerTurns??={};p._dpPowerTurns[usageKey(card,power)]=state.turn;if(shared(power)){p._dpSharedPowerTurns??={};p._dpSharedPowerTurns[power.name]=state.turn;}if(game(power)){p._dpPowerGames??={};p._dpPowerGames[power.name]=true;}}
function wait(store:any,state:any,done:()=>void){if(store.hasPrompts())store.waitPrompt(state,done);else done();}
function decision(prompt:any){return prompt.type==='Confirm'||prompt.type==='Confirm prompt'||prompt.type==='ConfirmPrompt'||prompt.type==='Select'&&prompt.values?.some((value:any)=>/^Use (?:Power|Link Lightning)/i.test(String(value)))||prompt.type==='Select'&&prompt.options?.some?.((value:any)=>/^Use Power/i.test(String(value)));}

// End-turn clauses are consequences of declaring the Power. Resolve after the
// Power-used reactions, including when its ordinary effects were cancelled.
function execute(store:any,state:any,p:any,fn:()=>void,done:(flush:()=>void)=>void,autoDecision=false){
 const pending:any[]=[];let auto=autoDecision;
 const enter=(action:()=>any):any=>{const prompt=store.prompt,reduce=store.reduceEffect;store.reduceEffect=function(current:any,effect:any){if(effect instanceof EndTurnEffect&&effect.player===p){pending.push(effect);return current;}return reduce.call(this,current,effect);};store.prompt=function(current:any,prompts:any,callback:any){const single=Array.isArray(prompts)?prompts.length===1?prompts[0]:null:prompts;if(auto&&single?.playerId===p.id&&decision(single)){auto=false;return enter(()=>callback(single.type==='Select'?1:true));}return prompt.call(this,current,prompts,(result:any)=>enter(()=>callback(result)));};try{return action();}finally{store.prompt=prompt;store.reduceEffect=reduce;}};
 const flush=()=>{const effect=pending[0];if(effect)store.reduceEffect(state,effect);};
 enter(fn);wait(store,state,()=>done(flush));
}

function canSpray(store:any,state:any,p:any,card:any){
 if([p.active,...p.bench].filter((list:any)=>list.getPokemonCard()?.tags.includes(CardTag.POKEMON_SP)).length<3)return false;
 const effect:any=new TrainerEffect(p,card);effect._dpReactionUse=true;effect._dpReactionProbe=true;
 try{store.reduceEffect(state,effect);return true;}catch{return false;}
}
function cancelers(store:any,state:any,p:any){return [p.active,...p.bench].flatMap((list:any)=>{const card=list.getPokemonCard(),power=card?.powers.find((power:any)=>power.name==='Power Cancel'&&power.powerType===PowerType.POKEPOWER);if(!power||list.specialConditions.length||p.hand.cards.length<2||dpPowerAlreadyUsed(state,p,card,power)||IS_POKEPOWER_BLOCKED(store,state,p,card))return [];return [{list,card,power}];});}

export function dpDeclarePower(store:any,state:any,p:any,card:any,power:any,run:()=>void,options:any={}){
 if(!state.rules.dpEraRules||power.powerType!==PowerType.POKEPOWER){run();return state;}
 if(dpPowerAlreadyUsed(state,p,card,power))throw new GameError(GameMessage.POWER_ALREADY_USED);
 const turn=state.turn,opponent=StateUtils.getOpponent(state,p);
 const finish=(cancelled:boolean)=>{claim(state,p,card,power);const used=(after:()=>void=()=>{})=>{options.beforeEvent?.();store.reduceEffect(state,{type:'DP_POWER_USED',player:p,card,power,turn,cancelled,preventDefault:false});wait(store,state,()=>{options.afterEvent?.();if(cancelled&&/your turn ends/i.test(power.text))store.reduceEffect(state,new EndTurnEffect(p));after();});};
  if(cancelled){options.cancelled?.();used();return;}
  execute(store,state,p,run,(flush:()=>void)=>used(flush),!!options.autoDecision);
 };
 // These response cards are usable only during the opponent's turn.
 if(state.players[state.activePlayer]!==p){finish(false);return state;}
 const sprays=opponent.hand.cards.filter((entry:any)=>entry._dpPowerSpray&&canSpray(store,state,opponent,entry)),powers=cancelers(store,state,opponent);
 if(!sprays.length&&!powers.length){finish(false);return state;}
 return store.prompt(state,new SelectPrompt(opponent.id,GameMessage.CHOOSE_OPTION,['Allow '+power.name,...sprays.map((_:any,index:number)=>'Use Power Spray '+(index+1)),...powers.map((entry:any)=>'Use Power Cancel ('+entry.card.name+')')],{allowCancel:false}),(choice:number)=>{
  if(choice===0)return finish(false);
  if(choice<=sprays.length){const spray=sprays[choice-1];if(!opponent.hand.cards.includes(spray)||!canSpray(store,state,opponent,spray))throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);const effect:any=new TrainerEffect(opponent,spray);effect._dpReactionUse=true;store.reduceEffect(state,effect);MOVE_CARDS(store,state,opponent.hand,opponent.discard,{cards:[spray],sourceCard:spray,sourceEffect:effect});return finish(true);}
  const counter=powers[choice-sprays.length-1];if(!counter||opponent.hand.cards.length<2)throw new GameError(GameMessage.CANNOT_USE_POWER);
  store.prompt(state,new ChooseCardsPrompt(opponent,GameMessage.CHOOSE_CARD_TO_DISCARD,opponent.hand,{},{min:2,max:2,allowCancel:false}),(cards:any)=>{const effect=new PowerEffect(opponent,counter.power,counter.card);MOVE_CARDS(store,state,opponent.hand,opponent.discard,{cards,sourceCard:counter.card,sourceEffect:effect});claim(state,opponent,counter.card,counter.power);store.reduceEffect(state,{type:'DP_POWER_USED',player:opponent,card:counter.card,power:counter.power,turn,cancelled:false,preventDefault:false});wait(store,state,()=>finish(true));});
 });
}

// The original prompt remains the owner's opt-in. Interception occurs before
// its callback draws, searches, pays a printed effect, or changes the board.
export function dpCapturePowerChoice(store:any,state:any,p:any,card:any,power:any,run:()=>any){
 let captured=false;const deckOrders=state.players.map((owner:any)=>({owner,cards:owner.deck.cards.slice()}));
 const restoreOrders=()=>{for(const entry of deckOrders)if(entry.cards.length===entry.owner.deck.cards.length&&entry.cards.every((card:any)=>entry.owner.deck.cards.includes(card)))entry.owner.deck.cards=entry.cards.slice();};
 const prompt=store.prompt;store.prompt=function(current:any,prompts:any,callback:any){if(captured)return prompt.call(this,current,prompts,callback);captured=true;const one=Array.isArray(prompts)?prompts.length===1?prompts[0]:null:prompts;
  if(one?.playerId===p.id&&decision(one))return prompt.call(this,current,prompts,(result:any)=>{const accepted=one.type==='Select'?result===1:result===true;if(!accepted){restoreOrders();callback(result);return;}dpDeclarePower(store,state,p,card,power,()=>callback(result),{cancelled:()=>{restoreOrders();callback(one.type==='Select'?0:false);}});});
  return prompt.call(this,current,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,['Skip Power','Use Power'],{allowCancel:false}),(choice:number)=>{if(choice!==1){restoreOrders();return callback(null);}dpDeclarePower(store,state,p,card,power,()=>prompt.call(this,current,prompts,callback),{cancelled:()=>{restoreOrders();callback(null);}});});
 };
 try{return run();}finally{store.prompt=prompt;}
}

export function dpTriggerPower(store:any,state:any,p:any,card:any,power:any,event:any,run:()=>void){
 if(dpPowerAlreadyUsed(state,p,card,power))return state;
 const entry=['EVOLVE_EFFECT','PLAY_POKEMON_EFFECT'].includes(event.type)&&!event.dpLevelPlaced,canPause=entry||event.type==='END_TURN_EFFECT',paused=canPause&&!event.preventDefault;
 if(paused)event.preventDefault=true;
 const resume=()=>{if(paused){event.preventDefault=false;event._dpResumeCore=true;store.reduceEffect(state,event);}};
 const use=()=>dpDeclarePower(store,state,p,card,power,run,{autoDecision:true,beforeEvent:entry?resume:undefined,afterEvent:entry?undefined:resume,cancelled:()=>{}});
 if(/\bmay\b/i.test(power.text))return store.prompt(state,new SelectPrompt(p.id,GameMessage.CHOOSE_OPTION,['Skip Power','Use Power'],{allowCancel:false}),(choice:number)=>{if(choice===1)use();else resume();});
 return use();
}

export function dpNativePowerChoice(store:any,state:any,card:any,e:any,run:()=>any){
 if(!state.rules.dpEraRules||card._wotcFinalPlans?.length||!['PLAY_POKEMON_EFFECT','EVOLVE_EFFECT','AFTER_ENERGY_ATTACHED_EFFECT','KNOCK_OUT_EFFECT'].includes(e.type)||!card.powers?.some((power:any)=>power.powerType===PowerType.POKEPOWER))return run();
 const list=StateUtils.findPokemonSlot(state,card),entry=e.pokemonCard===card,owner=entry?e.player:list?StateUtils.findOwner(state,list):null;if(!owner)return run();
 const power=card.powers?.find((power:any)=>power.powerType===PowerType.POKEPOWER&&(entry&&['PLAY_POKEMON_EFFECT','EVOLVE_EFFECT'].includes(e.type)&&/when you (?:put|play)/i.test(power.text)||e.type==='AFTER_ENERGY_ATTACHED_EFFECT'&&e.target===list&&e.fromHand&&/(?:when|whenever) you attach/i.test(power.text)||e.type==='KNOCK_OUT_EFFECT'&&e.target===list&&/would be Knocked Out|when .+Knocked Out/i.test(power.text)));
 return power?dpCapturePowerChoice(store,state,owner,card,power,run):run();
}
