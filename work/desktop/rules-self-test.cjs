const fs=require('node:fs'),path=require('node:path');
module.exports=async(win,root)=>{
 const evaluate=s=>win.webContents.executeJavaScript(s,true),pause=ms=>new Promise(r=>setTimeout(r,ms));
 for(let i=0;i<150;i++){if(await evaluate("typeof rulesReady!=='undefined'&&rulesReady&&cards.length===23736"))break;await pause(100)}
 if(!await evaluate('rulesReady'))throw Error('Rules catalog failed to load');
 const verifyDragAndSize=async()=>{
  const botReport=await evaluate(fs.readFileSync(path.join(__dirname,'bot-ui-tests.js'),'utf8'));
  const botPreview=botReport.preview;delete botReport.preview;
  fs.writeFileSync(path.join(root,'bot-ui-tests.json'),JSON.stringify(botReport,null,2));
  win.setSize(1920,1080);await pause(150);
  await evaluate("window.previewPrevious={spec:rulesMatch.spec,journal:rulesMatch.journal.slice()};botSuspended=true;rulesMatch=RulesMatch.restore("+JSON.stringify(botPreview)+",ruleMap,state.custom);seatFocus=null;tab='play';render();");
  await evaluate("(async()=>{await Promise.all([...document.querySelectorAll('#app img')].map(i=>i.decode()));window.scrollTo(0,0);document.querySelector('#toast').style.display='none';})()");
  await pause(250);fs.writeFileSync(path.join(root,'bot-preview.png'),(await win.webContents.capturePage()).toPNG());
  await evaluate("rulesMatch=RulesMatch.restore(window.previewPrevious,ruleMap,state.custom);delete window.previewPrevious;seatFocus=null;botSuspended=false;saveRules();render();");
  const report=await evaluate(fs.readFileSync(path.join(__dirname,'tabletop-drag-tests.js'),'utf8'));
  fs.writeFileSync(path.join(root,'drag-tests.json'),JSON.stringify(report,null,2));
  await evaluate("document.querySelector('#toast').style.display='none'");
  const sizes=[];
  for(const [width,height] of [[900,960],[1920,1080],[2560,1440]]){
   win.setSize(width,height);await pause(150);
   await evaluate("(async()=>{tab='play';render();await Promise.all([...document.querySelectorAll('#app img')].map(i=>i.decode()));window.scrollTo(0,0);})()");
   const layout=await evaluate("JSON.stringify({width:innerWidth,height:innerHeight,scroll:document.documentElement.scrollWidth,table:document.querySelector('.seated-experience').getBoundingClientRect().width,card:document.querySelector('.near-seat .seat-active').getBoundingClientRect().width,handBottom:document.querySelector('.near-hand').getBoundingClientRect().bottom})");
   const metrics=JSON.parse(layout);if(metrics.scroll>metrics.width+1)throw Error('Table overflows at '+width);sizes.push(metrics);
   if(width===1920)fs.writeFileSync(path.join(root,'tabletop-widescreen-preview.png'),(await win.webContents.capturePage()).toPNG());
  }
  fs.writeFileSync(path.join(root,'table-sizes.json'),JSON.stringify({passed:true,sizes},null,2));win.setSize(1440,960);await pause(150);
 };
 if(await evaluate("localStorage.getItem('rules-test-marker')")){
  const snapshot=await evaluate("JSON.stringify({turn:rulesMatch.store.state.turn,profile:rulesMatch.spec.profile,journal:rulesMatch.journal,deck:rulesMatch.store.state.players.map(p=>p.deck.cards.map(c=>c._labId)),pending:RulesMatch.pending(rulesMatch).map(p=>p.type)})");
  if(snapshot!==fs.readFileSync(path.join(root,'expected-restore.json'),'utf8'))throw Error('Restored rules match changed');
  fs.writeFileSync(path.join(root,'persistence.json'),JSON.stringify({passed:true,exactJournalAndDeckOrder:true}));
  await verifyDragAndSize();
  await evaluate("(async()=>{tab='play';render();await Promise.all([...document.querySelectorAll('#app img')].map(i=>i.decode()));window.scrollTo(0,0);})()");
  await pause(400);fs.writeFileSync(path.join(root,'tabletop-preview.png'),(await win.webContents.capturePage()).toPNG());
  await evaluate("tab='library';render();");
  await evaluate("(async()=>{const images=[...document.querySelectorAll('#app img')];images.forEach(i=>i.loading='eager');await Promise.all(images.map(i=>i.decode()));})()");
  await pause(300);fs.writeFileSync(path.join(root,'desktop-preview.png'),(await win.webContents.capturePage()).toPNG());return;
 }
 const result=await evaluate(`(async()=>{
  const check=(v,msg)=>{if(!v)throw Error(msg)},checks=[];
  check(document.title.startsWith('ILEX.GG')&&document.querySelector('.brand').textContent==='ILEX.GG','ILEX.GG branding');
  check(getComputedStyle(document.body).backgroundColor==='rgb(13, 33, 27)','Forest palette');
  await document.querySelector('.hero-icon img').decode();await document.querySelector('.brand img').decode();
  check(document.querySelector('.hero-icon img').naturalWidth>0&&document.querySelector('.hero-icon img').getAttribute('src')==='scans/c1122ffa3645e338fa0fce57.webp','Celebi Prime scan');checks.push('ILEX.GG title, forest theme, leaf emblem and Celebi Prime scan render');
  const bsf=cards.filter(c=>/^base[123]-/.test(c.id));check(bsf.length===228&&bsf.every(c=>ruleMap[c.id]),'Base–Fossil printing coverage');checks.push('All 228 Base–Fossil printings are available in desktop automation');
  check(wotcCoverage.total===1793&&wotcCoverage.available+wotcCoverage.pending===1793,'WOTC coverage totals');
  for(const id of ['base4','base5','si1','base6']){const set=wotcCoverage.bySet.find(s=>s.id===id);check(set.available===set.total,id+' automation coverage');}
  openWotcCoverage();check(document.querySelector('#wotccoverage').open&&document.querySelectorAll('#wotccoverage tbody tr').length===wotcCoverage.bySet.length,'WOTC coverage dialog');document.querySelector('#wotccoverage').close();checks.push('WOTC coverage dialog lists every set and pending cards; Base Set 2, Team Rocket, Southern Islands and Legendary Collection are complete');
  const images=[...document.querySelectorAll('.card img')];images.forEach(i=>i.loading='eager');await Promise.all(images.map(i=>i.decode()));check(images.length===36&&images.every(i=>i.naturalWidth),'Library scans');checks.push('36 library scans render with rules engine loaded');
  const list='Pokémon: 12\\n4 Caterpie BS 45\\n4 Bulbasaur BS 44\\n4 Charmeleon BS 24\\nTrainer: 12\\n4 Bill BS 91\\n4 Potion BS 94\\n4 Switch BS 95\\nEnergy: 36\\n36 Basic {G} Energy BS 99\\nTotal Cards: 60';
  check(state.formats.filter(f=>f.id.startsWith('wotc-')).length===6,'WOTC preset migration');checks.push('Six WOTC format presets added without overwriting existing formats');
  for(let i=0;i<2;i++){importDeckText();$('#importdeckname').value='Import test '+(i+1);$('#importdeckformat').value='wotc-base-fossil';$('#decktext').value=list;await $('#parsedeck').onclick();check(!!$('#confirmdeckimport'),'Valid import review');$('#confirmdeckimport').click();}
  check(state.decks.length===2&&Object.values(state.decks[0].cards).reduce((a,b)=>a+b,0)===60,'Imported quantities');checks.push('Limitless text imports through review and saves both decks');
  await exportDeckText();const exported=$('#exportdecktext').value;check(DeckText.parse(exported,cards,cardMetadata,deckCodes).errors.length===0,'Export round trip');$('#modal').close();checks.push('Limitless text export round trips');
  importDeckText();$('#decktext').value='4 Unknown OBF 999';await $('#parsedeck').onclick();check(!$('#confirmdeckimport'),'Unknown printing must not save');$('#modal').close();checks.push('Unresolved import blocks save');
  tab='play';render();$('#opponentmode').value='local';$('#opponentmode').onchange();$('#rp1').value=state.decks[0].id;$('#rp1').onchange();$('#rp2').value=state.decks[1].id;check($('#ruleprofile').value==='wotc','Format chooses historical WOTC profile');await beginRules();check(!!rulesMatch,'Match begins');checks.push('WOTC profile selected automatically from deck format');
  {const image=document.querySelector('.prompt-pick img');if(image){const journal=rulesMatch.journal.length,choice=JSON.stringify(promptChoice);image.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true}));check(document.querySelector('#cardmagnifier').open,'Prompt card magnifies');check(rulesMatch.journal.length===journal&&JSON.stringify(promptChoice)===choice,'Magnification cannot select a prompt option');document.querySelector('.magnify-close').click();checks.push('Right-click magnifies a prompt card without changing its selection or journal');}}
  for(let i=0;i<100;i++){const p=RulesMatch.pending(rulesMatch)[0];if(!p)break;
   if(p.type==='Choose cards'){const n=p.options.min;const buttons=[...document.querySelectorAll('[data-choice]:not(:disabled)')];check(buttons.length>=n,'Legal setup options');for(let j=0;j<n;j++)document.querySelectorAll('[data-choice]:not(:disabled)')[j].click();$('#resolvechoice').click();}
   else if(p.type==='Confirm')$('#yeschoice').click();else if($('#ackchoice'))$('#ackchoice').click();else if(['Select','SelectOption'].includes(p.type)){document.querySelector('[data-choice]:not(:disabled)').click();$('#resolvechoice').click();}else throw Error('Unsupported setup UI '+p.type);
  }
  check(rulesMatch.store.state.phase===RulesMatch.R.GamePhase.PLAYER_TURN,'Setup resolved');check(document.querySelectorAll('[data-seat-slot]').length===12&&document.querySelectorAll('.seat-half').length===2,'Both seated boards');check($('#ruleprofile').value==='wotc','Selected rules profile survives board rendering');checks.push('WOTC setup resolves into opposing Active/Bench rows on the seated table');
  {const image=document.querySelector('.near-hand img'),before=rulesMatch.journal.length,focus=JSON.stringify(seatFocus);check(!!image,'Visible local hand');image.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true}));check(document.querySelector('#cardmagnifier').open,'Hand card magnifies');check(document.querySelector('#magnify-image').getAttribute('src')===image.getAttribute('src'),'Correct enlarged scan');check(rulesMatch.journal.length===before&&JSON.stringify(seatFocus)===focus&&!document.querySelector('#modal').open,'Preview does not play or select a card');document.querySelector('.magnify-close').click();const back=document.querySelector('.far-hand img');back.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true}));check(!document.querySelector('#cardmagnifier').open,'Opponent hidden cards stay hidden');document.querySelector('.near-seat .seat-bench .seat-pokemon').click();check(seatFocus.active===false&&rulesMatch.journal.length===before,'Left click selects a slot without playing a card');checks.push('Hand and board previews preserve game state, left-click selects, and opponent hands stay hidden');}
  const before=rulesMatch.journal.length;ruleAction({type:'pass',player:999});check(rulesMatch.journal.length===before,'Illegal turn mutation');checks.push('Illegal action rolls back without adding to saved journal');
  {const owner=rulesMatch.store.state.players[rulesMatch.store.state.activePlayer],index=owner.hand.cards.findIndex(c=>c.superType===RulesMatch.R.SuperType.ENERGY);if(index>=0){ruleAction({type:'play',player:owner.id,index,target:{player:RulesMatch.R.PlayerType.BOTTOM_PLAYER,slot:RulesMatch.R.SlotType.ACTIVE,index:0}});const image=document.querySelector('.near-seat .seat-active .seat-energy img');check(!!image,'Attached Energy is visible beside its Pokémon');const count=rulesMatch.journal.length;image.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true}));check(document.querySelector('#cardmagnifier').open&&rulesMatch.journal.length===count,'Attached Energy magnifies without changing the game');document.querySelector('.magnify-close').click();checks.push('Attached Energy stays visible and can be magnified independently');}}
  const player=rulesMatch.store.state.players[rulesMatch.store.state.activePlayer];ruleAction({type:'pass',player:player.id});check(rulesMatch.store.state.turn===2,'Turn advance');checks.push('Turn and checkup advance through rules engine');
  await window.desktop.exportJSON('rules-workspace-test.json',state);localStorage.setItem('rules-test-marker','1');saveRules();
  return {passed:true,checks,mappedPrintings:Object.keys(ruleMap).length,cardScans:cards.length,nodeIntegration:typeof require!=='undefined',profile:rulesMatch.spec.profile};
 })()`);
 if(result.nodeIntegration)throw Error('Renderer Node enabled');
 fs.writeFileSync(path.join(root,'desktop-tests.json'),JSON.stringify(result,null,2));
 fs.writeFileSync(path.join(root,'expected-restore.json'),await evaluate("JSON.stringify({turn:rulesMatch.store.state.turn,profile:rulesMatch.spec.profile,journal:rulesMatch.journal,deck:rulesMatch.store.state.players.map(p=>p.deck.cards.map(c=>c._labId)),pending:RulesMatch.pending(rulesMatch).map(p=>p.type)})"));
 await verifyDragAndSize();
 await evaluate("(async()=>{tab='play';render();await Promise.all([...document.querySelectorAll('#app img')].map(i=>i.decode()));window.scrollTo(0,0);})()");
 await pause(400);fs.writeFileSync(path.join(root,'tabletop-preview.png'),(await win.webContents.capturePage()).toPNG());
 await evaluate("(async()=>{tab='library';render();const images=[...document.querySelectorAll('#app img')];images.forEach(i=>i.loading='eager');await Promise.all(images.map(i=>i.decode()));window.scrollTo(0,0);})()");
 await pause(500);fs.writeFileSync(path.join(root,'desktop-preview.png'),(await win.webContents.capturePage()).toPNG());
};

