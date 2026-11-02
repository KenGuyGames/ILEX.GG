(()=>{
 const T=IlexTutorial,E=IlexTutorialEngine,D=IlexTutorialData,M=RulesMatch,checks=[];
 const assert=(v,m)=>{if(!v)throw Error(m)},click=selector=>{const b=document.querySelector(selector);assert(b,'Missing control '+selector);assert(!b.disabled,'Disabled control '+selector);b.click();};
 const normal=()=>JSON.stringify({match:state.rulesMatch,campaign:state.storyCampaign||null,decks:state.decks,formats:state.formats,botPaused:state.botPaused,botError:state.botError});
 function bootstrap(){
  delete state.tutorial;delete state.tutorialSettings;botSuspended=true;
  const m=M.create({profile:'sv',seed:99,decks:[BotAI.decks[0],BotAI.decks[1]],opponent:{type:'local'}},ruleMap);for(let i=0;i<200&&M.pending(m).length;i++)M.apply(m,BotAI.prompt(m,M.pending(m)[0],'easy'));rulesMatch=m;saveRules();
  mainMenu();assert(document.querySelector('[data-tab=tutorial]').hidden,'Tutorial is in Arena, not a fourth home button');IlexMenuGroups.show('arena');assert(!document.querySelector('[data-tab=tutorial]').hidden,'Tutorial is visible in Arena');click('[data-tab=tutorial]');assert(document.querySelector('.tutorial-welcome'),'Tutorial landing opens');click('#tutorial-start');assert(T.progress().step===0,'Fresh tutorial starts at lesson 1');assert(document.querySelector('#tutorial-speed').value==='slow','Slow reading is the default');state.tutorialSettings={speed:'instant',sounds:false};save();T.screen();return normal();
 }
 function mainMove(){
  const t=T.progress(),s=D.steps[t.step];assert(tab==='tutorial','Own tutorial screen');
  if(s.kind==='quiz'){const wrong=s.answer===0?1:0;click('[data-tut-answer="'+wrong+'"]');assert(!T.progress().answered,'Wrong quiz answer cannot advance');assert(T.progress().step===t.step,'Wrong answer keeps the lesson');click('[data-tut-answer="'+s.answer+'"]');}
  else if(s.kind==='action'){
   const a=s.action;if(['openingCoin','goFirst','pass'].includes(a.type))click('#tutorial-move');
   else if(['play','setupActive'].includes(a.type)){
    const i=E.player(T.match()).hand.cards.findIndex(c=>c._labId===a.card);assert(i>=0,'Required hand card '+a.card);click('[data-tut-hand="'+i+'"]');if(a.zone||a.type==='setupActive')click('[data-tut-zone="1:'+(a.zone||'active')+':'+(a.index||0)+'"]');else click('#tutorial-move');
   }else{click('#tutorial-open-action');assert(document.querySelector('#tutorial-card').open,'Pokémon enlarges');const scan=document.querySelector('#tutorial-card .tut-current');if(a.type==='retreat')click('#tutorial-card .tut-retreat');else{assert(scan&&scan.getAttribute('aria-label')===a.name,'Printed attack/Ability target matches');click('#tutorial-card .tut-current');}}
   assert(T.progress().acted,'Lesson move commits');const count=T.match().journal.length;T.move();assert(T.match().journal.length===count,'Repeated move is ignored');
  }else if(s.kind==='opponent'){for(let i=0;i<35&&E.current(T.match())===2&&!E.finished(T.match());i++)click('#tutorial-opponent');assert(E.current(T.match())===1,'Scripted opponent returns the turn');}
  else if(s.kind==='practice'){
   for(let i=0;i<120&&!E.finished(T.match());i++){
    if(M.pending(T.match()).some(q=>q.playerId===1)){resolveAll();continue;}
    if(E.current(T.match())===2)click('#tutorial-opponent');else{click('#tutorial-attack');click('#tutorial-card .tut-current');}resolveAll();
   }
   assert(E.finished(T.match()),'Practice finishes');assert(T.match().store.state.players[T.match().store.state.winner].id===1,'Engine earns tutorial victory');
  }
  return {step:t.step,title:s.title,pending:M.pending(T.match()).map(q=>q.type),prizes:E.player(T.match()).prizes.filter(l=>l.cards.length).length};
 }
 function resolveAll(){for(let n=0;n<30&&M.pending(T.match()).some(q=>q.playerId===1)&&T.progress().step>5;n++){
  const q=M.pending(T.match()).find(q=>q.playerId===1);let confirm=document.querySelector('#tutorial-confirm');if(confirm){const buttons=[...document.querySelectorAll('[data-tut-choice]:not([disabled])')];let i=0;while(document.querySelector('#tutorial-confirm').disabled&&i<buttons.length){const index=buttons[i++].dataset.tutChoice;click('[data-tut-choice="'+index+'"]');}click('#tutorial-confirm');}else if(document.querySelector('#tutorial-ack'))click('#tutorial-ack');else throw Error('Unshown human choice '+q.type);
 }}
 function advance(){if(T.progress().step<D.steps.length-1)click('#tutorial-next');return T.progress().step;}
 function resume(){T.open();assert(document.querySelector('.tutorial-shell'),'Resume screen');return {progress:JSON.stringify(state.tutorial),normal:normal(),step:T.progress().step};}
 function stable(){const hand=document.querySelector('.tut-hand').getBoundingClientRect(),coach=document.querySelector('.tut-coach').getBoundingClientRect();const board=document.querySelector('.tutorial-table').getBoundingClientRect(),active=document.querySelector('.near-seat .seat-active .seat-pokemon'),ar=active.getBoundingClientRect(),hit=document.elementFromPoint(ar.left+ar.width/2,ar.top+ar.height/2);return {coachSeparate:coach.left>=board.right-2,activeClickable:active.contains(hit),handTop:hand.top,handBottom:hand.bottom,viewport:innerHeight,documentHeight:document.documentElement.scrollHeight,width:document.documentElement.scrollWidth,viewportWidth:innerWidth,coachBottom:coach.bottom};}
 function complete(){assert(T.progress().step===D.steps.length-1&&T.progress().completed,'Completion is saved');const q=T.match().store.state;assert(q.phase===M.R.GamePhase.FINISHED,'Completion comes from finished engine match');mainMenu();assert(normal()===window.tutorialNormalBaseline,'Regular match, decks, formats, Campaign and bot controls unchanged');T.open();assert(T.progress().completed,'Completion survives navigation');return {passed:true,checks:['Arena navigation and default slow pacing','All 38 lesson controls','Wrong quiz answer stays in lesson','Duplicate action guard','Real card/prompt choices','Six engine-earned Prizes and victory','Separate normal match/deck/format/Campaign/bot state'],normal:normal()};}
 window.TutorialQA={bootstrap,mainMove,resolveAll,advance,resume,normal,stable,complete};return true;
})()
