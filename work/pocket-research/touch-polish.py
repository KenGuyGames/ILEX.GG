from pathlib import Path
p=Path('work/pocket-candidate/ui/pocket-ui.js');s=p.read_text(encoding='utf-8').replace("async function screen(){\n", "async function screen(){\n  if(tab==='pocket')window.scrollTo(0,0);\n")
s=s.replace('class="pocket-hand">${p.hand.map(ref=>`<button draggable=', 'class="pocket-hand">${p.hand.map(ref=>`<button data-pocket-card="${ref.id}" draggable=')
s=s.replace("function selectEnergy(player){selected=", "function selectEnergy(player){if(!store().match.players[player].zone.current)return toast('No Energy has been generated this turn');selected=")
i=s.index(" document.addEventListener('keydown'")
s=s[:i]+''' let handHold=null,heldButton=null,holdPoint=null,suppressHandClick=null;
 document.addEventListener('pointerdown',e=>{if(tab!=='pocket'||e.pointerType!=='touch')return;const button=e.target.closest('[data-pocket-card]');if(!button)return;heldButton=button;holdPoint={x:e.clientX,y:e.clientY};clearTimeout(handHold);handHold=setTimeout(()=>{suppressHandClick=button;inspect(button.dataset.pocketCard);setTimeout(()=>{if(suppressHandClick===button)suppressHandClick=null},1000);},450);},{passive:true});
 document.addEventListener('pointermove',e=>{if(heldButton&&holdPoint&&Math.hypot(e.clientX-holdPoint.x,e.clientY-holdPoint.y)>10){clearTimeout(handHold);heldButton=null;}},{passive:true});
 for(const name of ['pointerup','pointercancel'])document.addEventListener(name,()=>{clearTimeout(handHold);heldButton=null;},{passive:true});
 document.addEventListener('click',e=>{if(suppressHandClick&&e.target.closest('[data-pocket-card]')===suppressHandClick){e.preventDefault();e.stopImmediatePropagation();suppressHandClick=null;}},true);
 document.addEventListener('pointermove',e=>{const tile=e.target.closest('.pocket-shine');if(!tile)return;const r=tile.getBoundingClientRect();tile.style.setProperty('--pocket-shine-x',((e.clientX-r.x)/r.width*100).toFixed(1)+'%');tile.style.setProperty('--pocket-shine-y',((e.clientY-r.y)/r.height*100).toFixed(1)+'%');},{passive:true});
''' +s[i:]
s=s.replace("s.botPaused=true;save();battleScreen()", "s.botPaused=true;save();if(typeof IlexAudio!=='undefined')IlexAudio.play('undo');battleScreen()")
p.write_text(s,encoding='utf-8')
p=Path('work/pocket-candidate/ui/pocket.css');s=p.read_text(encoding='utf-8')+'''
.pocket-shine:after{background:radial-gradient(ellipse at var(--pocket-shine-x,50%) var(--pocket-shine-y,35%),#f7ffd85e,transparent 38%),linear-gradient(115deg,transparent 25%,#d0ffd511 40%,#fcf7c144 50%,transparent 65%)}
.pocket-inspect{grid-template-columns:minmax(0,1fr) minmax(180px,.8fr)}
@media(max-width:700px) and (orientation:portrait){.pocket-inspect{grid-template-columns:1fr}}
@media(max-height:550px) and (orientation:landscape){.pocket-inspect{grid-template-columns:minmax(120px,34%) minmax(0,1fr)}}
''';p.write_text(s,encoding='utf-8')
p=Path('work/pocket-candidate/ui/pocket-engine.js');s=p.read_text(encoding='utf-8').replace("s.events.some(e=>e.type==='reveal'&&e.player===o.id&&e.cards.length===o.hand.length)", "s.events.some(e=>e.type==='reveal'&&e.player===o.id&&(e.privateTo===undefined||e.privateTo===player)&&e.cards.length===o.hand.length&&o.hand.every(r=>e.cards.includes(r.id)))")
p.write_text(s,encoding='utf-8')
