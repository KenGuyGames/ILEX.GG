const fs=require('fs'),path=require('path'),cp=require('child_process');
const root=path.resolve(__dirname,'../..'),candidate=path.join(root,'work/dp-desktop-candidate'),app=path.join(candidate,'resources/app'),hook=path.join(app,'self-test.cjs'),backup=fs.readFileSync(hook),dir=path.join(root,'work/marker-native');fs.mkdirSync(dir,{recursive:true});
for(const name of ['tabletop.js','power-markers.js','power-markers.css','index.html','rules-ui.js'])fs.copyFileSync(path.join(root,'work/desktop/ui',name),path.join(app,'ui',name));
const fixture=`(()=>{
 botSuspended=true;clearTimeout(botTimer);cancelRealisticPlanning();state.botPaused=true;state.presentationPreferences={effects:false};
 const M=RulesMatch,m=M.create({profile:'xy',seed:37,decks:[BotAI.decks[0],BotAI.decks[1]]},ruleMap);
 for(let i=0;i<180&&M.pending(m).length;i++){const q=M.pending(m)[0];M.apply(m,BotAI.choose(m,q.playerId,'normal'));}
 const card=id=>{const c=M.R.CardManager.getInstance().getCardByName(ruleMap[id]);c._labId=id;return c;};
 m.spec.format={sets:'sm,swsh',banned:''};const sid='bwp-BW50';if(!ruleMap[sid])throw Error('Missing Stadium fixture');
 m.spec.opponent={type:'local'};m.store.state.turn=5;
 for(const p of m.store.state.players){p.active.cards=[card('base1-46')];for(const l of p.bench)l.cards=[card('base1-46')];for(const l of p.prizes)if(!l.cards.length)l.cards=[card('base1-98')];p.stadium.cards=[];p.stadiumUsedTurn=0;}
 m.store.state.players[m.store.state.activePlayer].stadium.cards=[card(sid)];rulesMatch=m;tab='play';tableMode='rules';render();return {stadium:sid};
})()`;
const geometry=`(()=>{const nodes=[...document.querySelectorAll('[data-power-marker]')];const results=nodes.map(el=>{const r=el.getBoundingClientRect(),felt=el.closest('.felt-table').getBoundingClientRect();const overlap=[...document.querySelectorAll('.seat-pokemon,.seat-prizes img,.pile-stack,.seat-stadium button')].some(card=>{const c=card.getBoundingClientRect();return Math.min(r.right,c.right)-Math.max(r.left,c.left)>2&&Math.min(r.bottom,c.bottom)-Math.max(r.top,c.top)>2;});return {onTable:r.left>=felt.left&&r.right<=felt.right&&r.top>=felt.top&&r.bottom<=felt.bottom,overlap,kind:el.dataset.powerMarker,x:r.x,y:r.y,right:r.right,bottom:r.bottom};});return {passed:nodes.length===4&&results.every(r=>r.onTable&&!r.overlap&&r.x>=0&&r.y>=0&&r.right<=innerWidth&&(innerHeight>innerWidth||r.bottom<=innerHeight)),results};})()`;
const interaction=`(()=>{const tests=[];const check=(v,n)=>{if(!v)throw Error(n);tests.push(n);};const available=f=>PowerMarkers.available({sets:f,banned:''},cardMetadata);check(!available('base1').gx&&!available('xy').vstar,'historical');check(available('sm').gx&&!available('sm').vstar,'SM only GX');check(!available('swsh1').vstar,'pre VSTAR');check(available('swsh9').vstar&&!available('swsh9').gx,'Brilliant Stars only VSTAR');const p=rulesMatch.store.state.players[0];p.usedGX=true;play();check(document.querySelector('[data-marker-player="'+p.id+'"][data-power-marker="gx"]').dataset.used==='true','GX used');play();check(!document.querySelector('.marker-changed'),'redraw stable');p.usedGX=false;p.usedVSTAR=true;play();check(document.querySelector('[data-marker-player="'+p.id+'"][data-power-marker="vstar"]').dataset.used==='true','independent VSTAR');return {passed:true,tests};})()`;
const body=`const fs=require('fs'),path=require('path');module.exports=async(w,dir)=>{
 const run=async s=>{const result=await w.webContents.executeJavaScript('(async()=>{try{return await ('+s+')}catch(e){return {testError:e.stack}}})()',true);if(result?.testError)throw Error(result.testError);return result;},pause=ms=>new Promise(r=>setTimeout(r,ms));
 for(let i=0;i<200;i++){if(await run("typeof RulesMatch!=='undefined'&&rulesReady&&cards.length>23700"))break;await pause(100);}
 const fixture=await run(${JSON.stringify(fixture)}),results=[];let mobileLoaded=false;
 for(const [width,height,mobile] of [[1920,1080,false],[1280,800,false],[960,720,false],[640,360,true],[800,450,true],[1280,800,true],[390,844,true]]){
  w.setMinimumSize(0,0);w.setContentSize(width,height);w.webContents.setZoomFactor(1);let keys=[];
  if(mobile){for(const name of ['mobile.css','mobile-landscape.css'])keys.push(await w.webContents.insertCSS(fs.readFileSync(path.join(${JSON.stringify(root)},'work/android-build',name),'utf8')));if(!mobileLoaded){await w.webContents.executeJavaScript(fs.readFileSync(path.join(${JSON.stringify(root)},'work/android-build/mobile.js'),'utf8'),true);mobileLoaded=true;}await run("(()=>{document.documentElement.classList.add('ilex-mobile');document.body.classList.toggle('landscape-table',innerWidth>innerHeight)})()");}
  await run("(()=>{window.dispatchEvent(new Event('resize'));play()})()");await pause(700);
  const result=await run(${JSON.stringify(geometry)});result.mobile=mobile;results.push(result);fs.writeFileSync(path.join(dir,'layout-'+width+'x'+height+'-'+mobile+'.png'),(await w.webContents.capturePage()).toPNG());
  fs.writeFileSync(path.join(dir,'stadium-layout.json'),JSON.stringify({fixture,results},null,2));
  if(!result.passed)throw Error(JSON.stringify(result));
  for(const key of keys)await w.webContents.removeInsertedCSS(key);await run("(()=>{document.documentElement.classList.remove('ilex-mobile');document.body.classList.remove('landscape-table')})()");
 }
 const actions=await run(${JSON.stringify(interaction)});fs.writeFileSync(path.join(dir,'stadium-layout.json'),JSON.stringify({passed:true,fixture,results,actions},null,2));
};`;
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
try{fs.writeFileSync(hook,body);const p=cp.spawnSync(path.join(candidate,'ILEX.GG.exe'),['--no-sandbox','--self-test',dir],{env,cwd:candidate,windowsHide:true,encoding:'utf8',timeout:90000});fs.writeFileSync(path.join(dir,'run.log'),(p.stdout||'')+(p.stderr||''));if(p.status!==0)throw Error(fs.existsSync(path.join(dir,'failure.txt'))?fs.readFileSync(path.join(dir,'failure.txt'),'utf8'):String(p.error||p.stderr||p.status));console.log(fs.readFileSync(path.join(dir,'stadium-layout.json'),'utf8'));}finally{fs.writeFileSync(hook,backup);}

