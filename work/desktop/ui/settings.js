/* Shared settings use the existing persisted audio/presentation preferences. */
var IlexSettings=(()=>{
 const tools=document.querySelector('.header-tools');
 for(const id of ['audioButton','visualsButton'])document.getElementById(id).hidden=true;
 const button=document.createElement('button');button.id='settingsButton';button.textContent='Settings';tools.prepend(button);
 const workspace=document.querySelector('.menu-workspace');const panel=document.createElement('dialog');panel.id='ilexSettings';document.body.append(panel);panel.append(workspace);
 function open(){
  workspace.remove();
  IlexAudio.settings();const source=document.getElementById('audioSettings');source.close();const options=source.querySelector('#audioTrack').innerHTML;
  let d=document.getElementById('ilexSettings');if(!d){d=document.createElement('dialog');d.id='ilexSettings';document.body.append(d);}
  const audio=IlexAudio.preferences(),visual=IlexPresentation.preferences();
  d.innerHTML='<div class="row"><h2>Settings</h2><button data-close aria-label="Close settings">×</button></div><section><h3>Audio</h3><button data-enable>Enable audio / resume playback</button><p data-status aria-live="polite"></p>'+[['music','Music'],['effects','Sound effects'],['muted','Mute all audio']].map(([k,l])=>'<label><input type="checkbox" data-audio="'+k+'" '+(audio[k]?'checked':'')+'> '+l+'</label>').join('')+[['musicVolume','Music volume'],['effectsVolume','Effect volume']].map(([k,l])=>'<label>'+l+' <output>'+Math.round(audio[k]*100)+'%</output><input type="range" aria-label="'+l+'" min="0" max="100" value="'+Math.round(audio[k]*100)+'" data-audio="'+k+'"></label>').join('')+'<label>Music selection<select data-track>'+options+'</select></label><button data-preview>Preview sound effect</button></section><section><h3>Visuals</h3>'+[['effects','Cinematic effects'],['shake','Card impact motion']].map(([k,l])=>'<label><input type="checkbox" data-visual="'+k+'" '+(visual[k]?'checked':'')+'> '+l+'</label>').join('')+'<label>Animation speed<select data-speed><option value="normal">Cinematic</option><option value="fast">Fast</option></select></label></section>';
  const section=document.createElement('section');section.className='settings-workspace';section.innerHTML='<h3>Workspace</h3>';section.append(workspace);d.append(section);
  d.querySelector('[data-close]').onclick=()=>d.close();d.querySelector('[data-track]').value=audio.track;d.querySelector('[data-speed]').value=visual.speed;
  d.querySelectorAll('[data-audio]').forEach(i=>i.oninput=()=>{IlexAudio.update({[i.dataset.audio]:i.type==='checkbox'?i.checked:+i.value/100});if(i.type==='range')i.previousElementSibling.textContent=i.value+'%';});
  d.querySelectorAll('[data-visual]').forEach(i=>i.onchange=()=>IlexPresentation.update({[i.dataset.visual]:i.checked}));
  d.querySelector('[data-track]').onchange=e=>IlexAudio.update({track:e.target.value});d.querySelector('[data-speed]').onchange=e=>IlexPresentation.update({speed:e.target.value});
  d.querySelector('[data-enable]').onclick=async()=>{d.querySelector('[data-status]').textContent=await IlexAudio.unlock()?'Audio enabled':'Audio is unavailable or paused.';};d.querySelector('[data-preview]').onclick=async()=>{await IlexAudio.unlock();IlexAudio.play('energy');};d.showModal();
 }
 button.onclick=open;document.documentElement.classList.remove('ilex-booting');return {open};
})();
