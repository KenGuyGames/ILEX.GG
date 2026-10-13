const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../rules-research/twinleafgg-main/ptcg-server/src');
function edit(file,fn){const p=path.join(root,file);fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')).replace(/\r\n/g,'\n'));}
function block(s,needle,replacement){const start=s.indexOf(needle);if(start<0)throw Error(needle);const open=s.indexOf('{',start);let depth=1,i=open+1;for(;depth&&i<s.length;i++){if(s[i]==='{')depth++;if(s[i]==='}')depth--;}return s.slice(0,start)+replacement+s.slice(i);}
function imports(s,line){return s.includes(line)?s:line+'\n'+s;}
// Drain attacks heal from the final, actually applied damage, exactly once.
for(const [set,name,index,mode] of [['base-set','bulbasaur',0,'10'],['jungle','exeggcute',1,'10'],['jungle','venonat',1,'effect.damage'],['jungle','butterfree',1,'Math.ceil(effect.damage / 20) * 10'],['fossil','golbat',1,'effect.damage'],['fossil','zubat',1,'effect.damage'],['fossil','kabutops',1,'Math.ceil(effect.damage / 20) * 10']]){
 edit(`sets/set-${set}/${name}.ts`,s=>{
  if(s.includes('// TCG Lab actual drain'))return s;
  s=block(s,`if (WAS_ATTACK_USED(effect, ${index}, this))`,``);
  if(name==='bulbasaur')s=block(s,'if (effect instanceof EndTurnEffect','');
  s=imports(s,"import { AfterDamageEffect as LabAfterDamage } from '../../game/store/effects/attack-effects';");
  return s.replace('public reduceEffect(store: StoreLike, state: State, effect: Effect): State {',`public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // TCG Lab actual drain
    if (effect instanceof LabAfterDamage && effect.attack === this.attacks[${index}] && effect.source?.getPokemonCard() === this && effect.target === effect.opponent.active && effect.damage > 0) {
      store.reduceEffect(state,new HealEffect(effect.player,effect.source,${mode}));
    }`);
 });
}
// Quick Attack already has ten printed damage; tails adds nothing.
for(const name of ['eevee','flareon','jolteon','tauros','vaporeon'])edit(`sets/set-jungle/${name}.ts`,s=>s.replace(/} else {\s*effect.damage \+= 10;\s*}/g,'}'));
edit('sets/set-jungle/exeggutor.ts',s=>s.replace(/heads \* 80/g,'heads * 20').replace(/headsCount \* 80/g,'headsCount * 20'));
edit('sets/set-jungle/cubone.ts',s=>s.replace('player.active.damage * 10','player.active.damage'));
edit('sets/set-fossil/raichu.ts',s=>s.replace('opponent.bench.forEach(target => {','opponent.bench.filter(b => b.getPokemonCard()).forEach(target => {').replace('{ min: 1, max: 3, allowCancel: false }','{ min: 3, max: 3, allowCancel: false }').replace('damageEffect.target = targets[0];\n          store.reduceEffect(state, damageEffect);','for (const target of targets) { const damage = new PutDamageEffect(effect,10);damage.target=target;store.reduceEffect(state,damage); }'));
edit('sets/set-fossil/zapdos.ts',s=>{
 if(s.includes('// TCG Lab occupied bench'))return s;
 s=imports(s,"import { CoinFlipPrompt } from '../../game/store/prompts/coin-flip-prompt';");
 return block(s,'if (WAS_ATTACK_USED(effect, 0, this))',`if (WAS_ATTACK_USED(effect, 0, this)) {
      // TCG Lab occupied bench: one resolved flip per Pokémon, then recoil.
      const targets = effect.opponent.bench.filter(b => b.getPokemonCard());
      if (!targets.length) return state;
      let i=0,tails=0;
      const flip = () => store.prompt(state,new CoinFlipPrompt(effect.player.id, 'COIN_FLIP' as any),heads => {
        if (heads) { const damage = new PutDamageEffect(effect,20);damage.target=targets[i];store.reduceEffect(state,damage); } else tails++;
        i++;if(i<targets.length)flip();else if(tails){const recoil=new DealDamageEffect(effect,tails*10);recoil.target=effect.player.active;store.reduceEffect(state,recoil);}
      });
      return flip();
    }`);
});
// Damage to Benched Pokémon ignores Weakness and Resistance and skips empty slots.
for(const [set,name] of [['base-set','dugtrio'],['base-set','magnemite'],['base-set','magneton'],['fossil','golem'],['fossil','magneton'],['fossil','weezing']])edit(`sets/set-${set}/${name}.ts`,s=>{
 s=imports(s,"import { PutDamageEffect as LabBenchDamage } from '../../game/store/effects/attack-effects';");
 return s.replace(/\.bench\.forEach\((\w+) => {/g,'.bench.filter(b => b.getPokemonCard()).forEach($1 => {').replace(/(\.bench\.filter\(b => b.getPokemonCard\(\)\)\.forEach\(\w+ => \{[\s\S]*?)new DealDamageEffect/g,'$1new LabBenchDamage');
});
// Defer status conditions until after damage, as required by the original rulebook.
edit('game/store/store.ts',s=>s.includes('// TCG Lab defer attack status')?s:s.replace('public reduceEffect(state: State, effect: Effect): State {',`public reduceEffect(state: State, effect: Effect): State {
    // TCG Lab defer attack status
    if ((state.rules as any).wotcRules && (state as any).labDeferStatus && effect.type === 'ADD_SPECIAL_CONDITIONS_EFFECT' && (effect as any).attackEffect) {
      ((state as any).labPendingStatus ||= []).push(effect);return state;
    }`));
edit('game/store/effect-reducers/game-effect.ts',s=>{
 if(s.includes('// TCG Lab damage before conditions'))return s;
 s=s.replace('    state = store.reduceEffect(state, attackEffect);','    if ((state.rules as any).wotcRules) (state as any).labDeferStatus = true;\n    state = store.reduceEffect(state, attackEffect);');
 return s.replace('    const afterAttackEffect = new AfterAttackEffect(effect.player, opponent, attack);',`    // TCG Lab damage before conditions
    (state as any).labDeferStatus = false;
    const statuses = (state as any).labPendingStatus || [];(state as any).labPendingStatus = [];
    for (const status of statuses) state = store.reduceEffect(state,status);
    if (store.hasPrompts()) yield store.waitPrompt(state, () => next());
    const afterAttackEffect = new AfterAttackEffect(effect.player, opponent, attack);`);
});
edit('sets/set-fossil/haunter.ts',s=>s.replace('transparencyAttack !== targeted.attackEffect','transparencyTurn !== state.turn').replace('transparencyAttack = targeted.attackEffect','transparencyTurn = state.turn'));
edit('sets/set-jungle/exeggutor.ts',s=>s.replace('results.filter(r => r).length * 80','results.filter(r => r).length * 20'));
edit('sets/set-jungle/primeape.ts',s=>s.replace('if (results) {','if (!results) {'));
for(const [set,name,index] of [['base-set','blastoise',0],['base-set','poliwag',0],['base-set','poliwrath',0],['jungle','vaporeon',1],['fossil','omanyte',0],['fossil','omastar',0],['fossil','lapras',0],['fossil','seadra',0]])edit(`sets/set-${set}/${name}.ts`,s=>{
 if(s.includes('// TCG Lab surplus Water'))return s;
 s=imports(s,"import { CheckProvidedEnergyEffect as LabWaterEnergy } from '../../game/store/effects/check-effects';");
 return block(s,`if (WAS_ATTACK_USED(effect, ${index}, this))`,`if (WAS_ATTACK_USED(effect, ${index}, this)) {
      // TCG Lab surplus Water: other types can cover the Colorless portion.
      const energy = new LabWaterEnergy(effect.player,effect.source);store.reduceEffect(state,energy);
      const units = energy.energyMap.flatMap(e => e.provides);
      const water = units.filter(t => t === CardType.WATER || t === CardType.ANY).length;
      const other = units.length - water;
      const typedCost = effect.attack.cost.filter(t => t === CardType.WATER).length;
      const colorlessCost = effect.attack.cost.filter(t => t === CardType.COLORLESS).length;
      effect.damage += 10 * Math.min(2,Math.max(0,water - typedCost - Math.max(0,colorlessCost-other)));
      return state;
    }`);
});
edit('sets/set-fossil/slowpoke.ts',s=>{
 s=imports(s,"import { COIN_FLIP_PROMPT as LabFlip } from '../../game/store/prefabs/prefabs';");
 s=block(s,'if (WAS_ATTACK_USED(effect, 0, this))',`if (WAS_ATTACK_USED(effect, 0, this)) {
      if (!effect.player.active.damage) throw new GameError(GameMessage.CANNOT_USE_ATTACK);
      return LabFlip(store,state,effect.player,heads => {if(heads)store.reduceEffect(state,new HealEffect(effect.player,effect.player.active,10));});
    }`);
 return block(s,'if (WAS_ATTACK_USED(effect, 1, this))',`if (WAS_ATTACK_USED(effect, 1, this)) {
      const player=effect.player;
      const recover=() => {
        if(!player.discard.cards.some(c => c instanceof TrainerCard)) return state;
        return store.prompt(state,new ChooseCardsPrompt(player,GameMessage.CHOOSE_CARD_TO_HAND,player.discard,{superType:SuperType.TRAINER},{min:1,max:1,allowCancel:false}),cards => {
          if(cards?.length) MOVE_CARDS(store,state,player.discard,player.hand,{cards,sourceCard:this});
        });
      };
      if((effect as any).wotcEnergyCostPaid) return recover();
      const energy=new CheckProvidedEnergyEffect(player);store.reduceEffect(state,energy);
      return store.prompt(state,new ChooseEnergyPrompt(player.id,GameMessage.CHOOSE_ENERGIES_TO_DISCARD,energy.energyMap,[CardType.PSYCHIC],{allowCancel:false}),chosen => {
        const discard=new DiscardCardsEffect(effect,(chosen||[]).map(e=>e.card));discard.target=player.active;store.reduceEffect(state,discard);recover();
      });
    }`);
});
edit('sets/set-jungle/persian.ts',s=>s.replace('WAS_ATTACK_USED(effect, 0, this)','WAS_ATTACK_USED(effect, 1, this)'));
edit('sets/set-jungle/electrode.ts',s=>block(s,'if (WAS_ATTACK_USED(effect, 1, this))',`if (WAS_ATTACK_USED(effect, 1, this)) {
      const types=effect.opponent.active.getPokemonCard()?.cardType || [];
      if(types.includes(CardType.COLORLESS))return state;
      for(const owner of [effect.player,effect.opponent])for(const target of owner.bench){
        const card=target.getPokemonCard();if(card && card.cardType.some(t=>types.includes(t))){const damage=new PutDamageEffect(effect,10);damage.target=target;store.reduceEffect(state,damage);}
      }
    }`));
edit('sets/set-jungle/pikachu.ts',s=>s.includes('// TCG Lab no Spark target')?s:s.replace('if (WAS_ATTACK_USED(effect, 0, this)) {','if (WAS_ATTACK_USED(effect, 0, this)) {\n      // TCG Lab no Spark target\n      if (!effect.opponent.bench.some(b=>b.getPokemonCard())) return state;'));
edit('sets/set-fossil/moltres.ts',s=>{
 s=imports(s,"import { CheckProvidedEnergyEffect as LabFireEnergy } from '../../game/store/effects/check-effects';");
 return block(s,'if (WAS_ATTACK_USED(effect, 0, this))',`if (WAS_ATTACK_USED(effect, 0, this)) {
      const energy=new LabFireEnergy(effect.player);store.reduceEffect(state,energy);
      const eligible=energy.energyMap.filter(e=>e.provides.includes(CardType.FIRE)||e.provides.includes(CardType.ANY)).map(e=>e.card);
      const blocked=effect.player.active.cards.map((c,i)=>eligible.includes(c as any)?-1:i).filter(i=>i>=0);
      return store.prompt(state,new ChooseCardsPrompt(effect.player,GameMessage.CHOOSE_ENERGIES_TO_DISCARD,effect.player.active,{superType:SuperType.ENERGY},{min:0,max:eligible.length,blocked,allowCancel:false}),cards=>{
        const discard=new DiscardCardsEffect(effect,cards||[]);discard.target=effect.player.active;store.reduceEffect(state,discard);
        if(cards?.length)MOVE_CARDS(store,state,effect.opponent.deck,effect.opponent.discard,{count:cards.length});
      });
    }`);
});
edit('sets/set-fossil/ditto.ts',s=>s.includes('// TCG Lab copied marker constants')?s:s.replace('    this.transformSource = copy;',`    // TCG Lab copied marker constants: copied powers use their own identifiers.
    for(const key of Object.keys(copy)) if(key.endsWith('_MARKER')) (this as any)[key]=(copy as any)[key];
    this.transformSource = copy;`));
edit('sets/set-base-set/impostor-professor-oak.ts',s=>{
 s=imports(s,"import { ShuffleDeckPrompt } from '../../game/store/prompts/shuffle-prompt';");
 s=imports(s,"import { GameMessage } from '../../game/game-message';");
 return s.replace('      SHUFFLE_DECK(store, state, opponent);\n      // Draw 7 cards for the opponent\n      DRAW_CARDS(store, state, opponent, 7);',`      return store.prompt(state,new ShuffleDeckPrompt(opponent.id),order=>{
        opponent.deck.applyOrder(order);DRAW_CARDS(store,state,opponent,7);
      });`);
});
edit('sets/set-jungle/dodrio.ts',s=>s.replace('if (effect instanceof CheckRetreatCostEffect) {','if (effect instanceof CheckRetreatCostEffect) {\n      if (!effect.player.bench.some(b=>b.getPokemonCard()===this)) return state;'));
edit('sets/set-jungle/pidgeot.ts',s=>{
 s=imports(s,"import { CardsToHandEffect } from '../../game/store/effects/attack-effects';");
 s=block(s,'if (WAS_ATTACK_USED(effect, 1, this))','');
 s=block(s,'if (effect instanceof AfterDamageEffect',`if (effect instanceof AfterDamageEffect && effect.attack === this.attacks[1] && effect.source?.getPokemonCard() === this && effect.target === effect.opponent.active && effect.target.damage < effect.target.hp) {
      const bounce=new CardsToHandEffect(effect.attackEffect,[...effect.target.cards]);bounce.target=effect.target;store.reduceEffect(state,bounce);
      if(!bounce.preventDefault)effect.target.clearEffects();
    }`);
 return s;
});
edit('sets/set-jungle/butterfree.ts',s=>s.replace('effect instanceof AfterDamageEffect && this.USED_WHIRLWIND == true','effect instanceof AfterDamageEffect && effect.attack === this.attacks[0] && effect.source?.getPokemonCard() === this && effect.target === effect.opponent.active'));
// Conversion changes belong to the slot, so retreat and evolution clear them.
edit('sets/set-base-set/porygon.ts',s=>{
 s=block(s,'public reduceEffect(store: StoreLike, state: State, effect: Effect): State',`public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
      const first=WAS_ATTACK_USED(effect,0,this), second=WAS_ATTACK_USED(effect,1,this);
      if(first || second){
        const target=first?effect.opponent.active:effect.player.active;
        if(first && !target.getPokemonCard()?.weakness.length)return state;
        const types=[CardType.FIRE,CardType.WATER,CardType.GRASS,CardType.LIGHTNING,CardType.PSYCHIC,CardType.FIGHTING];
        return store.prompt(state,new SelectPrompt(effect.player.id,GameMessage.CHOOSE_ENERGY_TYPE,['Fire','Water','Grass','Lightning','Psychic','Fighting'],{allowCancel:false}),choice=>{
          (target as any)[first?'labConversionWeakness':'labConversionResistance']=types[choice];
        });
      }
      return state;
    }`);return s;
});
edit('game/store/store.ts',s=>s.includes('// TCG Lab slot conversion')?s:s.replace('    state = this.propagateEffect(state, effect);',`    state = this.propagateEffect(state, effect);
    // TCG Lab slot conversion
    if(effect.type === 'CHECK_POKEMON_STATS_EFFECT') {
      const stats=effect as any;
      if(stats.target.labConversionWeakness!==undefined)stats.weakness=[{type:stats.target.labConversionWeakness}];
      if(stats.target.labConversionResistance!==undefined)stats.resistance=[{type:stats.target.labConversionResistance,value:-30}];
    }`));
edit('game/store/state/pokemon-card-list.ts',s=>s.includes('delete (this as any).labConversionWeakness')?s:s.replace('  clearEffects(): void {','  clearEffects(): void {\n    delete (this as any).labConversionWeakness;delete (this as any).labConversionResistance;'));
console.log('Applied Base–Fossil follow-up interaction fixes');
