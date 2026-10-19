const fs=require('fs'),path=require('path');
for(const name of ['full-sweep','full-power-audit','full-trainer-audit']){
 let s=fs.readFileSync(path.join(__dirname,'sm-'+name+'.cjs'),'utf8').replaceAll('sm-wave-data','swsh-wave-data').replaceAll('sm-full','swsh-full').replaceAll('ILEX_SM','ILEX_SWSH').replaceAll('Sun & Moon with BW-onward','Sword & Shield with BW-onward').replace("setup('sm',", "setup('swsh',");
 if(name==='full-sweep')s=s.replace(" if(name==='Finishing Combo')c.specialComboTurn=m.store.state.turn-2;",` if(name==='Finishing Combo')c.specialComboTurn=m.store.state.turn-2;
 if(['Cheerful Charge','Encouraging Gift','Submerge Silently'].includes(name))m.store.state.turn=2;
 if(['Lost Mine','Star Requiem'].includes(name))for(let i=0;i<10;i++)put(m,'bw1-105',p.lostzone);
 if(c.name==="Team Magma's Groudon")for(let i=0;i<3;i++)bench('dc1-1',i);
 if(c.powers.some(a=>a.name==='Kinda Lazy'))prizes(p,5);
 if(name==='Mystery Bolt')p.discard.cards=p.discard.cards.filter(c=>c.trainerType!==R.TrainerType.SUPPORTER);
 if(name==='Radiant Hunt'){o.bench[0].cards=[];put(m,'swsh10.5-018',o.bench[0]);}
 if(name==='Hunting Claw')o.bench[0].damage=o.bench[0].getPokemonCard().hp-60;
 if(name==='Powdery Uppercut'){p.wotcLastTurnEnded=2;c._wotcLastUsedAttack={name:'Spore Ball',turn:2};}
 if(name==='Dede-Short'||name==='Peko Blaster'){p.wotcLastTurnEnded=2;p._swshAttackHistory=[{turn:2,pokemon:name==='Dede-Short'?'Togedemaru':'Dedenne',attack:name==='Dede-Short'?'Toge Dash':'Dede-Short'}];}
 `);
 if(name==='full-sweep')s=s.replace(" p.active.cards=[];put(m,id,p.active);", " p.active.cards=[];const selectedCard=put(m,id,p.active);if(selectedCard._swshUnionGroup!==undefined){for(let i=0;i<4;i++)if(i!==selectedCard._swshUnionPart)put(m,'swshp-SWSH'+(selectedCard._swshUnionGroup+i),p.active);p.active.cards=p.active.cards.filter(c=>c!==selectedCard);p.active.cards.push(selectedCard);p.active.getPokemons().forEach(c=>c._swshUnionInPlay=true);}");
 fs.writeFileSync(path.join(__dirname,'swsh-'+name+'.cjs'),s);
}
