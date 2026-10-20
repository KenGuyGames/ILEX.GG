// Refresh readable printed-clause inventories from the current pending list.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),directory=path.join(root,'work/rules-research');
const pending=JSON.parse(fs.readFileSync(path.join(directory,'wotc-automation-pending.json'),'utf8'));
const counts={pending:pending.length};
for(const [label,field] of [['attacks','attacks'],['powers','abilities'],['rules','rules']]){
 const groups=new Map();
 for(const card of pending)for(const clause of card[field]||[]){
  const text=typeof clause==='string'?clause:clause.text||'';
  if(!text)continue;const entries=groups.get(text)||[];
  entries.push(card.id+' '+card.name+(clause.name?' / '+clause.name:''));groups.set(text,entries);
 }
 const note=label==='attacks'?'These attack clauses have no compiled handler.':'These are all printed '+label+' on blocked cards; a handler may already exist while another interaction is pending.';
 fs.writeFileSync(path.join(directory,'wotc-pending-'+label+'.txt'),note+'\n\n'+[...groups].map(([text,entries])=>entries.join(', ')+'\n'+text).join('\n\n')+'\n');counts[label]=groups.size;
}
console.log(JSON.stringify(counts));
