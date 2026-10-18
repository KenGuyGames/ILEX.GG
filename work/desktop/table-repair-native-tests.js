(async()=>{
 const M=RulesMatch,R=M.R,P=IlexPresentation,checks=[],pause=ms=>new Promise(r=>setTimeout(r,ms));
 const original={state:JSON.stringify(state),match:rulesMatch,tab,mode:tableMode},nativeRaf=window.requestAnimationFrame,ellipse=CanvasRenderingContext2D.prototype.ellipse;
 const check=(ok,message)=>{if(!ok)throw Error(message);checks.push(message);};
 const idle=async()=>{await Promise.race([P.whenIdle(),pause(3500).then(()=>{throw Error('Animation did not release gameplay automatically');})]);check(!P.busy()&&!document.getElementById('ilex-cinema').open,'Animation releases the match without Skip');};
 let sequence=980000;
 const card=id=>{const c=R.CardManager.getInstance().getCardByName(ruleMap[id]);c._labId=id;c.id=-(sequence++);return c;};
 const deck={name:'Table repair regression',cards:{'bw1-1':4,'bw1-105':56}};
 const create=()=>{const m=M.create({profile:'xy',seed:7,decks:[deck,deck]},ruleMap);for(let i=0;i<400&&M.pending(m).length;i++)M.apply(m,BotAI.prompt(m,M.pending(m)[0],'easy'));return m;};
 const display=m=>{P.cancel();clearTimeout(botTimer);botTimer=null;botGeneration++;rulesMatch=m;tab='play';tableMode='rules';state.botPaused=true;render();};
 try{
  P.update({effects:true,speed:'fast',shake:false});
  for(const id of ['bw7-136','xy8-150']){
   const m=create(),p=m.store.state.players[m.store.state.activePlayer];
   for(const list of p.prizes)list.cards=[card('xy1-1')];
   p.hand.cards.push(card(id));display(m);await pause(100);
   const selector=`[data-seat-player="${p.id}"]>.seat-prizes`;
   const before=document.querySelector(selector+' .seat-prizes').getBoundingClientRect(),beforePile=document.querySelector(selector).getBoundingClientRect();
   M.apply(m,{type:'play',player:p.id,index:p.hand.cards.length-1,target:{player:R.PlayerType.BOTTOM_PLAYER,slot:R.SlotType.ACTIVE,index:0}});display(m);await pause(100);CardFoil.refresh();await pause(100);
   check(p.prizes.every(l=>l.faceUpPrize),id+' reveals all six Prizes through the engine');
   const pile=document.querySelector(selector),grid=pile.querySelector('.seat-prizes'),after=grid.getBoundingClientRect(),cards=[...grid.querySelectorAll('img')];
   check(cards.length===6&&grid.querySelectorAll('.foil-layer').length===6,'All six revealed holo Prizes retain foil decoration');
   const bounds=pile.getBoundingClientRect();
   check(Math.abs((after.left-bounds.left)-(before.left-beforePile.left))<2&&Math.abs((after.top-bounds.top)-(before.top-beforePile.top))<2,'Revealing holo Prizes does not move the Prize grid');
   check(cards.every(img=>{const b=img.getBoundingClientRect();return b.left>=bounds.left-2&&b.right<=bounds.right+2;}),'Every revealed Prize stays inside its pile');
   window.tableRepairPrizePreview={html:document.querySelector('#app').innerHTML,bodyClass:document.body.className};
  }
  // Exercise the presentation continuation used by damage resolved after a choice.
  const impact=()=>{const m=create();display(m);const p=m.store.state.players[m.store.state.activePlayer],a={type:'prompt',id:-1,value:0},token=P.before(m,a);token.context={energy:'GRASS',name:'Grass damage continuation',player:p.id};p.active.damage+=10;m.journal.push({type:'presentation-test-commit'});P.after(token,m,a);return m;};
  const errors=P.diagnostics().errors.length;
  let m=impact(),saved=JSON.stringify(m.journal);await idle();
  check(P.diagnostics().errors.length===errors,'Grass damage continuation finishes without a negative particle radius');
  check(JSON.stringify(m.journal)===saved,'Animation completion leaves committed actions untouched');
  let injected=false;
  CanvasRenderingContext2D.prototype.ellipse=function(...args){injected=true;throw Error('Injected canvas regression');};
  m=impact();await idle();check(injected,'Renderer failure regression reaches the canvas callback');
  CanvasRenderingContext2D.prototype.ellipse=ellipse;
  check(P.diagnostics().errors.at(-1)==='Injected canvas regression','Renderer errors are recorded and release the queue');
  window.requestAnimationFrame=callback=>callback.name==='safeDraw'?0:nativeRaf.call(window,callback);
  m=impact();await idle();check(true,'Stopped animation frames are bounded by the completion timer');
  window.requestAnimationFrame=nativeRaf;
  m=impact();await pause(80);P.cancel();await idle();
  check(true,'Skip still cancels a running continuation safely');
  return {passed:true,checks};
 }finally{
  window.requestAnimationFrame=nativeRaf;CanvasRenderingContext2D.prototype.ellipse=ellipse;P.cancel();clearTimeout(botTimer);botTimer=null;botGeneration++;state=JSON.parse(original.state);rulesMatch=original.match;tab=original.tab;tableMode=original.mode;save();render();
 }
})()
