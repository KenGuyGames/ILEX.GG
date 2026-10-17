const fs=require('fs'),path=require('path');
module.exports=async(win,root)=>{
 const run=s=>win.webContents.executeJavaScript(s,true),wait=ms=>new Promise(r=>setTimeout(r,ms));
 for(let i=0;i<150;i++){if(await run("typeof IlexPresentation!=='undefined'&&rulesReady&&cards.length===23736"))break;await wait(100);}
 await run('document.fonts.ready');await wait(300);
 fs.writeFileSync(path.join(root,'library.png'),(await win.webContents.capturePage()).toPNG());
 await run(`(()=>{
  const M=RulesMatch,R=M.R,deck={name:'Forest Arena',cards:{'dp1-76':4,'tk-dp-m-12':56}},m=M.create({profile:'dppl',seed:7,decks:[deck,deck]},ruleMap);
  for(let i=0;i<300&&M.pending(m).length;i++){const action=BotAI.prompt(m,M.pending(m)[0],'easy');if(!action)throw Error('Setup prompt');M.apply(m,action);}
  const put=(id,zone)=>{const c=R.CardManager.getInstance().getCardByName(ruleMap[id]);c._labId=id;c.id=-(900000+(m.previewSeq=(m.previewSeq||0)+1));zone.cards.push(c);return c;};
  m.store.state.turn=4;const p=m.store.state.players[m.store.state.activePlayer],o=m.store.state.players.find(x=>x!==p);
  p.active.cards=[];o.active.cards=[];put('dp1-76',p.active);put('base1-98',p.active);put('base1-98',p.active);const defender=put('dp1-103',o.active);defender.hp=500;defender.weakness=[];
  for(const [i,id]of ['dp2-106','dp6-43','pl1-47','dp3-7','dp5-49'].entries()){p.bench[i].cards=[];o.bench[i].cards=[];put(id,p.bench[i]);put(id,o.bench[i]);}
  for(let i=0;i<4;i++)put('dp5-83',p.discard);rulesMatch=m;tab='play';tableMode='rules';state.botPaused=true;play();window.previewPlayer=p.id;
 })()`);
 await wait(500);
 for(const [name,w,h]of [['arena-wide',1920,1080],['arena',1440,1000],['arena-small',1000,800]]){win.setContentSize(w,h);await wait(350);fs.writeFileSync(path.join(root,name+'.png'),(await win.webContents.capturePage()).toPNG());}
 win.setContentSize(1440,1000);await wait(300);
 await run("ruleAction({type:'attack',player:window.previewPlayer,name:'Ember'})");await wait(700);
 fs.writeFileSync(path.join(root,'coin.png'),(await win.webContents.capturePage()).toPNG());await wait(1300);
 fs.writeFileSync(path.join(root,'attack.png'),(await win.webContents.capturePage()).toPNG());
 await run('IlexPresentation.whenIdle()');
 fs.writeFileSync(path.join(root,'presentation.json'),JSON.stringify(await run('IlexPresentation.diagnostics()'),null,2));
};
