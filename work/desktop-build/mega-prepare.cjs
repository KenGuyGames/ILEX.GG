const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../..'),published='C:/Users/Kenneth/Documents/Codex/2026-10-13/ta/work/source-1.18.0-private.1',out=path.join(root,'work/mega-source');
if(!fs.existsSync(path.join(out,'src')))fs.cpSync(path.join(published,'work/cube-source/src'),path.join(out,'src'),{recursive:true});
const ui=path.join(root,'work/mega-candidate/ui');if(!fs.existsSync(ui))fs.cpSync(path.join(root,'work/desktop/ui'),ui,{recursive:true});
console.log('Isolated corrected release source and candidate UI prepared.');
