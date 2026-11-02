(async()=>{
 const M=RulesMatch,R=M.R,assert=(v,m)=>{if(!v)throw Error(m)},old={match:rulesMatch,tab,mode:tableMode},results=[];
 botSuspended=true;state.botPaused=true;if(typeof IlexAudio!=='undefined')IlexAudio.update({muted:true});
 const m=M.create({profile:'unlimited',seed:27,opponent:{type:'bot',humanPlayer:1,botPlayer:2,difficulty:'normal'},decks:[BotAI.decks[0],BotAI.decks[1]]},ruleMap);
 for(let i=0;i<200&&M.pending(m).length;i++)M.apply(m,BotAI.prompt(m,M.pending(m)[0]));
 m.store.state.activePlayer=0;m.store.state.turn=2;rulesMatch=m;tab='play';tableMode='rules';const p=m.store.state.players[0];p.bench.forEach(l=>l.cards=[]);
 const clone=id=>{const c=R.CardManager.getInstance().getCardByName(ruleMap[id]);c._labId=id;c.id=-800000-Math.floor(Math.random()*100000);return c;};
 const ids=['bog-1','sm115-6','xyp-XY70','mep-006','ex6-111','xy7-98','xyp-XY49','xyp-XY93','xyp-XY134','xyp-XY182','swshp-SWSH139','swshp-SWSH155','swshp-SWSH287','sm10-191','swsh11-201'];
 for(const id of ids){
  cardActionDialog.close();p.active.cards=[clone(id)];p.active.specialConditions=[];p.active.damage=0;
  if(id==='swshp-SWSH139')p.active.cards=['swshp-SWSH139','swshp-SWSH140','swshp-SWSH141','swshp-SWSH142'].map(clone);
  if(id==='swshp-SWSH155')p.active.cards=['swshp-SWSH155','swshp-SWSH156','swshp-SWSH157','swshp-SWSH158'].map(clone);
  if(id==='swshp-SWSH287')p.active.cards=['swshp-SWSH287','swshp-SWSH288','swshp-SWSH289','swshp-SWSH290'].map(clone);
  const before=JSON.stringify(m.journal);openCardActions(1,0,true);assert(cardActionDialog.open,id+' inspector opens');const img=cardActionDialog.querySelector('.card-action-scan img');if(!LegendDisplay.pair(p.active)){try{await img.decode();}catch(e){throw Error(id+' scan decode '+String(img.getAttribute('src')).slice(0,70));}}
  if(id.includes('SWSH139')||id.includes('SWSH155')||id.includes('SWSH287')){for(let i=0;i<100&&img.dataset.legendReady!=='true';i++)await new Promise(r=>setTimeout(r,20));assert(img.dataset.legendReady==='true',id+' composed scan');await img.decode();}
  const entries=cardActionView.entries.filter(e=>!e.copied&&e.kind!=='retreat'),layout=cardActionLayout(p.active.getPokemonCard(),entries,{joined:!!LegendDisplay.pair(p.active)}),scan=cardActionDialog.querySelector('.card-action-scan').getBoundingClientRect();
  assert(layout.every(r=>r.scanCalibrated),id+' uses calibrated live layout');
  for(const r of layout){const i=cardActionView.entries.indexOf(r.entry),b=cardActionDialog.querySelector('[data-card-action="'+i+'"]');assert(b,id+' button identity');const box=b.getBoundingClientRect();assert(Math.abs((box.left-scan.left)/scan.width-r.left)<.006&&Math.abs((box.top-scan.top)/scan.height-r.top)<.006,id+' visible position '+r.entry.name);assert(box.right<=scan.right+1&&box.bottom<=scan.bottom+1,id+' bounded');if(CARD_ACTION_SCAN_ALIASES[id]?.[r.entry.name])assert(b.getAttribute('aria-label').startsWith(r.label),id+' printed accessible name');assert(!b.textContent.trim(),id+' remains text-free');const css=getComputedStyle(b);assert(css.backgroundColor==='rgba(0, 0, 0, 0)'&&css.backdropFilter==='none',id+' transparent');}
  assert(JSON.stringify(m.journal)===before,id+' inspection read-only');results.push({id,count:layout.length,joined:!!LegendDisplay.pair(p.active)});
 }
 window.fullArtLivePreview=cardActionDialog.innerHTML;
 cardActionDialog.close();rulesMatch=old.match;tab=old.tab;tableMode=old.mode;return {passed:true,count:results.length,results};
})()

