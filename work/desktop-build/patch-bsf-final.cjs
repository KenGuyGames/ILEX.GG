const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'../rules-research/twinleafgg-main/ptcg-server/src');
function edit(file,fn){const p=path.join(root,file);fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));}
for(const [set,name] of [['base-set','pidgeotto'],['jungle','spearow']])edit(`sets/set-${set}/${name}.ts`,s=>{
 if(s.includes('return labMirror'))return s;
 const start=s.indexOf('  public reduceEffect(');
 const body=name==='pidgeotto'?`if (AFTER_ATTACK(effect, 0, this)) { const opponent = StateUtils.getOpponent(state,effect.player);if(opponent.bench.some(b=>b.getPokemonCard()))SWITCH_ACTIVE_WITH_BENCHED(store,state,opponent); }`:'';
 return "import { mirrorMove as labMirror } from '../../tcg-lab-mirror';\n"+s.slice(0,start)+`  public reduceEffect(store: StoreLike,state: State,effect: Effect): State { ${body}\n    return labMirror(store,state,effect,this);\n  }\n}\n`;
});
edit('game/store/state/pokemon-card-list.ts',s=>s.includes('delete (this as any).labMirrorTurn')?s:s.replace('  clearEffects(): void {','  clearEffects(): void {\n    delete (this as any).labMirrorTurn;delete (this as any).labMirrorEffects;'));
edit('sets/set-fossil/ditto.ts',s=>s.replace('if (!defending || defending === this) {','if (!defending || defending === this || defending instanceof Ditto) {'));
edit('sets/set-base-set/raticate.ts',s=>s.replace('const target = effect.target;\n      const remainingHP = target.hp - target.damage;','const target=effect.opponent.active;\n      const remainingHP=target.getPokemonCard()!.hp+target.hpBonus-target.damage;'));
edit('sets/set-jungle/pidgeot.ts',s=>s.replace('effect.target.damage < effect.target.hp','effect.target.damage < (effect.target.getPokemonCard()!.hp + effect.target.hpBonus)'));
edit('sets/set-fossil/weezing.ts',s=>s.replace('cardList.damage += 60;','const recoil=new DealDamageEffect(effect,60);recoil.target=cardList;store.reduceEffect(state,recoil);'));
edit('sets/set-fossil/golem.ts',s=>{
 if(!s.includes('DealDamageEffect }'))s="import { DealDamageEffect } from '../../game/store/effects/attack-effects';\n"+s;
 return s.replace('cardList.damage += 100;','const recoil=new DealDamageEffect(effect,100);recoil.target=cardList;store.reduceEffect(state,recoil);');
});
edit('sets/set-base-set/electrode.ts',s=>s.replace(/^\s*{ value: CardType\.(DARK|DRAGON|FAIRY|METAL), message: '[^']+' },\n/gm,'').replace('effect.energyMap.push({ card: this, provides: this.provides });','if(!effect.energyMap.some(e=>e.card===this))effect.energyMap.push({ card: this, provides: this.provides });'));
edit('game/store/store.ts',s=>s.includes('// TCG Lab final Energy Burn')?s:s.replace('    state = this.propagateEffect(state, effect);',`    state = this.propagateEffect(state, effect);
    // TCG Lab final Energy Burn, including a converted Buzzap card.
    if(effect.type === 'CHECK_PROVIDED_ENERGY_EFFECT') {
      const energy=effect as any, card=energy.source.getPokemonCard();
      if(card && energy.player.marker.hasMarker('ENERGY_BURN_MARKER',card))
        energy.energyMap.forEach((entry:any)=>entry.provides=entry.provides.map(()=>CardType.FIRE));
    }`).replace('import { SuperType, TrainerType }','import { SuperType, TrainerType, CardType }'));
edit('sets/set-jungle/marowak.ts',s=>s.replace('const slots: PokemonCardList[] = player.bench.filter(b => b.cards.length === 0);','const slots: PokemonCardList[] = player.bench.filter(b => b.cards.length === 0);\n      if(!slots.length)throw new GameError(GameMessage.CANNOT_USE_ATTACK);').replace('{ min: 1, max: 1, allowCancel: true }','{ min: 0, max: 1, allowCancel: true }'));
const ui=path.resolve(__dirname,'../desktop/ui');
editUI('rules-ui.js',s=>s.replace('showHand=p.id===perspective','showHand=p.id===perspective||p.hand.isPublic').replace('showHand=p.id === perspective','showHand=p.id === perspective||p.hand.isPublic'));
function editUI(file,fn){const p=path.join(ui,file);fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));}
console.log('Special-case fixes applied');
