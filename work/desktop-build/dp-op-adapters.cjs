// DP printed "Trainer cards" excludes the separately named Supporter and
// Stadium categories. Keep older compilers' meanings unchanged.
function adapt(op){
 if(Array.isArray(op))return op.map(adapt);
 if(!op||typeof op!=='object')return op;
 const out={...op};if(out.category==='Trainer')out.category='DPTrainer';
 if(out.op==='requiredCost'&&Array.isArray(out.energies))out.op='dpPayUnits';
 if(out.kind==='activatedSearch'&&out.category==='DPTrainer')out.kind='activatedExSearch';
 for(const key of ['ops','heads','tails','branches'])if(Array.isArray(out[key]))out[key]=adapt(out[key]);
 return out;
}
module.exports=adapt;
