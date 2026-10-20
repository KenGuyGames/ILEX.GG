const fs=require('fs'),path=require('path'),crypto=require('crypto');
module.exports=async(win,root,run)=>{
 const checks=[],check=(v,n)=>{if(!v)throw Error(n);checks.push(n)},wait=ms=>new Promise(r=>setTimeout(r,ms));await run('cubeAssets');await win.webContents.debugger.attach('1.3');await win.webContents.debugger.sendCommand('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
 const tap=async selector=>{await run(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'})`);const p=await run(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);for(const type of ['touchStart','touchEnd'])await win.webContents.debugger.sendCommand('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x:p.x,y:p.y,id:1,radiusX:2,radiusY:2,force:1}]});await wait(150);};
 for(const [width,height] of [[640,312],[360,800]]){
  await win.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});win.setContentSize(width,height);await wait(200);
  await run(`(async()=>{const c=CubeLibrary.clone(cubeBuiltins[0]);state.cubes=[c];state.cubeDrafts=[];activeCubeId=c.id;tab='cubes';render();await cubeScreen()})()`);
  await run('cubeDraftSetup();void 0');check(await run('!document.querySelector("#cube-draft-start").elements.expansion'),'No EXpansion option '+width);await run('(()=>{const f=document.querySelector("#cube-draft-start");f.elements.players.value="2";f.elements.packs.value="1"})()');
  await tap('#cube-draft-start button.primary');check(await run('state.cubeDrafts.at(-1)?.rounds[0].packs.flat().length===32'),'Touch starts imported draft without printing error '+width);
  check(await run('(()=>{const d=state.cubeDrafts.at(-1),p=d.rounds[0].packs[0];return !d.expansion&&p.filter(e=>cardMetadata[e.id].category==="Pokemon"&&cardMetadata[e.id].stage==="Basic").length===5&&p.filter(e=>cardMetadata[e.id].category==="Pokemon"&&cardMetadata[e.id].stage!=="Basic").length===5&&p.filter(e=>cardMetadata[e.id].category!=="Pokemon").length===6&&!d.rounds.some(r=>r.packs.flat().some(e=>CubeLibrary.isExpansion(e,cardMetadata)))})()'),'Exact5/5/6 and no EXpansion '+width);
  check(await run('ruleMap["ckcc-44142"]&&cardMetadata["ckcc-44142"].category==="Trainer"&&!!find("ckcc-44142")'),'X Attack printing and native rule registered '+width);
  check(await run('(async()=>{const i=new Image();i.src="cube-x-attack.webp";await i.decode();return i.naturalWidth===746})()'),'Offline X Attack artwork decodes '+width);
  await tap('.cube-pack button');check(await run('state.cubeDrafts.at(-1).pick===1'),'First touch draft pick resolves '+width);
  check(await run('document.documentElement.scrollWidth<=Math.ceil(visualViewport.width)+1'),'Imported cube controls fit mobile '+width);
 }
 return {passed:true,checks,errors:[],physicalAndroidDevice:false,hashes:Object.fromEntries(['cube-library.js','cube-ui.js','rules-engine.js','rules-card-map.json','card-details.json','cards.json','cube-x-attack.webp'].map(n=>[n,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'build/assets/ui',n))).digest('hex')]))};
};
