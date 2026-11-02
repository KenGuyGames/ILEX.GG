/* Player-paced tutorial presentation. Uses only its own match and progress namespace. */
var IlexTutorial=(()=>{
 const D=IlexTutorialData,E=IlexTutorialEngine;let match=null,selection=null,picks=[],error='',busy=false,narrationTimer=null,narrationKey='',shown=0,words=[],sounds=true;
 const dialog=document.createElement('dialog');dialog.id='tutorial-card';document.body.append(dialog);
 const data=()=>state.tutorial,step=()=>D.steps[data()?.step||0],settings=()=>({speed:state.tutorialSettings?.speed||'slow',sounds:state.tutorialSettings?.sounds!==false});
 function persist(){if(match&&data()){data().match=E.saved(match);save();}}
 function stop(){clearTimeout(narrationTimer);narrationTimer=null;IlexAudio.stopStoryWords();if(dialog.open)dialog.close();}
 function open(){tab='tutorial';render();}
 function start(){if(data()&&!confirm('Restart only your tutorial? Your regular matches, decks, and Campaign will stay saved.'))return;stop();match=E.create(ruleMap);state.tutorial={version:D.version,step:0,acted:false,answered:false,completed:false};selection=null;picks=[];error='';narrationKey='';persist();screen();}
 function restore(){if(match)return;if(!data())return;if(data().version!==D.version)throw Error('This tutorial save needs to be restarted.');match=RulesMatch.restore(data().match,ruleMap);}
 function cardInfo(c){return c?{_labId:c._labId,name:c.name}:null;}
 function art(c,back=false){const src=back?'ilex-card-back.svg':c&&ruleArt(c);return src?'<img src="'+esc(src)+'" alt="'+esc(back?'Face-down card':c.name)+'" draggable="false">':'<span class="tut-card-fallback">'+esc(c?.name||'Empty')+'</span>';}
 function savedEvent(text,c){data().lastEvent={text,card:cardInfo(c)};}
 function commit(a,{lesson=false,text='',card=null}={}){
  if(busy)return;busy=true;const before=E.saved(match),old=JSON.parse(JSON.stringify(data()));const audio=IlexAudio.before(match,a);
  try{
   if(lesson&&!data().acted)data().checkpoint={step:data().step,match:before};
   E.apply(match,a);if(lesson)data().acted=true;if(text)savedEvent(text,card);error='';selection=null;picks=[];if(E.finished(match)&&match.store.state.players[match.store.state.winner]?.id===1)data().completed=true;persist();IlexAudio.after(audio,match,a);
  }catch(e){match=RulesMatch.restore(before,ruleMap);state.tutorial=old;error='That move could not finish. Your position is saved. Try the highlighted move again.';data().diagnostic=String(e.message||e);persist();}finally{busy=false;screen();}
 }
 function quietReady(){return settings().speed==='instant'||shown>=words.length;}
 function move(){
  if(!quietReady())return reveal();const s=step();if(!match||s.kind!=='action'||data().acted)return;
  try{const a=E.expected(match,s);if(a.type==='play'&&selection&&E.player(match).hand.cards[selection.index]?._labId===s.action.card)a.index=selection.index;const c=a.type==='play'?E.player(match).hand.cards[a.index]:s.action.card?{_labId:s.action.card,name:cardMetadata[s.action.card]?.name}:null;commit(a,{lesson:true,text:s.action.type==='openingCoin'?'Opening coin: heads. You may choose who goes first.':s.title+' — resolved.',card:c});}catch(e){error='Follow the highlighted move to continue.';screen();}
 }
 function advance(){if(!quietReady())return reveal();if(!E.ready(match,data()))return;if(data().step>=D.steps.length-1)return;stop();data().step++;data().acted=false;data().answered=false;delete data().checkpoint;selection=null;picks=[];error='';narrationKey='';persist();screen();}
 function answer(index){if(!quietReady())return reveal();if(index!==step().answer){error='Not quite. Read the explanation and try the other answer.';screen();return;}data().answered=true;error='';persist();narrationKey='';screen();}
 function chooseHand(index){
  if(!quietReady())return reveal();const c=E.player(match).hand.cards[index],a=step().action;if(!c)return;
  if(data().acted||!a||!['play','setupActive'].includes(a.type)||c._labId!==a.card)return inspect(c);
  selection={index,id:c._labId};error='';screen();
 }
 function target(zone,index){
  if(!quietReady())return reveal();const a=step().action;if(!a||data().acted)return;
  if(['play','setupActive'].includes(a.type)&&selection&&(a.zone||'active')===zone&&(a.index||0)===index)return move();
  if(['attack','ability'].includes(a.type)&&(a.zone||'active')===zone&&(a.index||0)===index)return openAction(zone,index);
  if(a.type==='retreat'&&zone==='active')return openAction(zone,index);
 }
 function inspect(c){if(!c)return;dialog.innerHTML='<button class="tut-close" aria-label="Close enlarged card">×</button><h2>'+esc(c.name)+'</h2><div class="card-action-scan">'+art(c)+'</div>';dialog.querySelector('.tut-close').onclick=()=>dialog.close();if(!dialog.open)dialog.showModal();}
 function openAction(zone,index){
  if(!quietReady())return reveal();const s=step(),a=s.action||{type:'attack',name:'Royal Blaze',zone:'active'},p=E.player(match),list=zone==='active'?p.active:p.bench[index],c=list.getPokemonCard();if(!c)return;
  const token={step:data().step,journal:match.journal.length};
  const entries=[...c.powers.filter(p=>!p._dpExtra).map(p=>({kind:'ability',name:p.name,text:p.text||''})),...c.attacks.map(x=>({kind:'attack',name:x.name,text:x.text||''}))],layout=cardActionLayout(c,entries).map(r=>{const box=D.regions?.[c._labId]?.[r.entry.name];return box?{...r,left:.045,width:.91,top:box[0],bottom:box[1],reviewed:true}:r;}),buttons=layout.map(r=>{const enabled=r.entry.kind===a.type&&r.entry.name===a.name;return '<button class="card-action-hotspot scan-action '+(enabled?'tut-current':'')+'" data-tut-scan="'+esc(r.entry.name)+'" '+(enabled?'':'disabled')+' style="left:'+r.left*100+'%;width:'+r.width*100+'%;top:'+r.top*100+'%;height:'+(r.bottom-r.top)*100+'%" aria-label="'+esc(r.label||r.entry.name)+'" title="'+esc(enabled?'Use '+r.entry.name:'This lesson uses the highlighted move')+'"></button>';}).join('');
  dialog.innerHTML='<button class="tut-close" aria-label="Close enlarged card">×</button><h2>'+esc(c.name)+'</h2><p>'+esc(a.type==='retreat'?'Choose Retreat below.':'Select the highlighted '+(a.type==='ability'?'Ability':'attack')+' on the card.')+'</p><div class="card-action-scan">'+art(c)+buttons+'</div>'+(a.type==='retreat'?'<button class="tut-retreat primary">Retreat to Bidoof</button>':'');
  dialog.querySelector('.tut-close').onclick=()=>dialog.close();const fire=()=>{if(token.step!==data().step||token.journal!==match.journal.length){dialog.close();return;}dialog.close();if(s.kind==='practice')commit({type:'attack',player:1,name:'Royal Blaze',target:E.target()},{text:'Charizard used Royal Blaze.'});else move();};dialog.querySelectorAll('[data-tut-scan]:not([disabled]),.tut-retreat').forEach(b=>b.onclick=fire);if(!dialog.open)dialog.showModal();
 }
 function retry(){const checkpoint=data()?.checkpoint;if(!checkpoint||checkpoint.step!==data().step)return;match=RulesMatch.restore(checkpoint.match,ruleMap);data().acted=false;delete data().checkpoint;selection=null;picks=[];error='';narrationKey='';persist();screen();}
 function pending(){if(data().step<=5)return null;return RulesMatch.pending(match).find(q=>q.playerId===1);}
 function choose(index){const q=pending(),rows=E.promptRows(match,q),r=rows[index];if(!r||r.blocked)return;if(!quietReady())return reveal();const key=JSON.stringify(r.value),single=['Select','SelectOption'].includes(q.type),at=picks.findIndex(x=>JSON.stringify(x)===key);if(single)picks=[r.value];else if(at>=0)picks.splice(at,1);else{if((q.options?.max===1||q.options?.count===1))picks=[];picks.push(r.value);}screen();}
 function resolve(value){const q=pending();if(!q)return;if(!quietReady())return reveal();commit({type:'prompt',id:q.id,value:value===undefined?(['Select','SelectOption'].includes(q.type)?picks[0]:picks):value},{text:q.type==='Choose prize'?'You took a face-down Prize into your hand.':'Your card choice resolved.'});}
 function watch(){if(!quietReady())return reveal();const next=E.opponent(match,ruleMap);if(next)commit(next.action,{text:next.text,card:next.card});}
 function currentText(){const t=data(),s=step(),q=pending();if(q){if(q.type==='Choose prize')return 'You earned a Prize. Choose one face-down card, then confirm. It goes into your hand; you cannot inspect the other face-down Prizes.';if(q.type==='Choose energy')return 'Choose the attached Energy to discard for retreat, then confirm. This is a payment, so that Energy goes to your discard pile.';if(q.type==='Choose pokemon')return 'Choose a Pokémon for this effect, then confirm. The card effect decides which Pokémon are legal choices.';if(q.type==='Choose cards')return 'Choose the required card from the revealed choices, then confirm. Read the card’s effect to see what happens to the other cards.';return 'Finish this card’s choice before continuing. Read the revealed information, then confirm.';}
  if(s.kind==='quiz'&&t.answered)return s.explanation;
  if((s.kind==='opponent'||s.kind==='practice')&&E.current(match)===2&&!E.finished(match))return E.opponent(match,ruleMap)?.text||s.text;
  if(s.kind==='opponent'&&E.current(match)===1)return 'The opponent’s turn has ended. You have drawn a card for your next turn. Continue when you are ready.';
  if(s.kind==='practice'&&E.finished(match))return 'You took all 6 Prizes and won this match. Your final attack and Prize choices resolved in the real game rules. Continue to review what you learned.';
  if(s.kind==='action'&&t.acted)return 'That move is complete. Look at the table to see what changed. Nothing else happens until you continue.';
  return s.text;
 }
 function reveal(){clearTimeout(narrationTimer);shown=words.length;document.querySelectorAll('#tutorial-narration .tut-word').forEach(x=>x.classList.add('revealed'));IlexAudio.stopStoryWords();updateReadingButton();}
 function updateReadingButton(){const b=document.querySelector('#tutorial-show-text');if(b)b.disabled=shown>=words.length;}
 function narrate(text,key){
  clearTimeout(narrationTimer);if(narrationKey!==key){narrationKey=key;shown=0;IlexAudio.stopStoryWords();}const el=document.querySelector('#tutorial-narration');if(!el)return;words=text.match(/\S+\s*/gu)||[];if(settings().speed==='instant'||matchMedia('(prefers-reduced-motion: reduce)').matches)shown=words.length;
  el.setAttribute('aria-label',text);el.innerHTML=words.map((w,i)=>'<span aria-hidden="true" class="tut-word '+(i<shown?'revealed':'')+'">'+esc(w)+'</span>').join('');
  function tick(){if(tab!=='tutorial'||narrationKey!==key)return;const node=el.children[shown];if(!node){updateReadingButton();return;}node.classList.add('revealed');if(settings().sounds)IlexAudio.storyWord('Narrator',shown,node.textContent);shown++;updateReadingButton();narrationTimer=setTimeout(tick,settings().speed==='slow'?115:65);}
  if(shown<words.length)narrationTimer=setTimeout(tick,100);updateReadingButton();
 }
 function setSetting(key,value){state.tutorialSettings={...settings(),[key]:value};save();if(key==='sounds'&&!value)IlexAudio.stopStoryWords();if(key==='speed')reveal();screen();}
 function teachingTable(){
  const g=match.store.state,focus=seatFocus,host=document.createElement('div');
  try{host.innerHTML=renderSeatedTable(g,RulesMatch.pending(match)[0]||null,{match,viewerId:1});}finally{seatFocus=focus;}
  // Reuse the real board, but bind only this tutorial's guided controls and own journal.
  host.querySelectorAll('[onclick]').forEach(el=>el.removeAttribute('onclick'));
  host.querySelectorAll('[data-count-kind]').forEach(el=>{el.title=el.getAttribute('aria-label')||'';el.removeAttribute('data-count-kind');el.removeAttribute('aria-describedby');});
  host.querySelectorAll('.seat-half').forEach(half=>{
   const owner=Number(half.dataset.seatPlayer),p=E.player(match,owner);
   half.querySelectorAll('[data-seat-slot]').forEach(slot=>{
    const zone=slot.dataset.slotKind,index=Number(slot.dataset.slotIndex),b=slot.querySelector('.seat-pokemon'),a=step().action,same=owner===1&&(a?.zone||'active')===zone&&(a?.index||0)===index;
    b.dataset.tutZone=owner+':'+zone+':'+index;
    const highlight=owner===1&&((selection&&same&&!data().acted)||!data().acted&&same&&['attack','ability','retreat'].includes(a?.type)||step().kind==='practice'&&zone==='active'&&E.current(match)===1&&!pending());
    if(highlight)slot.classList.add('tut-highlight');
   });
   const discard=half.querySelector('.seat-discard button');if(discard)discard.dataset.tutDiscard=String(owner);
  });
  host.querySelector('.opponent-seat').innerHTML='<span class="dot"></span>Tutorial opponent<span>One move at a time</span>';
  host.querySelector('.seat-player-bar strong').textContent='You';host.querySelector('.seat-player-bar span').textContent='Select or drag a highlighted card · Click Pokémon for actions · Right-click to magnify';
  const hand=host.querySelector('.near-hand');hand.classList.add('tut-hand');
  hand.querySelectorAll('.fan-card').forEach((b,index)=>{const c=E.player(match).hand.cards[index];b.dataset.tutHand=String(index);b.dataset.tutId=c._labId;b.removeAttribute('aria-disabled');b.draggable=!!step().action?.card&&step().action.card===c._labId&&!data().acted;if(b.draggable)b.classList.add('tut-needed');if(selection?.index===index)b.classList.add('tut-selected');});
  host.querySelectorAll('.seat-stadium button').forEach(b=>{const c=g.players.flatMap(p=>p.stadium.cards)[0];if(c)b.dataset.tutInspect=c._labId;});
  return '<div class="tutorial-table">'+host.innerHTML+'</div>';
 }
 function choicesHtml(q){const rows=E.promptRows(match,q);if(rows.length){const count=q.options?.count,min=q.options?.min??count??1,max=q.options?.max??count??(['Select','SelectOption'].includes(q.type)?1:Infinity),valid=picks.length>=min&&picks.length<=max;return '<section class="tut-choice"><h3>'+esc(q.type==='Choose prize'?'Choose your Prize':q.type==='Choose energy'?'Pay the Retreat Cost':'Choose a card or Pokémon')+'</h3><div class="tut-choice-cards">'+rows.map((r,i)=>({r,i})).filter(({r})=>!r.blocked).map(({r,i})=>'<button data-tut-choice="'+i+'" '+(r.blocked?'disabled':'')+' class="'+(picks.some(x=>JSON.stringify(x)===JSON.stringify(r.value))?'tut-selected':'')+'">'+(r.back?art(null,true):r.card?art(r.card):'')+'<span>'+esc(r.label)+'</span></button>').join('')+'</div><button id="tutorial-confirm" class="primary" '+(valid?'':'disabled')+'>Confirm choice</button></section>';}
  if(['Confirm','Show cards','Confirm cards','Alert','Show mulligan'].includes(q.type))return '<section class="tut-choice"><h3>Read the revealed information</h3>'+((Array.isArray(q.cards)?q.cards:q.cards?.cards)||[]).map(c=>'<div class="tut-revealed">'+art(c)+'</div>').join('')+'<button id="tutorial-ack" class="primary">Continue</button></section>';
  return '<p class="error">This card choice could not be shown. Your tutorial is saved.</p><button id="tutorial-retry">Retry this move</button>';
 }
 function controls(){const s=step(),t=data(),q=pending();if(q)return choicesHtml(q);if(s.kind==='quiz')return '<div class="tut-answers">'+s.options.map((o,i)=>'<button data-tut-answer="'+i+'" '+(t.answered?'disabled':'')+'>'+esc(o)+'</button>').join('')+'</div>'+(t.answered?'<button id="tutorial-next" class="primary">Continue</button>':'');
  if(s.kind==='opponent'||s.kind==='practice'){if(E.current(match)===2&&!E.finished(match))return '<button id="tutorial-opponent" class="primary">Make this move</button>';if(s.kind==='practice'&&!E.finished(match))return '<button id="tutorial-attack" class="primary">Open Charizard to attack</button>';return '<button id="tutorial-next" class="primary">Continue</button>';}
  if(s.kind==='info')return t.step===D.steps.length-1?'<button id="tutorial-play" class="primary">Open Play</button><button id="tutorial-home">Main Menu</button>':'<button id="tutorial-next" class="primary">Continue</button>';
  if(t.acted)return (s.action.type==='openingCoin'?'<figure class="tut-opening-coin"><img src="ilex-mark.svg" alt="Celebi coin, heads"><figcaption>HEADS</figcaption></figure>':'')+'<button id="tutorial-next" class="primary">Continue</button><button id="tutorial-retry">Retry this move</button>';
  const a=s.action;if(['openingCoin','goFirst','pass'].includes(a.type))return '<button id="tutorial-move" class="primary">'+({openingCoin:'Flip coin',goFirst:'Choose to go first',pass:'End turn'})[a.type]+'</button>';
  if(a.type==='retreat'||['attack','ability'].includes(a.type))return '<button id="tutorial-open-action" class="primary">'+(a.type==='retreat'?'Open Charmander to retreat':'Open '+(a.zone==='bench'?'Bibarel':'your Active Pokémon'))+'</button>';
  if(selection&&!a.zone&&a.type==='play')return '<button id="tutorial-move" class="primary">Play '+esc(cardMetadata[a.card]?.name||'selected card')+'</button>';
  return '<p class="tut-instruction">'+(selection?'Now select the highlighted '+((a.zone||'active')==='active'?'Active Spot':'Bench space')+'.':'Select the highlighted card in your hand.')+'</p>';
 }
 function bind(){
  const on=(id,fn)=>{const el=document.getElementById(id);if(el)el.onclick=fn;};on('tutorial-start',start);on('tutorial-restart',start);on('tutorial-home',()=>mainMenu());on('tutorial-pause',()=>mainMenu());on('tutorial-next',advance);on('tutorial-move',move);on('tutorial-opponent',watch);on('tutorial-attack',()=>openAction('active',0));on('tutorial-open-action',()=>openAction(step().action.zone||'active',step().action.index||0));on('tutorial-confirm',()=>resolve());on('tutorial-ack',()=>resolve(true));on('tutorial-retry',retry);on('tutorial-show-text',reveal);on('tutorial-repeat',()=>{narrationKey='';screen();});on('tutorial-play',()=>{tab='play';render();});
  document.querySelectorAll('[data-tut-hand]').forEach(b=>{b.onclick=()=>chooseHand(+b.dataset.tutHand);b.oncontextmenu=e=>{e.preventDefault();inspect(E.player(match).hand.cards[+b.dataset.tutHand]);};b.ondragstart=e=>{selection={index:+b.dataset.tutHand,id:E.player(match).hand.cards[+b.dataset.tutHand]._labId};e.dataTransfer.setData('text/plain',selection.id);};});
  document.querySelectorAll('[data-tut-zone]').forEach(b=>{const [owner,kind,index]=b.dataset.tutZone.split(':'),p=E.player(match,+owner),c=(kind==='active'?p.active:p.bench[+index]).getPokemonCard();b.onclick=()=>{if(+owner===1){if(step().kind==='practice'&&kind==='active'&&E.current(match)===1&&!pending())return openAction('active',0);const a=step().action,same=(a?.zone||'active')===kind&&(a?.index||0)===+index;if(!data().acted&&same&&(selection||['attack','ability','retreat'].includes(a?.type)))return target(kind,+index);}inspect(c);};b.oncontextmenu=e=>{e.preventDefault();inspect(c);};b.ondragover=e=>e.preventDefault();b.ondrop=e=>{e.preventDefault();if(+owner===1&&e.dataTransfer.getData('text/plain')===step().action?.card)target(kind,+index);};});
  document.querySelectorAll('[data-tut-choice]').forEach(b=>b.onclick=()=>choose(+b.dataset.tutChoice));document.querySelectorAll('[data-tut-answer]').forEach(b=>b.onclick=()=>answer(+b.dataset.tutAnswer));document.querySelectorAll('[data-tut-inspect]').forEach(b=>b.onclick=()=>inspect({_labId:b.dataset.tutInspect,name:cardMetadata[b.dataset.tutInspect]?.name||'Card'}));
  document.querySelectorAll('[data-tut-discard]').forEach(b=>b.onclick=()=>{const p=E.player(match,+b.dataset.tutDiscard);dialog.innerHTML='<button class="tut-close" aria-label="Close discard">×</button><h2>'+ (p.id===1?'Your':'Opponent’s')+' discard pile</h2><div class="tut-discard">'+p.discard.cards.map(c=>'<figure>'+art(c)+'<figcaption>'+esc(c.name)+'</figcaption></figure>').join('')+'</div>';dialog.querySelector('.tut-close').onclick=()=>dialog.close();if(!dialog.open)dialog.showModal();});
  const speed=document.getElementById('tutorial-speed'),sound=document.getElementById('tutorial-sounds');if(speed)speed.onchange=()=>setSetting('speed',speed.value);if(sound)sound.onchange=()=>setSetting('sounds',sound.checked);
 }
 function screen(){
  document.body.classList.add('in-match','in-tutorial');document.getElementById('crumb').textContent='Learn to Play';
  if(!rulesReady){document.getElementById('app').innerHTML='<section class="panel"><h1>Learn to Play</h1><p>Loading the teaching cards…</p></section>';rulesAssets.then(()=>{if(tab==='tutorial')screen();});return;}
  if(!data()){document.getElementById('app').innerHTML='<section class="tutorial-welcome panel"><span class="eyebrow">LEARN AT YOUR OWN PACE</span><h1>Your first Pokémon TCG match</h1><p>A narrator guides you through a complete, prepared match. Play the highlighted cards yourself, watch the opponent one move at a time, and take all 6 Prizes.</p><div class="tut-welcome-cards">'+['sv03.5-004','swsh4-25','swsh9-121'].map(id=>art({_labId:id,name:cardMetadata[id]?.name})).join('')+'</div><p>Learn Pokémon, Energy, evolution, Abilities, Items, Supporters, Tools, Stadiums, retreating, attacks, and Prizes. Both teaching decks have 60 cards. Modern first-turn rules apply.</p><p>There is no timer. Your tutorial saves separately from normal matches and Campaign. Narrator words use the same MegaMan X text sound as Campaign and respect your audio settings.</p><button id="tutorial-start" class="primary">Start Tutorial</button></section>';bind();return;}
  try{restore();}catch(e){document.getElementById('app').innerHTML='<section class="panel"><h1>Your tutorial save could not load</h1><p>Your other matches and Campaign remain saved. Restart only the tutorial to begin again.</p><button id="tutorial-restart">Restart Tutorial</button></section>';bind();return;}
  const s=step(),t=data(),g=match.store.state,q=pending(),text=currentText(),key=[t.step,t.acted,t.answered,q?.id||'',g.turn,t.lastEvent?.text||''].join('|'),stadium=g.players.flatMap(p=>p.stadium.cards)[0];
  document.getElementById('app').innerHTML='<section class="tutorial-shell"><div class="tut-heading"><div><span class="eyebrow">LEARN TO PLAY · '+esc(s.chapter)+'</span><h1>'+esc(s.title)+'</h1></div><div><button id="tutorial-pause">Pause & Main Menu</button><button id="tutorial-restart">Restart</button></div></div><div class="tut-layout">'+teachingTable()+'<section class="tut-coach" role="complementary" aria-label="Tutorial narrator"><div class="tut-progress"><span>LESSON '+(t.step+1)+' / '+D.steps.length+'</span><progress value="'+(t.step+1)+'" max="'+D.steps.length+'">'+(t.step+1)+'</progress></div><div class="tut-narrator-heading"><img src="ilex-mark.svg" alt=""><h2>Narrator</h2></div><p id="tutorial-narration" tabindex="0"></p><div class="tut-reading"><button id="tutorial-show-text">Show full text</button><button id="tutorial-repeat">Read again</button></div>'+ (error?'<p class="tut-error" role="alert">'+esc(error)+'</p>':'')+'<div class="tut-lesson-controls">'+controls()+'</div>'+(t.lastEvent?'<div class="tut-last-event">'+(t.lastEvent.card?art(t.lastEvent.card):'')+'<span>'+esc(t.lastEvent.text)+'</span></div>':'')+'<details class="tut-options"><summary>Reading options</summary><label>Text speed <select id="tutorial-speed"><option value="slow" '+(settings().speed==='slow'?'selected':'')+'>Slow</option><option value="normal" '+(settings().speed==='normal'?'selected':'')+'>Normal</option><option value="instant" '+(settings().speed==='instant'?'selected':'')+'>Instant</option></select></label><label><input type="checkbox" id="tutorial-sounds" '+(settings().sounds?'checked':'')+'> Narrator word sounds</label></details></section></div></section>';
  bind();IlexPresentation.fitTable();narrate(text,key);if(selection)document.querySelector('[data-tut-hand="'+selection.index+'"]')?.scrollIntoView({block:'nearest',inline:'nearest'});
 }
 const originalRender=render;render=function(){document.body.classList.toggle('in-tutorial',tab==='tutorial');if(tab!=='tutorial')stop();const result=originalRender();if(tab==='tutorial')document.body.classList.add('in-match');return result;};
 const nav=document.createElement('button');nav.dataset.tab='tutorial';nav.innerHTML='<span class="menu-icon" aria-hidden="true">✦</span><span><strong>Tutorial</strong></span>';nav.onclick=open;document.querySelector('#mainmenu nav').append(nav);
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 return {open,start,screen,advance,move,chooseHand,target,openAction,choose,resolve,watch,answer,reveal,retry,setSetting,stop,progress:()=>data()?JSON.parse(JSON.stringify(data())):null,match:()=>match};
})();
