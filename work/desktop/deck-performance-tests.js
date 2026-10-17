(()=>{
 const checks=[],check=(v,n)=>{if(!v)throw Error(n);checks.push(n);};
 const original={decks:state.decks,formats:state.formats,custom:state.custom,filter:state.deckFormatFilter,metadata:cardMetadata},timings={};
 try{
  const actual=state.formats.filter(f=>f.allowEquivalentPrintings&&f.sets).slice(0,3);
  for(const f of actual){state.deckFormatFilter=f.id;const expected=state.decks.filter(d=>!deckFormatIssues(d,f,id=>find(id)?.custom?find(id):cardMetadata[id]||detailCache[id]).length).map(d=>d.id);const start=performance.now();const ids=visibleDecks().map(d=>d.id);timings[f.name]=performance.now()-start;check(JSON.stringify(ids)===JSON.stringify(expected),'Cached format results match fresh legality: '+f.name);check(JSON.stringify(visibleDecks().map(d=>d.id))===JSON.stringify(expected),'Warm cache returns identical decks: '+f.name);}
  const f={id:'perf-test',name:'Cache test',size:60,copies:4,sets:'',banned:'',custom:true},d={id:'cache-deck',cards:{'base1-43':4,'bw1-106':56}};
  state.formats=[f];state.decks=[d];state.custom=[];state.deckFormatFilter=f.id;
  const visible=()=>visibleDecks().includes(d);
  check(visible()&&visible(),'Valid deck survives repeated cached queries');
  d.cards['base1-43']=3;check(!visible(),'Quantity edit invalidates compatibility');d.cards['base1-43']=4;check(visible(),'Restoring quantity restores compatibility');
  f.banned='Abra';check(!visible(),'Ban edit invalidates compatibility');f.banned='';check(visible(),'Removing ban restores compatibility');
  f.sets='bw1';check(!visible(),'Set-pool edit invalidates compatibility');f.sets='';
  const custom={id:'custom-perf',custom:true,name:'Cache Basic',category:'Pokemon',stage:'Basic'};state.custom=[custom];d.cards={'custom-perf':4,'bw1-106':56};check(visible(),'Custom Basic deck can be cached');f.banned='Forbidden';custom.name='Forbidden';check(!visible(),'In-place custom-card edit invalidates compatibility');custom.name='Cache Basic';check(visible(),'Custom card restoration is reflected');
  state.custom=[];check(!visible(),'Deleting custom card removes stale compatibility');
  d.cards={'perf-unloaded':4,'bw1-106':56};check(!visible(),'Unresolved details are initially rejected');detailCache['perf-unloaded']={name:'Loaded Basic',category:'Pokemon',stage:'Basic'};check(visible(),'Newly loaded details are not trapped in a stale negative cache');delete detailCache['perf-unloaded'];
  d.cards={'base1-43':4,'bw1-106':56};check(visible(),'Baseline deck restored');f.banned='Blocked';cardMetadata={...cardMetadata,'base1-43':{...cardMetadata['base1-43'],name:'Blocked'}};check(!visible(),'Replacement metadata invalidates compatibility');
  const transient={id:'perf-index-card',name:'Index fixture'};cards.push(transient);check(find(transient.id)===transient,'Card lookup indexes appended catalog cards');cards.pop();check(!find(transient.id),'Card lookup removes deleted catalog cards');
  const unique={name:'Unique Cache Trainer',category:'Trainer',subtypes:['Item']};cardMetadata={...original.metadata,'perf-equivalent':unique};const equivalent={sets:'none',allowEquivalentPrintings:true,allowedPrintingIds:['perf-equivalent']};check(limitlessPrintingAllowed('perf-other',unique,equivalent,['none']),'Equivalent-printing signature is cached');equivalent.allowedPrintingIds[0]='base1-43';check(!limitlessPrintingAllowed('perf-other',unique,equivalent,['none']),'In-place allowed-printing edits refresh equivalent signatures');
  return {passed:true,checks,timings};
 }finally{state.decks=original.decks;state.formats=original.formats;state.custom=original.custom;state.deckFormatFilter=original.filter;cardMetadata=original.metadata;delete detailCache['perf-unloaded'];}
})()
