const previous=require('./xy-power-patterns.cjs');
module.exports=(a,name)=>{
 if(a.name==='Plunge'&&name==='Croconaw')return {kind:'activatedSm',action:'plunge',bench:true,once:true,conditions:null};
 const known=previous(a,name);if(known!==null)return known;
 const active=(action,extra={})=>({kind:'activatedSm',action,once:true,conditions:null,...extra}),passive=(action,extra={})=>({kind:'smPassive',action,conditions:null,...extra});
 const plans={
 'Electric Start':passive('electricSetup'),
 'Double Drive':passive('doubleDrive'),
 'Golden Wing':passive('goldenWing'),
 'Scoop-Up Block':passive('scoopBlock'),
 'Hypnotic Pendulum':passive('hypnoticPromotion'),
 'Underground Work':passive('undergroundWork'),
 'Hard Coat':{kind:'reduceDamage',amount:30,conditions:null},
 Frubbles:{kind:'retreatSelf',zero:true,energy:'Water',requireEnergy:true,conditions:null},
 'Flight Support':{kind:'hgssPassive',action:'namedRetreat',name:'Latios',amount:99,conditions:null},
 'Power Suction':active('namedEnergyMove',{name:'Deoxys'}),
 'Hydrating Drops':active('healActive',{energy:'Water',amount:30}),
 'Table Service':active('healAny',{amount:30}),
 'Wall of Stone':passive('prizeHp',{prizes:3,hp:200}),
 Pressure:passive('pressure',{amount:20}),
 'Security Guard':passive('teamReduction',{amount:30}),
 Troubleshooting:active('discardSpecialHeal',{amount:80}),
 'Ascension DNA':active('eeveeEvolve'),
 "Round ‘n' Round":active('firstSecondConfuse')
 };
 return plans[a.name]||null;
};
