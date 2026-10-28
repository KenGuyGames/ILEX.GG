import { CardType, PowerType, GameError, GameMessage, StateUtils, ChoosePokemonPrompt, PlayerType, SlotType, CardTag } from './game';
import { AttachEnergyEffect, AfterEnergyAttachedEffect } from './game/store/effects/play-card-effects';
import { CheckProvidedEnergyEffect, CheckPokemonTypeEffect } from './game/store/effects/check-effects';
import { AfterDamageEffect, PutDamageEffect } from './game/store/effects/attack-effects';
import { EffectOfAbilityEffect, PlaceDamageCountersEffect, HealEffect, KnockOutEffect, AttackEffect } from './game/store/effects/game-effects';
import { IS_SPECIAL_ENERGY_BLOCKED, DRAW_CARDS, SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_ONTO_BENCH, GET_PLAYER_BENCH_SLOTS, MOVE_CARDS } from './game/store/prefabs/prefabs';

const probeStacks = new WeakMap<object, Set<any>>();
function blockedEnergy(store:any,state:any,owner:any,card:any,holder:any):boolean {
 let stack=probeStacks.get(store);if(!stack){stack=new Set();probeStacks.set(store,stack);}
 if(stack.has(card))return false;stack.add(card);
 try{return IS_SPECIAL_ENERGY_BLOCKED(store,state,owner,card,holder,card.name==='Fusion Strike Energy');}finally{stack.delete(card);}
}

const handTriggers = new Set(['Rainbow Energy','Full Heal Energy','Potion Energy','Warp Energy','Speed Lightning Energy','Capture Energy','Draw Energy','Enriching Energy','Medical Energy','Herbal Energy','Heal Energy','Cyclone Energy','Jet Energy']);

