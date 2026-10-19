import {CardTag,Stage,PowerType,StateUtils,EnergyType,CardType,SpecialCondition,TrainerType,GameError,GameMessage} from './game';
import {CheckHpEffect,CheckPokemonTypeEffect,CheckSpecialConditionRemovalEffect,CheckPokemonAttacksEffect,CheckPokemonPowersEffect} from './game/store/effects/check-effects';
import {ApplyWeaknessEffect,AfterDamageEffect,PutDamageEffect,AddSpecialConditionsEffect} from './game/store/effects/attack-effects';
import {AttackEffect,UseAttackEffect} from './game/store/effects/game-effects';
import {IS_SPECIAL_ENERGY_BLOCKED,IS_TOOL_BLOCKED} from './game/store/prefabs/prefabs';
import {IS_STADIUM_EFFECT_BLOCKED} from './game/store/prefabs/stadium-effect';
import {installSvCard} from './tcg-lab-sv-cards';
import {installSmCard} from './tcg-lab-sm-cards';
import {installSwshCard} from './tcg-lab-swsh-cards';
import {installXyCard} from './tcg-lab-xy-cards';
import {megaData} from './tcg-lab-mega-data';
import {megaEnergy} from './tcg-lab-mega-energy';

export function installMegaCard(card:any,record:any){
 const d=record.d,sub=d.subtypes||[];installSvCard(card,record);card._megaId=d.id;
 if(d.abilities?.some((a:any)=>a.name==='Explosiveness'))card._megaSetupActiveOnly=true;
 if(record.fossil)card._megaNoSetupFossil=true;
 if(d.name==='Nitro Fire Energy'){card._xyBurningEnergy=true;card._megaNitroEnergy=true;}
 // Modern Mega ex evolves from its printed pre-evolution and awards three Prizes.
 // The older XY Mega EX rule is a distinct mechanic retained for Classic reprints.
 if(sub.includes('Mega ex')){card.tags=card.tags.filter((t:any)=>t!==CardTag.MEGA);card.stage=sub.includes('Stage 2')?Stage.STAGE_2:sub.includes('Stage 1')?Stage.STAGE_1:Stage.BASIC;if(!card.tags.includes(CardTag.POKEMON_SV_MEGA))card.tags.push(CardTag.POKEMON_SV_MEGA);}
 if(d.set.id==='30th-c'){
  if(sub.some((t:string)=>['GX','TAG TEAM'].includes(t)))installSmCard(card,record);
  if(sub.some((t:string)=>['V','VMAX','VSTAR'].includes(t)))installSwshCard(card,record);
  if(sub.some((t:string)=>['MEGA','BREAK'].includes(t))){card.stage=sub.includes('BREAK')?Stage.BREAK:Stage.MEGA;installXyCard(card,record);}
  if(sub.includes('LEVEL-UP')){card._dpLevelUp=true;card.stage=Stage.LV_X;card.name=d.name.replace(/ LV\.X$/,'');if(!card.tags.includes(CardTag.POKEMON_LV_X))card.tags.push(CardTag.POKEMON_LV_X);}
  if(sub.includes('LEGEND')){card._hgssLegend=true;card._hgssLegendPrizes=2;card._hgssLegendHalf=megaData.filter((r:any)=>r.d.set.id==='30th-c'&&r.d.name===d.name).every((r:any)=>Number(d.number)<=Number(r.d.number))?'top':'bottom';card.stage=Stage.LEGEND;card.tags=card.tags.filter((t:any)=>t!==CardTag.DUAL_LEGEND);if(!card.tags.includes(CardTag.LEGEND))card.tags.push(CardTag.LEGEND);}
 }
 card.attacks?.forEach((a:any,i:number)=>{const p=d.attacks?.[i];if(p){a.name=p.name;a.text=p.text||'';a.damageCalculation=/[+×x-]$/.test(p.damage||'')?p.damage.slice(-1):'';}});
 card.powers?.filter((p:any)=>!p._dpExtra).forEach((p:any,i:number)=>{if(d.abilities?.[i]){p.name=d.abilities[i].name;p.text=d.abilities[i].text||'';if(p.name==='Multi Adapter'){p._wotcPassive=true;p.useWhenInPlay=false;}}});
 if(record.megaEnergy){card.energyType=EnergyType.SPECIAL;card.provides=[d.name==='Growing Grass Energy'?CardType.GRASS:CardType.LIGHTNING];}
 const kind=record.trainerOps?.[0]?.kind,ordinary=card.reduceEffect;
 card.reduceEffect=function(store:any,state:any,e:any){
  if(megaEnergy(this,store,state,e))return state;
  if(d.name==='Sacred Charm'){
   const holder=state.players.flatMap((p:any)=>[p.active,...p.bench]).find((l:any)=>l.tools.includes(this));
   if(holder&&e instanceof PutDamageEffect&&e.target===holder&&e.player!==StateUtils.findOwner(state,holder)&&!e.attackEffect?.wotcBypassDefender&&!IS_TOOL_BLOCKED(store,state,StateUtils.findOwner(state,holder),this)){
    const source=e.source.getPokemonCard();if(source){const powers=new CheckPokemonPowersEffect(e.player,source);store.reduceEffect(state,powers);if(powers.powers.some((p:any)=>p.powerType===PowerType.ABILITY))e.damage=Math.max(0,e.damage-30);}
   }return state;
  }
  if(d.name==='Core Memory'){
   const eligible=e.player?.active.tools.includes(this)&&e.player.active.getPokemonCard()?.name==='Mega Zygarde ex'&&!IS_TOOL_BLOCKED(store,state,e.player,this);
   if(e instanceof CheckPokemonAttacksEffect){const next=ordinary.call(this,store,state,e);if(!eligible)e.attacks=e.attacks.filter((a:any)=>!this.attacks.includes(a));return next;}
   if((e instanceof UseAttackEffect||e instanceof AttackEffect)&&this.attacks.includes(e.attack)&&!eligible)throw new GameError(GameMessage.CANNOT_USE_ATTACK);
  }
  if(record.megaEnergy){const holder=state.players.flatMap((p:any)=>[p.active,...p.bench]).find((l:any)=>l.cards.includes(this));if(holder&&(e instanceof CheckHpEffect&&e.target===holder||e instanceof ApplyWeaknessEffect&&e.source===holder)){
   const owner=StateUtils.findOwner(state,holder);if(!IS_SPECIAL_ENERGY_BLOCKED(store,state,owner,this,holder)){const q=new CheckPokemonTypeEffect(holder);store.reduceEffect(state,q);if(d.name==='Growing Grass Energy'&&e instanceof CheckHpEffect&&q.cardTypes.includes(CardType.GRASS))e.hp+=20;if(d.name==='Voltaic Lightning Energy'&&e instanceof ApplyWeaknessEffect&&q.cardTypes.includes(CardType.LIGHTNING)&&e.target===StateUtils.getOpponent(state,owner).active&&e.damage>0)e.damage+=20;}
  }}
  if(kind==='megaConfusion'&&StateUtils.getStadiumCard(state)===this&&e instanceof CheckSpecialConditionRemovalEffect&&!IS_STADIUM_EFFECT_BLOCKED(store,state,e.player,e.target)&&e.target.specialConditions.includes(SpecialCondition.CONFUSED)&&!e.preservedConditions.includes(SpecialCondition.CONFUSED))e.preservedConditions.push(SpecialCondition.CONFUSED);
  if(['megaThickScale','megaHypnotizer'].includes(kind)){
   const holder=state.players.flatMap((p:any)=>[p.active,...p.bench]).find((l:any)=>l.tools.includes(this));if(holder){const owner=StateUtils.findOwner(state,holder),opponent=StateUtils.getOpponent(state,owner);if(!IS_TOOL_BLOCKED(store,state,owner,this)){
    if(kind==='megaThickScale'&&e instanceof PutDamageEffect&&e.target===holder&&e.player!==owner&&!e.attackEffect?.wotcBypassDefender){const ownType=new CheckPokemonTypeEffect(holder),sourceType=new CheckPokemonTypeEffect(e.source);store.reduceEffect(state,ownType);store.reduceEffect(state,sourceType);if(ownType.cardTypes.includes(CardType.DRAGON)&&sourceType.cardTypes.some((t:any)=>[CardType.GRASS,CardType.FIRE,CardType.WATER,CardType.LIGHTNING].includes(t)))e.damage=Math.max(0,e.damage-50);}
    if(kind==='megaHypnotizer'&&e instanceof AfterDamageEffect&&e.player!==owner&&e.target===holder&&holder===owner.active&&holder.getPokemonCard()?.name.startsWith("Team Rocket's ")&&e.damage>0){const b=new AttackEffect(owner,opponent,{name:this.name,cost:[],damage:0,text:this.text});b.source=holder;(b as any)._wotcTrainer=true;(b as any)._wotcTrainerCard=this;const status=new AddSpecialConditionsEffect(b,[SpecialCondition.ASLEEP]);status.target=e.source;store.reduceEffect(state,status);}
   }}
  }
  return ordinary.call(this,store,state,e);
 };
}
