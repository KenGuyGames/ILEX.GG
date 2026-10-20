const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'../..');
function edit(file,fn){const p=path.join(root,file);fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));}
edit('work/desktop/ui/app.js',s=>s.replace('<div class="hero-icon" aria-hidden="true"><img src="forest-guardian.svg" alt=""></div>','<div class="hero-icon celebi-prime"><img src="scans/c1122ffa3645e338fa0fce57.webp" alt="Celebi Prime — Triumphant 92/102"><span>Celebi Prime · Triumphant</span></div>'));
edit('work/desktop/rules-self-test.cjs',s=>s.replace("naturalWidth===320,'Guardian illustration'","naturalWidth>0&&document.querySelector('.hero-icon img').getAttribute('src')==='scans/c1122ffa3645e338fa0fce57.webp','Celebi Prime scan'").replace('leaf emblem and guardian illustration render','leaf emblem and Celebi Prime scan render'));
edit('work/desktop-build/run-test.cjs',s=>s.replace('desktop-ilex-tests-v1','desktop-ilex-celebi-tests-v1'));
edit('work/desktop-build/package-ilex.py',s=>s.replace('desktop-ilex-tests-v1','desktop-ilex-celebi-tests-v1').replace('an original guardian illustration','the Celebi Prime scan from Triumphant (92/102)'));
const dest=path.join(root,'outputs/ILEX.GG-win32-x64/resources/app');
for(const f of ['app.js','ilex-theme.css'])fs.copyFileSync(path.join(root,'work/desktop/ui',f),path.join(dest,'ui',f));
fs.copyFileSync(path.join(root,'work/desktop/rules-self-test.cjs'),path.join(dest,'self-test.cjs'));
console.log('Celebi Prime installed');
