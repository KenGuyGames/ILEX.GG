(async()=>{
 const M=RulesMatch,R=M.R,checks=[],check=(v,s)=>{if(!v)throw Error('SWSH native: '+s);checks.push(s);window.swshNativeStage=s},old={match:rulesMatch,paused:state.botPaused,tab,mode:tableMode,suspended:botSuspended,focus:seatFocus};
 const coverage=await fetch('swsh-coverage.json').then(r=>r.json());check(coverage.total===3715&&coverage.available===3715&&coverage.pending===0,'All 3715 Sword & Shield printings mapped');check(coverage.bySet.length===28,'All 28 era catalogs included');
 check(M.profiles.swsh.bwEraRules&&M.profiles.swsh.xyEraRules&&!M.profiles.swsh.firstTurnUseSupporter&&!M.profiles.swsh.attackFirstTurn,'Sword & Shield profile and BW-onward framework enabled');
 for(const set of coverage.bySet){const id=cards.find(c=>c.id.startsWith(set.id+'-'))?.id;check(!!id&&!!ruleMap[id],set.name+' has mapped cards');check(!!ruleArt({_labId:id}),set.name+' has scans');}
 const deck={name:'Sword & Shield UI fixture',cards:{'bw1-1':4,'bw1-105':56}},m=M.create({profile:'swsh',seed:7,decks:[deck,deck]},ruleMap);
 for(let i=0;i<200&&M.pending(m).length;i++){const a=BotAI.prompt(m,M.pending(m)[0],'easy');check(!!a,'Setup choice resolves');M.apply(m,a);}check(!M.pending(m).length,'Sword & Shield setup settles');
 const [p,o]=m.store.state.players;m.store.state.turn=4;m.store.state.activePlayer=0;let serial=0;
 const put=(id,list)=>{const c=R.CardManager.getInstance().getCardByName(ruleMap[id]);c._labId=id;c.id=-(920000+serial++);list.cards.push(c);return c;};
 const union=(first,list)=>{list.cards=[];for(const i of [1,2,3,0])put('swshp-SWSH'+(first+i),list);list.getPokemons().forEach(c=>c._swshUnionInPlay=true);};
 for(const owner of [p,o]){for(const list of [owner.active,...owner.bench]){list.cards=[];list.tools=[];list.energies.cards=[];list.damage=0;list.specialConditions=[];}owner.hand.cards=[];owner.discard.cards=[];}
 union(139,p.active);put('swsh11-131',p.bench[0]);put('swsh10-046',p.bench[1]);put('swsh5-85',p.bench[2]);put('swsh8-185',p.bench[3]);union(159,p.bench[4]);
 put('swsh9-123',o.active);put('swsh8-114',o.bench[0]);put('swsh7-123',o.bench[1]);put('swsh12-139',o.bench[2]);union(155,o.bench[3]);put('swsh10.5-011',o.bench[4]);
 for(let i=0;i<3;i++)put('bw1-108',p.active);for(const id of ['swsh1-178','swsh6-148','swsh5-141','swsh5-140','swsh8-244','swsh9-151'])put(id,p.hand);
 for(let i=0;i<5;i++)put('bw1-105',o.hand);
 try{
  botSuspended=true;botGeneration++;clearTimeout(botTimer);rulesMatch=m;tab='play';tableMode='rules';state.botPaused=true;render();
  check(document.querySelector('#mainmenu').hidden&&!document.querySelector('#app').hidden,'Battle shell visible');
  const img=document.querySelector('.near-seat .seat-active img[data-union-parts]');check(!!img,'V-UNION uses all four scan sources');
  for(let i=0;i<100&&img.dataset.legendReady!=='true';i++)await new Promise(r=>setTimeout(r,50));await img.decode();check(img.dataset.legendReady==='true'&&img.naturalWidth/img.naturalHeight>.69&&img.naturalWidth/img.naturalHeight<.74,'V-UNION composite is upright');
  check(!document.querySelector('.near-seat .seat-active .seat-energy [data-preview-name*="V-UNION"]'),'V-UNION quarters are not Energy attachments');
  const before=JSON.stringify({journal:m.journal,random:m.randomState});openCardActions(p.id,0,true);check(cardActionDialog.open,'V-UNION enlarged view opens');
  const actionImg=cardActionDialog.querySelector('img');for(let i=0;i<100&&actionImg.dataset.legendReady!=='true';i++)await new Promise(r=>setTimeout(r,50));await actionImg.decode();check(actionImg.dataset.legendReady==='true','Enlarged V-UNION uses the same composite');
  check(cardActionView.entries.filter(e=>e.kind==='attack').length===4,'All four V-UNION attacks offered');check(!cardActionView.entries.some(e=>e.name.endsWith(' V-UNION Assembly')),'Discard-only assembly is absent from field actions');check(cardActionView.entries.some(e=>e.kind==='retreat'),'Retreat remains available');
  const buttons=[...cardActionDialog.querySelectorAll('.scan-action')];check(buttons.every(b=>!b.textContent.trim()),'Attack regions remain text-free');check(buttons.every(b=>parseFloat(b.style.width)<50),'V-UNION regions fit individual quadrants');
  const unionGain=buttons.find(b=>b.getAttribute('aria-label').startsWith('Union Gain'));check(parseFloat(unionGain.style.top)<25&&parseFloat(unionGain.style.left)<50,'Union Gain aligns with upper-left printing');
  cardActionDialog.close();check(JSON.stringify({journal:m.journal,random:m.randomState})===before,'Inspection preserves journal and randomness');
  for(const first of [139,155,159,163,215,287]){const ids=Array.from({length:4},(_,i)=>'swshp-SWSH'+(first+i)),src=await LegendDisplay.composeUnion(ids.map(id=>ruleArt({_labId:id})),ids[0]),image=new Image();image.src=src;await image.decode();check(image.naturalWidth/image.naturalHeight>.69&&image.naturalWidth/image.naturalHeight<.74,'Four-quarter composite decodes: '+first);}
  const secret=p.active.isSecret;p.active.isSecret=true;check(LegendDisplay.pair(p.active)===null,'Hidden cards expose no V-UNION quarter metadata');p.active.isSecret=secret;
  window.swshNativeScreenshotReady=true;return {passed:true,checks,printings:3715,catalogs:28,unionLayouts:6};
 }finally{const cleanup=()=>{cardActionDialog.close();rulesMatch=old.match;state.botPaused=old.paused;tab=old.tab;tableMode=old.mode;seatFocus=old.focus;botSuspended=old.suspended;render();};if(window.swshNativeCapture)window.swshNativeCleanup=cleanup;else cleanup();}
})()
