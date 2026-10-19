const fs=require('fs'),path=require('path'),src=path.resolve(__dirname,'../rules-research/twinleafgg-main/ptcg-server/src');
function edit(file,before,after){const f=path.join(src,file),s=fs.readFileSync(f,'utf8');if(s.includes(after))return;if(!s.includes(before))throw Error('Missing category anchor '+file);fs.writeFileSync(f,s.replaceAll(before,after));}
function imp(file){const f=path.join(src,file),s=fs.readFileSync(f,'utf8');if(!s.includes("import {isTrainerItem}"))fs.writeFileSync(f,"import {isTrainerItem} from './tcg-lab-trainer-categories';\n"+s);}
for(const file of ['tcg-lab-wotc.ts','tcg-lab-ex-power-choices.ts','tcg-lab-dp-passives.ts','tcg-lab-wotc-final.ts'])imp(file);
edit('tcg-lab-wotc.ts',"'DPGalacticOrStadium','DPTrainer','DPTrainerSupporter'","'Item','DPGalacticOrStadium','DPTrainer','DPTrainerSupporter'");
edit('tcg-lab-wotc.ts',"(op.category!=='DPTrainer'||![TrainerType.SUPPORTER,TrainerType.STADIUM].includes(c.trainerType))","(op.category!=='DPTrainer'||isTrainerItem(c,state))&&(op.category!=='Item'||c.trainerType===TrainerType.ITEM)");
edit('tcg-lab-ex-power-choices.ts',"op.category==='DPTrainer'?c.superType===SuperType.TRAINER&&![TrainerType.SUPPORTER,TrainerType.STADIUM].includes(c.trainerType)","op.category==='DPTrainer'?isTrainerItem(c,state)");
edit('tcg-lab-dp-passives.ts','export function dpPassiveTrigger(op:any,e:any,owner:any,list:any){','export function dpPassiveTrigger(op:any,e:any,owner:any,list:any,state?:any){');
edit('tcg-lab-dp-passives.ts','[TrainerType.ITEM,TrainerType.TOOL].includes(e.trainerCard.trainerType)','isTrainerItem(e.trainerCard,state)');
edit('tcg-lab-wotc-final.ts','[TrainerType.ITEM,TrainerType.TOOL].includes(e.trainerCard.trainerType)','isTrainerItem(e.trainerCard,state)');
edit('tcg-lab-wotc-powers.ts','dpPassiveTrigger(op,e,owner,list)','dpPassiveTrigger(op,e,owner,list,state)');
edit('tcg-lab-hgss-powers.ts',"case 'trainerLock':return e instanceof PlayItemEffect||e instanceof AttachPokemonToolEffect;","case 'trainerLock':return e instanceof PlayItemEffect||!state.rules.svEraRules&&e instanceof AttachPokemonToolEffect;");
console.log('SV Trainer category helpers installed with historical fallback.');
