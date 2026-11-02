 // Presentation only: a bounded queue of public story cues, never game actions.
 let cinematicTimer=null,cinematicPaintKey='';
 const cinematicFriends=new Set(['Rowan','Mara','Bram','Nessa','Mira','Tess','Ada','Edda','Oren','Sela','Ivo','Maren','Dr. Sen','Neri','Sera','Tarin','Lio','Rhea','Dalen','Anwen','Elian','Bren','Toma','Vale','Jun']);
 function cinematicLine(m,id){return Object.values(m.battleDialogue||{}).find(l=>l.id===id)||Object.values(m.partyDialogue||{}).find(l=>l.id===id)||Object.values(m.signatureExchanges||{}).flatMap(e=>e.lines).find(l=>l.id===id);}
 function cinematicEmotion(line,cue,role){
  const key=characterKey(line.speaker,mission()?.opponent),friendly=cinematicFriends.has(key)||(key==='Surveyor Venn'&&progress().chapter>=4),text=line.text.toLowerCase();
  if(role==='party')return /Comeback|Victory/.test(cue)?'proud':'concerned';
  if(role==='exchange'){
   if(/afraid|fright|hurt|lost|trembl|lose you|loss|too late|alone|cannot remember|do not know/.test(text))return 'concerned';
   if(/refuse|cruel|shame|not.*yours|never|angry|how dare/.test(text))return 'angry';
   if(friendly&&['Fracture Warden','Commander Saturn','Slowking','Lysandre','Maxie','Zoroark','Arceus, Dialga & Palkia'].includes(mission()?.opponent))return 'angry';
   return friendly?'neutral':'proud';
  }
  if(cue==='playerKeyKO'||cue==='opponentOne'||cue==='defeat')return friendly&&cue==='playerKeyKO'?'concerned':'proud';
  if(cue==='opponentKeyKO'||cue==='playerOne'||cue==='victory')return friendly?(cue==='victory'?'proud':'concerned'):'angry';
  return /^signature/.test(cue)?'proud':'neutral';
 }
 function queueBattleCinematics(t,m,events,priorSeen,priorParty){
  const before=JSON.stringify(t.cinematic),baseline=priorSeen.map(c=>m.battleDialogue[c]?.id).concat(priorParty.map(c=>m.partyDialogue?.[c]?.id)).filter(Boolean);
  const c=t.cinematic||={version:1,seen:baseline,queue:[],active:null,history:[],sequence:0};
  const additions=[];
  const add=(line,role,cue,group,priority,force=false)=>{
   if(!line)return;const known=c.seen.includes(line.id);if(known&&!force)return;
   if(!known)c.seen.push(line.id);
   const frame={id:line.id,role,cue,group,priority,emotion:cinematicEmotion(line,cue,role),sequence:c.sequence++,queuedAt:Date.now()};
   if(!c.history.some(f=>f.id===frame.id))c.history.push(frame);
   if(!c.queue.some(f=>f.id===frame.id)&&c.active?.id!==frame.id)additions.push(frame);
  };
  for(const item of t.exchanges?.queue||[]){
   const exchange=m.signatureExchanges?.[item.cue];if(!exchange)continue;
   exchange.lines.slice(item.line).forEach(l=>add(l,'exchange',item.cue,'exchange:'+item.cue,3,true));
   if(!t.exchanges.completed.includes(item.cue))t.exchanges.completed.push(item.cue);
  }
  if(t.exchanges)t.exchanges.queue=[];
  for(const cue of events)if(!priorSeen.includes(cue)&&!m.signatureExchanges?.[cue])add(m.battleDialogue[cue],'opponent',cue,'event:'+cue,/victory|defeat/.test(cue)?5:/KO|chronos|signature/.test(cue)?3:/One/.test(cue)?2:0);
  const party=t.party,newParty=(party?.seen||[]).filter(cue=>!priorParty.includes(cue));
  for(const cue of newParty){const line=m.partyDialogue?.[cue];if(!line)continue;
   if(cue===party.current)add(line,'party',cue,'party:'+cue,/Victory|Defeat/.test(cue)?5:/Comeback|Danger/.test(cue)?3:2);
   else if(!c.history.some(f=>f.id===line.id))c.history.push({id:line.id,role:'party',cue,emotion:cinematicEmotion(line,cue,'party')});
  }
  const urgent=additions.filter(f=>f.priority>=3);
  if(urgent.length&&c.active){
   const strongest=Math.max(...urgent.map(f=>f.priority)),newGroups=new Set(urgent.map(f=>f.group));
   if(strongest>=c.active.priority&&!newGroups.has(c.active.group)){
    c.queue=c.queue.filter(f=>f.priority>=strongest&&f.group!==c.active.group);
    c.active.until=Math.min(c.active.until,Math.max(c.active.start+2200,Date.now()+650));
   }
  }
  if(additions.some(f=>f.priority===5))c.queue=c.queue.filter(f=>f.priority===5);
  c.queue.push(...additions);c.queue.sort((a,b)=>b.priority-a.priority||a.sequence-b.sequence);c.queue=c.queue.slice(0,12);
  return before!==JSON.stringify(c);
 }
 function stopBattleCinematic(){clearTimeout(cinematicTimer);cinematicTimer=null;document.getElementById('story-battle-cinematic')?.remove();cinematicPaintKey='';IlexAudio.stopStoryWords();}
 function battleCinematicState(){return talkCache?.cinematic?structuredClone(talkCache.cinematic):null;}
 function dismissBattleCinematic(){if(!talkCache?.cinematic)return;talkCache.cinematic.active=null;talkCache.cinematic.queue=[];stopBattleCinematic();rememberBattleTalk();drawBattleTalk();}
 function cinematicPortrait(line,frame,m){
  const speaker=line.speaker==='Narrator'?m.opponent:line.speaker,key=characterKey(speaker,m.opponent),asset=characterArt.portraits[key];
  let art=characterPortrait(speaker,m.opponent);const mood=frame.emotion,expression=asset&&cinematicExpressionFiles[asset.file]?.[mood];
  if(expression)art=art.replace('story-portraits/'+asset.file,'story-portraits/expressions/'+expression);
  return art.replace('data-character=',`data-expression="${expression?mood:'neutral'}" data-character=`);
 }
 function startCinematicFrame(c,m){
  if(c.active&&Date.now()>=c.active.until)c.active=null;
  if(c.active)return false;
  let frame;while(c.queue.length){const candidate=c.queue.shift();if(Date.now()-candidate.queuedAt<45000&&cinematicLine(m,candidate.id)){frame=candidate;break;}}
  if(!frame)return false;
  const line=cinematicLine(m,frame.id),words=line.text.match(/\S+\s*/gu)||[],pace=readingPreferences().speed==='fast'?32:58;
  const revealMs=readingPreferences().speed==='instant'||matchMedia('(prefers-reduced-motion: reduce)').matches?0:Math.min(3400,words.length*pace);
  c.active={...frame,start:Date.now(),until:Date.now()+Math.min(9000,Math.max(3200,revealMs+Math.max(1800,words.length*130))),revealMs,shownWords:0};return true;
 }
 function drawCinematicFrame(t,m){
  clearTimeout(cinematicTimer);cinematicTimer=null;document.getElementById('story-battle-remark')?.remove();
  const c=t.cinematic,table=document.querySelector('.table-scene');if(!c||!table||t.collapsed){stopBattleCinematic();return;}
  if(document.hidden||document.querySelector('dialog[open]')){stopBattleCinematic();return;}
  const bounds=table.getBoundingClientRect(),topInset=Math.max(0,60-bounds.top),bottomInset=Math.max(0,bounds.bottom-innerHeight+12),visibleHeight=bounds.height-topInset-bottomInset;
  if(visibleHeight<150){stopBattleCinematic();if(c.active||c.queue.length)cinematicTimer=setTimeout(()=>{if(tab==='play'&&inBattle())drawBattleTalk();},250);return;}
  const oldActive=c.active?.id,started=startCinematicFrame(c,m);if(started||oldActive!==c.active?.id)rememberBattleTalk();
  const frame=c.active;if(!frame){stopBattleCinematic();return;}
  const line=cinematicLine(m,frame.id);if(!line){c.active=null;rememberBattleTalk();return;}
  const key=t.token+'/'+frame.id,words=line.text.match(/\S+\s*/gu)||[],elapsed=Date.now()-frame.start;
  const instant=readingPreferences().speed==='instant'||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealed=instant||frame.revealMs===0?words.length:Math.min(words.length,Math.floor(elapsed/Math.max(20,frame.revealMs/Math.max(1,words.length))));
  let box=document.getElementById('story-battle-cinematic');
  if(!box||box.dataset.frameKey!==key){
   box?.remove();const ally=frame.role==='party'||line.speaker==='Celebi'||line.speaker===route()?.companion;
   table.insertAdjacentHTML('beforeend',`<div role="status" aria-live="polite" id="story-battle-cinematic" class="battle-cinematic ${ally?'cinematic-ally':'cinematic-opponent'}" data-frame-key="${esc(key)}" data-emotion="${esc(frame.emotion)}" aria-label="Battle dialogue"><div class="cinematic-streak" aria-hidden="true"></div>${cinematicPortrait(line,frame,m)}<div class="cinematic-words"><span class="cinematic-speaker">${esc(line.speaker)}</span><p aria-label="${esc(line.text)}">${words.map((w,i)=>`<span class="cinematic-word ${i<revealed?'revealed':''}" aria-hidden="true">${esc(w)}</span>`).join('')}</p></div></div>`);
   box=document.getElementById('story-battle-cinematic');cinematicPaintKey=key;
  }
  box.classList.toggle('cinematic-fading',Date.now()>frame.until-350);box.style.setProperty('--cinematic-age',elapsed+'ms');box.style.top=topInset+'px';box.style.bottom=bottomInset+'px';box.style.setProperty('--cinematic-visible-height',visibleHeight+'px');
  box.querySelectorAll('.cinematic-word').forEach((node,i)=>node.classList.toggle('revealed',i<revealed));
  if(revealed>frame.shownWords&&readingPreferences().sounds)IlexAudio.storyWord(line.speaker,revealed-1,words[revealed-1]);frame.shownWords=revealed;
  cinematicTimer=setTimeout(()=>{if(tab!=='play'||!inBattle()){stopBattleCinematic();return;}if(Date.now()>=frame.until){c.active=null;rememberBattleTalk();drawBattleTalk();}else drawCinematicFrame(t,m);},45);
 }
 function openBattleDialogueLog(){
  if(!inBattle())return;const m=mission(),t=observeBattleTalk();if(!t)return;stopBattleCinematic();
  let dialog=document.getElementById('story-battle-log');if(!dialog){dialog=document.createElement('dialog');dialog.id='story-battle-log';document.body.append(dialog);dialog.addEventListener('close',()=>drawBattleTalk());}
  const ids=[...t.seen.map(cue=>m.battleDialogue[cue]?.id),...(t.party?.seen||[]).map(cue=>m.partyDialogue?.[cue]?.id),...(t.cinematic?.history||[]).map(f=>f.id),...(t.exchanges?.completed||[]).flatMap(cue=>(m.signatureExchanges?.[cue]?.lines||[]).map(l=>l.id))];
  dialog.innerHTML=`<div class="row"><h2>Battle dialogue</h2><button onclick="document.getElementById('story-battle-log').close()">Close</button></div><p>${esc(m.tip)}</p><div class="cinematic-transcript">${[...new Set(ids)].map(id=>cinematicLine(m,id)).filter(Boolean).map(line=>`<p><strong>${esc(line.speaker)}</strong>${esc(line.text)}</p>`).join('')||'<p>No battle dialogue yet.</p>'}</div>`;dialog.showModal();
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopBattleCinematic();else if(tab==='play'&&inBattle())drawBattleTalk();});
 document.addEventListener('close',()=>{if(tab==='play'&&inBattle())drawBattleTalk();},true);



