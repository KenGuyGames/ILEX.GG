const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..'),research=path.join(root,'work/rules-research'),sha=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'work/desktop/ui/rules-engine.js'))).digest('hex'),load=n=>JSON.parse(fs.readFileSync(path.join(research,n+'.json'),'utf8'));
for(const kind of ['hgss-final-smoke-report','hgss-match-audit']){
 const shards=[0,1,2].map(i=>load(kind+'-'+i));for(const r of shards){assert.ok(r.passed);assert.equal(r.engineSha256,sha);assert.equal(r.failures.length,0);}
 let result;
 if(kind==='hgss-final-smoke-report'){
  const records=JSON.parse(fs.readFileSync(path.join(research,'twinleafgg-main/ptcg-server/src/tcg-lab-hgss-data.ts'),'utf8').match(/^export const hgssData:any = (.*);$/m)[1]),expected=records.filter(r=>r.d.supertype==='Pokémon');
  const tested=shards.flatMap(r=>r.testedPrintings);assert.equal(new Set(tested).size,expected.length);for(const r of expected)assert.ok(tested.includes(r.d.id));const scenarios=shards.reduce((n,r)=>n+r.scenarios,0);assert.equal(scenarios,809);
  result={passed:true,scenarios,failures:[],testedPrintings:tested,scope:shards[0].scope,engineSha256:sha,shards:3};
 }else{const games=shards.flatMap(r=>r.games);assert.equal(games.length,16);assert.equal(new Set(games.map(g=>g.decks.join(' / '))).size,16);assert.ok(games.every(g=>g.replay&&g.undo));result={passed:true,engineSha256:sha,scope:shards[0].scope,games,failures:[],shards:3};}
 fs.writeFileSync(path.join(research,kind+'.json'),JSON.stringify(result,null,2));console.log(kind+' PASS '+(result.scenarios||result.games.length));
}
