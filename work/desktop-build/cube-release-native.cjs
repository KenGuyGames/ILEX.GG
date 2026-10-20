const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),source=path.join(root,'work/desktop'),report=path.resolve(process.argv[2]);fs.mkdirSync(report,{recursive:true});process.argv.push('--self-test',report);
const self=path.join(source,'self-test.cjs');
require.cache[self]={id:self,filename:self,loaded:true,exports:async(win)=>{
 const ev=s=>win.webContents.executeJavaScript(s,true);for(let n=0;n<300;n++){if(await ev("typeof cubeAssets!=='undefined'&&rulesReady"))break;await new Promise(r=>setTimeout(r,100));}await ev('cubeAssets');
 const expected=path.join(report,'expected-draft.json');if(fs.existsSync(expected)){assert.equal(await ev('JSON.stringify(state.cubeDrafts)'),fs.readFileSync(expected,'utf8'));console.log('PASS exact saved cube draft restart');}
 const results=await ev(`(async()=>{
 const checks=[],check=(v,n)=>{if(!v)throw Error(n);checks.push(n)};
 document.querySelector('nav button[data-tab="cubes"]').click();await cubeScreen();
 check(tab==='cubes'&&document.querySelector('#cube-select'),'Cube Drafting opens from the main menu');
 const c=currentCube();check(CubeLibrary.active(c).length===640,'Bundled Zander Core has 640 playable entries');
 cubeDraftSetup();let f=document.querySelector('#cube-draft-start');check(!!f,'Draft setup opens');check(!f.elements.expansion,'Retired EXpansion is absent from new draft setup');f.elements.players.value='2';f.elements.packs.value='1';f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));await cubeScreen();
 let d=state.cubeDrafts.at(-1);check(d&&d.rules.players===2,'Local two-seat pod starts');check(document.querySelectorAll('.cube-pack button').length===16,'Seeded pack contains 16 visible choices');
 document.querySelector('.cube-pack button').click();await cubeScreen();d=state.cubeDrafts.at(-1);check(d.pools[0].length===1,'A visible card pick commits once');
 const original=JSON.stringify(d);deleteCubeDraft(d.id);document.querySelector('#draft-delete-cancel').click();check(JSON.stringify(state.cubeDrafts.at(-1))===original,'Cancel preserves draft');
 deleteCubeDraft(d.id);document.querySelector('#draft-delete-confirm').click();await cubeScreen();check(!state.cubeDrafts.some(x=>x.id===d.id),'Confirmed deletion removes only selected draft');check(state.deletedCubeDrafts.some(x=>x.draft.id===d.id),'Deleted session is recoverable');restoreDeletedDraft();await cubeScreen();check(JSON.stringify(state.cubeDrafts.find(x=>x.id===d.id))===original,'Restoration returns exact picks and packs');save();return checks;})()`);
 const mutant=await ev(fs.readFileSync(path.join(root,'work/cube-mutant-repair/browser-checks.js'),'utf8'));assert.equal(mutant.length,10);
 await new Promise(r=>setTimeout(r,2000));fs.writeFileSync(path.join(report,'cube-draft.png'),(await win.webContents.capturePage()).toPNG());
 fs.writeFileSync(expected,await ev('JSON.stringify(state.cubeDrafts)'));fs.writeFileSync(path.join(report,'native-result.json'),JSON.stringify({passed:true,checks:results,mutantChecks:mutant,restored:fs.existsSync(path.join(report,'first-pass.json'))},null,2));fs.writeFileSync(path.join(report,'first-pass.json'),'true');console.log('PASS Cube Drafting setup/pick/delete/restore and ten mutant native checks');
}};
require(path.join(source,'main.cjs'));
