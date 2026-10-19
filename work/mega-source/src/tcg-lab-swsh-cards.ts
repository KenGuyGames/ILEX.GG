import {CardTag,Stage,GameError,GameMessage,PowerType} from './game';
import {PowerEffect,AttackEffect,UseAttackEffect} from './game/store/effects/game-effects';
import {MOVE_CARDS,IS_TOOL_BLOCKED} from './game/store/prefabs/prefabs';
import {CheckPokemonAttacksEffect} from './game/store/effects/check-effects';
export function installSwshCard(card:any,record:any){
 card._swshId=record.d.id;
 card.attacks?.forEach((a:any,index:number)=>{const text=record.d.attacks?.[index]?.text||'';if(/can't use more than 1 VSTAR Power/.test(text))a._swshVstar=true;if(/If you go first, you can use this attack during your first turn\./.test(text))a.canUseOnFirstTurn=true;});
 card.attacks?.forEach((a:any,index:number)=>{const minimum=(record.ops?.[index]||record.copyOps?.[index]||[]).find((op:any)=>op.op==='swsh'&&op.kind==='requireLostCount');if(minimum)a._swshLostZoneMinimum=minimum.amount;});
 card.powers?.forEach((power:any,index:number)=>{if(/can't use more than 1 VSTAR Power/.test(record.d.abilities?.[index]?.text||''))power._swshVstar=true;});
 {const reduce=card.reduceEffect;card.reduceEffect=function(store:any,state:any,e:any){
  if(e.card===this&&e.power?._swshVstar&&e.player.usedVSTAR&&(e.type==='USE_POWER_EFFECT'||e.type==='POWER_EFFECT'&&this.powers?.includes(e.power)))throw new GameError(GameMessage.LABEL_VSTAR_USED);
  if((e instanceof UseAttackEffect||e instanceof AttackEffect)&&this.attacks?.includes(e.attack)&&e.attack._swshVstar){
   const index=this.attacks.indexOf(e.attack);for(const op of record.ops?.[index]||[])if(op.op==='swsh'&&op.kind==='requireLostCount'&&e.player.lostzone.cards.length<op.amount)throw new GameError(GameMessage.CANNOT_USE_ATTACK);
   if(e.player.usedVSTAR)throw new GameError(GameMessage.LABEL_VSTAR_USED);
   if(e instanceof AttackEffect&&!record.reuse)e.player.usedVSTAR=true;
  }
  return reduce.call(this,store,state,e);
 };}
 const subtypes=record.d.subtypes||[];
 for(const [name,tag] of [['V',CardTag.POKEMON_V],['VMAX',CardTag.POKEMON_VMAX],['VSTAR',CardTag.POKEMON_VSTAR],['V-UNION',CardTag.POKEMON_VUNION],['Radiant',CardTag.RADIANT]] as any[])if(subtypes.includes(name)&&!card.tags.includes(tag))card.tags.push(tag);
 for(const [name,stage] of [['VMAX',Stage.VMAX],['VSTAR',Stage.VSTAR],['V-UNION',Stage.VUNION]] as any[])if(subtypes.includes(name))card.stage=stage;
 for(const [name,tag] of [['Single Strike',CardTag.SINGLE_STRIKE],['Rapid Strike',CardTag.RAPID_STRIKE],['Fusion Strike',CardTag.FUSION_STRIKE]] as any[])if(subtypes.includes(name)&&!card.tags.includes(tag))card.tags.push(tag);
 if(subtypes.includes('V-UNION')){
  card.powers?.forEach((power:any)=>{if(power.name.endsWith(' V-UNION Assembly')){power.powerType=PowerType.VUNION_ASSEMBLY;power.useFromDiscard=true;power.useWhenInPlay=false;power.exemptFromAbilityLock=true;delete power._wotcPassive;}});
  card.powers?.forEach((power:any)=>{if(['Ninja Body','Antidote Jutsu','Photon Barrier'].includes(power.name))power._wotcPassive=true;});
  const number=Number(record.d.number.replace('SWSH','')),groups=[[139,140,141,142],[155,156,157,158],[159,160,161,162],[163,164,165,166],[215,216,217,218],[287,288,289,290]],group=groups.find(g=>g.includes(number));
  if(!group)throw Error('Unrecognized V-UNION printing '+record.d.id);
  card._swshUnionPart=group.indexOf(number);
  card._swshUnionGroup=group[0];card._swshUnionInPlay=false;
  const reduce=card.reduceEffect;card.reduceEffect=function(store:any,state:any,e:any){
   if(e instanceof PowerEffect&&e.type==='POWER_EFFECT'&&e.card===this&&this.powers.includes(e.power)&&e.power.powerType===PowerType.VUNION_ASSEMBLY){
    const p=e.player,slot=p.bench.find((l:any)=>!l.cards.length);
    if(p.assembledVUNIONs.includes(this.name)||!slot)throw new GameError(GameMessage.CANNOT_USE_POWER);
    const pieces=[0,1,2,3].map(part=>p.discard.cards.find((c:any)=>c.name===this.name&&c._swshUnionPart===part&&c._swshUnionGroup===this._swshUnionGroup));
    if(pieces.some((c:any)=>!c))throw new GameError(GameMessage.CANNOT_USE_POWER);
    // Move exactly one copy of each quarter; top-left supplies the composite's effects.
    for(const part of [1,2,3,0])MOVE_CARDS(store,state,p.discard,slot,{cards:[pieces[part]],sourceCard:this,sourceEffect:e});
    pieces.forEach((piece:any)=>piece._swshUnionInPlay=true);
    p.assembledVUNIONs.push(this.name);slot.pokemonPlayedTurn=state.turn;return state;
   }
   return reduce.call(this,store,state,e);
  };
 }
 if(record.d.supertype==='Trainer'&&record.d.attacks?.length){
  const reduce=card.reduceEffect;card.reduceEffect=function(store:any,state:any,e:any){
   if(!(e instanceof CheckPokemonAttacksEffect||e instanceof UseAttackEffect||e instanceof AttackEffect))return reduce.call(this,store,state,e);
   const p=e.player,eligible=p?.active.tools.includes(this)&&!IS_TOOL_BLOCKED(store,state,p,this)&&(!subtypes.includes('Single Strike')||p.active.getPokemonCard()?.hasTag(CardTag.SINGLE_STRIKE))&&(!subtypes.includes('Rapid Strike')||p.active.getPokemonCard()?.hasTag(CardTag.RAPID_STRIKE))&&(!this.attacks.some((a:any)=>a._swshVstar)||p.active.getPokemonCard()?.hasTag(CardTag.POKEMON_V));
   if((e instanceof UseAttackEffect||e instanceof AttackEffect)&&this.attacks.includes(e.attack)&&!eligible)throw new GameError(GameMessage.CANNOT_USE_ATTACK);
   const next=reduce.call(this,store,state,e);
   if(e instanceof CheckPokemonAttacksEffect){e.attacks=e.attacks.filter((a:any)=>!this.attacks.includes(a));if(eligible)e.attacks.push(...this.attacks);}
   return next;
  };
 }
 if(record.reuse&&record.d.abilities?.length===card.powers?.length)card.powers.forEach((p:any,i:number)=>{p.name=record.d.abilities[i].name;p.text=record.d.abilities[i].text;});
}
