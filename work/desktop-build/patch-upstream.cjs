const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../rules-research/twinleafgg-main/ptcg-server/src');
for(const name of ['shuffle-prompt.ts','shuffle-hand-prompt.ts','order-cards-prompt.ts']){
  const p=path.join(root,'game/store/prompts',name);if(fs.existsSync(p))fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace('s.sort();','s.sort((a,b)=>a-b);'));
}
const phase=path.join(root,'game/store/effect-reducers/game-phase-effect.ts');
let code=fs.readFileSync(phase,'utf8');
const start=code.indexOf('      case SpecialCondition.BURNED:');const end=code.indexOf('      case SpecialCondition.ASLEEP:',start);
if(start<0||end<0)throw Error('Burn checkup block changed');
code=code.slice(0,start)+`      case SpecialCondition.BURNED: {
        const legacy = (state.rules as any).legacyBurn === true;
        if (!legacy) player.active.damage += effect.burnDamage;
        const resolveBurn = (heads: boolean) => {
          if (legacy) { if (!heads) player.active.damage += effect.burnDamage; }
          else if (heads) player.active.removeSpecialCondition(SpecialCondition.BURNED);
        };
        if (effect.burnFlipResult !== undefined) resolveBurn(effect.burnFlipResult);
        else COIN_FLIP_PROMPT(store, state, player, resolveBurn);
        break;
      }
`+code.slice(end);fs.writeFileSync(phase,code);
const setup=path.join(root,'game/store/reducers/setup-reducer.ts');
code=fs.readFileSync(setup,'utf8').replace('if (state.gameSettings?.format === Format.RSPK || state.gameSettings?.format === Format.RETRO) {','if ((state.rules as any).forceFirst || state.gameSettings?.format === Format.RSPK || state.gameSettings?.format === Format.RETRO) {');fs.writeFileSync(setup,code);
const caterpie=path.join(root,'sets/set-base-set/caterpie.ts');
code=fs.readFileSync(caterpie,'utf8').replaceAll('ADD_POISON_TO_PLAYER_ACTIVE','ADD_PARALYZED_TO_PLAYER_ACTIVE');fs.writeFileSync(caterpie,code);
console.log('Patched shuffle validation, historical Burn, forced first player, and Caterpie condition');
const peak=path.join(root,'sets/09-sword-and-shield/set-chilling-reign/path-to-the-peak.ts');
code=fs.readFileSync(peak,'utf8').replace('if (slot === undefined) {\n          return false;\n        }','if (slot === undefined) {\n          // On-play powers are checked before the play reducer moves the card.\n          return state.players.some(p => p.hand.cards.includes(card));\n        }');fs.writeFileSync(peak,code);
