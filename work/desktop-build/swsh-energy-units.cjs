const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../..'),src=path.join(root,'work/cube-source/src');
let changed=0;
function patch(file){const s=fs.readFileSync(file,'utf8'),next=s.replace(/StateUtils\.getProvidesUnitCount\((\w+)\.provides\)/g,'StateUtils.getProvidesUnitCount($1.provides,$1)');if(next!==s){fs.writeFileSync(file,next);changed++;}}
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isDirectory())walk(file);else if(e.name.endsWith('.ts')&&!e.name.endsWith('-data.ts'))patch(file);}}
walk(src);for(const file of ['bot-ai.js','rules-match.js'])patch(path.join(root,'work/desktop/ui',file));
console.log('Updated energy-unit readers in '+changed+' files');
