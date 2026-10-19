import {GameError,GameMessage,StateUtils,CardType,Stage,SuperType,EnergyType,PlayerType,SlotType,SpecialCondition,ChooseCardsPrompt,ChoosePokemonPrompt,CardList} from './game';
import {CheckPokemonTypeEffect,CheckHpEffect,AddSpecialConditionsPowerEffect} from './game/store/effects/check-effects';
import {PutDamageEffect,ApplyWeaknessEffect} from './game/store/effects/attack-effects';
import {HealEffect,EvolveEffect,KnockOutEffect} from './game/store/effects/game-effects';
import {MOVE_CARDS} from './game/store/prefabs/prefabs';
import {exAttachedEnergy,exMoveEnergy} from './tcg-lab-ex-attachments';
import {xyTypes} from './tcg-lab-xy-actions';
export function smPowerTrigger(op:any,e:any,p:any,list:any,state:any){
 if(op.kind!=='smPassive')return false;
 if(op.action==='prizeHp')return e instanceof CheckHpEffect&&e.target===list;
 if(op.action==='pressure')return e instanceof ApplyWeaknessEffect&&e.target===list&&p.active===list;
 if(op.action==='teamReduction')return e instanceof PutDamageEffect&&p.active===list&&[p.active,...p.bench].includes(e.target);
 if(op.action==='goldenWing')return !e._smGoldenResolved&&e instanceof KnockOutEffect&&e.target===list&&p.active===list&&state.players[state.activePlayer]!==p&&list._exLethalAttackDamage?.turn===state.turn&&list._exLethalAttackDamage.card===list.getPokemonCard();
 if(op.action==='scoopBlock')return e.type==='MOVE_CARDS_EFFECT';
 return false;
}
export function smPower(card:any,op:any,power:any,store:any,state:any,e:any,p:any,list:any,use:any){
 const o=StateUtils.getOpponent(state,p),typed=(target:any,type:string)=>{const c=new CheckPokemonTypeEffect(target);store.reduceEffect(state,c);return c.cardTypes.includes(xyTypes[type]);};
 if(op.kind==='smPassive'){
  if(op.action==='scoopBlock'){if(e.destination!==o.hand)return state;const damaged=[o.active,...o.bench].filter((l:any)=>l.getPokemonCard()&&l.damage>0);if(damaged.some((l:any)=>e.source===l||e.source===l.energies))e.preventDefault=true;return state;}
  if(op.action==='goldenWing'){const entries=exAttachedEnergy(store,state,p,list).filter((x:any)=>x.card.energyType===EnergyType.BASIC);if(!entries.length||!p.bench.some((l:any)=>l.getPokemonCard()))return state;e.preventDefault=true;const finish=()=>{e._smGoldenResolved=true;e.preventDefault=false;store.reduceEffect(state,e);};const view=new CardList();view.cards=entries.map((x:any)=>x.card);return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_ATTACH,view,{},{min:0,max:Math.min(2,entries.length),allowCancel:false}),(cards:any)=>{const put=(i:number):any=>{if(i>=cards.length)return finish();store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_ATTACH_CARDS,PlayerType.BOTTOM_PLAYER,[SlotType.BENCH],{allowCancel:false}),(targets:any)=>{const entry=entries.find((x:any)=>x.card===cards[i]);MOVE_CARDS(store,state,entry.zone,targets[0],{cards:[entry.card],sourceCard:card,sourceEffect:e});put(i+1);});};put(0);});}
  if(op.action==='prizeHp'&&o.prizes.filter((l:any)=>l.cards.length).length<=op.prizes)e.hp=op.hp;
  if(op.action==='pressure'&&e.player!==p)e.damage=Math.max(0,e.damage-op.amount);
  if(op.action==='teamReduction'&&e.player!==p&&!e.attackEffect.wotcBypassDefender)e.damage=Math.max(0,e.damage-op.amount);
  return state;
 }
 const choose=(targets:any[],done:any)=>{if(!targets.length)throw new GameError(GameMessage.CANNOT_USE_POWER);const slots=[{player:PlayerType.BOTTOM_PLAYER,slot:SlotType.ACTIVE,index:0,list:p.active},...p.bench.map((list:any,index:number)=>({player:PlayerType.BOTTOM_PLAYER,slot:SlotType.BENCH,index,list}))];return store.prompt(state,new ChoosePokemonPrompt(p.id,GameMessage.CHOOSE_POKEMON_TO_HEAL,PlayerType.BOTTOM_PLAYER,[SlotType.ACTIVE,SlotType.BENCH],{allowCancel:false,blocked:slots.filter(s=>!targets.includes(s.list)).map(({list,...t})=>t)}),(chosen:any)=>done(chosen[0]));};
 switch(op.action){
 case 'plunge':{if(p.active===list||!p.bench.includes(list))throw new GameError(GameMessage.CANNOT_USE_POWER);const entries=exAttachedEnergy(store,state,p,p.active);if(!entries.length)throw new GameError(GameMessage.CANNOT_USE_POWER);use();let moved=0;for(const entry of entries){MOVE_CARDS(store,state,entry.zone,list,{cards:[entry.card],sourceCard:card,sourceEffect:e});if(list.cards.includes(entry.card)||list.energies.cards.includes(entry.card))moved++;}if(moved)p.switchPokemon(list,store,state);break;}
 case 'healActive':if(!p.active.damage||!typed(p.active,op.energy))throw new GameError(GameMessage.CANNOT_USE_POWER);use();store.reduceEffect(state,new HealEffect(p,p.active,op.amount));break;
 case 'healAny':return choose([p.active,...p.bench].filter(l=>l.getPokemonCard()&&l.damage),(target:any)=>{use();store.reduceEffect(state,new HealEffect(p,target,op.amount));});
 case 'discardSpecialHeal':{const energy=exAttachedEnergy(store,state,p,list).filter((entry:any)=>entry.card.energyType===EnergyType.SPECIAL);if(!energy.length||!list.damage)throw new GameError(GameMessage.CANNOT_USE_POWER);const view=new CardList();view.cards=energy.map((x:any)=>x.card);return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_ENERGIES_TO_DISCARD,view,{},{min:1,max:1,allowCancel:false}),(cards:any)=>{use();const entry=energy.find((x:any)=>x.card===cards[0]);MOVE_CARDS(store,state,entry.zone,p.discard,{cards,sourceCard:card,sourceEffect:e});if(p.discard.cards.includes(cards[0]))store.reduceEffect(state,new HealEffect(p,list,op.amount));});}
 case 'namedEnergyMove':{if(![p.active,...p.bench].some(l=>l.getPokemonCard()?.name===op.name))throw new GameError(GameMessage.CANNOT_USE_POWER);return exMoveEnergy(store,state,p,card,e,{targetName:op.name},()=>use());}
 case 'eeveeEvolve':{if(state.turn<=2||list.pokemonPlayedTurn===state.turn)throw new GameError(GameMessage.CANNOT_USE_POWER);const eligible=p.hand.cards.filter((c:any)=>c.superType===SuperType.POKEMON&&c.evolvesFrom==='Eevee');if(!eligible.length)throw new GameError(GameMessage.CANNOT_USE_POWER);return store.prompt(state,new ChooseCardsPrompt(p,GameMessage.CHOOSE_CARD_TO_HAND,p.hand,{superType:SuperType.POKEMON},{min:1,max:1,allowCancel:false,blocked:p.hand.cards.map((c:any,i:number)=>eligible.includes(c)?-1:i).filter((i:number)=>i>=0)}),(cards:any)=>{use();store.reduceEffect(state,new HealEffect(p,list,999));const evolve:any=new EvolveEffect(p,list,cards[0]);evolve._smEeveeEvolution=true;store.reduceEffect(state,evolve);});}
 case 'firstSecondConfuse':if(state.turn!==2)throw new GameError(GameMessage.CANNOT_USE_POWER);use();store.reduceEffect(state,new AddSpecialConditionsPowerEffect(p,card,o.active,[SpecialCondition.CONFUSED]));break;
 default:throw Error('Unsupported SM power '+op.action);
 }
 return state;
}
