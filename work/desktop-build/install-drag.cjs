const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),source=path.join(root,'work/desktop'),dest=path.join(root,'outputs/ILEX.GG-win32-x64/resources/app');
const index=path.join(source,'ui/index.html');let html=fs.readFileSync(index,'utf8');
if(!html.includes('tabletop-drag.js'))html=html.replace('<script src="tabletop.js"></script>','<script src="tabletop.js"></script><script src="tabletop-drag.js"></script>');
fs.writeFileSync(index,html);
for(const file of ['index.html','tabletop-drag.js','tabletop.css'])fs.copyFileSync(path.join(source,'ui',file),path.join(dest,'ui',file));
fs.copyFileSync(path.join(source,'main.cjs'),path.join(dest,'main.cjs'));
fs.copyFileSync(path.join(source,'rules-self-test.cjs'),path.join(dest,'self-test.cjs'));
fs.copyFileSync(path.join(source,'tabletop-drag-tests.js'),path.join(dest,'tabletop-drag-tests.js'));
