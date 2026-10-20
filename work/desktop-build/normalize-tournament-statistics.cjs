const fs=require('fs'),path=require('path'),p=path.join(__dirname,'tournament-bot-benchmark.cjs');let s=fs.readFileSync(p,'utf8');
const anchor='const replaySnap=m=>JSON.stringify(';
s=s.replace(anchor,`const normalizeStats=(k,v)=>{if(k==='__uniqueId'&&typeof v==='string')return v.replace(/^\\d+_/,'clock_');if(k==='cardId'&&typeof v==='string')return v.replace(/^pokemon_list_\\d+_/,'pokemon_list_clock_');if(k==='pokemonDamageStats'&&v)return Object.fromEntries(Object.entries(v).map(([key,value])=>[key.replace(/^pokemon_list_\\d+_/,'pokemon_list_clock_'),value]));return v;};
const replaySnap=m=>JSON.stringify(`);
s=s.replace('players:m.store.state.players});','players:m.store.state.players},normalizeStats);');
fs.writeFileSync(p,s);console.log('Only wall-clock analytics IDs normalized; physical card IDs and all gameplay fields remain compared.');
