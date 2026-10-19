(async()=>{
 const M=RulesMatch,R=M.R,checks=[],check=(v,s)=>{if(!v)throw Error('SV native: '+s);checks.push(s);window.svNativeStage=s;},old={match:rulesMatch,paused:state.botPaused,tab,mode:tableMode,suspended:botSuspended,focus:seatFocus};
 const coverage=await fetch('sv-coverage.json').then(r=>r.json());check(coverage.total===3694&&coverage.available===3694&&coverage.pending===0,'All 3694 cataloged SV printings are mapped');check(coverage.bySet.length===20,'All 20 SV catalogs included');
 check(M.profiles.sv.bwEraRules&&M.profiles.sv.svEraRules,'SV rule profile includes BW-onward framework');
 for(const set of coverage.bySet){const id=cards.find(c=>c.id.startsWith(set.id+'-'))?.id;check(!!id&&!!ruleMap[id],set.name+' mapped');const image=new Image();image.src=ruleArt({_labId:id});await image.decode();check(image.naturalWidth>0,set.name+' scan decodes');}
 const deck={name:'SV native fixture',cards:{'bw1-1':4,'bw1-105':56}},m=M.create({profile:'sv',seed:7,decks:[deck,deck]},ruleMap);
 for(let i=0;i<200&&M.pending(m).length;i++){const a=BotAI.prompt(m,M.pending(m)[0],'easy');check(!!a,'Setup choice resolves');M.apply(m,a);}check(!M.pending(m).length,'SV setup settles');
 const [p,o]=m.store.state.players;m.store.state.turn=4;m.store.state.activePlayer=0;let serial=0;
 const put=(id,list)=>{const c=R.CardManager.getInstance().getCardByName(ruleMap[id]);c._labId=id;c.id=-(940000+serial++);list.cards.push(c);return c;};
 for(const owner of [p,o]){for(const list of [owner.active,...owner.bench]){list.cards=[];list.tools=[];list.energies.cards=[];list.damage=0;list.specialConditions=[];}owner.hand.cards=[];owner.discard.cards=[];}
 put('sv07-128',p.active);put('sv06-025',p.bench[0]);put('sv06-095',p.bench[1]);put('sv01-081',p.bench[2]);put('sv03.5-151',p.bench[3]);put('sv03.5-152',p.bench[4]);put('sv03-125',o.active);put('sv01-019',o.bench[0]);
 for(const id of ['bw1-105','bw1-107','bw1-109','bw1-108'])for(let i=0;i<3;i++)put(id,p.active);
 for(const id of ['sv07-133','sv05-160','sv06-159','sv08-188','sv10-174'])if(ruleMap[id])put(id,p.hand);
 try{
  botSuspended=true;botGeneration++;clearTimeout(botTimer);rulesMatch=m;tab='play';tableMode='rules';state.botPaused=true;render();
  check(document.querySelector('#mainmenu').hidden&&!document.querySelector('#app').hidden,'SV battle shell visible');
  check(!!document.querySelector('.near-seat .seat-active img'),'Stellar Tera ex appears on the table');
  for(const image of document.querySelectorAll('.play-table img,.seat img'))if(image.getAttribute('src'))await image.decode();
  const before=JSON.stringify({journal:m.journal,random:m.randomState});openCardActions(p.id,0,true);check(cardActionDialog.open,'SV enlarged actions open');await cardActionDialog.querySelector('img').decode();
  check(cardActionView.entries.some(e=>e.kind==='attack'),'Printed SV attacks offered');check(cardActionView.entries.some(e=>e.kind==='retreat'),'Retreat remains in enlarged view');
  const buttons=[...cardActionDialog.querySelectorAll('.scan-action')];check(buttons.length>0&&buttons.every(b=>!b.textContent.trim()),'SV action regions remain transparent and text-free');cardActionDialog.close();check(JSON.stringify({journal:m.journal,random:m.randomState})===before,'Inspection preserves journal and randomness');
  openCardActions(p.id,1,false);check(cardActionView.entries.some(e=>e.name==='Adrena-Brain'),'Benched Adrena-Brain is available through enlarged view');cardActionDialog.close();
  window.svNativeScreenshotReady=true;return {passed:true,checks,printings:3694,catalogs:20};
 }finally{const cleanup=()=>{cardActionDialog.close();rulesMatch=old.match;state.botPaused=old.paused;tab=old.tab;tableMode=old.mode;seatFocus=old.focus;botSuspended=old.suspended;render();};if(window.svNativeCapture)window.svNativeCleanup=cleanup;else cleanup();}
})()
