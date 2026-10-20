const fs=require('fs'),path=require('path'),crypto=require('crypto');
module.exports=async(win,root,run)=>{
 const checks=[],check=(v,n)=>{if(!v)throw Error(n);checks.push(n)},wait=ms=>new Promise(r=>setTimeout(r,ms));await run('cubeAssets');await win.webContents.debugger.attach('1.3');await win.webContents.debugger.sendCommand('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
 const tap=async selector=>{await run(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'})`);const p=await run(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);for(const type of ['touchStart','touchEnd'])await win.webContents.debugger.sendCommand('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x:p.x,y:p.y,id:1,radiusX:2,radiusY:2,force:1}]});await wait(150);};
 for(const [width,height] of [[640,312],[360,800]]){
  await win.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});win.setContentSize(width,height);await wait(200);
  checks.push(...(await run(fs.readFileSync(path.join(root,'../cube-mutant-repair/browser-checks.js'),'utf8'))).map(n=>n+' '+width));
  await run(`(async()=>{const c=CubeLibrary.clone(cubeBuiltins[0]);state.cubes=[c];state.cubeDrafts=[CubeLibrary.createDraft(c,{players:2,packsPerPlayer:1,seed:5},cardMetadata)];state.activeCubeDraftId=state.cubeDrafts[0].id;state.deletedCubeDrafts=[];activeCubeId=c.id;tab='cubes';render();await cubeScreen()})()`);
  await tap('button[onclick^="deleteCubeDraft"]');check(await run('document.querySelector("#draft-delete-confirm")!==null'),'Delete draft opens confirmation '+width);
  await tap('#draft-delete-cancel');check(await run('state.cubeDrafts.length===1&&!state.deletedCubeDrafts.length'),'Touch cancel keeps draft '+width);
  await tap('button[onclick^="deleteCubeDraft"]');await tap('#draft-delete-confirm');check(await run('state.cubeDrafts.length===0&&state.deletedCubeDrafts.length===1'),'Touch deletes last saved draft '+width);
  check(await run('state.cubes.length===1'),'Deleting draft keeps cube '+width);
  await tap('button[onclick="restoreDeletedDraft()"]');check(await run('state.cubeDrafts.length===1&&!state.deletedCubeDrafts.length'),'Touch restores deleted draft '+width);
  check(await run('document.documentElement.scrollWidth<=Math.ceil(visualViewport.width)+1'),'Imported cube controls fit mobile '+width);
 }
 return {passed:true,checks,errors:[],physicalAndroidDevice:false,hashes:Object.fromEntries(['rules-engine.js'].map(n=>[n,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'build/assets/ui',n))).digest('hex')]))};
};
