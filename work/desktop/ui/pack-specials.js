/* Confirmed English special-pack layouts. Trigger frequencies are simulation estimates. */
(function(root){
 const labels={'151-starter':'Starter Evolution Demigod Pack','prismatic-eevee':'Eeveelution God Pack','prismatic-triple':'Triple SIR Demigod Pack','black-bolt-art':'Black Bolt God Pack','white-flare-art':'White Flare God Pack','ascended-mega':'Ascended Heroes God Pack'};
 function build(id,cards,details,boost){const ids=predicate=>cards.filter(c=>predicate(details[c.id]||{})).map(c=>c.id),sir=ids(d=>d.rarity==='Special Illustration Rare'),ir=ids(d=>d.rarity==='Illustration Rare');const make=(code,base,extra)=>({code,label:labels[code],base,rate:base*boost,...extra});
  if(id==='sv03.5')return [make('151-starter',1/700,{mode:'starter',lines:[['sv03.5-166','sv03.5-167','sv03.5-198'],['sv03.5-168','sv03.5-169','sv03.5-199'],['sv03.5-170','sv03.5-171','sv03.5-200']]})];
  if(id==='sv08.5'){const family=['Eevee ex','Vaporeon ex','Jolteon ex','Flareon ex','Espeon ex','Umbreon ex','Leafeon ex','Glaceon ex','Sylveon ex'],eevee=ids(d=>d.name==='Eevee'&&String(d.number)==='74');return [make('prismatic-eevee',1/2000,{mode:'eevee',eevee,family:family.map(name=>sir.find(card=>details[card]?.name===name))}),make('prismatic-triple',1/1000,{mode:'triple',sir})];}
  if(/^sv10\.5[bw]$/.test(id))return [make(id.endsWith('b')?'black-bolt-art':'white-flare-art',1/1000,{mode:'art',ir,sir})];
  if(id==='me02.5')return [make('ascended-mega',1/2000,{mode:'mega',mega:ids(d=>['MEGA_ATTACK_RARE','Mega Attack Rare'].includes(d.rarity)),sir})];return [];
 }
 function roll(profile,normal,rng){const events=profile.specials||[];if(!events.length)return normal;const chance=rng();let sum=0,event;for(const candidate of events){sum+=candidate.rate;if(chance<sum){event=candidate;break;}}if(!event)return normal;const result=[],used=new Set();
  const put=(id,tier,finish='holo',slot='Special pack')=>{if(!id)throw Error('Missing special-pack printing');used.add(id);result.push({id,tier,finish,slot,revealed:false});};
  const draw=(pool,n,tier,finish='holo',slot)=>{if(pool.length<n)throw Error('Incomplete special-pack pool');for(let i=0;i<n;i++){const available=pool.filter(id=>!used.has(id));if(!available.length)throw Error('Special-pack pool exhausted');put(available[Math.floor(rng()*available.length)],tier,finish,slot);}};
  if(event.mode==='starter'||event.mode==='triple'){result.push(...normal.slice(0,-3).map(c=>({...c})));for(const c of result)used.add(c.id);if(event.mode==='starter'){const line=event.lines[Math.floor(rng()*event.lines.length)];line.forEach((id,i)=>put(id,i===2?'special':'illustration'));}else draw(event.sir,3,'special');}
  else{if(event.mode==='eevee'){draw(event.eevee,1,'masterball','masterball');draw(event.family,9,'special');}else if(event.mode==='art'){draw(event.ir,9,'illustration');draw(event.sir,1,'special');}else if(event.mode==='mega'){draw(event.mega,3,'special');draw(event.sir,7,'special');}draw(profile.pools.energy,1,'energy','holo','Basic Energy');}
  if(result.length!==profile.count)throw Error('Invalid special-pack size');for(const c of result)c.packVariant=event.code;return result;
 }
 const api={build,roll,label:code=>labels[code]||'Special Pack'};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PackSpecials=api;
})(typeof globalThis!=='undefined'?globalThis:this);
