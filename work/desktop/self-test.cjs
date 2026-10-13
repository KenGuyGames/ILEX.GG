const fs=require('node:fs');
const path=require('node:path');
module.exports=async(win,root)=>{
  const evaluate=code=>win.webContents.executeJavaScript(code,true);
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  let loaded=false;
  for(let i=0;i<100;i++){
    loaded=await evaluate("typeof cards!=='undefined' && cards.length===23736 && document.querySelectorAll('.card').length===36");
    if(loaded)break;
    await wait(100);
  }
  if(!loaded)throw Error('Card library did not load');
  const persistence=await evaluate("localStorage.getItem('desktop-test-marker')");
  if(persistence){
    const saved=await evaluate("({decks:state.decks.length,custom:state.custom.length,formats:state.formats.length,game:!!state.game})");
    if(saved.decks!==1 || saved.custom!==1 || saved.formats!==3 || !saved.game)throw Error('Workspace did not persist across launches');
    fs.writeFileSync(path.join(root,'persistence.json'),JSON.stringify({passed:true,saved},null,2));
    return;
  }
  const library=await evaluate(`(async()=>{
    const images=[...document.querySelectorAll('.card img')];
    images.forEach(im=>im.loading='eager');
    await Promise.all(images.map(im=>im.decode()));
    if(images.length!==36 || images.some(im=>!im.naturalWidth))throw Error('Library image failed');
    const manifest=await (await fetch('scan-manifest.json')).json();
    const sources={};
    for(const [id,m] of Object.entries(manifest))if(!sources[m.source]){
      const im=new Image();im.src=m.file;await im.decode();
      if(!im.naturalWidth)throw Error('Source scan did not load: '+id);
      sources[m.source]={id,width:im.naturalWidth,height:im.naturalHeight};
    }
    if(Object.keys(sources).length!==9)throw Error('Missing source coverage');
    if(image({id:'base1-4'})!==find('base1-4').scan)throw Error('Detail image fallback failed');
    const traversal=await fetch('tcglab://app/%2e%2e%5cpackage.json');
    if(traversal.status!==404)throw Error('Protocol path containment failed');
    return {cards:cards.length,visibleImages:images.length,sources,nodeIntegration:typeof require!=='undefined'};
  })()`);
  if(library.nodeIntegration)throw Error('Renderer Node integration enabled');
  await wait(200);
  fs.writeFileSync(path.join(root,'desktop-preview.png'),(await win.webContents.capturePage()).toPNG());
  const offline=await evaluate(`(async()=>{
    const originalFetch=window.fetch;window.fetch=(u,...args)=>String(u).startsWith('https://api.tcgdex.net')?Promise.reject(Error('Offline test')):originalFetch(u,...args);
    await inspect('base1-4');await document.querySelector('#modalbody img').decode();
    const result=document.querySelector('#modalbody').textContent.includes('Scan available offline');
    window.fetch=originalFetch;document.querySelector('#modal').close();
    if(!result)throw Error('Offline scan inspector failed');return true;
  })()`);
  const workspace=await evaluate(`(()=>{
    newDeck();const f=document.querySelector('#newdeck');f.elements.name.value='Desktop test deck';f.requestSubmit();
    if(state.decks.length!==1||state.decks[0].name!=='Desktop test deck')throw Error('Deck creation dialog failed');
    addCard('base1-4');if(state.decks[0].cards['base1-4']!==1)throw Error('Deck add failed');
    tab='custom';render();const cf=document.querySelector('#cf');cf.elements.name.value='Desktop test custom';cf.elements.attack.value='Test attack';cf.requestSubmit();
    if(state.custom.length!==1)throw Error('Custom card form failed');
    tab='formats';render();const ff=document.querySelector('#ff');ff.elements.name.value='Desktop test format';ff.elements.custom.checked=true;ff.requestSubmit();
    if(state.formats.length!==3)throw Error('Format form failed');
    state.decks[0].cards['base1-4']=60;tab='play';render();startGame();
    let p=state.game.players[0];if(p.hand.length!==7||p.prizes.length!==6||p.deck.length!==47)throw Error('Opening deal failed');
    draw(0);takePrize(0);if(p.hand.length!==9||p.prizes.length!==5)throw Error('Draw or prize failed');
    selected={i:0,z:'hand',uid:p.hand[0].uid};move(0,'active');if(p.active.length!==1)throw Error('Move failed');
    damage(0,'active',p.active[0].uid);let df=document.querySelector('#damageform');df.elements.damage.value=30;df.elements.status.value='Poisoned';df.requestSubmit();
    if(p.active[0].damage!==30||p.active[0].status!=='Poisoned')throw Error('Counters failed');
    save();localStorage.setItem('desktop-test-marker','saved');
    document.querySelector('#backup').click();
    return {deckDialog:true,customCards:true,formats:true,openingDeal:true,draw:true,prizes:true,movement:true,counters:true};
  })()`);
  for(let i=0;i<100 && !fs.existsSync(path.join(root,'tcg-lab-workspace.json'));i++)await wait(100);
  if(!fs.existsSync(path.join(root,'tcg-lab-workspace.json')))throw Error('JSON export failed');
  const exported=JSON.parse(fs.readFileSync(path.join(root,'tcg-lab-workspace.json'),'utf8'));
  if(exported.decks.length!==1||exported.custom.length!==1)throw Error('Exported workspace incorrect');
  fs.writeFileSync(path.join(root,'desktop-tests.json'),JSON.stringify({passed:true,library,offlineInspector:offline,workspace,export:true,electron:process.versions.electron,platform:process.platform,architecture:process.arch},null,2));
};
