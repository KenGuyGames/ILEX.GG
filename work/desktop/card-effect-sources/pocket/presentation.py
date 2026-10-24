from pathlib import Path
p=Path('work/pocket-candidate/ui/presentation.js');s=p.read_text(encoding='utf-8');s=s.replace("return element?.getBoundingClientRect();", "return (element||document.querySelector(`[data-pocket-drop=\"${row.player}:${row.active?0:(row.index||0)+1}\"]`))?.getBoundingClientRect();")
i=s.index(' function manualCoin(')
s=s[:i]+''' function pocket(events){if(tab!=='pocket')return;events.forEach(record);if(!prefs().effects||document.hidden||!events.length)return;lockedMatch=null;lockedViewer=null;queue.push(...events);if(!running){running=true;document.body.classList.add('presentation-busy');const launchEpoch=epoch;requestAnimationFrame(()=>pump(launchEpoch));}}
''' +s[i:];s=s.replace('noteCoin,manualCoin,cancel','noteCoin,manualCoin,pocket,cancel');p.write_text(s,encoding='utf-8')
p=Path('work/pocket-candidate/ui/audio.js');s=p.read_text(encoding='utf-8').replace("function scene(){return ","function scene(){if(tab==='pocket'&&state.pocket?.match&&!['setup','finished'].includes(state.pocket.match.phase)&&typeof PocketUI!=='undefined'&&PocketUI.isBattle())return 'battle';return ");p.write_text(s,encoding='utf-8')
p=Path('work/pocket-candidate/ui/pocket-ui.js');s=p.read_text(encoding='utf-8')
s=s.replace("if(tab!=='pocket')return;$('#crumb')", "document.body.classList.toggle('pocket-battle-mode',tab==='pocket'&&section==='battle'&&!!store().match);if(typeof IlexAudio!=='undefined')IlexAudio.sync();if(tab!=='pocket')return;$('#crumb')")
s=s.replace("const s=store(),m=s.match,host=$('#pocket-content');", "const s=store(),m=s.match,host=$('#pocket-content');document.body.classList.toggle('pocket-battle-mode',!!m);if(typeof IlexAudio!=='undefined')IlexAudio.sync();")
s=s.replace('function act(action,bot=false){safely(()=>{const s=store();s.match=rules.apply(s.match,action);', 'function act(action,bot=false){safely(()=>{if(typeof IlexPresentation!==\'undefined\'&&IlexPresentation.busy())return;const s=store(),before=s.match;s.match=rules.apply(s.match,action);')
s=s.replace("selected=null;battleScreen()});}", "selected=null;battleScreen();present(before,s.match,action)});}")
i=s.index(' function undo(){');s=s[:i]+''' function present(before,after,action){
  const events=[],coins=after.events.filter(e=>e.type==='coin').map(e=>e.heads);if(coins.length)events.push({kind:'coin',results:coins,name:'Pocket coin flip'});
  const attack=after.events.find(e=>e.type==='attack'),hits=after.events.filter(e=>['damage','abilityDamage'].includes(e.type)).map(e=>{for(const owner of before.players){const all=rules.slots(owner),l=all.find(t=>t.key===e.target);if(l)return {player:owner.id,active:owner.active===l,index:owner.bench.indexOf(l),amount:e.amount,name:rules.top(l).name};}return null}).filter(Boolean);
  const source=before.players[action.player]?.active,c=rules.top(source);if(attack||hits.length)events.push({kind:attack?'attack':'impact',player:action.player,pokemon:c?.name,name:attack?.name||'Card effect',energy:({Darkness:'DARK'})[c?.subtype]||c?.subtype?.toUpperCase()||'COLORLESS',hits,waiting:!!after.prompt});
  const kos=after.events.filter(e=>e.type==='knockout');if(kos.length)events.push({kind:'knockout',names:kos.map(e=>data.byId.get(e.card).name)});
  if(after.phase==='finished')events.push({kind:'victory',name:after.winner==='tie'?'Tie':after.players[after.winner].name});
  if(typeof IlexAudio!=='undefined'){IlexAudio.play(({attack:'attack',energy:'energy',trainer:'trainer',ability:'ability',retreat:'retreat',pass:'turn'})[action.type]||'card');if(hits.length)IlexAudio.play('hit',.15);}
  if(typeof IlexPresentation!=='undefined'){clearTimeout(botTimer);IlexPresentation.pocket(events);IlexPresentation.whenIdle().then(()=>{if(store().match===after)scheduleBot()});}
 }
''' +s[i:]
s=s.replace("clearTimeout(botTimer);const s=store();s.match=rules.undo", "clearTimeout(botTimer);if(typeof IlexPresentation!=='undefined')IlexPresentation.cancel();const s=store();s.match=rules.undo")
s=s.replace("m.phase==='finished'||document.hidden", "m.phase==='finished'||document.hidden||(typeof IlexPresentation!=='undefined'&&IlexPresentation.busy())")
s=s.replace("stopReveals();clearTimeout(botTimer);oldRender();", "document.body.classList.remove('pocket-battle-mode');stopReveals();clearTimeout(botTimer);oldRender();")
s=s.replace('assets,screen,inspect,',"assets,isBattle:()=>section==='battle',screen,inspect,")
p.write_text(s,encoding='utf-8')
p=Path('work/pocket-candidate/ui/pocket.css');s=p.read_text(encoding='utf-8')+'''
/* Keep both players and their controls within the landscape table. */
.pocket-battle-mode #app{padding:12px 22px;max-width:none}.pocket-battle-mode #app>.heading{display:none}
.pocket-battle-mode .pocket-tabs{margin-bottom:8px;padding:6px 10px;min-height:0}.pocket-battle-mode #pocket-content>.toolbar{padding:6px 10px;margin-bottom:8px;min-height:0}
.pocket-battle-mode .pocket-table{height:calc(100dvh - 202px);grid-template-columns:1fr;grid-template-rows:1fr 1fr;gap:8px;padding:8px;position:relative;overflow:hidden}
.pocket-battle-mode .pocket-player{grid-column:1;grid-row:auto;display:grid;grid-template-rows:26px minmax(0,1fr) 56px;padding:5px;min-height:0}
.pocket-battle-mode .pocket-player:first-child{grid-row:1}.pocket-battle-mode .pocket-player:last-child{grid-row:2}
.pocket-battle-mode .pocket-field{flex-direction:row;gap:40px;min-height:0;margin:4px 0}.pocket-battle-mode .pocket-slot{width:clamp(40px,calc((100dvh - 350px)*.16),112px);min-height:0;height:100%;max-height:190px;aspect-ratio:.72}
.pocket-battle-mode .pocket-active{width:clamp(48px,calc((100dvh - 350px)*.2),135px)}.pocket-battle-mode .pocket-bench{height:85%;gap:12px}
.pocket-battle-mode .pocket-hand{min-height:0;height:100%;overflow:hidden}.pocket-battle-mode .pocket-hand button{height:100%;width:auto;flex:0 1 40px;min-width:25px}.pocket-battle-mode .pocket-hand img{height:100%;width:100%;object-fit:contain}
.pocket-battle-mode .pocket-stadium{position:absolute;left:12px;top:50%;transform:translateY(-50%);z-index:2;flex-direction:column}.pocket-battle-mode .pocket-stadium img{width:48px}
.pocket-battle-mode .pocket-choice{position:fixed;bottom:12px;left:50%;transform:translateX(-50%);max-width:90vw;box-shadow:0 10px 40px #0009}.pocket-battle-mode .pocket-revealed{position:fixed;right:16px;bottom:14px;z-index:20;max-width:40vw}
@media(max-height:550px) and (orientation:landscape){
 .pocket-battle-mode #app{padding:4px 10px}.pocket-battle-mode .pocket-tabs{padding:2px 5px;margin-bottom:3px}.pocket-battle-mode .pocket-tabs button{font-size:11px;padding:4px 8px;min-height:26px}
 .pocket-battle-mode #pocket-content>.toolbar{padding:2px 5px;margin-bottom:3px;font-size:11px}.pocket-battle-mode #pocket-content>.toolbar button{padding:3px 8px;font-size:10px;min-height:25px}
 .pocket-battle-mode .pocket-table{height:calc(100dvh - 133px);gap:3px;padding:3px;border-radius:10px}.pocket-battle-mode .pocket-player{grid-template-rows:20px minmax(0,1fr) 28px;padding:2px;gap:2px}
 .pocket-battle-mode .pocket-field{gap:24px;margin:1px 0}.pocket-battle-mode .pocket-slot{width:clamp(30px,10vh,48px);max-height:75px}.pocket-battle-mode .pocket-active{width:clamp(36px,12vh,58px)}.pocket-battle-mode .pocket-player .row{font-size:9px;gap:4px;flex-wrap:nowrap}.pocket-battle-mode .pocket-player .row button{font-size:9px;padding:2px 4px;min-height:18px}.pocket-battle-mode .pocket-slot span{font-size:7px;padding:1px}.pocket-battle-mode .pocket-stadium img{width:30px}.pocket-battle-mode .pocket-stadium button{font-size:8px;padding:2px}
}
''';p.write_text(s,encoding='utf-8')
