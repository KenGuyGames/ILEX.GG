const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const desktop=path.join(root,'work/desktop');
const deployed=path.join(root,'outputs/TCG Lab-win32-x64/resources/app');
for(const folder of [desktop,deployed]){
  let js=fs.readFileSync(path.join(folder,'ui/app.js'),'utf8');
  js=js.replace('function download(name,data){let a=',"function download(name,data){if(window.desktop){window.desktop.exportJSON(name,data).then(ok=>{if(ok)toast('Export saved')}).catch(e=>toast('Export failed: '+e.message));return}let a=");
  fs.writeFileSync(path.join(folder,'ui/app.js'),js);
  let css=fs.readFileSync(path.join(folder,'ui/style.css'),'utf8');
  css=css.replace(/^@import[^\n]+\n/,"@font-face{font-family:'DM Sans';src:url('fonts/DM-Sans.ttf') format('truetype');font-weight:100 1000;font-display:swap}@font-face{font-family:'Space Grotesk';src:url('fonts/Space-Grotesk.ttf') format('truetype');font-weight:300 700;font-display:swap}\n");
  fs.writeFileSync(path.join(folder,'ui/style.css'),css);
}
for(const name of ['main.cjs','preload.cjs','self-test.cjs'])fs.copyFileSync(path.join(desktop,name),path.join(deployed,name));
console.log('Desktop native exports ready');
