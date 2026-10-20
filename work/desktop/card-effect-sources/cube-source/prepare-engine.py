from pathlib import Path
import shutil,re,json,os
root=Path(__file__).resolve().parents[2];source=root/'work/cube-source/src';base=root/'work/unlimited-source/src'
if not source.exists():shutil.copytree(base,source)
shutil.copy2(Path(__file__).with_name('cube-context.ts'),source/'tcg-lab-cube.ts')
def edit(relative,fn):
    p=source/relative;old=p.read_text(encoding='utf-8');new=fn(old);assert old!=new,relative;p.write_text(new,encoding='utf-8')
def imp(relative,symbols):
    target=os.path.relpath(source/'tcg-lab-cube', (source/relative).parent).replace('\\','/')
    if not target.startswith('.'):target='./'+target
    return 'import {'+symbols+"} from '"+target+"';\n"
p='game/store/card/pokemon-types.ts'
def power(s):
    m=re.search(r'export enum PowerType\s*\{([^}]+)\}',s);names=[re.sub(r'//[^\n]*','',t).strip() for t in m.group(1).split(',')];names=[n for n in names if n];return imp(p,'makePowerTypes')+s[:m.start()]+'export type PowerType = number;\nexport const PowerType = makePowerTypes('+json.dumps(names)+');'+s[m.end():]
edit(p,power)
p='game/store/store.ts'
def store(s):
    s=s.replace('  private dispatchInternal(action:Action,clientRoleId?:number):State {','  private dispatchInternal(action:Action,clientRoleId?:number):State { return withCubeRules(this.state,()=>this.cubeDispatchInternal(action,clientRoleId)); }\n  private cubeDispatchInternal(action:Action,clientRoleId?:number):State {')
    s=s.replace('  public reduceEffect(state: State,effect:Effect):State {','  public reduceEffect(state: State,effect:Effect):State { return withCubeRules(state,()=>this.cubeReduceEffect(state,effect)); }\n  private cubeReduceEffect(state: State,effect:Effect):State {')
    return imp(p,'withCubeRules')+s
edit(p,store)
p='game/cards/deck-analyser.ts'
edit(p,lambda s:imp(p,'currentCubeRules')+s.replace('const requiredDeckSize = format === Format.PRE_RELEASE ? 40 : 60;','const requiredDeckSize = currentCubeRules()?.deckSize ?? (format === Format.PRE_RELEASE ? 40 : 60);').replace('((card as any)._wotcMaxCopies ?? 4)','((card as any)._wotcMaxCopies ?? currentCubeRules()?.copyLimit ?? 4)'))
p='game/store/reducers/setup-reducer.ts'
edit(p,lambda s:s.replace('const prizeCount = state.gameSettings?.format === Format.PRE_RELEASE ? 4 : 6;','const prizeCount = (state.rules as any).cubeRules?.prizes ?? (state.gameSettings?.format === Format.PRE_RELEASE ? 4 : 6);'))
p='game/store/effect-reducers/play-pokemon-effect.ts'
def evo(s):
    s=s.replace('const isValidEvolution = (isEvolved', 'const originalEvolution = (isEvolved');needle='    const permission=new CheckEvolutionEligibilityEffect';i=s.index(needle);s=s[:i]+"    const isValidEvolution = (state.rules as any).cubeRules ? cubeEvolution(pokemonCard,effect.pokemonCard) : originalEvolution;\n"+s[i:];return imp(p,'cubeEvolution')+s
edit(p,evo)
p='game/store/prefabs/prefabs.ts'
def prefabs(s):
    # Preserve native evolution permission for ordinary matches, replace the entire family test for cubes.
    pattern=r'const matchesEvolution =\s*(activePokemon|benchPokemon)\.name([\s\S]+?)\.includes\(pokemonCard\.evolvesFrom\)\);'
    def f(m):return 'const matchesEvolution = (state.rules as any).cubeRules ? cubeEvolution('+m.group(1)+',pokemonCard) : ('+m.group(0).split('=',1)[1].strip()[:-1]+');'
    s,n=re.subn(pattern,f,s);assert n==2,n
    return imp(p,'cubeEvolution')+s
edit(p,prefabs)
p='game/store/prefabs/ability-lock.ts'
edit(p,lambda s:imp(p,'cubePowerIncludes')+s.replace('opts.powerTypes.includes(power.powerType)','cubePowerIncludes(opts.powerTypes,power.powerType)'))
p='game/store/effect-reducers/game-effect.ts'
def game(s):
    begin=s.index('      // Pokemon ex rule');end=s.index('      // Attack-armed prize denial',begin)
    s=s[:begin]+"      if ((state.rules as any).cubeRules) effect.prizeCount += cubeBasePrizes(card,(state.rules as any).cubeRules)-1;\n      else {\n"+s[begin:end]+"      }\n"+s[end:]
    needle='  if (effect instanceof EvolveEffect) {';s=s.replace(needle,needle+"\n    if ((state.rules as any).cubeRules?.twoPrizeEvolutionOnly && ((cubeBasePrizes(effect.target.getPokemonCard(),(state.rules as any).cubeRules)===2)!==(cubeBasePrizes(effect.pokemonCard,(state.rules as any).cubeRules)===2))) throw new GameError(GameMessage.INVALID_TARGET);")
    return imp(p,'cubeBasePrizes')+s
edit(p,game)
entry=source/'tcg-lab-entry.ts';s=entry.read_text(encoding='utf-8');s+="\nexport {withCubeRules,currentCubeRules,cubeEvolution,cubeBasePrizes,prepareCubeCards} from './tcg-lab-cube';\n";entry.write_text(s,encoding='utf-8')
print('Scoped cube engine source prepared')
