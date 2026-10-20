const older=require('./bw-trainer-patterns.cjs');
module.exports=d=>{
 if(d.name.endsWith(' Spirit Link')){const target=d.rules?.find(r=>r.startsWith('Your turn does not end'))?.match(/becomes (.+)\.$/)?.[1];if(target)return [{op:'tool',kind:'xySpiritLink',target}];}
 if(d.name==='Trevor')return [{op:'search',category:'Pokemon',amount:1,reveal:true}];
 if(d.name==='Clemont')return [{op:'search',category:'Energy',energy:'Lightning',amount:4,reveal:true}];
 if(d.name==='Gym Badge')return [{op:'xy',kind:'gymBadge'}];
 if(d.name==='Imakuni?')return [{op:'xy',kind:'confuseSelf'}];
 if(d.name==='Floral Crown')return [{op:'tool',kind:'xyFloralCrown'}];
 if(['Aqua Diffuser','Magma Pointer'].includes(d.name)){const compile=require('./xy-attack-patterns.cjs'),attacks=d.attacks.map(a=>compile(a,d.name));if(attacks.every(a=>a!==null))return [{op:'technicalMachine',tool:true,anyType:true,persistent:true,team:d.name.startsWith('Aqua')?'Aqua':'Magma',attacks}];}
 if(d.name==='Team Aqua Admin')return [{op:'xy',kind:'aquaAdmin'}];
 if(d.name==='Team Magma Admin')return [{op:'recover',category:'Pokemon',nameIncludes:"Team Magma's",amount:3,optional:true}];
 if(['Team Aqua Grunt','Team Magma Grunt'].includes(d.name))return [{op:'xy',kind:'teamGrunt',team:d.name.includes('Aqua')?'Aqua':'Magma'}];
 return older(d);
};
