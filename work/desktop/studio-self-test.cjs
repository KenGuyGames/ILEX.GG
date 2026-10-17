const fs=require('fs'),path=require('path');
module.exports=async(win,root)=>{
 const run=s=>win.webContents.executeJavaScript(s,true),wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 for(let i=0;i<150;i++){if(await run("typeof IlexPresentation!=='undefined'&&rulesReady"))break;await wait(100);}
 const restored=await run("localStorage.getItem('studio-preferences-marker')==='1'");
 if(restored&&!await run("state.presentationPreferences?.effects&&state.presentationPreferences.speed==='fast'&&!state.presentationPreferences.shake"))throw Error('Visual settings were not restored');
 // Existing fast action/drag tests exercise their original controls without cinematic delays.
 const previousVisuals=await run('JSON.stringify(state.presentationPreferences||null)');
 await run("state.presentationPreferences={effects:false,speed:'fast',shake:false}");
 try{await require('./rules-self-test.cjs')(win,root);}finally{await run('state.presentationPreferences='+previousVisuals+';save()');}
 const report=await run(fs.readFileSync(path.join(__dirname,'studio-native-tests.js'),'utf8'));
 report.preferencesRestored=restored;
 fs.writeFileSync(path.join(root,'studio-native-tests.json'),JSON.stringify(report,null,2));
 await run("IlexPresentation.update({effects:true,speed:'fast',shake:false});localStorage.setItem('studio-preferences-marker','1')");
 // A simple static fixture for responsive layout measurements and screenshots.
 await run(`window.studioPreviousMatch=rulesMatch;(()=>{const M=RulesMatch,R=M.R,deck={name:'ILEX Arena',cards:{'dp1-76':4,'base1-98':56}},m=M.create({profile:'dppl',seed:7,decks:[deck,deck]},ruleMap);for(let i=0;i<400&&M.pending(m).length;i++)M.apply(m,BotAI.prompt(m,M.pending(m)[0],'easy'));let seq=0;const put=(id,list)=>{const card=R.CardManager.getInstance().getCardByName(ruleMap[id]);card._labId=id;card.id=-(800000+seq++);list.cards.push(card);return card;};for(const player of m.store.state.players){for(const [i,id]of ['dp2-106','dp6-43','pl1-47','dp3-7','dp5-49'].entries()){player.bench[i].cards=[];put(id,player.bench[i]);}put('dp5-83',player.discard);}rulesMatch=m;tab='play';tableMode='rules';render();})()`);
 const sizes=[];
 for(const [width,height]of [[1920,1080],[1440,960],[1000,780]]){
  win.setContentSize(width,height);await wait(400);
  const metrics=await run(`(()=>{const box=selector=>{const b=document.querySelector(selector).getBoundingClientRect();return{x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom,right:b.right};};return{width:innerWidth,height:innerHeight,scroll:document.documentElement.scrollWidth,arena:box('.seated-experience'),hand:box('.near-hand'),deck:box('.near-seat .seat-deck .pile-stack'),discard:box('.near-seat .seat-discard .pile-stack'),prizes:box('.near-seat>.seat-prizes'),table:box('.felt-table')};})()`);
  if(metrics.scroll>width+1)throw Error('Studio layout horizontal overflow at '+width);
  if(metrics.hand.bottom>height+8)throw Error('Studio hand outside viewport at '+width);
  if(metrics.deck.width<(width>1400?85:40))throw Error('Studio piles too small at '+width);
  sizes.push(metrics);fs.writeFileSync(path.join(root,'studio-arena-'+width+'.png'),(await win.webContents.capturePage()).toPNG());
 }
 fs.writeFileSync(path.join(root,'studio-layouts.json'),JSON.stringify({passed:true,sizes},null,2));
 await run('rulesMatch=window.studioPreviousMatch;delete window.studioPreviousMatch;render()');
 // Verify the OS motion preference changes the actual coin presentation.
 try{
  win.webContents.debugger.attach('1.3');
  await win.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait(100);
  const reduced=await run(`(async()=>{IlexPresentation.manualCoin(false);for(let i=0;i<40&&!document.querySelector('#ilex-cinema').open;i++)await new Promise(r=>setTimeout(r,15));const coin=document.querySelector('#ilex-cinema .coin'),result={reduced:IlexPresentation.diagnostics().reduced,animation:coin?getComputedStyle(coin).animationName:'missing',result:document.querySelector('#ilex-cinema .coin-slot')?.dataset.result};IlexPresentation.cancel();return result;})()`);
  if(!reduced.reduced||reduced.animation!=='none'||reduced.result!=='tails')throw Error('Reduced-motion coin presentation failed');
  fs.writeFileSync(path.join(root,'studio-reduced-motion.json'),JSON.stringify({passed:true,...reduced},null,2));
 }finally{if(win.webContents.debugger.isAttached()){await win.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[]});win.webContents.debugger.detach();}}
 await run("IlexPresentation.update({effects:true,speed:'fast',shake:false})");
 win.setContentSize(1440,960);
};
