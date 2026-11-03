/* Presentation observes committed UI transactions. It never dispatches a game action. */
var IlexPresentation=(()=>{
 const R=RulesMatch.R,defaults={effects:true,speed:'normal',shake:true};
 const dialog=document.createElement('dialog');dialog.id='ilex-cinema';dialog.setAttribute('aria-label','Match animation');document.body.append(dialog);
 const motion=matchMedia('(prefers-reduced-motion: reduce)'),history=[],waiters=[],errors=[],cardAnimations=new Set();
 let queue=[],running=false,epoch=0,capture=null,attackContext=null,lockedViewer=null,lockedMatch=null,frame=0,timer=0,finishCurrent=null;
 const prefs=()=>({...defaults,...state.presentationPreferences});
 const reduced=()=>motion.matches;
 const speed=()=>prefs().speed==='fast'?.58:1;
 const record=event=>{history.push(JSON.parse(JSON.stringify(event)));if(history.length>80)history.shift();};
 function publicBoard(m){return m.store.state.players.flatMap(player=>[player.active,...player.bench].flatMap((list,index)=>{const card=list.getPokemonCard();return card&&!list.isSecret?[{id:card.id,player:player.id,index:index?index-1:0,active:!index,damage:list.damage,name:card.name,type:card.cardType?.[0],art:ruleArt(card)}]:[];}));}
 function before(m,a){
  if(!m)return null;
  const g=m.store.state,p=g.players.find(p=>p.id===a.player),card=p?.active.getPokemonCard();
  const printed=card?.attacks.find(attack=>attack.name===a.name),typed=printed?.cost.find(type=>![R.CardType.COLORLESS,R.CardType.ANY,R.CardType.NONE].includes(type));
  const context=a.type==='attack'?{player:a.player,name:a.name,pokemon:card?.name||'Pokémon',energy:R.CardType[typed??card?.cardType?.[0]]||'COLORLESS'}:a.type==='prompt'&&attackContext?.match===m?attackContext.data:null;
  const token={match:m,action:a,journal:m.journal.length,logTail:g.logs.at(-1),logCount:g.logs.length,board:publicBoard(m),turn:g.turn,phase:g.phase,prizes:g.players.map(p=>p.prizes.reduce((n,l)=>n+l.cards.length,0)),coins:[],context,viewer:Number(document.querySelector('.near-seat')?.dataset.seatPlayer)||g.players[g.activePlayer]?.id};
  capture=token;const prompt=a.type==='prompt'?RulesMatch.pending(m).find(p=>p.id===a.id):null;if(prompt?.type==='Coin flip'&&typeof a.value==='boolean')token.coins.push(a.value);
  return token;
 }
 function noteCoin(prompt,value){if(capture&&prompt.type==='Coin flip')capture.coins.push(!!value);}
 function abort(token){if(capture===token)capture=null;}
 function after(b,m,a){
  if(capture===b)capture=null;if(!b||b.match!==m||m.journal.length<=b.journal)return;
  const g=m.store.state,tailIndex=g.logs.indexOf(b.logTail),logs=tailIndex>=0?g.logs.slice(tailIndex+1):g.logs.slice(Math.min(b.logCount,g.logs.length));
  const coins=[...b.coins,...logs.filter(l=>/^LOG_PLAYER_FLIPS_(HEADS|TAILS)$/.test(l.message)).map(l=>l.message.endsWith('HEADS'))];
  const current=publicBoard(m),hits=[];
  for(const previous of b.board){const now=current.find(c=>c.id===previous.id);if(now&&now.damage!==previous.damage)hits.push({...now,amount:now.damage-previous.damage});}
  // A knocked-out target can already have left its slot by the time the animation starts.
  for(const log of logs.filter(l=>l.message==='LOG_PLAYER_DEALS_DAMAGE'))if(+log.params?.damage>0&&!hits.some(hit=>hit.name===log.params.target)){
   const old=b.board.find(card=>card.name===log.params.target&&!current.some(now=>now.id===card.id));if(old)hits.push({...old,amount:+log.params.damage});
  }
  if(a.type==='attack')attackContext={match:m,data:b.context};
  const events=[];if(coins.length)events.push({kind:'coin',results:coins,name:b.context?.name||'Coin flip'});
  const usedAttack=logs.some(l=>l.message==='LOG_PLAYER_USES_ATTACK');
  if(a.type==='attack'&&usedAttack)events.push({kind:'attack',...b.context,hits,waiting:!!RulesMatch.pending(m).length});
  else if(hits.length)events.push({kind:'impact',...(b.context||{energy:'COLORLESS',name:a.type==='ability'?a.name:'Card effect',player:a.player}),hits});
  const kos=logs.filter(l=>l.message==='LOG_POKEMON_KO').map(l=>l.params?.name).filter(Boolean);
  if(kos.length)events.push({kind:'knockout',names:kos});
  const taken=g.players.reduce((n,p,i)=>n+Math.max(0,b.prizes[i]-p.prizes.reduce((n,l)=>n+l.cards.length,0)),0);
  if(taken)events.push({kind:'prize',count:taken});
  if(g.phase===R.GamePhase.FINISHED&&b.phase!==g.phase)events.push({kind:'victory',name:g.winner>=0&&g.players[g.winner]?g.players[g.winner].name:'Match complete'});
  if(a.type!=='prompt'&&a.type!=='attack'||g.turn!==b.turn&&!RulesMatch.pending(m).length)attackContext=null;
  events.forEach(record);
  if(!prefs().effects||!events.length||tab!=='play'||document.hidden)return;
  if(lockedMatch&&lockedMatch!==m)cancel();lockedMatch=m;lockedViewer=b.viewer;queue.push(...events);running=true;document.body.classList.add('presentation-busy');
  if(queue.length===events.length&&!dialog.open){const launchEpoch=epoch;requestAnimationFrame(()=>requestAnimationFrame(()=>pump(launchEpoch)));}
 }
 function viewer(m){return running&&lockedMatch===m?lockedViewer:null;}
 function locate(row){const element=document.querySelector(`[data-slot-player="${row.player}"][data-slot-kind="${row.active?'active':'bench'}"][data-slot-index="${row.index||0}"] .seat-pokemon`);return element?.getBoundingClientRect();}
 const center=rect=>rect?{x:rect.left+rect.width/2,y:rect.top+rect.height/2}:{x:innerWidth/2,y:innerHeight*.58};
 function heading(small,title,subtitle=''){return `<div class="cinema-heading"><small>${esc(small)}</small><h2>${esc(title)}</h2><p>${esc(subtitle)}</p></div>`;}
 function shell(kind,html){dialog.style.setProperty('--motion-rate',speed());dialog.className='cinema-'+kind+(reduced()?' cinema-reduced':'');dialog.innerHTML='<div class="cinema-shade"></div><canvas aria-hidden="true"></canvas>'+html+'<button class="cinema-skip" aria-label="Skip animation">Skip animation <kbd>ESC</kbd></button>';dialog.setAttribute('aria-label','Match animation');dialog.querySelector('button').onclick=cancel;if(!dialog.open)dialog.showModal();}
 function animateCard(card,frames,options){if(!card||reduced())return;const animation=card.animate(frames,options);cardAnimations.add(animation);animation.finished.then(()=>cardAnimations.delete(animation),()=>cardAnimations.delete(animation));return animation;}
 function complete(){for(const animation of cardAnimations)animation.cancel();cardAnimations.clear();cancelAnimationFrame(frame);clearTimeout(timer);finishCurrent=null;if(dialog.open)dialog.close();running=false;lockedViewer=null;lockedMatch=null;document.body.classList.remove('presentation-busy');while(waiters.length)waiters.shift()();if(tab==='play'&&typeof play==='function')play();if(typeof scheduleBot==='function')scheduleBot();}
 function cancel(){epoch++;queue=[];capture=null;cancelAnimationFrame(frame);clearTimeout(timer);const finish=finishCurrent;finishCurrent=null;if(finish)finish();complete();}
 function duration(ms){return reduced()?Math.min(ms,550):ms*speed();}
 function wait(ms,token){return new Promise(resolve=>{finishCurrent=resolve;timer=setTimeout(()=>{finishCurrent=null;resolve();},duration(ms));});}
 async function pump(token){
  if(token!==epoch)return;
  const event=queue.shift();if(!event)return complete();
  try{
   if(event.kind==='coin'){
    const results=event.results,heads=results.filter(Boolean).length;
    shell('coin',heading('Engine result',event.name,results.length===1?'One flip. One outcome.':results.length+' coin flips')+`<div class="coin-stage ${results.length>4?'many':''}">${results.map((heads,index)=>`<div class="coin-slot" data-result="${heads?'heads':'tails'}" style="--delay:${Math.min(index,7)*65}ms;--landing:${heads?1440:1620}deg"><div class="coin" aria-hidden="true"><div class="coin-face"><svg viewBox="40 80 310 280"><path fill="currentColor" d="M86 209C70 176 78 144 103 123C113 115 122 111 131 112C100 136 83 164 92 197C112 178 146 168 177 153C204 141 216 121 219 96C242 121 248 158 241 193L236 226C254 216 273 210 289 213C305 219 279 243 260 254C248 261 238 265 227 268C256 268 282 273 308 271L317 267L316 275L326 276C337 277 326 288 313 291C288 297 259 299 233 295C233 310 237 324 231 334C226 343 215 340 210 331L203 311C189 320 171 318 160 307C129 309 102 298 88 279C80 268 76 256 74 248L52 235L61 230L61 218L70 223L73 215L80 223Z"/></svg></div><div class="coin-face back"><svg viewBox="40 80 310 280"><path fill="currentColor" d="M86 209C70 176 78 144 103 123C113 115 122 111 131 112C100 136 83 164 92 197C112 178 146 168 177 153C204 141 216 121 219 96C242 121 248 158 241 193L236 226C254 216 273 210 289 213C305 219 279 243 260 254C248 261 238 265 227 268C256 268 282 273 308 271L317 267L316 275L326 276C337 277 326 288 313 291C288 297 259 299 233 295C233 310 237 324 231 334C226 343 215 340 210 331L203 311C189 320 171 318 160 307C129 309 102 298 88 279C80 268 76 256 74 248L52 235L61 230L61 218L70 223L73 215L80 223Z"/></svg></div></div><span class="coin-outcome">${heads?'HEADS':'TAILS'}</span>${results.length>1?`<span class="coin-index">FLIP ${index+1}</span>`:''}</div>`).join('')}</div>`+(results.length>1?`<div class="coin-summary"><span><b>${heads}</b> HEADS</span><span><b>${results.length-heads}</b> TAILS</span></div>`:''));
    dialog.setAttribute('aria-label','Coin flip: '+results.map(result=>result?'heads':'tails').join(', '));
    if(typeof IlexAudio!=='undefined')IlexAudio.play('coin');await wait(1600+Math.min(results.length,8)*65,token);
   }else if(event.kind==='attack'||event.kind==='impact'){
    const damage=event.hits.filter(hit=>hit.amount>0).reduce((n,hit)=>n+hit.amount,0);
    shell(event.kind,heading(event.pokemon||'Card effect',event.name,event.waiting?'Resolving card choices':damage?damage+' damage resolved':event.hits.some(hit=>hit.amount<0)?'Recovery resolved':'Effect resolved')+elementalSeal(event.energy));
    dialog.setAttribute('aria-label',event.name+(damage?', '+damage+' damage resolved':''));
    await attackVisual(event,token);
   }else{
    const labels={knockout:['KNOCK OUT',event.names?.join(' · ')],prize:['PRIZE CLAIMED',event.count+' '+(event.count===1?'card':'cards')+' taken'],victory:['MATCH COMPLETE',event.name]};const [title,subtitle]=labels[event.kind];
    shell(event.kind,eventFinale(event,title,subtitle));dialog.setAttribute('aria-label',title+': '+subtitle);await wait(event.kind==='victory'?1600:850,token);
   }
  }catch(error){errors.push(error.message);if(errors.length>20)errors.shift();console.warn('Presentation skipped:',error.message);}
  if(token===epoch)pump(token);
 }
 const palettes={FIRE:['#ffb84d','#ff5633','#fff1a6'],WATER:['#5bdcf7','#398cff','#d8fbff'],LIGHTNING:['#ffee7d','#a6dfff','#fffdf0'],GRASS:['#b9ee86','#56bb83','#e6f8bd'],PSYCHIC:['#d7a9ff','#9b65f0','#fff0ff'],FIGHTING:['#e4b780','#be7655','#fff1ca'],DARK:['#9d8ce3','#554784','#d9c4ff'],METAL:['#b5e2df','#62919e','#f0fffb'],DRAGON:['#ffd287','#c4a5ff','#fff1d0'],COLORLESS:['#cbded4','#76a5aa','#fffbe7'],FAIRY:['#f5b7e0','#cf6bba','#fff0fc']};
 const elementPaths={FIRE:'M12 2c2 7 7 7 7 13a7 7 0 0 1-14 0c0-4 4-7 4-10 0 4 3 5 3 5s2-3 0-8Z',WATER:'M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Zm-4 13a4 4 0 0 0 4 4',LIGHTNING:'m14 2-9 12h7l-2 8 9-13h-7Z',GRASS:'M20 3C8 2 2 9 5 16s15 5 15-13ZM4 21 16 8M7 17l-1-6m4 3 6 1',PSYCHIC:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10-4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',FIGHTING:'m4 13 2-7 3 1 2-4 3 1 1 4 3-1 2 7-5 7H8Z',DARK:'M18 3A10 10 0 1 0 21 17 9 9 0 0 1 18 3Z',METAL:'m12 2 9 5v10l-9 5-9-5V7Zm0 5-5 3v5l5 3 5-3v-5Z',DRAGON:'M5 20 8 12 4 8l9-6-1 6 8-1-4 8 4 5-8-2Z',FAIRY:'m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z',COLORLESS:'m12 2 2 7 7-4-4 7 5 2-7 2 4 7-7-4-2 5-2-7-7 4 4-7-5-2 7-2-4-7 7 4Z'};
 function elementalSeal(type){const energy=palettes[type]?type:'COLORLESS';return `<div class="cinema-element" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="${elementPaths[energy]}"/></svg><span>${energy==='DARK'?'DARKNESS':energy}</span><i></i></div>`;}
 function eventFinale(event,title,subtitle){
  const icons={knockout:'m12 2 2.5 6.5L22 12l-7.5 3.5L12 22l-2.5-6.5L2 12l7.5-3.5Z',prize:'M7 2h13v17H7Zm-3 3H2v17h13v-2M10 6h7M10 9h7M10 12h4',victory:'M8 17h8M9 21h6M12 13v8M7 3h10v5a5 5 0 0 1-10 0Zm0 1H3v3a5 5 0 0 0 5 5m9-8h4v3a5 5 0 0 1-5 5'};
  const ornaments=Array.from({length:event.kind==='victory'?12:6},(_,i)=>`<i style="--petal:${i}"></i>`).join('');
  return `<div class="cinema-event-aura" aria-hidden="true">${ornaments}</div><div class="cinema-ribbon"><div class="cinema-event-crest" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="${icons[event.kind]}"/></svg></div><small>${event.kind==='victory'?'A MOMENT TO REMEMBER':event.kind==='prize'?'ONE STEP CLOSER':'THE BATTLE TURNS'}</small><h2>${esc(title)}</h2><p>${esc(subtitle)}</p><div class="cinema-event-rule" aria-hidden="true"><i></i><span>◆</span><i></i></div></div>`;
 }
 function attackVisual(event,token){return new Promise(resolve=>{
  const canvas=dialog.querySelector('canvas'),ctx=canvas.getContext('2d'),dpr=Math.min(devicePixelRatio||1,2),w=innerWidth,h=innerHeight;canvas.width=w*dpr;canvas.height=h*dpr;ctx.scale(dpr,dpr);
  const energy=palettes[event.energy]?event.energy:'COLORLESS',[primary,secondary,white]=palettes[energy];
  const sourceRect=(document.querySelector(`[data-seat-player="${event.player}"] .seat-active .seat-pokemon`))?.getBoundingClientRect(),targetRect=event.hits.length?locate(event.hits.find(hit=>hit.player!==event.player)||event.hits[0]):document.querySelector(`[data-seat-player]:not([data-seat-player="${event.player}"]) .seat-active .seat-pokemon`)?.getBoundingClientRect();
  dialog.style.setProperty('--impact-color',primary);
  if(event.kind==='attack'){const host=document.querySelector(`[data-seat-player="${event.player}"] .seat-active .seat-pokemon`),img=host?.querySelector('img');if(img&&!host.matches('[data-card-back="true"]')&&!img.src.includes('ilex-card-back')){const portrait=document.createElement('div');portrait.className='v2-attack-portrait';portrait.innerHTML='<img src="'+esc(img.getAttribute('src'))+'" alt="'+esc(event.pokemon||'Attacking Pokemon')+'"><span>ATTACK</span>';dialog.append(portrait);
    // Anchor the portrait to the visible table, using viewport coordinates like the attack canvas.
    const table=host.closest('.felt-table')?.getBoundingClientRect(),bounds={left:Math.max(16,table?.left||0),top:Math.max(16,table?.top||0),right:Math.min(innerWidth-16,table?.right||innerWidth),bottom:Math.min(innerHeight-16,table?.bottom||innerHeight)};
    const width=Math.min(170,Math.max(75,(sourceRect?.width||110)*1.15),Math.max(40,(bounds.right-bounds.left)*.55),Math.max(40,(bounds.bottom-bounds.top)/2.1));
    portrait.style.width=width+'px';
    const point=center(sourceRect),height=portrait.offsetHeight,pad=width*.12,clamp=(value,min,max)=>Math.max(min,Math.min(Math.max(min,max),value));
    portrait.style.left=clamp(point.x-width/2,bounds.left+pad,bounds.right-width-pad)+'px';
    portrait.style.top=clamp(point.y-height/2,bounds.top+pad,bounds.bottom-height-pad)+'px';}}
  const source=center(sourceRect),target=center(targetRect),length=Math.hypot(target.x-source.x,target.y-source.y),angle=Math.atan2(target.y-source.y,target.x-source.x),start=performance.now(),ms=duration(event.kind==='impact'?800:1250);let impacted=false;
  if(!reduced()&&event.kind==='attack')animateCard(document.querySelector(`[data-seat-player="${event.player}"] .seat-active .seat-pokemon`),[{translate:'0 0',scale:1},{translate:`${Math.cos(angle)*13}px ${Math.sin(angle)*13}px`,scale:1.06},{translate:'0 0',scale:1}],{duration:ms*.65,easing:'cubic-bezier(.2,.8,.2,1)'});
  const glow=(color,blur=12)=>{ctx.strokeStyle=color;ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=blur;};
  const circle=(x,y,r,color,width=1)=>{glow(color);ctx.lineWidth=width;ctx.beginPath();ctx.arc(x,y,Math.max(0,r),0,Math.PI*2);ctx.stroke();};
  const leaf=(x,y,size,rotation,color)=>{ctx.save();ctx.translate(x,y);ctx.rotate(rotation);glow(color,6);ctx.beginPath();ctx.moveTo(-size,0);ctx.quadraticCurveTo(0,-size*.8,size,0);ctx.quadraticCurveTo(0,size*.8,-size,0);ctx.fill();ctx.restore();};
  const line=(points,color,width)=>{glow(color);ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();points.forEach((point,i)=>i?ctx.lineTo(point.x,point.y):ctx.moveTo(point.x,point.y));ctx.stroke();};
  const impact=()=>{if(impacted)return;impacted=true;for(const hit of event.hits){const rect=locate(hit),point=center(rect);const el=document.createElement('span');el.className='impact-number'+(hit.amount<0?' heal':'');el.textContent=(hit.amount<0?'+':'')+Math.abs(hit.amount);el.style.left=point.x+'px';el.style.top=point.y+'px';dialog.append(el);if(!reduced()&&prefs().shake){const card=document.querySelector(`[data-slot-player="${hit.player}"][data-slot-kind="${hit.active?'active':'bench'}"][data-slot-index="${hit.index}"] .seat-pokemon`);animateCard(card,[{translate:'0 0'},{translate:'-4px 1px'},{translate:'4px -1px'},{translate:'-2px 0'},{translate:'0 0'}],{duration:250*speed()});}}};
  let finished=false;
  const finish=()=>{if(finished)return;finished=true;cancelAnimationFrame(frame);clearTimeout(timer);finishCurrent=null;resolve();};
  finishCurrent=finish;
  // Frames can stop (or a renderer can fail) without blocking committed gameplay.
  timer=setTimeout(finish,ms+500);
  if(reduced()){impact();circle(target.x,target.y,55,primary,2);clearTimeout(timer);timer=setTimeout(finish,ms);return;}
  const draw=now=>{
   if(token!==epoch){finish();return;}const t=Math.min(1,(now-start)/ms);ctx.clearRect(0,0,w,h);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1;
   // Deterministic presentation-time shapes never consume the match RNG.
   const flightFade=Math.min(1,Math.max(0,(.73-t)*6));
   // Charge sigil, elemental orbit and impact lighting use presentation time only.
   const charge=Math.max(0,1-t/.58);
   if(event.kind==='attack'&&charge>0){ctx.save();ctx.globalAlpha=charge*.65;ctx.translate(source.x,source.y);ctx.rotate(t*3);ctx.scale(1,.5);circle(0,0,36+t*115,secondary,1.5);ctx.setLineDash([7,12]);circle(0,0,52+t*95,primary,2);ctx.setLineDash([]);ctx.restore();for(let i=0;i<18;i++){const a=i*2.39996+t*9,r=(1-t/.7)*(28+(i%5)*13);ctx.globalAlpha=charge*.7;glow(i%3?primary:white,12);ctx.beginPath();ctx.arc(source.x+Math.cos(a)*r,source.y+Math.sin(a)*r,Math.max(.2,2.3*(1-t)),0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}
   const travel=Math.min(1,Math.max(0,(t-.12)/.45)),x=source.x+(target.x-source.x)*travel,y=source.y+(target.y-source.y)*travel;
   if(event.kind==='attack'&&t<.7){
    circle(source.x,source.y,18+Math.sin(t*8)*12,secondary,2);circle(source.x,source.y,40+t*28,primary,1);
    if(energy==='LIGHTNING'){
     if(t>.12){for(let branch=0;branch<3;branch++){const points=Array.from({length:13},(_,i)=>{const f=i/12,offset=i&&i<12?Math.sin(i*17+Math.floor(t*35)*3+branch*9)*22:0;return{x:source.x+(x-source.x)*f+Math.cos(angle+Math.PI/2)*offset,y:source.y+(y-source.y)*f+Math.sin(angle+Math.PI/2)*offset};});line(points,primary,branch?2:9);if(!branch)line(points,white,2);}}
    }else{
     for(let ribbon=0;ribbon<(energy==='DRAGON'?2:3);ribbon++){const points=Array.from({length:30},(_,i)=>{const f=Math.max(0,travel-i*.012),wave=Math.sin(f*13-t*15+ribbon*1.6)*Math.sin(f*Math.PI)*17;return{x:source.x+(target.x-source.x)*f+Math.cos(angle+Math.PI/2)*wave,y:source.y+(target.y-source.y)*f+Math.sin(angle+Math.PI/2)*wave};});ctx.globalAlpha=(.48-ribbon*.1)*flightFade;line(points,ribbon%2?secondary:primary,energy==='WATER'?11-ribbon*2:6-ribbon*1.5);}ctx.globalAlpha=1;
     if(t>.12){
      ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=flightFade;
      if(energy==='FIRE'){
       for(let plume=0;plume<7;plume++){const wave=Math.sin(t*24+plume*2.1),extent=40+plume*11;glow(plume%2?secondary:primary,12);ctx.globalAlpha=flightFade*(.5-plume*.05);ctx.beginPath();ctx.moveTo(16,0);ctx.quadraticCurveTo(-extent*.4,-12+wave*12,-extent,wave*18);ctx.quadraticCurveTo(-extent*.3,15+wave*8,16,0);ctx.fill();}
       glow(white,16);ctx.globalAlpha=flightFade;ctx.beginPath();ctx.ellipse(0,0,17,8,0,0,Math.PI*2);ctx.fill();
      }else if(energy==='WATER'){
       for(let wake=0;wake<5;wake++){ctx.globalAlpha=flightFade*(1-wake*.16);ctx.save();ctx.translate(-wake*18,Math.sin(t*18-wake)*8);ctx.scale(.35,1);circle(0,0,13+wake*3,wake%2?secondary:primary,2);ctx.restore();}glow(white,10);ctx.beginPath();ctx.ellipse(1,0,15,7,0,0,Math.PI*2);ctx.fill();
      }else if(energy==='GRASS'){
       for(let i=0;i<9;i++){const f=i/8;ctx.globalAlpha=flightFade*(1-f*.7);leaf(-f*100,Math.sin(t*19+i*1.9)*(8+f*18),5+(i%3)*2,t*8+i,i%2?primary:white);}circle(0,0,13,primary,2);
      }else if(energy==='PSYCHIC'||energy==='FAIRY'){
       for(let ring=0;ring<3;ring++){ctx.save();ctx.rotate(t*8+ring*Math.PI/3);ctx.scale(1,.35);circle(0,0,17+ring*6,ring===1?white:primary,1.8);ctx.restore();}glow(white,18);ctx.fillRect(-3,-3,6,6);
      }else if(energy==='METAL'||energy==='FIGHTING'){
       for(let shard=0;shard<7;shard++){const length=energy==='METAL'?36:21,offset=(shard-3)*8;glow(shard%3?primary:white,6);ctx.globalAlpha=flightFade*(shard%2?.6:.9);ctx.beginPath();ctx.moveTo(16-Math.abs(offset)*.4,offset);ctx.lineTo(-length-Math.abs(offset),offset-3);ctx.lineTo(-length*.6,offset+5);ctx.closePath();ctx.fill();}
      }else if(energy==='DARK'){
       for(let arc=0;arc<3;arc++){ctx.save();ctx.rotate(t*7+arc*2.1);glow(arc%2?primary:secondary,10);ctx.lineWidth=4-arc;ctx.beginPath();ctx.arc(0,0,17+arc*9,.2,Math.PI*1.4);ctx.stroke();ctx.restore();}
      }else if(energy==='DRAGON'){
       for(let helix=0;helix<2;helix++){const points=Array.from({length:20},(_,i)=>({x:-i*5,y:Math.sin(i*.45-t*17+helix*Math.PI)*16}));line(points,helix?secondary:primary,4);glow(white,14);ctx.beginPath();ctx.arc(0,points[0].y,5,0,Math.PI*2);ctx.fill();}
      }else{
       for(let wind=0;wind<3;wind++){ctx.save();ctx.translate(-wind*15,0);ctx.scale(.5,1);glow(wind%2?white:primary,8);ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,15+wind*7,-1.2,1.2);ctx.stroke();ctx.restore();}
      }
      ctx.restore();ctx.globalAlpha=1;
     }
    }
   }
   const burst=Math.min(1,Math.max(0,(t-(event.kind==='impact'?.12:.53))/.47));
   if(burst>0){impact();
    dialog.classList.add('cinema-landed');
    const halo=ctx.createRadialGradient(target.x,target.y,0,target.x,target.y,Math.max(1,50+burst*230));halo.addColorStop(0,white);halo.addColorStop(.18,primary);halo.addColorStop(.55,secondary+'66');halo.addColorStop(1,'transparent');ctx.globalAlpha=Math.max(0,1-burst)*.23;ctx.fillStyle=halo;ctx.shadowBlur=0;ctx.fillRect(target.x-300,target.y-300,600,600);
    ctx.save();ctx.translate(target.x,target.y);ctx.scale(1,.35);ctx.globalAlpha=(1-burst)*.6;circle(0,0,20+burst*260,primary,2);ctx.restore();
    for(let ray=0;ray<12;ray++){const a=ray*Math.PI/6+.2,r=20+burst*160;ctx.globalAlpha=(1-burst)*.5;line([{x:target.x+Math.cos(a)*r*.35,y:target.y+Math.sin(a)*r*.35},{x:target.x+Math.cos(a)*r,y:target.y+Math.sin(a)*r}],ray%3?primary:white,Math.max(.6,(1-burst)*2));}
    ctx.globalAlpha=Math.max(0,1-burst);circle(target.x,target.y,12+burst*100,primary,3);circle(target.x,target.y,burst*150,secondary,1);if(energy==='PSYCHIC'||energy==='DRAGON')for(let ring=0;ring<3;ring++){ctx.save();ctx.translate(target.x,target.y);ctx.rotate(t*4+ring);ctx.scale(1,.42);circle(0,0,35+burst*80+ring*13,ring%2?secondary:primary,2);ctx.restore();}
    // Bounded, type-specific debris keeps the cards visible beneath the impact.
    const count=energy==='FIRE'?56:energy==='WATER'?42:36;for(let i=0;i<count;i++){const a=i*2.39996,seed=(Math.sin(i*127.1)*43758.5453)%1,r=burst*(45+Math.abs(seed)*140),px=target.x+Math.cos(a)*r,py=target.y+Math.sin(a)*r+(energy==='FIRE'?-burst*70:energy==='WATER'?burst*60:0),size=(1-burst)*(2+Math.abs(seed)*5);glow(i%3?primary:white,9);ctx.globalAlpha=Math.max(0,1-burst)*(i%4?.7:1);
     if(energy==='GRASS'){ctx.save();ctx.translate(px,py);ctx.rotate(a+burst*3);ctx.beginPath();ctx.ellipse(0,0,size*2,size*.65,0,0,Math.PI*2);ctx.fill();ctx.restore();}
     else if(energy==='WATER'){circle(px,py,size,primary,1.5);}
     else if(energy==='METAL'||energy==='FIGHTING'||energy==='DARK'){line([{x:px,y:py},{x:px-Math.cos(a)*size*4,y:py-Math.sin(a)*size*4}],i%3?primary:white,Math.max(1,size*.5));}
     else{ctx.beginPath();ctx.arc(px,py,Math.max(.1,size),0,Math.PI*2);ctx.fill();}
    }
   }
   ctx.globalAlpha=1;ctx.shadowBlur=0;if(t<1)frame=requestAnimationFrame(safeDraw);else finish();
  };
  const safeDraw=now=>{try{draw(now);}catch(error){errors.push(error.message);if(errors.length>20)errors.shift();console.warn('Presentation skipped:',error.message);finish();}};
  frame=requestAnimationFrame(safeDraw);
 });}
 function manualCoin(result){const event={kind:'coin',results:[!!result],name:'Coin flip'};record(event);if(!prefs().effects||!['play','online'].includes(tab))return;lockedMatch=null;lockedViewer=null;queue.push(event);if(!running){running=true;document.body.classList.add('presentation-busy');const launchEpoch=epoch;requestAnimationFrame(()=>pump(launchEpoch));}}
 function update(value){state.presentationPreferences={...prefs(),...value};save();if(!prefs().effects)cancel();}
 function settings(){let d=document.getElementById('presentationSettings');if(!d){d=document.createElement('dialog');d.id='presentationSettings';d.className='presentation-options';document.body.append(d);}const p=prefs();d.innerHTML='<div class="row"><h2>Match presentation</h2><button aria-label="Close visual settings">×</button></div><p>Elemental attack effects and visible coin flips. Coin results always come from the game engine.</p><label><input type="checkbox" data-visual="effects" '+(p.effects?'checked':'')+'> Cinematic effects</label><label><input type="checkbox" data-visual="shake" '+(p.shake?'checked':'')+'> Card impact motion</label><label>Animation speed<select id="animationSpeed"><option value="normal">Cinematic</option><option value="fast">Fast</option></select></label><p>'+ (reduced()?'Your system’s reduced-motion setting is active. Flips and movement use a static result.':'Press Esc or Skip animation to return immediately to the match.')+'</p>';d.querySelector('button').onclick=()=>d.close();d.querySelectorAll('[data-visual]').forEach(input=>input.onchange=()=>update({[input.dataset.visual]:input.checked}));d.querySelector('select').value=p.speed;d.querySelector('select').onchange=e=>update({speed:e.target.value});d.showModal();}
 dialog.addEventListener('cancel',event=>{event.preventDefault();cancel();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&running)cancel();});window.addEventListener('resize',()=>{if(running)cancel();});motion.addEventListener('change',()=>{if(motion.matches&&running)cancel();});
 const header=document.querySelector('.header-tools');if(header){const button=document.createElement('button');button.id='visualsButton';button.textContent='Visuals';button.onclick=settings;header.prepend(button);}
 const previousRender=render;render=function(){if(running)cancel();previousRender();};
 let observedScene=null,fitFrame=0;
 const arenaObserver=new ResizeObserver(()=>scheduleFit());
 function scheduleFit(){cancelAnimationFrame(fitFrame);fitFrame=requestAnimationFrame(()=>fitArena(0));}
 function fitArena(pass){
  const scene=document.querySelector('.table-scene'),table=scene?.querySelector('.felt-table');if(!scene||!table||!scene.clientHeight)return;
  const bounds=table.getBoundingClientRect(),old=Number(table.style.getPropertyValue('--arena-scale'))||1;
  const scale=Math.max(.35,Math.min(1,old*Math.min((scene.clientHeight-8)/bounds.height,(scene.clientWidth-8)/bounds.width)));
  if(Math.abs(scale-old)>.003){table.style.setProperty('--arena-scale',scale.toFixed(4));if(pass<3)fitFrame=requestAnimationFrame(()=>fitArena(pass+1));}
 }
 function watchArena(){const scene=document.querySelector('.table-scene');if(scene!==observedScene){arenaObserver.disconnect();observedScene=scene;if(scene)arenaObserver.observe(scene);}scheduleFit();}
 const previousPlay=play;play=function(){previousPlay();watchArena();};watchArena();
 return {fitTable:watchArena,before,after,abort,noteCoin,manualCoin,cancel,settings,update,preferences:prefs,viewer,busy:()=>running,whenIdle:()=>running?new Promise(resolve=>waiters.push(resolve)):Promise.resolve(),diagnostics:()=>({busy:running,queued:queue.length,reduced:reduced(),events:history.slice(),errors:errors.slice()})};
})();
