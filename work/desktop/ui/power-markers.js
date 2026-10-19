/* Public once-per-game counters. Availability never inspects a player's deck. */
const PowerMarkers=(()=>{
 const cache=new Map(),faces=new WeakMap();let metadataIdentity;
 function available(format,metadata){
  if(metadataIdentity!==metadata){cache.clear();metadataIdentity=metadata;}
  const key=JSON.stringify(format||{});if(cache.has(key))return cache.get(key);
  const pool=String(format?.sets||'').split(',').map(x=>x.trim()).filter(Boolean),bans=String(format?.banned||'').toLowerCase().split(',').map(x=>x.trim());
  const result={gx:false,vstar:false};
  for(const [id,c] of Object.entries(metadata||{})){
   if(bans.includes(id.toLowerCase())||bans.includes(String(c.name).toLowerCase()))continue;
   const inPool=pool.some(token=>id.startsWith(token+'-')||(!/\d$/.test(token)&&id.startsWith(token)));
   if(pool.length&&!inPool&&!(format.allowedPrintingIds||[]).includes(id)&&!(format.allowEquivalentPrintings&&limitlessPrintingAllowed(id,c,format,pool.map(t=>/\d$/.test(t)?t+'-':t))))continue;
   if(/(?:-|\s)GX\b/i.test(c.name||'')||(c.attacks||[]).some(a=>/GX\s*$/i.test(a.name||'')))result.gx=true;
   if(/VSTAR\b/i.test(c.name||'')||/^(Forest|Sky|Earthen) Seal Stone$/.test(c.name||''))result.vstar=true;
   if(result.gx&&result.vstar)break;
  }
  cache.set(key,result);return result;
 }
 function render(player,match,metadata){
  const format=match.spec.format?.markerRules||match.spec.format;
  // Old saves stored only the format ID. Resolve it without reading hidden cards.
  const resolved=format&&Object.hasOwn(format,'sets')?format:state.formats.find(f=>f.id===format?.id);
  if(!resolved)return '';
  const eligible=available(resolved,metadata);let previous=faces.get(match);if(!previous){previous=new Map();faces.set(match,previous);}
  return `<div class="power-markers" aria-label="${esc(player.name)} once-per-game markers">${['gx','vstar'].filter(k=>eligible[k]).map(k=>{
   const used=!!player[k==='gx'?'usedGX':'usedVSTAR'],label=k==='gx'?'GX':'VSTAR';
   const key=player.id+':'+k,changed=previous.has(key)&&previous.get(key)!==used;previous.set(key,used);
   return `<div class="power-marker ${k} ${changed?'marker-changed':''} ${used?'is-used':''}" role="img" aria-label="${label}: ${used?'used':'available'}" title="${label} ${used?'used':'available'}" data-power-marker="${k}" data-marker-player="${player.id}" data-used="${used}"><span class="marker-turn"><span class="marker-face marker-front">${label}</span><span class="marker-face marker-back"><i class="marker-ball"></i></span></span><small>${used?'USED':'READY'}</small></div>`;
  }).join('')}</div>`;
 }
 return {available,render};
})();
