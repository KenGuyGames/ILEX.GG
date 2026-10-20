const fs=require('fs'),path=require('path'),crypto=require('crypto');
module.exports=async(win,root,run)=>{
 const checks=[],check=(v,n)=>{if(!v)throw Error(n);checks.push(n)},wait=ms=>new Promise(r=>setTimeout(r,ms));await run('cubeAssets');await win.webContents.debugger.attach('1.3');await win.webContents.debugger.sendCommand('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
 const tap=async selector=>{await run(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'})`);const p=await run(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);for(const type of ['touchStart','touchEnd'])await win.webContents.debugger.sendCommand('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x:p.x,y:p.y,id:1,radiusX:2,radiusY:2,force:1}]});await wait(150);};
 for(const [width,height] of [[640,312],[360,800]]){
  await win.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});win.setContentSize(width,height);await wait(200);
  await run('(async()=>{state.cubes=CubeLibrary.clone(cubeBuiltins);state.cubeDrafts=[];activeCubeId=state.cubes[0].id;tab="cubes";render();await cubeScreen()})()');
  check(await run('currentCube().entries.length===1283&&currentCube().entries.every(e=>e.id&&ruleMap[e.id])'),'All cube and EXpansion printings available '+width);
  check(await run('(()=>{const c=CubeLibrary.clone(currentCube());c.entries.find(e=>e.key==="Pokemon:Y10").id=null;c.entries.find(e=>e.key==="Pokemon:X7").id=null;return CubeLibrary.repairPrintings(c,cubeBuiltins[0],ruleMap,cardMetadata)===2&&c.entries.every(e=>e.id)})()'),'Saved Greninja and Urshifu repair on mobile '+width);
  await run('cubeDraftSetup();void 0');await run('(()=>{const f=document.querySelector("#cube-draft-start");f.elements.players.value="2";f.elements.packs.value="1";f.elements.expansion.checked=true})()');
  await tap('#cube-draft-start button.primary');check(await run('state.cubeDrafts.at(-1)?.expansion&&state.cubeDrafts.at(-1).rounds[0].grants.flat().length===72'),'Touch starts full EXpansion without printing error '+width);
  await tap('.cube-pack button');check(await run('state.cubeDrafts.at(-1).pick===1'),'First touch draft pick resolves '+width);
  check(await run('document.documentElement.scrollWidth<=Math.ceil(visualViewport.width)+1'),'EXpansion controls fit mobile '+width);
 }
 return {passed:true,checks,errors:[],physicalAndroidDevice:false,hashes:Object.fromEntries(['cube-library.js','cube-ui.js','cube-presets.json'].map(n=>[n,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'build/assets/ui',n))).digest('hex')]))};
};
