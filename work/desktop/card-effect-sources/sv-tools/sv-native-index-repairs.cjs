const fs=require('fs'),path=require('path'),src=path.resolve(__dirname,'../rules-research/twinleafgg-main/ptcg-server/src/sets/10-scarlet-and-violet');
for(const file of ['set-paradox-rift/aegislash.ts','set-paradox-rift/skeledirge-ex.ts']){
 const p=path.join(src,file);let s=fs.readFileSync(p,'utf8'),start=s.indexOf('if (WAS_ATTACK_USED(effect, 1, this)) {');if(start<0)continue;
 let level=0,end=-1;for(let i=s.indexOf('{',start);i<s.length;i++){if(s[i]==='{')level++;if(s[i]==='}'&&!--level){end=i+1;break;}}
 if(end<0)throw Error('Unclosed native attack '+file);
 s=s.slice(0,start)+'if (WAS_ATTACK_USED(effect, 0, this)) {\n      (effect as any).wotcBypassDefender = true;\n    }'+s.slice(end);fs.writeFileSync(p,s);
}
for(const file of ['set-obsidian-flames/revavroom-ex.ts','set-twilight-masquerade/sunkern.ts']){
 const p=path.join(src,file);let s=fs.readFileSync(p,'utf8').replace('WAS_ATTACK_USED(effect, 1, this)','WAS_ATTACK_USED(effect, 0, this)');
 if(file.includes('revavroom'))s=s.replace('effect.player.active.damageReductionNextTurn = 30;','effect.source.damageReductionNextTurn = 30;');
 fs.writeFileSync(p,s);
}
console.log('Corrected the four native classes used by eight printings. Shred uses the ordinary damage pipeline.');
