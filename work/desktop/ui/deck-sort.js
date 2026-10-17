/* Presentation order only: deck counts and saved card order remain untouched. */
var DeckSort=(()=>{
 const key=value=>String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/♀/g,' female ').replace(/♂/g,' male ').replace(/[’‘]/g,"'").replace(/[^a-z0-9]/gi,'').toLowerCase();
 const nameOrder=(a,b)=>String(a.card?.name||a.id).localeCompare(String(b.card?.name||b.id))||a.id.localeCompare(b.id);
 const countOrder=(a,b)=>b.n-a.n||nameOrder(a,b);
 let cachedMetadata,cachedParents;
 function add(parent,card){
  if(card?.category!=='Pokemon')return;
  const name=key(card.name),raw=card.evolveFrom||card.evolvesFrom;
  if(!name||!raw)return;
  for(const from of Array.isArray(raw)?raw:[raw]){
   const previous=key(from);if(!previous)continue;
   const a=root(parent,name),b=root(parent,previous);if(a!==b)parent.set(a<b?b:a,a<b?a:b);
  }
 }
 function root(parent,name){let next=parent.get(name);if(!next)return name;const result=root(parent,next);parent.set(name,result);return result;}
 function trainerRank(card){const types=[...(card?.subtypes||[]),card?.trainerType||''].join(' ');return /supporter/i.test(types)?0:/tool|technical machine/i.test(types)?2:/stadium/i.test(types)?3:1;}
 function energyRank(card){return card?.energyType==='Normal'||/basic/i.test((card?.subtypes||[]).join(' '))?0:1;}
 function sort(entries,category,metadata={},custom=[]){
  if(category==='Trainer')return [...entries].sort((a,b)=>trainerRank(a.card)-trainerRank(b.card)||countOrder(a,b));
  if(category==='Energy')return [...entries].sort((a,b)=>energyRank(a.card)-energyRank(b.card)||countOrder(a,b));
  if(category!=='Pokemon')return [...entries].sort(countOrder);
  if(cachedMetadata!==metadata){cachedMetadata=metadata;cachedParents=new Map();Object.values(metadata).forEach(card=>add(cachedParents,card));}
  const parents=new Map(cachedParents);custom.forEach(card=>add(parents,card));entries.forEach(entry=>add(parents,entry.card));
  const groups=new Map();for(const entry of entries){const line=root(parents,key(entry.card?.name)||entry.id);if(!groups.has(line))groups.set(line,[]);groups.get(line).push(entry);}
  const stage=card=>({Basic:0,Stage1:1,Stage2:2,'LV.X':3,Mega:3})[card?.stage]??0;
  const lines=[...groups.values()];
  lines.forEach(line=>line.sort((a,b)=>b.n-a.n||stage(a.card)-stage(b.card)||nameOrder(a,b)));
  lines.sort((a,b)=>b[0].n-a[0].n||b.reduce((n,c)=>n+c.n,0)-a.reduce((n,c)=>n+c.n,0)||nameOrder(a[0],b[0]));
  return lines.flat();
 }
 return {sort};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=DeckSort;
