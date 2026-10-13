const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'../rules-research/twinleafgg-main/ptcg-server/src');
function edit(f,fn){const p=path.join(root,f);fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));}
edit('sets/set-base-set/charizard.ts',s=>{
 s=s.replace('turn all [R] Energy','turn all Energy');
 s=s.replace(/      if \(player.marker.hasMarker\(this.ENERGY_BURN_MARKER, this\)\) \{\s*throw new GameError\(GameMessage.POWER_ALREADY_USED\);\s*\}/,'');
 const start=s.indexOf('      effect.source.cards.forEach(c => {'),end=s.indexOf('\n    if (effect instanceof EndTurnEffect',start);
 if(start>=0&&end>=0)s=s.slice(0,start)+`      // Preserve the number of Energy units, including Double Colorless.
      effect.energyMap.forEach(entry => { entry.provides = entry.provides.map(() => CardType.FIRE); });
    }

`+s.slice(end);
 return s;
});
edit('sets/set-base-set/charizard.ts',s=>{
 const start=s.indexOf('    if (effect instanceof CheckProvidedEnergyEffect'),end=s.indexOf('    if (effect instanceof EndTurnEffect',start);
 return s.slice(0,start)+`    if (effect instanceof CheckProvidedEnergyEffect && effect.source.getPokemonCard() === this && effect.player.marker.hasMarker(this.ENERGY_BURN_MARKER, this)) {
      effect.source.cards.forEach(c => { if (c.superType === 3 && !effect.energyMap.some(e=>e.card===c)) effect.energyMap.push({card:c as EnergyCard,provides:(c as EnergyCard).provides.map(()=>CardType.FIRE)}); });
      effect.energyMap.forEach(entry => { entry.provides = entry.provides.map(() => CardType.FIRE); });
    }
\n`+s.slice(end);
});
edit('sets/set-base-set/double-colorless-energy.ts',s=>s.replace('public provides: CardType[] = [CardType.COLORLESS];','public provides: CardType[] = [CardType.COLORLESS, CardType.COLORLESS];'));
edit('sets/set-base-set/alakazam.ts',s=>s.replace('player.forEachPokemon(PlayerType.TOP_PLAYER','player.forEachPokemon(PlayerType.BOTTOM_PLAYER').replace(/damage: checkHpEffect.hp(?: - 10)*/g,'damage: checkHpEffect.hp - 10'));
edit('sets/set-fossil/slowbro.ts',s=>s.replace('player.forEachPokemon(PlayerType.TOP_PLAYER','player.forEachPokemon(PlayerType.BOTTOM_PLAYER').replace(/damage: checkHpEffect.hp(?: - 10)*/g,'damage: checkHpEffect.hp - 10').replace('{ allowCancel: true }',`{ allowCancel: true, blockedTo: maxAllowedDamage.filter(x => StateUtils.getTarget(state, player, x.target).getPokemonCard() !== effect.card).map(x => x.target) }`));
edit('sets/set-fossil/gengar.ts',s=>{
 if(!s.includes("import { EndTurnEffect }"))s=s.replace("import { PutDamageEffect }", "import { EndTurnEffect } from '../../game/store/effects/game-phase-effects';\nimport { PutDamageEffect }");
 const debug=s.indexOf("      console.log('Opponent active cards:'"),finish=s.indexOf('      const damagedPokemon',debug);if(debug>=0)s=s.slice(0,debug)+s.slice(finish);
 const start=s.indexOf('      const maxAllowedDamage: DamageMap[] = [];'),end=s.indexOf('      return store.prompt',start);if(start>=0&&end>=0)s=s.slice(0,start)+'      const maxAllowedDamage: DamageMap[] = [];\n\n'+s.slice(end);
 s=s.replace(/          if \(source.damage == 10\) \{\s*source.damage -= 10;\s*target.damage \+= 10;\s*\}/,'');
 if(!s.includes('effect instanceof EndTurnEffect'))s=s.replace('    return state;\n  }\n}',`    if (effect instanceof EndTurnEffect) effect.player.marker.removeMarker(this.CURSE_MARKER, this);
    return state;
  }
}`);return s;
});
edit('game/store/prompts/move-damage-prompt.ts',s=>{
 if(s.includes('Validate sequential counter movements'))return s;
 return s.replace('    return true;\n  }',`    // Validate sequential counter movements, not just target ownership.
    const damage = new Map<any, number>();
    const read = (list:any) => damage.has(list) ? damage.get(list)! : list.damage;
    const caps = new Map(this.maxAllowedDamage.map(x => [StateUtils.getTarget(state, player, x.target), x.damage]));
    for (const r of result) {
      const from = StateUtils.getTarget(state, player, r.from), to = StateUtils.getTarget(state, player, r.to);
      if (from === to || !from.getPokemonCard() || !to.getPokemonCard() || read(from) < 10) return false;
      damage.set(from, read(from) - 10); damage.set(to, read(to) + 10);
      if (caps.has(to) && read(to) > caps.get(to)!) return false;
    }
    return true;
  }`);
});
for(const f of ['sets/set-base-set/clefairy-doll.ts','sets/set-fossil/mysterious-fossil.ts'])edit(f,s=>{
 const start=s.indexOf('      const cardList = effect.player.active;'),end=s.indexOf('\n    if (effect instanceof PlayItemEffect',start);
 if(start>=0&&end>=0)s=s.slice(0,start)+`      const cardList = StateUtils.findCardList(state, this);
      cardList.moveTo(effect.player.discard);
      cardList.clearEffects();
    }

`+s.slice(end);
 s=s.replace('effect.player.active.getPokemonCard() === this) {\n      effect.prizeCount','effect.target.getPokemonCard() === this) {\n      effect.prizeCount');
 return s;
});
edit('sets/set-fossil/ditto.ts',s=>s.replace(/entry.provides = \[CardType.ANY\];/g,'entry.provides = entry.provides.map(() => CardType.ANY);').replace(/card: c, provides: \[CardType.ANY\]/g,'card: c, provides: ((c as EnergyCard).provides || [CardType.COLORLESS]).map(() => CardType.ANY)'));
console.log('Base–Fossil interaction fixes applied');
edit('sets/set-jungle/snorlax.ts',s=>{
 const start=s.indexOf('    if (effect instanceof CheckTableStateEffect)'),end=s.indexOf('    if (WAS_ATTACK_USED',start);
 if(start>=0&&end>=0)s=s.slice(0,start)+`    if (effect instanceof AddSpecialConditionsEffect && effect.target.getPokemonCard() === this) {
      const owner = StateUtils.findOwner(state, effect.target);
      if (!effect.target.specialConditions.some(c => [SpecialCondition.ASLEEP,SpecialCondition.CONFUSED,SpecialCondition.PARALYZED].includes(c))
        && !IS_POKEMON_POWER_BLOCKED(store,state,owner,this)) effect.preventDefault = true;
    }

`+s.slice(end);return s;
});
edit('sets/set-jungle/venomoth.ts',s=>s.replace('if (pokemonHasCardType(card, CardType.COLORLESS))','if (card === this || pokemonHasCardType(card, CardType.COLORLESS))').replace('player.marker.hasMarker(this.SHIFT_MARKER)','player.marker.hasMarker(this.SHIFT_MARKER, this)').replace('        PlayerType.TOP_PLAYER,\n        [SlotType.BENCH],','        PlayerType.ANY,\n        [SlotType.ACTIVE, SlotType.BENCH],'));
edit('sets/set-fossil/dragonite.ts',s=>s.includes('throw new GameError(GameMessage.POWER_ALREADY_USED)')?s:s.replace('      // Index of this Dragonite on bench',`      if (player.marker.hasMarker(this.STEP_IN_MARKER, this)) throw new GameError(GameMessage.POWER_ALREADY_USED);
      // Index of this Dragonite on bench`));
