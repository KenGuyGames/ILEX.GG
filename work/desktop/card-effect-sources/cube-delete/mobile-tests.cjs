const fs=require('fs'),path=require('path'),crypto=require('crypto');
module.exports=async(win,root,run)=>{
 const checks=[],check=(v,n)=>{if(!v)throw Error(n);checks.push(n)},wait=ms=>new Promise(r=>setTimeout(r,ms));
 await run('cubeAssets');await win.webContents.debugger.attach('1.3');await win.webContents.debugger.sendCommand('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
 const tap=async selector=>{await run(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'})`);const p=await run(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);for(const type of ['touchStart','touchEnd'])await win.webContents.debugger.sendCommand('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x:p.x,y:p.y,id:1,radiusX:2,radiusY:2,force:1}]});await wait(150);};
 const proof=[];for(const [width,height] of [[640,312],[360,800]]){
  await win.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});win.setContentSize(width,height);await wait(200);
  await run('state.cubes=CubeLibrary.clone(cubeBuiltins);state.deletedCubes=[];state.cubeDrafts=[];activeCubeId=state.cubes[0].id;');
  const native=await run(fs.readFileSync(path.join(root,'../cube-delete/workflow.js'),'utf8'));proof.push({width,height,checks:native});
  await run('(async()=>{state.cubes=CubeLibrary.clone(cubeBuiltins);activeCubeId=state.cubes[0].id;await cubeScreen()})()');
  await tap('[onclick="deleteCube()"]');check(await run('document.querySelector("#modal").open'),'Touch opens delete confirmation '+width);
  await tap('#cube-delete-confirm');check(await run('state.cubes.length===0'),'Touch confirms deletion '+width);
  await tap('[onclick="restoreDeletedCube()"]');check(await run('state.cubes.length===1'),'Touch restores a deleted cube '+width);
  check(await run('document.documentElement.scrollWidth<=Math.ceil(visualViewport.width)+1'),'Cube controls fit mobile width '+width);
  fs.writeFileSync(path.join(root,'../cube-delete/mobile-'+width+'.png'),(await win.webContents.capturePage()).toPNG());
 }
 return {passed:true,checks,proof,physicalAndroidDevice:false,cubeUiSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'build/assets/ui/cube-ui.js'))).digest('hex')};
};
