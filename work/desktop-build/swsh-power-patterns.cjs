const previous=require('./sm-power-patterns.cjs');
module.exports=(a,name)=>{
 const text=String(a.text||'').replace(/[’‘]/g,"'");let m;
 if(a.name==='Bladed Armament')return {kind:'xyPassive',action:'shred',conditions:null};
 if(a.name==='Dangerous Mucus')return {kind:'onEvolutionDpStatus',statuses:['BURNED','POISONED'],conditions:null};
 if(['Loopy Lasso','Pump Shot'].includes(a.name))return {kind:'activatedSwsh',action:a.name,once:true,conditions:null};
 if(['Punk Out','Protective DNA','Shadow Knife','Dark Ray','Teapot of Surprises','Top Entry','Justified Law'].includes(a.name))return {kind:'swshPassive',action:a.name,conditions:null};
 if(['Brazen Tail','Reassuring Dam','Boss Pockets'].includes(a.name))return {kind:'swshPassive',action:a.name,conditions:null};
 if(m=text.match(/^This Pokémon takes (\d+) less damage from attacks \(after applying Weakness and Resistance\)\.$/))return {kind:'reduceDamage',amount:+m[1],conditions:null};
 if(text==="Prevent all effects of attacks from your opponent's Pokémon done to this Pokémon. (Damage is not an effect.)")return {kind:'preventAttackEffects',conditions:null};
 return previous(a,name);
};
