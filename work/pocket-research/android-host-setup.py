from pathlib import Path
import shutil
p=Path('work/pocket-candidate/ui/pocket-ui.js');s=p.read_text(encoding='utf-8').replace("botTimer=null;", "botTimer=null,hostPaused=false;",1)
s=s.replace("if(tab!=='pocket'||section!=='packs'||document.hidden", "if(tab!=='pocket'||section!=='packs'||document.hidden||hostPaused")
s=s.replace("m.phase==='finished'||document.hidden||", "m.phase==='finished'||document.hidden||hostPaused||")
s=s.replace("m.events.some(e=>e.type==='reveal')", "m.events.some(e=>e.type==='reveal'&&(e.privateTo===undefined||e.privateTo===0||m.spec.opponent!=='bot'))")
s=s.replace("m.events.filter(e=>e.type==='reveal').flatMap", "m.events.filter(e=>e.type==='reveal'&&(e.privateTo===undefined||e.privateTo===0||m.spec.opponent!=='bot')).flatMap")
i=s.index(' function go(next)');s=s[:i]+''' function setHostPaused(value){hostPaused=!!value;if(hostPaused){stopReveals();clearTimeout(botTimer);clearTimeout(handHold);if(tab==='pocket'&&typeof IlexPresentation!=='undefined')IlexPresentation.cancel();}else if(tab==='pocket'){if(section==='packs')startReveals();if(section==='battle'&&store().match)scheduleBot();}}
''' +s[i:]
s=s.replace('assets,isBattle:', 'assets,setHostPaused,isBattle:')
p.write_text(s,encoding='utf-8')
r=Path('work');candidate=r/'pocket-candidate';shutil.copy2(r/'cube-candidate/MainActivity.java',candidate/'MainActivity.java');shutil.copy2(r/'cube-candidate/mobile-host.js',candidate/'mobile-host.js')
p=candidate/'AndroidManifest.xml';s=(r/'cube-candidate/AndroidManifest.xml').read_text(encoding='utf-8').replace('versionCode="41"','versionCode="42"').replace('1.22.0-android.41','1.23.0-android.42');p.write_text(s,encoding='utf-8')
p=candidate/'mobile.js';s=(r/'android-build/mobile.js').read_text(encoding='utf-8').replace('IlexAudio.setHostPaused(value)}',"IlexAudio.setHostPaused(value);if(typeof PocketUI!=='undefined')PocketUI.setHostPaused(value)}");p.write_text(s,encoding='utf-8')
