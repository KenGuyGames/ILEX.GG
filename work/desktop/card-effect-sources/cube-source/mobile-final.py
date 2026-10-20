from pathlib import Path
p=Path('work/android-build/preview/main.cjs');s=p.read_text(encoding='utf-8');needle="  fs.writeFileSync(path.join(root,'mobile-verification.json')"
i=s.index(needle)
block="""  if(process.env.ILEX_ANDROID_CUBE_CHECKS==='1'){
   const sizes=[];await evalJS('cubeAssets');
   for(const [width,height] of [[800,360],[640,312],[360,800]]){
    await win.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});win.setContentSize(width,height);await wait(250);
    const report=await evalJS(fs.readFileSync(path.join(root,'../cube-review/cube-native-workflow.js'),'utf8'));checks.push(...report.checks.map(n=>n+' '+width+'x'+height));
    await evalJS('cubeDraftSetup();const f=document.querySelector("#cube-draft-start");f.elements.players.value="2";f.elements.packs.value="1";f.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));void 0');await wait(250);
    await evalJS('document.querySelector(".cube-pack button").scrollIntoView({block:"start"});window.scrollBy(0,-100)');await wait(150);
    const before=await evalJS('state.cubeDrafts.at(-1).pick'),point=await rect('.cube-pack button');await touch('touchStart',point.x,point.y);await wait(550);await touch('touchEnd',point.x,point.y);await wait(150);
    await check('document.querySelector("#cardmagnifier").open&&state.cubeDrafts.at(-1).pick==='+before,'Cube card long-press magnifies without drafting '+width+'x'+height);await evalJS('IlexMobile.back()');await wait(700);await tap('.cube-pack button');
    await check('state.cubeDrafts.at(-1).pick==='+String(before+1),'Cube tap drafts exactly one card '+width+'x'+height);
    await check('document.documentElement.scrollWidth<=Math.ceil(visualViewport.width)+1','Cube draft fits phone width '+width+'x'+height);
    fs.writeFileSync(path.join(root,'cube-'+width+'.png'),(await win.webContents.capturePage()).toPNG());sizes.push({width,height,...report});
   }
   fs.writeFileSync(path.join(root,'cube-mobile-tests.json'),JSON.stringify({passed:true,sizes,physicalAndroidDevice:false,engineSha256:require('crypto').createHash('sha256').update(fs.readFileSync(path.join(ui,'rules-engine.js'))).digest('hex')},null,2));
  }
"""
s=s[:i]+block+s[i:];p.write_text(s,encoding='utf-8')
