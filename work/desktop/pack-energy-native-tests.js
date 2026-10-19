(async()=>{
 const checks=[],check=(v,n)=>{if(!v)throw Error(n);checks.push(n)},previous=JSON.stringify(state.packOpening),previousTab=tab,decks=JSON.stringify(state.decks),match=JSON.stringify(state.rulesMatch);
 const expected={'sm1':'sm1-','sm9':'energy2019-','swsh1':'energy2020-','swsh9':'energy2022-','sv01':'sve-00','sv07':'sve-0','me01':'mee-','30th':'mee-'};
 try{tab='packs';
  for(const [id,prefix]of Object.entries(expected)){
   PackOpening.select(id);PackOpening.open();PackOpening.revealAll();
   const pack=PackOpening.current(),energy=pack.cards.find(c=>c.slot==='Basic Energy');check(energy?.id.startsWith(prefix),id+' opens the intended Energy printing');
   if(id==='me01'||id==='30th'){const n=+energy.id.split('-').at(-1);check(id==='30th'?n>=9&&n<=16:n>=1&&n<=8,id+' uses its own numbered Energy design');}
   const index=pack.cards.indexOf(energy),currentImage=()=>document.querySelectorAll('.pack-results>.pack-pull')[index]?.querySelector('img');let img=currentImage();
   for(let n=0;n<300&&(!img?.complete||!img.naturalWidth);n++){await new Promise(r=>setTimeout(r,50));img=currentImage();}
   check(img?.complete&&img.naturalWidth>0,id+' Energy artwork loads from bundled scan');await img.decode();
   const c=cards.find(c=>c.id===energy.id);check(img.alt===c.name,id+' displayed Energy name matches its artwork record');
   check(PackOpening.inventory().collection[energy.id+'|'+energy.finish]>0,id+' collection saves the same Energy printing');
  }
  check(JSON.stringify(state.decks)===decks&&JSON.stringify(state.rulesMatch)===match,'Energy pack fix leaves decks and saved matches unchanged');
  return {passed:true,checks};
 }finally{state.packOpening=previous?JSON.parse(previous):undefined;save();tab=previousTab;render();}
})()
