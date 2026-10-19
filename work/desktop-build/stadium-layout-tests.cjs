const fs=require('fs'),path=require('path'),cp=require('child_process');
const root=path.resolve(__dirname,'../..'),candidate=path.join(root,'work/dp-desktop-candidate'),app=path.join(candidate,'resources/app'),hook=path.join(app,'self-test.cjs'),backup=fs.readFileSync(hook),dir=path.join(root,'work/stadium-native');fs.mkdirSync(dir,{recursive:true});
for(const name of ['tabletop.js','studio.css'])fs.copyFileSync(path.join(root,'work/desktop/ui',name),path.join(app,'ui',name));
const fixture=`(()=>{
 botSuspended=true;clearTimeout(botTimer);cancelRealisticPlanning();state.botPaused=true;state.presentationPreferences={effects:false};
 const M=RulesMatch,m=M.create({profile:'xy',seed:37,decks:[BotAI.decks[0],BotAI.decks[1]]},ruleMap);
 for(let i=0;i<180&&M.pending(m).length;i++){const q=M.pending(m)[0];M.apply(m,BotAI.choose(m,q.playerId,'normal'));}
 const card=id=>{const c=M.R.CardManager.getInstance().getCardByName(ruleMap[id]);c._labId=id;return c;};
 const sid='bwp-BW50';if(!ruleMap[sid])throw Error('Missing Stadium fixture');
 m.spec.opponent={type:'local'};m.store.state.turn=5;
 for(const p of m.store.state.players){p.active.cards=[card('base1-46')];for(const l of p.bench)l.cards=[card('base1-46')];for(const l of p.prizes)if(!l.cards.length)l.cards=[card('base1-98')];p.stadium.cards=[];p.stadiumUsedTurn=0;}
 m.store.state.players[m.store.state.activePlayer].stadium.cards=[card(sid)];rulesMatch=m;tab='play';tableMode='rules';render();return {stadium:sid};
})()`;
const geometry=`(()=>{
 const button=document.querySelector('.table-divider>.seat-stadium button');if(!button)throw Error('Shared Stadium missing');
 const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};},r=rect(button),overlap=[];
 for(const el of document.querySelectorAll('.seat-prizes img,.pile-stack,.seat-pokemon,.hand-fan .fan-card')){const b=rect(el);if(Math.min(r.right,b.right)-Math.max(r.x,b.x)>2&&Math.min(r.bottom,b.bottom)-Math.max(r.y,b.y)>2)overlap.push({class:el.className,rect:b});}
 const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('.seat-stadium')===button.closest('.seat-stadium');
 const visible=r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;
 const sameLane=document.querySelectorAll('.table-divider>.seat-stadium').length===1&&!document.querySelector('.seat-half .seat-stadium');
 return {passed:!overlap.length&&hit&&visible&&sameLane,viewport:[innerWidth,innerHeight],stadium:r,overlap,hit,visible,sameLane};
})()`;
const interaction=`(()=>{
 const g=rulesMatch.store.state,near=g.players[g.activePlayer],other=g.players.find(p=>p!==near),stadium=near.stadium.cards[0],old=ruleAction;let action;
 try{ruleAction=a=>{action=a;};document.querySelector('.seat-stadium button').click();if(action?.type!=='stadium'||action.player!==near.id)throw Error('Own Stadium action changed');
 near.stadium.cards=[];other.stadium.cards=[stadium];play();action=null;document.querySelector('.seat-stadium button').click();if(action?.player!==near.id)throw Error('Opponent Stadium action changed');
 near.stadiumUsedTurn=g.turn;play();if(document.querySelector('.seat-stadium button').hasAttribute('onclick'))throw Error('Spent Stadium activated');
 near.stadiumUsedTurn=0;other.stadium.cards=[];play();if(document.querySelector('.seat-stadium'))throw Error('Empty Stadium remained');return {passed:true,checks:['own activation','opponent activation','once-per-turn restriction','empty lane']};
 }finally{ruleAction=old;other.stadium.cards=[];near.stadium.cards=[stadium];near.stadiumUsedTurn=0;play();}
})()`;
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
