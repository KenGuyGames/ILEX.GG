/* A read-only travel journal, derived from the campaign's existing checkpoints. */
var StoryChronicle = (() => {
 'use strict';
 const chapterArt = [0,4,7,10,13,16,19,22,25,28,31,34,37];
 const reflections = [
  ['fragment','A small piece of something that did not belong in the forest. You kept it because small things can be evidence.'],
  ['book','Two accounts, side by side. A blank page is allowed to remain blank.'],
  ['book','Routes written down where a change of mind cannot erase them. There is room in the margins for disagreement.'],
  ['book','Paper that was meant to stay out of sight. Keeping it means refusing to make the missing pages look tidy.'],
  ['book','Names, carefully kept. A register can hold a question open long after the world has stopped asking.'],
  ['bell','A bell is a small promise: someone will hear, and someone will answer.'],
  ['compass','Made for a return journey. The cord has room for another knot.'],
  ['fragment','Heavy in your hand. Whatever it once held together, it now has to be carried by someone.'],
  ['book','Moments placed in order, without smoothing away the spaces between them.'],
  ['leaf','A memory can belong to you without being all of you. Leave room beside it for the day you are having now.'],
  ['beacon','A signal to come back to. You do not have to carry the whole distance alone.'],
  ['compass','Many hands, many small tasks. The lines meet without becoming a single line.'],
  ['leaf','No glow. No miracle to demonstrate. Just a leaf, and the next afternoon.']
 ];
 const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const iconPaths = {
  book:'M12 9h12c4 0 8 3 8 6v38c-2-4-6-6-11-6h-9zm40 0H40c-4 0-8 3-8 6v38c2-4 6-6 11-6h9z M18 20h7m-7 8h7m14-8h7m-7 8h7',
  bell:'M18 40c4-5 4-10 4-17a10 10 0 0 1 20 0c0 7 0 12 4 17z M14 45h36M27 49a5 5 0 0 0 10 0M30 10V6h4v4',
  compass:'M32 7a25 25 0 1 0 0 50 25 25 0 0 0 0-50z M42 22l-6 14-14 6 6-14z M32 7v5m0 40v5M7 32h5m40 0h5',
  fragment:'M23 9l19 4 10 21-17 20-23-8 5-22z M23 9l5 22 24 3M28 31l7 23M17 24l11 7-16 15',
  leaf:'M50 10C21 9 11 24 16 40c6 15 29 10 34-30z M13 53l28-30M23 42l-1-13m8 6 12 1',
  beacon:'M27 31h10l5 22H22z M32 31V17M27 19a7 7 0 0 1 10 0M21 13a15 15 0 0 1 22 0M15 7a23 23 0 0 1 34 0M18 57h28'
 };
 function icon(kind){return `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="${iconPaths[kind]||iconPaths.leaf}"/></svg>`;}
 function art(index,backdrop){if(index===0&&!Number.isInteger(backdrop))return "--chronicle-art:url('story-environments/forest-trail-v2.png');--chronicle-size:cover;--chronicle-x:50%;--chronicle-y:50%";const n=backdrop??(chapterArt[index]||0);return `--chronicle-art:url('story-environments/atlas-${Math.floor(n/6)+1}.png');--chronicle-x:${n%2*100}%;--chronicle-y:${Math.floor(n%6/2)*50}%`;}
 function describe(content, progress){
  if(!content?.chapters?.[progress?.chapter]||!Array.isArray(progress.completed)||!Array.isArray(progress.keepsakes))return null;
  const completed=new Set(progress.completed), reached=content.chapters.slice(0,progress.chapter+1);
  const chapters=reached.map((ch,index)=>{
   const current=index===progress.chapter, finished=!current||progress.cleared;
   const path=current?ch.paths.find(r=>r.id===progress.path):ch.paths.find(r=>r.missions.some(m=>completed.has(`${ch.id}/${r.id}/${m.id}`)));
   const scenes=[];
   const add=(id,title,lines,count=lines.length)=>{const available=lines.slice(0,Math.max(0,count));if(available.length)scenes.push({id,title,lines:available.map(l=>({speaker:l.speaker,text:l.text}))});};
   const awaitingEra=current&&progress.phase==='intro'&&progress.line===0&&!progress.eraBriefings?.includes(ch.id);
   add('arrival','Arrival',ch.intro,finished||progress.phase!=='intro'?ch.intro.length:awaitingEra?0:progress.line+1);
   if(path)path.missions.forEach((m,mi)=>{
    const won=completed.has(`${ch.id}/${path.id}/${m.id}`), active=current&&mi===progress.mission;
    if(won||active&&['brief','after','outro','complete'].includes(progress.phase)){
     add(m.id+'-before',m.title+' · Before the battle',m.before,active&&progress.phase==='brief'&&!progress.battle?progress.line+1:m.before.length);
     if(won)add(m.id+'-after',m.title+' · After the battle',m.after,active&&progress.phase==='after'?progress.line+1:m.after.length);
    }
   });
   if(finished||current&&progress.phase==='outro')add('farewell','At the shrine',ch.outro,finished?ch.outro.length:progress.line+1);
   return {index,backdrop:ch.backdrop,id:ch.id,title:ch.title,year:ch.displayYear,location:ch.location,format:ch.format,current,finished,path:path?{name:path.name,companion:path.companion}:null,won:path?path.missions.filter(m=>completed.has(`${ch.id}/${path.id}/${m.id}`)).length:0,total:path?.missions.length||0,scenes,keepsake:progress.keepsakes.includes(ch.keepsake)?{name:ch.keepsake,kind:reflections[index][0],reflection:ch.reflection||reflections[index][1]}:null};
  });
  const ch=content.chapters[progress.chapter],path=ch.paths.find(r=>r.id===progress.path),mission=path?.missions[progress.mission];
  let objective='Find your bearings in '+ch.location+'.',label='Your next step';
  if(progress.cleared){label='Home, at last';objective='The afternoon continues. Revisit the people and moments you carried home.';}
  else if(progress.battle){label='A battle is waiting';objective='Return to '+(mission?.title||'your saved battle')+'. Your place at the table is saved.';}
  else if(progress.phase==='choice')objective='Choose the companion and deck you will travel with through this era.';
  else if(progress.phase==='brief')objective='Continue '+(mission?.title||'your briefing')+(path?' with '+path.companion:'')+'.';
  else if(progress.phase==='after')objective='Take a breath after '+(mission?.title||'the battle')+'. Hear what happens next.';
  else if(progress.phase==='outro')objective='Stay for the farewell. There is still something to carry with you.';
  return {chapters,chapter:chapters.at(-1),objective,label,keepsakes:chapters.filter(c=>c.keepsake),battles:chapters.reduce((n,c)=>n+c.won,0),cleared:!!progress.cleared};
 }
 function recap(content,progress){
  const d=describe(content,progress);if(!d)return '';
  const c=d.chapter;
  return `<section class="chronicle-resume" aria-label="Your journey"><span class="chronicle-resume-mark" aria-hidden="true">${icon(d.cleared?'leaf':'compass')}</span><div><span class="eyebrow">${escape(d.label)}</span><p>${escape(d.objective)}</p><span class="chronicle-resume-meta">${c.path?escape(c.path.name)+' · ':''}${d.battles} ${d.battles===1?'battle':'battles'} won · ${d.keepsakes.length} ${d.keepsakes.length===1?'keepsake':'keepsakes'}</span></div><button onclick="StoryChronicle.open()">Open journal <span aria-hidden="true">↗</span></button></section>`;
 }
 let selected=0,section='journey';
 function current(){return typeof IlexStoryContent==='undefined'||typeof StoryMode==='undefined'?null:describe(StoryMode.content(),StoryMode.progress());}
 function open(){const d=current();if(!d)return;selected=d.chapter.index;section='journey';modal(markup(d));document.querySelector('#modal').scrollTop=0;document.querySelector('.chronicle-close')?.focus({preventScroll:true});}
 function select(index){const d=current();if(!d||!d.chapters.some(c=>c.index===index))return;selected=index;section='journey';paint(d);document.querySelector('#modal').scrollTop=0;document.getElementById('chronicle-detail-title')?.focus({preventScroll:true});}
 function show(value){if(!['journey','keepsakes'].includes(value))return;section=value;const d=current();if(d)paint(d);document.querySelector('#modal').scrollTop=0;document.querySelector(`[data-chronicle-section="${section}"]`)?.focus({preventScroll:true});}
 function paint(d){const el=document.querySelector('#modalbody');if(el&&document.querySelector('.story-chronicle'))el.innerHTML=markup(d);}
 function markup(d){
  const c=d.chapters.find(c=>c.index===selected)||d.chapter;
  return `<section class="story-chronicle" aria-labelledby="chronicle-title"><header class="chronicle-header"><div><span class="eyebrow">THE THINGS WE CARRY</span><h2 id="chronicle-title">Your journey</h2><p>Places found. Words remembered. A way back.</p></div><button class="chronicle-close" onclick="document.querySelector('#modal').close()" aria-label="Close journey journal">Close <span aria-hidden="true">×</span></button></header><div class="chronicle-tabs" aria-label="Journal sections"><button data-chronicle-section="journey" aria-pressed="${section==='journey'}" onclick="StoryChronicle.show('journey')">The journey <span>${d.chapters.length}</span></button><button data-chronicle-section="keepsakes" aria-pressed="${section==='keepsakes'}" onclick="StoryChronicle.show('keepsakes')">Keepsakes <span>${d.keepsakes.length}</span></button></div>${section==='keepsakes'?keepsakeMarkup(d):journeyMarkup(d,c)}<p class="chronicle-footnote">Only places and words you have reached appear here. Reading the journal keeps your campaign at its saved moment.</p></section>`;
 }
 function journeyMarkup(d,c){
  return `<div class="chronicle-layout"><nav class="chronicle-map" aria-label="Discovered eras">${d.chapters.map(ch=>`<button class="chronicle-era ${ch.index===c.index?'is-selected':''}" style="${art(ch.index,ch.backdrop)}" aria-pressed="${ch.index===c.index}" onclick="StoryChronicle.select(${ch.index})"><span class="chronicle-era-number">${String(ch.index+1).padStart(2,'0')}</span><span class="chronicle-era-copy"><small>${escape(ch.year)} · ${ch.current&&!d.cleared?'YOU ARE HERE':'REMEMBERED'}</small><strong>${escape(ch.title)}</strong><span>${escape(ch.location)}</span></span></button>`).join('')}</nav><div class="chronicle-detail"><div class="chronicle-landscape" style="${art(c.index)}"><div><span class="eyebrow">CHAPTER ${c.index+1} · ${escape(c.year)}</span><h3 id="chronicle-detail-title" tabindex="-1">${escape(c.title)}</h3><p>${escape(c.location)}</p></div></div>${c.current?`<section class="chronicle-objective"><span class="eyebrow">${escape(d.label)}</span><p>${escape(d.objective)}</p></section>`:''}<div class="chronicle-route"><span>${c.path?escape(c.path.name)+' · With '+escape(c.path.companion):'Your path is still to be chosen.'}</span>${c.total?`<strong>${c.won} / ${c.total} battles won</strong>`:''}</div>${c.keepsake?`<div class="chronicle-keepsake-inline">${icon(c.keepsake.kind)}<span>A keepsake from this era<strong>${escape(c.keepsake.name)}</strong></span></div>`:''}<section class="chronicle-memories" aria-label="Words remembered"><h4>Words remembered</h4><p>Open a moment to read it again.</p>${c.scenes.length?c.scenes.map((scene,i)=>`<details class="chronicle-memory"><summary><span>${String(i+1).padStart(2,'0')}</span>${escape(scene.title)}<small>${scene.lines.length} ${scene.lines.length===1?'line':'lines'}</small></summary><div class="chronicle-transcript">${scene.lines.map(l=>`<div class="chronicle-remembered-line ${l.speaker==='Narrator'?'is-narrator':''}"><strong>${escape(l.speaker)}</strong><p>${escape(l.text)}</p></div>`).join('')}</div></details>`).join(''):'<p class="chronicle-empty">Your first page is waiting. Enter this era to begin remembering.</p>'}</section></div></div>`;
 }
 function keepsakeMarkup(d){
  return `<div class="chronicle-collection-intro"><span class="eyebrow">A PLACE IN YOUR PACK</span><h3>Small things. Entire worlds.</h3><p>What you brought with you from the places you helped.</p></div>${d.keepsakes.length?`<div class="chronicle-keepsakes">${d.keepsakes.map(c=>`<article class="chronicle-keepsake"><div class="chronicle-object">${icon(c.keepsake.kind)}<span aria-hidden="true">${String(c.index+1).padStart(2,'0')}</span></div><div><span class="eyebrow">${escape(c.year)} · ${escape(c.location)}</span><h4>${escape(c.keepsake.name)}</h4><p>${escape(c.keepsake.reflection)}</p><button onclick="StoryChronicle.select(${c.index})">Remember this place <span aria-hidden="true">↗</span></button></div></article>`).join('')}</div>`:'<div class="chronicle-empty-collection">'+icon('leaf')+'<h4>Room for what matters.</h4><p>Keepsakes will appear here as your journey unfolds.</p></div>'}`;
 }
 return {describe,recap,open,select,show};
})();