export function installSpecialEnergyAudit(card: any, record: any): void {
 const ordinary = card.reduceEffect;
 const text = (record.d.rules || []).join(' ');
 card.reduceEffect = function(store: any, state: any, effect: any) {
  const holder = StateUtils.findPokemonSlot(state, this);
  const owner = holder && StateUtils.findOwner(state, holder);
  if(this.name==='Boomerang Energy'){
   if(effect instanceof AttackEffect&&holder&&effect.source===holder)this._specialEnergyAttackSource={turn:state.turn,pokemon:holder.getPokemonCard()};
   if(effect.type==='AFTER_ATTACK_EFFECT'){
    const plan=this._specialEnergyReturn;delete this._specialEnergyReturn;
    if(plan?.turn===state.turn){const p=state.players.find((p:any)=>p.id===plan.ownerId),list=StateUtils.findPokemonSlot(state,plan.pokemon);if(p?.discard.cards.includes(this)&&list&&StateUtils.findOwner(state,list)===p){const attach:any=new AttachEnergyEffect(p,this,list);attach.source=p.discard;attach.origin='attack';store.reduceEffect(state,attach);}}
   }
   if(effect.type==='END_TURN_EFFECT'){delete this._specialEnergyAttackSource;delete this._specialEnergyReturn;}
   return state;
  }
  const relevant = holder && (effect.source === holder || effect.target === holder || effect.target === holder.getPokemonCard() || ['CHECK_TABLE_STATE_EFFECT','END_TURN_EFFECT','BETWEEN_TURNS_EFFECT'].includes(effect.type) || effect.power && this.powers?.includes(effect.power));
  // A suppression probe must never probe itself. Fusion Energy's own shield
  // wins against the opponent's Spectral Breach, but not against a Stadium.
  if(this.name === 'Fusion Strike Energy' && effect instanceof EffectOfAbilityEffect && effect.target === holder && effect.player === owner) return state;
  const blocked = relevant && !['SPECIAL_ENERGY_EFFECT','EFFECT_OF_ABILITY_EFFECT'].includes(effect.type) && blockedEnergy(store,state,owner,this,holder);
  if (blocked) return state;

  if(this.name==='Aurora Energy'&&effect instanceof AttachEnergyEffect&&effect.energyCard===this&&!effect.player.hand.cards.includes(this))return state;
  if(this.name==='Regenerative Energy'&&effect.type==='EVOLVE_EFFECT'&&(!effect.player.hand.cards.includes(effect.pokemonCard)||effect._wotcFromDeck))return state;
  if (handTriggers.has(this.name) && effect instanceof AttachEnergyEffect && effect.energyCard === this) {
   if (this.name === 'Herbal Energy') {
    const type = new CheckPokemonTypeEffect(effect.target);store.reduceEffect(state,type);
    if (!type.cardTypes.includes(CardType.GRASS)) throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
   }
   // These effects happen after attachment, and only when attached from hand.
   return state;
  }
  if (handTriggers.has(this.name) && effect instanceof AfterEnergyAttachedEffect && effect.energyCard === this) {
   if (!effect.fromHand || !holder || IS_SPECIAL_ENERGY_BLOCKED(store,state,owner,this,holder)) return state;
   const type = new CheckPokemonTypeEffect(holder);store.reduceEffect(state,type);
   if (this.name === 'Rainbow Energy') store.reduceEffect(state,new PlaceDamageCountersEffect(owner,holder,10));
   if (this.name === 'Full Heal Energy') {
    const all = /Special Condition/i.test(text);
    holder.specialConditions = holder.specialConditions.filter((condition: any) => !all && ![0,1,2,3].includes(condition));
    if (all) holder.clearAllSpecialConditions();
   }
   if(this.name==='Heal Energy'&&!holder.getPokemonCard()?.hasTag(CardTag.POKEMON_ex)){store.reduceEffect(state,new HealEffect(owner,holder,10));holder.clearAllSpecialConditions();}
   if(this.name==='Jet Energy'&&owner.bench.includes(holder))owner.switchPokemon(holder,store,state);
   if(this.name==='Cyclone Energy'&&owner.active===holder){const opponent=StateUtils.getOpponent(state,owner);if(opponent.bench.some((l:any)=>l.getPokemonCard()))store.prompt(state,new ChoosePokemonPrompt(opponent.id,GameMessage.CHOOSE_NEW_ACTIVE_POKEMON,PlayerType.BOTTOM_PLAYER,[SlotType.BENCH],{allowCancel:false}),(chosen:any)=>{if(chosen?.[0])opponent.switchPokemon(chosen[0],store,state);});}
   if (this.name === 'Potion Energy' || this.name === 'Medical Energy' || this.name === 'Herbal Energy' && type.cardTypes.includes(CardType.GRASS)) store.reduceEffect(state,new HealEffect(owner,holder,this.name === 'Potion Energy' ? 10 : 30));
   if (this.name === 'Speed Lightning Energy' && type.cardTypes.includes(CardType.LIGHTNING)) DRAW_CARDS(store,state,owner,2);
   if (this.name === 'Draw Energy') DRAW_CARDS(store,state,owner,1);
   if (this.name === 'Enriching Energy') DRAW_CARDS(store,state,owner,4);
   if (this.name === 'Capture Energy' && GET_PLAYER_BENCH_SLOTS(owner).length) SEARCH_YOUR_DECK_FOR_POKEMON_AND_PUT_ONTO_BENCH(store,state,owner,{stage: 2},{min:0,max:1});
   if (this.name === 'Warp Energy' && owner.active === holder && owner.bench.some((l:any)=>l.getPokemonCard())) store.prompt(state,new ChoosePokemonPrompt(owner.id,GameMessage.CHOOSE_NEW_ACTIVE_POKEMON,PlayerType.BOTTOM_PLAYER,[SlotType.BENCH],{allowCancel:false}),(chosen:any)=>{if(chosen?.[0])owner.switchPokemon(chosen[0],store,state);});
   return state;
  }
  if (holder && effect instanceof KnockOutEffect && effect.target === holder && ['Gift Energy','Legacy Energy','Splash Energy'].includes(this.name)) {
   const lethal=holder._exLethalAttackDamage;
   if(state.phase!==3||state.players[state.activePlayer]===owner||lethal?.turn!==state.turn||lethal.card!==holder.getPokemonCard())return state;
   if(this.name==='Gift Energy'){DRAW_CARDS(store,state,owner,Math.max(0,7-owner.hand.cards.length));return state;}
   if(this.name==='Splash Energy'){effect._hgssRescue=true;return state;}
  }
  if(holder&&['V Guard Energy','Stone Fighting Energy','Shield Energy'].includes(this.name)){
   if(effect instanceof PutDamageEffect&&effect.target===holder&&effect.player!==owner){
    const type=new CheckPokemonTypeEffect(holder);store.reduceEffect(state,type);
    const v=effect.source.getPokemonCard()?.tags.some((tag:any)=>[CardTag.POKEMON_V,CardTag.POKEMON_VMAX,CardTag.POKEMON_VSTAR,CardTag.POKEMON_VUNION].includes(tag));
    let amount=this.name==='V Guard Energy'?(v&&!effect._vGuardEnergyApplied?30:0):this.name==='Stone Fighting Energy'&&type.cardTypes.includes(CardType.FIGHTING)?20:this.name==='Shield Energy'&&type.cardTypes.includes(CardType.METAL)?10:0;
    if(amount){effect.specialEnergyAfterWeaknessReduction=(effect.specialEnergyAfterWeaknessReduction||0)+amount;if(this.name==='V Guard Energy')effect._vGuardEnergyApplied=true;}
   }
   return state;
  }
  if(this.name==='Splash Energy'&&holder&&effect.type==='CHECK_TABLE_STATE_EFFECT'){const types=new CheckPokemonTypeEffect(holder);store.reduceEffect(state,types);if(!types.cardTypes.includes(CardType.WATER)){const zone=holder.cards.includes(this)?holder:holder.energies;MOVE_CARDS(store,state,zone,owner.discard,{cards:[this],sourceCard:this,sourceEffect:effect});}return state;}
  if (this.name === 'Lucky Energy' && holder) {
   if (effect instanceof AfterDamageEffect && effect.target === holder && owner.active === holder && effect.player !== owner && effect.damage > 0 && state.phase === 3) DRAW_CARDS(store,state,owner,1);
   return state;
  }
  if (this.name === 'Spiky Energy' && holder) {
   if (effect instanceof AfterDamageEffect && effect.target === holder && owner.active === holder && effect.player !== owner && effect.damage > 0 && state.phase === 3) store.reduceEffect(state,new PlaceDamageCountersEffect(owner,effect.source,20));
   return state;
  }
  if (this.name === 'Fusion Strike Energy' && holder && holder.getPokemonCard()?.hasTag(CardTag.FUSION_STRIKE)) {
   if (effect instanceof EffectOfAbilityEffect && effect.target === holder) { if(effect.player !== owner && effect.power.powerType === PowerType.ABILITY && !blockedEnergy(store,state,owner,this,holder)) effect.target = undefined;return state; }
   if (effect instanceof PlaceDamageCountersEffect && effect.target === holder) {
    const source = effect.source && StateUtils.findPokemonSlot(state,effect.source);
    if (source && StateUtils.findOwner(state,source) !== owner && effect.source.powers?.some((power:any)=>power.powerType === PowerType.ABILITY)) effect.preventDefault = true;
    return state;
   }
  }
  return ordinary.call(this,store,state,effect);
 };
}
