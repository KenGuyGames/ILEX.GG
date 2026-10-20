const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),inventory=require('../rules-research/xy-inventory.json'),file=path.join(root,'work/card-sources/xy-supplements.json');
const records=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):[],queue=inventory.filter(r=>r.reason==='missing-text'&&!records.some(d=>d.id===r.id));
const clean=s=>String(s||'').replace(/[’‘]/g,"'").replace(/[“”]/g,'"');
async function worker(){while(queue.length){const scan=queue.shift(),url='https://api.tcgdex.net/v2/en/cards/'+scan.id,response=await fetch(url);if(!response.ok)throw Error(scan.id+' '+response.status);const c=await response.json();
 records.push({id:c.id,name:c.name,number:c.localId,set:{id:c.set.id},supertype:c.category==='Pokemon'?'Pokémon':c.category,subtypes:c.category==='Pokemon'?[{Basic:'Basic',Stage1:'Stage 1',Stage2:'Stage 2',MEGA:'MEGA',BREAK:'BREAK'}[c.stage]||c.stage]:c.category==='Energy'?[c.energyType==='Special'?'Special':'Basic']:[c.trainerType||'Item'],hp:c.hp?String(c.hp):undefined,types:c.types,evolvesFrom:c.evolveFrom,attacks:(c.attacks||[]).map(a=>({name:a.name,cost:a.cost||[],damage:a.damage===undefined?'':String(a.damage),text:clean(a.effect)})),abilities:(c.abilities||[]).map(a=>({name:a.name,type:a.type,text:clean(a.effect)})),rules:c.effect?[clean(c.effect)]:undefined,weaknesses:c.weaknesses,resistances:c.resistances,retreatCost:Array.from({length:c.retreat||0},()=> 'Colorless'),rarity:c.rarity,_source:{url,updated:c.updated}});
 fs.writeFileSync(file,JSON.stringify(records.sort((a,b)=>a.id.localeCompare(b.id)),null,2));
}}
Promise.all(Array.from({length:4},worker)).then(()=>console.log('Saved '+records.length+' XY supplement texts.')).catch(e=>{console.error(e);process.exitCode=1;});
