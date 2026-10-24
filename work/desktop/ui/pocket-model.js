/* Pocket has its own catalog, deck rules and pack tables. It never aliases paper cards. */
(function(root){
 'use strict';
 const clone=x=>JSON.parse(JSON.stringify(x));
 const energies=['G','R','W','L','P','F','D','M'];
 const norm=s=>String(s||'').normalize('NFKD').replace(/[’‘]/g,"'").toLowerCase();
 function rng(seed){let n=Number(seed)>>>0;return()=>{n=(n+0x6D2B79F5)>>>0;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
 function weighted(entries,random){const total=entries.reduce((s,x)=>s+x[1],0);if(!(total>0))throw Error('No eligible Pocket pack entries');let n=random()*total;for(const [value,w] of entries){n-=w;if(n<0)return value;}return entries.at(-1)[0];}
 function catalog(cards,sets){
  const byId=new Map(cards.map(c=>[c.id,c])),bySet=new Map(sets.map(s=>[s.id,s])),cache=new Map();
  function issues(deck,{automation=false}={}){
   const errors=[],names=new Map();let total=0,basics=0;
   for(const [id,n]of Object.entries(deck.cards||{})){
    const c=byId.get(id);if(!c){errors.push('Unknown Pocket printing: '+id);continue;}
    if(!Number.isInteger(n)||n<1||n>2){errors.push(c.name+': choose 1 or 2 copies');continue;}
    total+=n;names.set(norm(c.name),(names.get(norm(c.name))||0)+n);
    if(c.category==='Pokemon'&&c.stage===0)basics+=n;
    if(automation&&c.automation!=='implemented')errors.push(c.name+': automation is still pending');
   }
   if(total!==20)errors.push('Pocket decks need exactly 20 cards (currently '+total+')');
   if(!basics)errors.push('Include at least one Basic Pokémon');
   for(const [name,n]of names)if(n>2)errors.push(name+': at most 2 copies across all printings');
   const types=deck.energyTypes||[];
   if(types.length<1||types.length>3||new Set(types).size!==types.length||types.some(t=>!energies.includes(t)))errors.push('Choose 1 to 3 different Energy Zone types');
   return errors;
  }
  function pool(setId,pack){const key=setId+'\0'+pack;if(!cache.has(key))cache.set(key,cards.filter(c=>c.set===setId&&c.packs.includes(pack)));return cache.get(key);}
  function packs(){return sets.flatMap(s=>s.packs.filter(p=>pool(s.id,p).length).map(p=>({id:s.id+'|'+p,set:s.id,name:p,setName:s.name,promo:s.promo})));}
  function packTable(setId,pack){
   const set=bySet.get(setId),eligible=pool(setId,pack);if(!set||!eligible.length)throw Error('Choose an available Pocket pack');
   if(set.promo)return{set,eligible,variants:[['Promo Pack',{appearance_rate:100,cards:1,slots:{1:{PROMO:100}}}]],buckets:new Map([['PROMO',eligible]])};
   if(!set.rates)throw Error('This Pocket set has no verified pack table');
   const buckets=new Map();for(const c of eligible){const list=buckets.get(c.rarityBucket)||[];list.push(c);buckets.set(c.rarityBucket,list);}
   const variants=Object.entries(set.rates);
   for(const [name,v]of variants)for(const [slot,weights]of Object.entries(v.slots))for(const [rarity,w]of Object.entries(weights))if(w>0&&!buckets.get(rarity)?.length)throw Error(set.name+' / '+pack+' / '+name+' slot '+slot+': missing '+rarity+' pool');
   return{set,eligible,variants,buckets};
  }
  function open(setId,pack,seed){
   const {variants,buckets}=packTable(setId,pack),random=rng(seed),boost=1.12;
   const [variant,table]=weighted(variants.map(v=>[v,v[1].appearance_rate*(/Rare Pack/.test(v[0])?boost:1)]),random);
   const pulls=Object.keys(table.slots).sort((a,b)=>a-b).map(slot=>{
    const rarity=weighted(Object.entries(table.slots[slot]).filter(([,w])=>w>0).map(([r,w])=>[r,w*(['RR','AR','SR','SAR','SSR','SIR','IM','UR'].includes(r)?boost:1)]),random);
    // Deluxe's fourth card is its guaranteed ex; full-art Supporters of the same
    // rarity remain eligible in the earlier rare slot, not the ex-only slot.
    const available=buckets.get(rarity).filter(c=>!(['a4b','b4b'].includes(setId)&&/^Regular Pack/.test(variant)&&Number(slot)===4)||c.ex);
    if(!available.length)throw Error('Missing guaranteed Pocket pack pool');
    return available[Math.floor(random()*available.length)].id;
   });
   if(pulls.length!==table.cards)throw Error('Pocket pack slot count mismatch');
   return{schema:1,set:setId,pack,seed:Number(seed)>>>0,variant,cards:pulls};
  }
  return{cards,sets,byId,bySet,issues,packs,pool,packTable,open};
 }
 const api={catalog,clone,rng,energies,norm};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PocketModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
