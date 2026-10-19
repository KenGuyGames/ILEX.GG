from pathlib import Path
root=Path(__file__).resolve().parents[1]/'rules-research/twinleafgg-main/ptcg-server/src'
def edit(file,old,new):
 p=root/file;t=p.read_text(encoding='utf-8')
 if new in t:return
 assert old in t,file
 p.write_text(t.replace(old,new,1),encoding='utf-8')
if 'useAttackEffect.explicitSource=true' in (root/'game/store/reducers/player-turn-reducer.ts').read_text(encoding='utf-8'):
 raise SystemExit('Bench source migration already installed')
edit('game/store/reducers/player-turn-reducer.ts',"import { SlotType }", "import { PlayerType, SlotType }")
p=root/'game/store/reducers/player-turn-reducer.ts';t=p.read_text(encoding='utf-8')
start=t.index('      const pokemonCard = player.active.getPokemonCard();')
end=t.index('      const energy = new CheckProvidedEnergyEffect',start)
t=t[:start]+'''      let attackingSlot = player.active;
      if (action.sourceTarget) {
        const target=action.sourceTarget;
        if(target.player!==PlayerType.BOTTOM_PLAYER || ![SlotType.ACTIVE,SlotType.BENCH].includes(target.slot)
          || !Number.isInteger(target.index) || target.index<0 || (target.slot===SlotType.ACTIVE?target.index!==0:target.index>=player.bench.length))
          throw new GameError(GameMessage.INVALID_TARGET);
        attackingSlot=target.slot===SlotType.ACTIVE?player.active:player.bench[target.index];
      }
      const pokemonCard=attackingSlot.getPokemonCard();
      let attacks:Attack[] = pokemonCard ? pokemonCard.attacks.filter(a=>attackingSlot===player.active||a.useOnBench) : [];
      const attackEffect = new CheckPokemonAttacksEffect(player);
      if(attackingSlot===player.active){
        state=store.reduceEffect(state,attackEffect);
        attacks=[...attacks,...attackEffect.attacks];
      }
      // Legacy actions without a source still select a unique Bench-only attack.
      let attack=attacks.find(a=>a.name===action.name);
      if(!attack&&!action.sourceTarget){
        const choices=player.bench.flatMap(slot=>(slot.getPokemonCard()?.attacks||[]).filter(a=>a.useOnBench&&a.name===action.name).map(a=>({slot,a})));
        if(choices.length===1){attackingSlot=choices[0].slot;attack=choices[0].a;}
      }
      if(!attack)throw new GameError(GameMessage.UNKNOWN_ATTACK);
      const cost=new CheckAttackCostEffect(player,attack,attackingSlot);
      state=store.reduceEffect(state,cost);
''' +t[end:]
t=t.replace('      useAttackEffect.delegateFrom=attackEffect.attackSources.get(attack);','      useAttackEffect.source=attackingSlot;\n      useAttackEffect.explicitSource=true;\n      useAttackEffect.delegateFrom=attackEffect.attackSources.get(attack);')
t=t.replace('      if (pokemonCard) {\n        state.playerLastAttack[player.id] = { attack, sourceCard: pokemonCard };','      if (attackingSlot.getPokemonCard()) {\n        state.playerLastAttack[player.id] = { attack, sourceCard: attackingSlot.getPokemonCard() };')
p.write_text(t,encoding='utf-8')
p=root/'game/store/effect-reducers/game-effect.ts';t=p.read_text(encoding='utf-8')
start=t.index('  const sp = player.active.specialConditions;',t.index('function* useAttack'))
end=t.index('  // Check if Pokemon cannot attack next turn',start)
t=t[:start]+'''  const attack=effect.attack;
  let attackingPokemon=effect.source||player.active;
  if(effect instanceof UseAttackEffect&&!effect.explicitSource&&attackingPokemon===player.active&&!player.active.getPokemonCard()?.attacks.includes(attack)){
    const candidates=player.bench.filter(slot=>slot.getPokemonCard()?.attacks.includes(attack)&&attack.useOnBench);
    if(candidates.length===1)attackingPokemon=candidates[0];
  }
  const sp=attackingPokemon.specialConditions;
  const ignoreStatusConditions=effect instanceof UseAttackEffect&&effect.ignoreStatusConditions;
  if((sp.includes(SpecialCondition.PARALYZED)||sp.includes(SpecialCondition.ASLEEP))&&!ignoreStatusConditions)
    throw new GameError(GameMessage.BLOCKED_BY_SPECIAL_CONDITION);
  const preceding=(attack as any)._wotcRequiredPreviousAttack,last=(attackingPokemon.getPokemonCard() as any)?._wotcLastUsedAttack;
  if(preceding&&(last?.name!==preceding||last.turn!==(player as any).wotcLastTurnEnded))throw new GameError(GameMessage.CANNOT_USE_ATTACK);

''' +t[end:]
t=t.replace('const checkAttackCost = new CheckAttackCostEffect(player, attack);','const checkAttackCost = new CheckAttackCostEffect(player, attack, attackingPokemon);')
p.write_text(t,encoding='utf-8')
