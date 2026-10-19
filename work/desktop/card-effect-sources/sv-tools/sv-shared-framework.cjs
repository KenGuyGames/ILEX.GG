const fs=require('fs'),path=require('path'),src=path.resolve(__dirname,'../rules-research/twinleafgg-main/ptcg-server/src');
function update(file,before,after){const p=path.join(src,file),s=fs.readFileSync(p,'utf8');if(s.includes(after))return;if(!s.includes(before))throw Error('Missing framework anchor '+file);fs.writeFileSync(p,s.replace(before,after));}
if(!fs.readFileSync(path.join(src,'tcg-lab-wotc.ts'),'utf8').includes('op.targetTag&&!s.list.getPokemonCard().tags.includes(op.targetTag)')){
 update('tcg-lab-wotc.ts','if(!s.list.getPokemonCard()||op.self&&','if(!s.list.getPokemonCard()||op.targetBasic&&s.list.getPokemonCard().stage!==Stage.BASIC||op.self&&');
 update('tcg-lab-wotc.ts','if(!s.list.getPokemonCard()||op.targetBasic&&','if(!s.list.getPokemonCard()||op.targetTag&&!s.list.getPokemonCard().tags.includes(op.targetTag)||op.targetBasic&&');
}
update('tcg-lab-bw-actions.ts','while(pool.length&&cards.length<3)','while(pool.length&&cards.length<(op.amount??3))');
update('tcg-lab-swsh-actions.ts',"return choose(o.hand.cards.slice(),1,(cards:any)=>{move(o.hand,o.deck,cards);", "const eligible=o.hand.cards.filter((c:any)=>!op.supporter||c.superType===SuperType.TRAINER&&c.trainerType===TrainerType.SUPPORTER);if(!eligible.length)break;return choose(eligible,1,(cards:any)=>{move(o.hand,o.deck,cards);");
update('tcg-lab-dp-attack-actions.ts','[selected]);next();});','[selected]);if(op.paidOps&&cards.some((c:any)=>p.discard.cards.includes(c)))ctx.run(op.paidOps,next);else next();});');
update('tcg-lab-wotc.ts','max:count,allowCancel:false,blocked:zone.cards.map','max:count,allowCancel:false,differentTypes:!!op.differentTypes,blocked:zone.cards.map');
console.log('Shared optional filters installed; previous defaults preserved.');
