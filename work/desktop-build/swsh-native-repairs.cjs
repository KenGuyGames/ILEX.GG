const fs=require('fs'),path=require('path'),src=path.resolve(__dirname,'../rules-research/twinleafgg-main/ptcg-server/src/sets/09-sword-and-shield');
const fixes={
 'set-rebel-clash/dragapult-v.ts':[['Jet Assult','Jet Assault']],
 'set-battle-styles/mimikyu-v.ts':[['Dummmy Doll','Dummy Doll']],
 'set-evolving-skies/zygarde.ts':[['Judgement Surge','Judgment Surge']],
 'set-fusion-strike/meloetta.ts':[['Melodius Echo','Melodious Echo']],
 'set-fusion-strike/inteleon-vmax.ts':[['Aqua Bullet','G-Max Spiral']],
 'set-lost-origin/giratina-vstar.ts':[['Star Requium','Star Requiem']],
 'set-lost-origin/magnezone-vstar.ts':[['Splitting Beam','Electro Star']],
 'set-chilling-reign/galarian-zapdos-v.ts':[['public hp: number = 210','public hp: number = 200']],
 'set-battle-styles/victini-vmax.ts':[['public hp: number = 190','public hp: number = 310']],
 'set-vivid-voltage/shiftry.ts':[['Shiftry Substitution','Shifty Substitution']],
 'set-vivid-voltage/dusknoir.ts':[['public power: Power[]','public powers: Power[]']],
 'set-fusion-strike/accelgor.ts':[['Grass Tornado','Ninja Tornado']],
 'set-rebel-clash/hatterene.ts':[['effect.source.getPokemonCard()!','effect.card']],
 'set-brilliant-stars/double-turbo-energy.ts':[['import { DealDamageEffect }','import { ApplyWeaknessEffect }'],['(effect instanceof DealDamageEffect) && effect.source.cards.includes(this)','(effect instanceof ApplyWeaknessEffect) && effect.damage > 0 && effect.source.cards.includes(this)'],['effect.damage -= 20;','if(effect.target===effect.opponent.active||effect.opponent.bench.includes(effect.target))effect.damage=Math.max(0,effect.damage-20);']],
 'set-battle-styles/single-strike-energy.ts':[['import { DealDamageEffect }','import { ApplyWeaknessEffect }'],['effect instanceof DealDamageEffect && effect.source.cards.includes(this)','effect instanceof ApplyWeaknessEffect && effect.damage > 0 && effect.source.cards.includes(this)']],
 'set-darkness-ablaze/big-parasol.ts':[['if (player.active.tools.includes(this)', 'if (effect.player !== player && player.active.tools.includes(this)']],
 'set-silver-tempest/noivern.ts':[['if (radiantTargets.length === 0) {\r\n        throw new GameError(GameMessage.CANNOT_USE_ATTACK);','if (radiantTargets.length === 0) {\r\n        return state;'],['if (radiantTargets.length === 0) {\n        throw new GameError(GameMessage.CANNOT_USE_ATTACK);','if (radiantTargets.length === 0) {\n        return state;']],
 'set-evolving-skies/lycanroc-vmax.ts':[['if (!hasValidTarget) {\r\n        throw new GameError(GameMessage.CANNOT_USE_ATTACK);','if (!hasValidTarget) {\r\n        return state;'],['if (!hasValidTarget) {\n        throw new GameError(GameMessage.CANNOT_USE_ATTACK);','if (!hasValidTarget) {\n        return state;']]
};
for(const [file,pairs] of Object.entries(fixes)){const p=path.join(src,file);if(!fs.existsSync(p))throw Error(p);let s=fs.readFileSync(p,'utf8');for(const [a,b] of pairs)s=s.replaceAll(a,b);fs.writeFileSync(p,s);}
console.log('Sword & Shield printed label repairs applied; behavior validation pending');
for(const [file,from,to] of [['set-silver-tempest/noivern.ts','new KnockOutEffect(player, target[0])','KNOCK_OUT_OPPONENTS_ACTIVE_POKEMON(store,state,effect,target[0])'],['set-evolving-skies/lycanroc-vmax.ts','new KnockOutEffect(opponent, target)','KNOCK_OUT_OPPONENTS_ACTIVE_POKEMON(store,state,effect,target)']]){
 const p=path.join(src,file);let s=fs.readFileSync(p,'utf8');if(!s.includes('import {KNOCK_OUT_OPPONENTS_ACTIVE_POKEMON}'))s="import {KNOCK_OUT_OPPONENTS_ACTIVE_POKEMON} from '../../../game/store/prefabs/attack-effects';\n"+s;
 // The helper itself dispatches a blockable attack effect and returns State.
 if(s.includes(from)){s=s.replace(/const (knockOutEffect|koEffect) = new KnockOutEffect\([^;]+;\s*store.reduceEffect\(state, \1\);/,to+';');}
 fs.writeFileSync(p,s);
}
{const p=path.join(src,'set-vivid-voltage/forretress.ts');let s=fs.readFileSync(p,'utf8');if(!s.includes('import {KNOCK_OUT_OPPONENTS_ACTIVE_POKEMON,'))s="import {KNOCK_OUT_OPPONENTS_ACTIVE_POKEMON,KNOCK_OUT_PLAYERS_ACTIVE_POKEMON} from '../../../game/store/prefabs/attack-effects';\n"+s;s=s.replace(/const knockOutOpponent = new KnockOutEffect\([^;]+;\s*store.reduceEffect\(state, knockOutOpponent\);/,'KNOCK_OUT_OPPONENTS_ACTIVE_POKEMON(store,state,effect);').replace(/const knockOutSelf = new KnockOutEffect\([^;]+;\s*store.reduceEffect\(state, knockOutSelf\);/,'KNOCK_OUT_PLAYERS_ACTIVE_POKEMON(store,state,effect);');fs.writeFileSync(p,s);}
