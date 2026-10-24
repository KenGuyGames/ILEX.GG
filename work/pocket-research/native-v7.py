from pathlib import Path
import shutil
r=Path('work');p=r/'pocket-research/native-self-test.cjs';s=p.read_text(encoding='utf-8')
s=s.replace(" await run('cubeAssets');", " await run('cubeAssets');if(process.env.ILEX_POCKET_RESTORED==='1'){const expected=fs.readFileSync(path.join(dir,'pocket-expected.json'),'utf8');check(await run('JSON.stringify(state.pocket)')===expected,'Pocket saved decks, match, collection and bot pause restore exactly');}await run(\"state.pocket={schema:1,decks:[],collection:{},opened:0,lastPack:null,match:null}\");")
i=s.index(' win.setMinimumSize(')
s=s[:i]+''' check(await run('IlexAudio.diagnostics().scene==="battle"'),'Pocket battle selects battle music');
 await run('window.pocketNativeSaved=JSON.stringify(state.pocket.match);PocketUI.target(state.pocket.match.active,0)');
 check(await run('document.querySelectorAll(".pocket-attack-region").length>0'),'Pocket attacks are available on the enlarged Pokemon');
 check(await run('[...document.querySelectorAll(".pocket-attack-region")].every(b=>!b.textContent&&getComputedStyle(b).backgroundColor==="rgba(0, 0, 0, 0)"&&getComputedStyle(b).backdropFilter==="none")'),'Enlarged action regions remain transparent without covering printed text');
 await run('document.querySelector("#modal").close()');
 await run(`(async()=>{const data=await PocketUI.assets(),m=state.pocket.match,p=m.players[m.active],o=m.players[1-m.active],c=data.cards.find(c=>c.stage===0&&!c.ability&&c.attacks.some(a=>a.automation?.[0]?.kind==='coinDamage'&&a.automation[0].count===2)),d=data.cards.find(c=>c.name==='Charizard ex'&&!c.ability);p.active.stack=[{id:c.id,key:p.active.key}];p.active.damage=0;p.active.energy=['G','R','W','L','P','F','D','M','C'].flatMap(t=>[t,t,t]);p.active.conditions=[];p.active.effects=[];p.turns=3;m.turn=5;o.active.stack=[{id:d.id,key:o.active.key}];o.active.damage=0;state.presentationPreferences={...state.presentationPreferences,effects:true};PocketUI.act({type:'attack',player:p.id,index:c.attacks.findIndex(a=>a.automation?.[0]?.kind==='coinDamage'&&a.automation[0].count===2)});})()`);
 await new Promise(r=>setTimeout(r,100));check(await run('document.querySelector("#ilex-cinema").open&&document.querySelectorAll(".coin-face svg").length===4'),'Committed Pocket coin results use the visible Celebi coin animation');
 check(await run('state.pocket.match.events.filter(e=>e.type==="coin").length===2'),'Presentation uses the two committed coin results');
 await run('IlexPresentation.cancel()');await new Promise(r=>setTimeout(r,50));check(await run('!IlexPresentation.busy()'),'Skipping the Pocket animation releases presentation');
 await run('state.pocket.match=JSON.parse(window.pocketNativeSaved);state.pocket.match.spec.opponent="bot";PocketUI.go("battle")');await new Promise(r=>setTimeout(r,50));
 await run('PocketUI.act({type:"pass",player:state.pocket.match.active});PocketUI.undo()');
 check(await run('state.pocket.botPaused===true&&state.pocket.match.journal.length===2'),'Pocket Undo restores the preceding action and pauses the bot immediately');
 check(await run('document.querySelector("#pocket-content").textContent.includes("Resume bot")&&!document.querySelector("#modal").open'),'Bot Undo has no approval dialog');
''' +s[i:]
s=s.replace("'pocket-native-tests.json'", "process.env.ILEX_POCKET_RESTORED==='1'?'restored-tests.json':'fresh-tests.json'")
s=s.replace(" fs.writeFileSync(path.join(dir,process.env.ILEX_POCKET_RESTORED", " fs.writeFileSync(path.join(dir,'pocket-expected.json'),await run('JSON.stringify(state.pocket)'));\n fs.writeFileSync(path.join(dir,process.env.ILEX_POCKET_RESTORED")
p.write_text(s,encoding='utf-8')
for name in ['pocket-engine.js','pocket-model.js','pocket-ui.js','pocket-cards.json','pocket-sets.json','pocket.css','audio.js','presentation.js','POCKET-SOURCES.txt','POCKET-DATA-LICENSE.txt','POCKET-METADATA-LICENSE.txt']:
 shutil.copy2(r/'pocket-candidate/ui'/name,r/'pocket-desktop-candidate/resources/app/ui'/name)
shutil.copy2(p,r/'pocket-desktop-candidate/resources/app/self-test.cjs')
p=r/'pocket-research/run-native.cjs';s=p.read_text().replace('native-v6','native-v7');s=s.replace("p.on('exit',code=>{", "p.on('exit',code=>{")
p.write_text(s)
