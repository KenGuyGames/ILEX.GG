from pathlib import Path
import shutil
p=Path('work/pocket-candidate/ui/pocket-ui.js');s=p.read_text(encoding='utf-8');s=s.replace("const local=m.spec.opponent!=='bot'||p.id===0,acting=", "if(m.phase==='setup'&&p.ready)return `<section class=\"pocket-player pocket-setup-player pocket-ready\"><div class=\"row\"><strong>${esc(p.name)}</strong><span>Ready · Cards face down</span></div><div class=\"pocket-ready-cards\"><img src=\"ilex-card-back.svg\" alt=\"Active Pokemon face down\">${p.bench.map(()=>'<img src=\"ilex-card-back.svg\" alt=\"Benched Pokemon face down\">').join('')}</div></section>`;\n  const local=m.spec.opponent!=='bot'||p.id===0,acting=")
s=s.replace('<section class="pocket-player"><div class="row">', '<section class="pocket-player ${m.phase===\'setup\'?\'pocket-setup-player\':\'\'}"><div class="row">')
s=s.replace("heldButton=button;holdPoint=", "suppressHandClick=null;heldButton=button;holdPoint=")
p.write_text(s,encoding='utf-8')
p=Path('work/pocket-candidate/ui/pocket.css');s=p.read_text(encoding='utf-8')+'''
.pocket-battle-mode .pocket-setup-player{grid-template-rows:24px minmax(0,1fr)}.pocket-setup-player>.pocket-field,.pocket-setup-player>p{display:none}.pocket-battle-mode .pocket-setup-player>.pocket-hand{grid-row:2;align-items:center;gap:12px}.pocket-battle-mode .pocket-setup-player>.pocket-hand button{flex:0 1 100px;height:90%;max-height:170px;min-width:36px}.pocket-ready-cards{display:flex;justify-content:center;align-items:center;height:100%;gap:10px}.pocket-ready-cards img{height:80%;max-height:130px;max-width:90px;border-radius:5px}
@media(max-height:550px) and (orientation:landscape){.pocket-battle-mode .pocket-setup-player{grid-template-rows:18px minmax(0,1fr)}.pocket-battle-mode .pocket-setup-player>.pocket-hand button{max-height:85px;flex-basis:62px}.pocket-ready-cards img{max-height:80px;max-width:57px}}
''';p.write_text(s,encoding='utf-8')
for name in ['pocket-ui.js','pocket.css','pocket-engine.js','pocket-model.js','pocket-cards.json','pocket-sets.json']:
 shutil.copy2(Path('work/pocket-candidate/ui')/name,Path('work/android-build/build/assets/ui')/name)
