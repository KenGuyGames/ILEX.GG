/* Finish identity is separate from the underlying playable card ID. */
var FinishCatalog=(()=>{
 let sourceCards,sourceMetadata,sourceSets,index=new Map(),packIndex=new Map();
 function refresh(){
  if(sourceCards===cards&&sourceMetadata===cardMetadata&&sourceSets===sets)return;
  sourceCards=cards;sourceMetadata=cardMetadata;sourceSets=sets;index=new Map();packIndex=new Map();
  const add=(id,finish)=>{if(!index.has(id))index.set(id,new Set());index.get(id).add(finish);};
  // The actual generator pools are authoritative for booster availability.
  for(const p of PackModel.build(cards,sets,cardMetadata)){
   const pack=new Map();packIndex.set(p.id,pack);
   const record=(id,f)=>{if(!pack.has(id))pack.set(id,new Set());pack.get(id).add(f);};
   if(p.reverse)for(const id of p.pools.reverse)record(id,'reverse');
   for(const f of PackModel.parallelFinishes.slice(1))for(const id of p.pools[f]||[])record(id,f);
   if(/^ecard[23]$/.test(p.id))for(const id of p.pools.secret)record(id,'reverse');
   if(p.reverse)for(const id of p.pools.reverse)add(id,'reverse');
   for(const finish of PackModel.parallelFinishes.slice(1))for(const id of p.pools[finish]||[])add(id,finish);
   if(/^ecard[23]$/.test(p.id))for(const id of p.pools.secret)add(id,'reverse');
  }
  // Positively recorded supplemental printings remain browsable without entering packs.
  for(const id of PackFinishes.reverse)if(find(id)&&!/^ecard[23]-H/i.test(id))add(id,'reverse');
  for(const [id,record] of Object.entries(PackFinishes.special))if(find(id)){
   if(id.startsWith('me02.5-')&&!record.plainReverse)index.get(id)?.delete('reverse');
   for(const finish of PackModel.parallelFinishes.slice(1))if(record[finish])add(id,finish);
  }
 }
 function finishes(id){refresh();return [...(index.get(id)||[])];}
 function entries(pool,filter='base',packId=''){
  if(filter==='base')return pool;
  return pool.flatMap(c=>{
   const variants=finishes(c.id).filter(f=>(!packId||packIndex.get(packId)?.get(c.id)?.has(f))&&(filter==='all'||filter==='reverse-all'||filter==='scanned'&&!!PackFinish.scan(c.id,f)||f===filter)).map(f=>({...c,_finish:f}));
   return filter==='all'?[c,...variants]:variants;
  });
 }
 function controls(value){return `<label>Printing finish<select id="finishfilter" aria-label="Printing finish">${[['base','Base printings'],['all','All printings and finishes'],['reverse-all','All reverse holo finishes'],['scanned','Original finish images'],...PackModel.parallelFinishes.map(f=>[f,PackFinish.label(f)])].map(([key,label])=>`<option value="${key}" ${key===value?'selected':''}>${esc(label)}</option>`).join('')}</select></label>`;}
 function attrs(c){return c._finish?`data-preview-src="${esc(image(c))}" data-preview-name="${esc(c.name+' · '+PackFinish.label(c._finish))}" data-preview-finish="${c._finish}" data-preview-card="${esc(c.id)}" data-preview-energy="${esc(cardMetadata[c.id]?.types?.[0]||'Colorless')}"`:'';}
 function layer(c){return c._finish?PackFinish.layer(c._finish,cardMetadata[c.id]?.types?.[0],c.id):'';}
 function packHas(set,id){refresh();return !!packIndex.get(set)?.has(id);}
 function browse(set){setFilter=set||'';galleryPackFilter=set||'';galleryFinishFilter='reverse-all';query='';page=0;customOnly=false;tab='library';window.render();}
 return {finishes,entries,controls,attrs,layer,browse,packHas};
})();
