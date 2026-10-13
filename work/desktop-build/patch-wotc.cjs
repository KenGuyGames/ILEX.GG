const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../rules-research/twinleafgg-main/ptcg-server/src');
function edit(file,fn){const p=path.join(root,file);fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')))}
edit('game/store/reducers/play-card-reducer.ts',s=>s.replace('state.turn === 1 && handCard.firstTurn !== true','state.turn === 1 && !state.rules.firstTurnUseSupporter && handCard.firstTurn !== true'));
edit('game/store/prefabs/trainer-prefabs.ts',s=>s.replace('state.turn === 1 && !trainerCard.firstTurn','state.turn === 1 && !state.rules.firstTurnUseSupporter && !trainerCard.firstTurn'));
edit('game/store/reducers/setup-reducer.ts',s=>{
 s=s.replace(/Math\.max\(0, (opponentMulligans - playerMulligans|playerMulligans - opponentMulligans)\);/g,'Math.max(0, $1) * ((state.rules as any).mulliganBonus || 1);');
 if(!s.includes('WOTC decides the first player after setup')){
  const start=s.indexOf('  // 1. Decide who goes first',s.indexOf('export function* setupGame'));
  const end=s.indexOf('  // 2. Both players draw 7 cards',start);
  s=s.slice(0,start)+'  if (!(state.rules as any).wotcRules) {\n'+s.slice(start,end)+'  }\n\n'+s.slice(end);
  const anchor=s.indexOf('  // Set initial Pokemon Played Turn',s.indexOf('export function* setupGame'));
  s=s.slice(0,anchor)+`  // WOTC decides the first player after setup, before revealing Pokemon.
  if ((state.rules as any).wotcRules) {
    yield store.prompt(state, new CoinFlipPrompt(player.id, GameMessage.SETUP_WHO_BEGINS_FLIP), heads => { state.activePlayer = heads ? 0 : 1; next(); });
  }
\n`+s.slice(anchor);
 }return s;
});
edit('game/store/effect-reducers/retreat-effect.ts',s=>{
 if(s.includes('const finishRetreat'))return s;
 if(!s.includes("import { COIN_FLIP_PROMPT }"))s="import { COIN_FLIP_PROMPT } from '../prefabs/prefabs';\n"+s;
 s=s.replaceAll('if (player.retreatedTurn === state.turn) {','if (!(state.rules as any).unlimitedRetreat && player.retreatedTurn === state.turn) {');
 s=s.replaceAll('    const sp = player.active.specialConditions;','    const sp = player.active.specialConditions;\n    if ((state.rules as any).wotcRules && sp.includes(SpecialCondition.CONFUSED) && (player.active as any).wotcFailedRetreatTurn === state.turn) throw new GameError(GameMessage.RETREAT_ALREADY_USED);');
 s=s.replaceAll('      player.active.clearEffects();\n','').replaceAll('        player.active.clearEffects();\n','');
 if(!s.includes('const finishRetreat'))s=s.replace('  player.retreatedTurn = state.turn;\n  player.switchPokemon(player.bench[effect.benchIndex], store, state);',`  const finishRetreat = () => {
    player.retreatedTurn = state.turn;
    player.active.clearEffects();
    player.switchPokemon(player.bench[effect.benchIndex], store, state);
  };
  if ((state.rules as any).wotcRules && player.active.specialConditions.includes(SpecialCondition.CONFUSED)) {
    COIN_FLIP_PROMPT(store, state, player, heads => {
      if (heads) finishRetreat();
      else (player.active as any).wotcFailedRetreatTurn = state.turn;
    });
  } else finishRetreat();`);
 return s;
});
edit('game/store/state/pokemon-card-list.ts',s=>s.includes('delete (this as any).wotcFailedRetreatTurn')?s:s.replace('  removeSpecialCondition(sp: SpecialCondition): void {','  removeSpecialCondition(sp: SpecialCondition): void {\n    if (sp === SpecialCondition.CONFUSED) delete (this as any).wotcFailedRetreatTurn;'));
edit('game/store/reducers/player-turn-reducer.ts',s=>s.replace('      player.active.clearEffects();\n',''));
// Required discards happen before the Confusion flip. A successful attack must
// not charge that cost again in a card-specific prefab.
for(const [file,name] of [['game/store/prefabs/costs.ts','DISCARD_X_ENERGY_FROM_THIS_POKEMON'],['game/store/prefabs/prefabs.ts','DISCARD_SPECIFIC_ENERGY_FROM_THIS_POKEMON'],['game/store/prefabs/prefabs.ts','DISCARD_ALL_ENERGY_FROM_POKEMON']])edit(file,s=>{
 const start=s.indexOf('export function '+name+'(');if(start<0)throw Error('Missing cost prefab '+name);const body=s.indexOf('\n  const player = effect.player;',start);if(body<0)throw Error('Missing cost body');
 if(!s.slice(start,body).includes('wotcEnergyCostPaid'))s=s.slice(0,body)+'\n  if ((effect as any).wotcEnergyCostPaid) return state;'+s.slice(body);return s;
});
edit('game/store/effect-reducers/game-effect.ts',s=>{
 if(s.includes('let wotcEnergyCostPaid'))return s;
 if(!s.includes("import { ChooseCardsPrompt }"))s="import { ChooseCardsPrompt } from '../prompts/choose-cards-prompt';\n"+s;
 if(!s.includes('let wotcEnergyCostPaid'))s=s.replace('  if (sp.includes(SpecialCondition.CONFUSED)) {',`  let wotcEnergyCostPaid = false;
  if ((state.rules as any).wotcRules) {
    const required = attack.text.match(/Discard (all|\\d+) (?:\\[([A-Z])\\] )?Energy(?: cards?)? attached to [^.]+? in order to use this attack/i);
    if (required) {
      const types: Record<string, CardType> = { G: CardType.GRASS, R: CardType.FIRE, W: CardType.WATER, L: CardType.LIGHTNING, P: CardType.PSYCHIC, F: CardType.FIGHTING, D: CardType.DARK, M: CardType.METAL, C: CardType.COLORLESS };
      const eligible = checkProvidedEnergy.energyMap.filter(e => !required[2] || e.provides.includes(types[required[2]])).map(e => e.card);
      const count = required[1].toLowerCase() === 'all' ? eligible.length : Number(required[1]);
      if (eligible.length < count) throw new GameError(GameMessage.NOT_ENOUGH_ENERGY);
      if (count) {
        yield store.prompt(state, new ChooseCardsPrompt(player, GameMessage.CHOOSE_ENERGIES_TO_DISCARD, attackingPokemon, { superType: SuperType.ENERGY }, { min: count, max: count, allowCancel: false, blocked: attackingPokemon.cards.map((c,i)=>eligible.includes(c)?-1:i).filter(i=>i>=0) }), chosen => {
          if (chosen) attackingPokemon.moveCardsTo(chosen, player.discard);
          next();
        });
      }
      wotcEnergyCostPaid = true;
    }
  }
  if (sp.includes(SpecialCondition.CONFUSED)) {`);
 s=s.replace('      player.active.damage += player.active.confusionDamage;',`      if ((state.rules as any).wotcRules) {
        const confusionAttack = new AttackEffect(player, opponent, { name: 'Confusion', cost: [], damage: 20, text: '' });
        confusionAttack.source = attackingPokemon;
        const selfDamage = new DealDamageEffect(confusionAttack, 20);
        selfDamage.target = attackingPokemon;
        state.phase = GamePhase.ATTACK;
        state = store.reduceEffect(state, selfDamage);
      } else player.active.damage += player.active.confusionDamage;`);
 if(!s.includes('(attackEffect as any).wotcEnergyCostPaid'))s=s.replace('  attackEffect.source = attackingPokemon;','  attackEffect.source = attackingPokemon;\n  (attackEffect as any).wotcEnergyCostPaid = wotcEnergyCostPaid;');return s;
});
console.log('WOTC setup, retreats, Confusion damage and prepaid costs patched');
edit('game/store/effect-reducers/game-effect.ts',s=>{
 if(s.includes('WOTC attack cancellation follows required costs'))return s;
 const start=s.indexOf('  // Smokescreen / Sand-Attack:'),end=s.indexOf('  // Get the actual PokemonCard',start);
 if(start<0||end<0)throw Error('Attack cancellation block changed');const block=s.slice(start,end);
 s=s.slice(0,start)+'  if (!(state.rules as any).wotcRules) {\n'+block+'  }\n\n'+s.slice(end);
 const anchor=s.indexOf('  if (sp.includes(SpecialCondition.CONFUSED)) {',s.indexOf('let wotcEnergyCostPaid'));
 return s.slice(0,anchor)+'  // WOTC attack cancellation follows required costs.\n  if ((state.rules as any).wotcRules) {\n'+block+'  }\n\n'+s.slice(anchor);
});
edit('game/store/prefabs/prefabs.ts',s=>s.replace('if (player.active.getPokemonCard() === source && player.active.specialConditions.length > 0)','if (player.active.getPokemonCard() === source && player.active.specialConditions.some(sp => !(player as any).wotcEarlyPowers || [SpecialCondition.ASLEEP, SpecialCondition.CONFUSED, SpecialCondition.PARALYZED].includes(sp)))'));
edit('game/store/store.ts',s=>{
 if(!s.includes("import { StateUtils }"))s="import { StateUtils } from './state-utils';\n"+s;
 if(!s.includes("import { PowerType }"))s="import { PowerType } from './card/pokemon-types';\n"+s;
 if(!s.includes('wotcPowerConditions'))s=s.replace('    const resolvingThisTrainer =',`    if ((state.rules as any).wotcPowerConditions && (card as any).powers?.some((p:any) => [PowerType.POKEMON_POWER,PowerType.POKEPOWER,PowerType.POKEBODY].includes(p.powerType))) {
      const slot = StateUtils.findPokemonSlot(state, card);
      if (slot?.specialConditions.length && !['ATTACK_EFFECT','AFTER_ATTACK_EFFECT','END_TURN_EFFECT'].includes(effect.type)) {
        if (effect instanceof PowerEffect && effect.card === card) throw new GameError(GameMessage.CANNOT_USE_POWER);
        return state;
      }
    }
    const resolvingThisTrainer =`);return s;
});
edit('sets/set-base-set/defender.ts',s=>{
 if(s.includes('StateUtils.findCardList(state, this).moveCardTo(this, targetPokemon)'))return s;
 s=s.replace('            const targetPokemon = results[0];','            const targetPokemon = results[0];\n            StateUtils.findCardList(state, this).moveCardTo(this, targetPokemon);');
 s=s.replace('      const player = effect.player;\n\n      player.forEachPokemon', '      const player = StateUtils.getOpponent(state, effect.player);\n      effect.player.marker.removeMarker(this.CLEAR_DEFENDER_MARKER, this);\n\n      player.forEachPokemon');return s;
});
