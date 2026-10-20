const fs=require('fs'),path=require('path');
module.exports=async(win,root)=>{
 const run=s=>win.webContents.executeJavaScript(s,true);
 for(let i=0;i<200;i++){if(await run("typeof DeckSort!=='undefined'&&rulesReady&&cards.length>23700"))break;await new Promise(r=>setTimeout(r,100));}
 const report=await run(`(()=>{
  const timings={},measure=(name,fn)=>{const start=performance.now();const value=fn();timings[name]=performance.now()-start;return value;};
  const ids=Object.keys(state.decks[0].cards),sample=state.decks.slice(0,10);
  measure('lookup5000Ms',()=>{for(let i=0;i<5000;i++)find(ids[i%ids.length]);});
  state.deckFormatFilter='';tab='decks';measure('firstOpenMs',()=>render());
  measure('switch10Ms',()=>{for(const deck of sample){activeDeck=deck.id;decks();}});
  const formats=state.formats.filter(f=>f.allowEquivalentPrintings&&f.sets);
  const chosen=formats.find(f=>/2004/.test(f.name))||formats[0]||state.formats[0];
  state.deckFormatFilter=chosen.id;
  const visible=measure('filterColdMs',()=>visibleDecks());measure('filterWarmMs',()=>visibleDecks());
  measure('filteredSwitch3Ms',()=>{for(const deck of visible.slice(0,3)){activeDeck=deck.id;decks();}});
  return {timings,format:chosen.name,deckCount:state.decks.length,visible:visible.length,entries:cards.length};
 })()`);
 fs.writeFileSync(path.join(root,'deck-performance.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
};
