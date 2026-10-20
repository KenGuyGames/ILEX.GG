const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),source=path.join(root,'work/desktop'),dest=path.join(root,'outputs/ILEX.GG-win32-x64/resources/app');
const index=path.join(source,'ui/index.html');let html=fs.readFileSync(index,'utf8');
if(!html.includes('bot-ai.js'))html=html.replace('<script src="rules-match.js"></script>','<script src="rules-match.js"></script><script src="bot-ai.js"></script>');
if(!html.includes('bot-ui.js'))html=html.replace('<script src="tabletop-drag.js"></script>','<script src="tabletop-drag.js"></script><script src="bot-ui.js"></script>');fs.writeFileSync(index,html);
for(const file of ['index.html','rules-engine.js','rules-match.js','rules-ui.js','rules-card-map.json','card-details.json','deck-set-codes.json','rules-coverage.json','wotc-coverage.json','RULES-SOURCES.md','tabletop.js','tabletop-drag.js','tabletop.css','bot-ai.js','bot-ui.js'])fs.copyFileSync(path.join(source,'ui',file),path.join(dest,'ui',file));
for(const [src,out] of [['rules-self-test.cjs','self-test.cjs'],['tabletop-drag-tests.js','tabletop-drag-tests.js'],['bot-ui-tests.js','bot-ui-tests.js']])if(fs.existsSync(path.join(source,src)))fs.copyFileSync(path.join(source,src),path.join(dest,out));
