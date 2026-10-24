const fs=require('fs'),path=require('path'),crypto=require('crypto');
module.exports=async(win,dir)=>{
 const run=s=>win.webContents.executeJavaScript(s,true),checks=[],check=(v,n)=>{if(!v)throw Error(n);checks.push(n)},wait=ms=>new Promise(r=>setTimeout(r,ms));
 for(let i=0;i<250;i++){if(await run("typeof IlexV2!=='undefined'&&rulesReady&&cards.length>0"))break;await wait(100);}
 await run('PackOpening.inventory();PocketUI.diagnostics()');await wait(100);await run('mainMenu()');const original=await run('JSON.stringify(state)');win.setMinimumSize(300,250);
 for(const [w,h]of [[1440,960],[1280,720],[1920,1080],[800,450],[640,360],[390,844]]){
  win.setContentSize(w,h);await run('mainMenu()');await wait(250);await run('Promise.all([...document.querySelectorAll("#mainmenu img")].map(i=>i.decode().catch(()=>{})))');
  check(await run('innerWidth==='+w+'&&innerHeight==='+h),'Actual viewport '+w+'x'+h);
  fs.writeFileSync(path.join(dir,'debug-'+w+'.json'),JSON.stringify(await run('([...document.querySelectorAll("body *")].filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth+1&&r.width>0}).map(e=>({tag:e.tagName,id:e.id,cl:e.className,right:e.getBoundingClientRect().right})))')));fs.writeFileSync(path.join(dir,'debug-'+w+'.png'),(await win.webContents.capturePage()).toPNG());check(await run('document.documentElement.scrollWidth<=innerWidth+1'),'Home has no horizontal overflow '+w);
  check(await run('document.querySelectorAll("#mainmenu nav button[data-tab]").length>=8'),'All modes available '+w);
  check(await run('[...document.querySelectorAll("#mainmenu nav button")].every(b=>{const r=b.getBoundingClientRect();return r.width>80&&r.height>=44})'),'Navigation touch targets remain usable '+w);
  check(await run('(()=>{const b=document.querySelector("#menu-celebi"),r=b.getBoundingClientRect(),e=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return b.contains(e)})()'),'Celebi remains inspectable above decoration '+w);
  fs.writeFileSync(path.join(dir,'home-'+w+'x'+h+'.png'),(await win.webContents.capturePage()).toPNG());
 }
 win.setContentSize(1440,960);await run('mainMenu()');await wait(120);
 check(await run('getComputedStyle(document.querySelector("#v2-atmosphere")).pointerEvents==="none"'),'Ambient canvas never intercepts controls');
 const initialCard=await run('document.querySelector("#menu-celebi").dataset.cardId');await run('render()');check(await run('document.querySelector("#menu-celebi").dataset.cardId')===initialCard,'Ordinary redraw does not cycle Celebi');
 for(const page of ['library','decks','formats','custom','cubes','packs','pocket','play']){
  await run('IlexV2.navigate('+JSON.stringify(page)+')');await wait(250);
  check(await run('tab==='+JSON.stringify(page)+'&&!document.querySelector("#app").hidden'),'Mode opens '+page);
  check(await run('document.documentElement.scrollWidth<=innerWidth+1'),'Mode fits desktop width '+page);
  if(page==='decks')fs.writeFileSync(path.join(dir,'deck-images.json'),JSON.stringify(await run('[...document.querySelectorAll(".deck-card-art img")].slice(0,3).map(i=>({src:i.getAttribute("src"),width:i.naturalWidth,hidden:i.hidden,complete:i.complete}))')));fs.writeFileSync(path.join(dir,page+'.png'),(await win.webContents.capturePage()).toPNG());await run('mainMenu()');await wait(50);
 }
 const after=await run('JSON.stringify(state)');fs.writeFileSync(path.join(dir,'state-change-keys.json'),JSON.stringify(Object.keys(JSON.parse(after)).filter(k=>JSON.stringify(JSON.parse(after)[k])!==JSON.stringify(JSON.parse(original)[k]))));check(after===original,'Visual navigation never mutates saved workspace');
 await win.webContents.debugger.attach('1.3');await win.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait(150);
 check(await run('IlexV2.diagnostics().reducedMotion&&!IlexV2.diagnostics().ambientRunning'),'Reduced motion stops ambient animation');
 check(await run('getComputedStyle(document.querySelector("#v2-atmosphere")).display==="none"'),'Reduced motion hides decorative particles');
 await win.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[]});await wait(100);await run('IlexV2.setHostPaused(true)');await wait(50);check(await run('!IlexV2.diagnostics().ambientRunning'),'Native host pause suspends ambient frames');await run('IlexV2.setHostPaused(false)');await wait(100);check(await run('IlexV2.diagnostics().ambientRunning'),'Ambient scene resumes after host pause');
 await win.webContents.debugger.detach();
 await require('./pocket-self-test.cjs')(win,dir);
 await run('window.v2SavedPocket=JSON.stringify(state.pocket);window.v2SavedPreferences=state.presentationPreferences;PocketUI.go("battle");state.pocket.match.spec.opponent="local";state.presentationPreferences={effects:true,speed:"normal",shake:true};PocketUI.go("battle")');await wait(100);
 const board=await run('JSON.stringify(state.pocket.match)');
 for(const type of ['FIRE','WATER','LIGHTNING','GRASS','PSYCHIC','FIGHTING','DARK','METAL','DRAGON','COLORLESS']){
  await run('IlexPresentation.pocket([{kind:"attack",energy:'+JSON.stringify(type)+',player:state.pocket.match.active,pokemon:"Presentation fixture",name:'+JSON.stringify(type+' ATTACK')+',hits:[{player:1-state.pocket.match.active,active:true,index:0,amount:50}]}])');await wait(650);
  if(['FIRE','LIGHTNING','GRASS'].includes(type))fs.writeFileSync(path.join(dir,'attack-'+type+'.png'),(await win.webContents.capturePage()).toPNG());
  check(await run('document.querySelector("#ilex-cinema").open&&!!document.querySelector(".v2-attack-portrait")'),'Attack cinematic renders public source card '+type);
  check(await run('IlexPresentation.diagnostics().errors.length===0'),'Elemental charge and impact draw without canvas exceptions '+type);

  await run('IlexPresentation.cancel()');check(await run('!IlexPresentation.busy()'),'Skip releases '+type+' cinematic');
 }
 check(await run('JSON.stringify(state.pocket.match)')===board,'Presentation fixtures never mutate match, journal or RNG');
 await run('state.pocket=JSON.parse(window.v2SavedPocket);state.presentationPreferences=window.v2SavedPreferences;save();PocketUI.go("packs")');

 await run(`(()=>{window.v2PriorRules=rulesMatch;const deck={name:'Arena preview',cards:{'base1-46':4,'base1-98':56}};rulesMatch=RulesMatch.create({profile:'unlimited',seed:13,decks:[deck,deck]},ruleMap);for(let i=0;i<200&&RulesMatch.pending(rulesMatch).length;i++)RulesMatch.apply(rulesMatch,BotAI.prompt(rulesMatch,RulesMatch.pending(rulesMatch)[0],'normal'));let serial=950000;const make=id=>{const c=RulesMatch.R.CardManager.getInstance().getCardByName(ruleMap[id]);c._labId=id;c.id=serial++;return c};rulesMatch.store.state.players.forEach((p,j)=>{p.name=j?'Rival':'You';p.active.cards=[make(j?'base1-2':'base1-4')];p.active.damage=j?30:0;for(let i=0;i<5;i++)p.bench[i].cards=[make(['base1-43','base1-46','base1-49','base1-58','base1-7'][i])];});tab='play';render();})();`);await wait(200);
 for(const [w,h]of [[1440,960],[1280,720],[800,450],[640,360]]){win.setContentSize(w,h);await run('play()');await wait(200);await run('Promise.all([...document.querySelectorAll(".seat-pokemon img")].map(i=>i.decode().catch(()=>{})))');check(await run('document.querySelectorAll(".seat-slot").length===12'),'Paper arena retains two Actives and ten Bench positions '+w);check(await run('document.querySelectorAll(".seat-prizes>img,.seat-prizes .seat-prizes>img").length>=12'),'Paper arena retains both six-Prize piles '+w);check(await run('document.documentElement.scrollWidth<=innerWidth+1'),'Paper arena fits width '+w);if(w>=900)check(await run('[...document.querySelectorAll(".seat-pokemon.occupied")].every(b=>{const r=b.getBoundingClientRect(),e=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.width>15&&b.contains(e)})'),'Every occupied Pokemon keeps an unobstructed selection target '+w);fs.writeFileSync(path.join(dir,'paper-battle-'+w+'x'+h+'.png'),(await win.webContents.capturePage()).toPNG());}
await run('tableMode="manual";play()');check(await run('!!document.querySelector("#app>.heading")&&getComputedStyle(document.querySelector("#app>.heading")).display!=="none"'),'Manual sandbox keeps its heading and setup controls');await run('tableMode="rules";rulesMatch=window.v2PriorRules;mainMenu()');
 const report={passed:true,checks,errors:[],hashes:Object.fromEntries(['index.html','rules-ui.js','v2.js','v2.css','presentation.js','rules-engine.js','pocket-engine.js'].map(n=>[n,crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'ui',n))).digest('hex')]))};
 fs.writeFileSync(path.join(dir,process.env.ILEX_POCKET_RESTORED==='1'?'v2-restored.json':'v2-fresh.json'),JSON.stringify(report,null,2));
};
