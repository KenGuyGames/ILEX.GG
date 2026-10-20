const older=require('./bw-power-patterns.cjs');
module.exports=(a,name)=>{
 const known=older(a,name);if(known)return known;
 const active=(action,extra={})=>({kind:'activatedXy',action,once:true,conditions:null,...extra}),passive=(action,extra={})=>({kind:'xyPassive',action,conditions:null,...extra});
 const plans={
 'Frozen Charm':passive('waterParalysisShield'),
 'Aroma of Gratitude':active('healBasicBench',{amount:20}),
 Levitate:passive('energyFreeRetreat'),Lamentation:passive('randomHandOnDamage'),Immunity:passive('conditionShield'),
 'Devour Light':passive('breakLock'),
 'Mist Concealment':passive('entryShield'),
 'Metamorphosis Gene':{kind:'dpBorrowAttacks',pool:'opponent',conditions:null},
 'Dry Skin':passive('typedReduction',{energy:'Water',amount:30}),
 'Benevolent Boss':passive('benchHp',{amount:20}),
 Contrary:passive('contrary'),
 'Voice of the Sands':active('roar',{active:true}),
 'Ozone Wall':passive('benchShield'),
 'Despotic Fang':passive('shred'),
 'Earthen Awakening':passive('attachHeal',{amount:20}),
 'Burning Draft':active('attachSelfDiscard',{energies:['Fire','Fighting']}),
 'Power Saver':passive('teamAttackMinimum',{team:name.includes('Aqua')?'Aqua':'Magma',minimum:5}),
 'Sludge Festival':passive('nonAquaRetreatTax',{amount:1}),
 'Magma Switch':active('moveToMagma'),
 'Aqua Search':active('searchTeam',{team:'Aqua'}),
 'Sparkling Induction':passive('namedBenchRetreat',{name:'Magnemite'}),
 'Flash Fire':{kind:'activatedHgss',action:'moveEnergy',energy:'Fire',self:true,once:true,conditions:null},
 'Drag Along':passive('koCoin'),
 Bodyguard:passive('playerAttackEffectShield')
 };
 return plans[a.name]||null;
};