edit('sets/set-jungle/vileplume.ts',s=>{
 s=s.replace('MULTIPLE_COIN_FLIPS_PROMPT }','MULTIPLE_COIN_FLIPS_PROMPT, COIN_FLIP_PROMPT }');
 s=s.replace('player.marker.hasMarker(this.HEAL_MARKER)','player.marker.hasMarker(this.HEAL_MARKER, this)');
 if(!s.includes('const healCoin')){
 s=s.replace('      let targets: PokemonCardList[] = [];',`      player.marker.addMarker(this.HEAL_MARKER, this);
      return COIN_FLIP_PROMPT(store, state, player, healCoin => {
      if (!healCoin) return state;
      let targets: PokemonCardList[] = [];`);
 s=s.replace('      });\n    }\n\n    if (effect instanceof EndTurnEffect','      });\n      });\n    }\n\n    if (effect instanceof EndTurnEffect');}
 return s;
});
edit('sets/set-jungle/mr-mime.ts',s=>s.replace(/DealDamageEffect/g,'PutDamageEffect'));
edit('sets/set-base-set/machamp.ts',s=>s.replace(/DealDamageEffect/g,'AfterDamageEffect'));
edit('sets/set-base-set/pluspower.ts',s=>{
 const start=s.indexOf('        const additionalDamageEffect ='),end=s.indexOf('\n      }',start);
 if(start>=0&&end>=0)s=s.slice(0,start)+'        effect.damage += 10;'+s.slice(end);return s;
});
edit('game/store/store.ts',s=>{
 if(s.includes('WOTC printed damage order'))return s;
 return s.replace('      cards.sort((a, b) => a.superType - b.superType);',`      // WOTC printed damage order (rulebook p.22): attacking Trainers,
      // defending Trainers, then prevention/reduction and Pokémon Powers.
      if ((state.rules as any).wotcRules && effect.type === 'PUT_DAMAGE_EFFECT') {
        const damageEffect = effect as any;
        const rank = (c:Card) => damageEffect.source?.cards.includes(c) && c.superType === SuperType.TRAINER ? 0 : damageEffect.target?.cards.includes(c) && c.superType === SuperType.TRAINER ? 1 : 2;
        cards.sort((a,b) => rank(a) - rank(b));
      } else cards.sort((a, b) => a.superType - b.superType);`);
});
edit('sets/set-base-set/pokedex.ts',s=>s.replace('MOVE_CARDS(store, state, deckTop, player.deck, { sourceCard: this });','deckTop.moveToTopOfDestination(player.deck);'));
edit('sets/set-fossil/gambler.ts',s=>{
 const start=s.indexOf('      store.prompt(state, [new ShuffleDeckPrompt'),end=s.indexOf('      return state;',start);
 if(start<0||end<0)return s;
 return s.slice(0,start)+`      return store.prompt(state, new ShuffleDeckPrompt(player.id), order => {
        player.deck.applyOrder(order);
        COIN_FLIP_PROMPT(store, state, player, heads => {
          MOVE_CARDS(store,state,player.deck,player.hand,{count:heads?8:1,sourceCard:this});
        });
      });
`+s.slice(end);
});
edit('sets/set-fossil/recycle.ts',s=>s.replace('if (player.deck.cards.length === 0)','if (player.discard.cards.length === 0)'));
edit('game/store/prefabs/prefabs.ts',s=>{
 if(s.includes('Preserve attack attribution for WOTC status helpers'))return s;
 const anchor=s.indexOf('  store.reduceEffect(',s.indexOf('export function ADD_SPECIAL_CONDITIONS_TO_PLAYER_ACTIVE('));
 return s.slice(0,anchor)+`  // Preserve attack attribution for WOTC status helpers; prevention Powers
  // and Barrier/Transparency must see a status inflicted by an attack.
  if ((state.rules as any).wotcRules && [GamePhase.ATTACK,GamePhase.AFTER_ATTACK].includes(state.phase) && source instanceof PokemonCard) {
    const owner = StateUtils.findOwner(state,StateUtils.findCardList(state,source));
    const base = new AttackEffect(owner,StateUtils.getOpponent(state,owner),source.attacks[0]);
    base.source = StateUtils.findCardList(state,source) as PokemonCardList;
    const condition = new AddSpecialConditionsEffect(base,specialConditions);condition.target=player.active;condition.poisonDamage=poisonDamage;condition.burnDamage=burnDamage;condition.confusionDamage=confusionDamage;
    store.reduceEffect(state,condition);return;
  }
`+s.slice(anchor);
});
for(const name of ['gloom','venomoth','primeape','tauros','vileplume'])edit('sets/set-jungle/'+name+'.ts',s=>{
 if(!s.includes("import { AddSpecialConditionsEffect }"))s="import { AddSpecialConditionsEffect } from '../../game/store/effects/attack-effects';\n"+s;
 return s.replace(/((?:effect\.)?player|opponent)\.active\.addSpecialCondition\(SpecialCondition\.(\w+)\);/g,(_,owner,condition)=>`{ const status = new AddSpecialConditionsEffect(effect as any,[SpecialCondition.${condition}]);status.target=${owner}.active;store.reduceEffect(state,status); }`);
});
edit('sets/set-base-set/mewtwo.ts',s=>s.replace('checkProvidedEnergyEffect.energyMap.reduce((left, p) => left + p.provides.length, 0)','checkProvidedEnergyEffect.energyMap.length'));
edit('sets/set-base-set/mewtwo.ts',s=>s.includes('wotcEnergyCostPaid')?s:s.replace('      const player = effect.player;\n\n      const checkProvidedEnergy',`      const player = effect.player;
      if ((effect as any).wotcEnergyCostPaid) { PREVENT_DAMAGE(store,state,effect,this);PREVENT_EFFECTS_OF_ATTACKS(store,state,effect,this);return state; }
      const checkProvidedEnergy`));
edit('sets/set-fossil/haunter.ts',s=>{
 const start=s.indexOf('    // Transparency'),end=s.indexOf('    // Nightmare',start);
 if(start<0||end<0)return s;
 return s.slice(0,start)+`    // One Transparency flip protects against the entire attack, including
    // damage-free status attacks. Do not flip again for each subeffect.
    const targeted = effect as any;
    if (targeted.attackEffect && targeted.target?.getPokemonCard() === this && state.phase === GamePhase.ATTACK
      && !['APPLY_WEAKNESS_EFFECT','AFTER_DAMAGE_EFFECT','AFTER_WEAKNESS_AND_RESISTANCE_EFFECT'].includes(effect.type)) {
      const slot = targeted.target;
      if (!slot.specialConditions.some((c:SpecialCondition) => [SpecialCondition.ASLEEP,SpecialCondition.CONFUSED,SpecialCondition.PARALYZED].includes(c))
        && !IS_POKEMON_POWER_BLOCKED(store,state,targeted.player,this)) {
        if ((slot as any).transparencyAttack !== targeted.attackEffect) {
          const coin = new CoinFlipEffect(targeted.player); store.reduceEffect(state,coin);
          (slot as any).transparencyAttack = targeted.attackEffect;
          (slot as any).transparencyPrevent = coin.result;
        }
        if ((slot as any).transparencyPrevent) targeted.preventDefault = true;
      }
    }
`+s.slice(end);
});
