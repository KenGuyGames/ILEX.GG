const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../..');
const records=require('../rules-research/sv-era-candidate-data.json'),old=require('../rules-research/swsh-cached-decks.json');
const names=['Miraidon ex','Gardevoir ex','Charizard ex','Gholdengo ex','Raging Bolt ex','Dragapult ex','Terapagos ex','Hydreigon ex',"Ethan's Ho-Oh ex",'Reshiram ex','Zekrom ex',"Team Rocket's Mewtwo ex"],energy={Grass:'bw1-105',Fire:'bw1-106',Water:'bw1-107',Lightning:'bw1-108',Psychic:'bw1-109',Fighting:'bw1-110',Darkness:'bw1-111',Metal:'bw1-112'};
const byName=name=>records.find(r=>r.d.name===name&&r.d.supertype==='Pokémon');
const decks=[];for(let i=0;i<names.length;i++){
 const r=byName(names[i]);if(!r)throw Error('Missing '+names[i]);const cards={},line=[];let c=r;
 while(c&&!line.includes(c)){line.push(c);c=c.d.evolvesFrom?byName(c.d.evolvesFrom):null;}
 for(const row of line)cards[row.d.id]=4;
 cards['sv01-189']=4;cards['sv01-181']=4;cards['sv01-194']=3;cards['sv07-133']=2;cards['sv05-160']=1;
 const types=new Set([...(r.d.types||[]),...(r.d.attacks||[]).flatMap(a=>a.cost)].filter(t=>energy[t]));if(!types.size)types.add('Psychic');
 let left=60-Object.values(cards).reduce((a,b)=>a+b,0);for(const [n,t]of [...types].entries()){const count=Math.floor(left/(types.size-n));cards[energy[t]]=count;left-=count;}
 if(Object.values(cards).reduce((a,b)=>a+b,0)!==60)throw Error('Fixture count');
 decks.push({name:'Constructed SV interaction fixture: '+names[i],cards},old[i]);
}
fs.writeFileSync(path.join(root,'work/rules-research/sv-mixed-fixture-decks.json'),JSON.stringify(decks,null,2));
let runner=fs.readFileSync(path.join(__dirname,'swsh-full-match-audit.cjs'),'utf8').replaceAll("path.join(ui,'rules-engine.js')","path.join(root,'work/sv-candidate/rules-engine.js')").replaceAll("fs.readFileSync(path.join(ui,file),'utf8')","fs.readFileSync(file==='rules-engine.js'?path.join(root,'work/sv-candidate/rules-engine.js'):path.join(ui,file),'utf8')");
runner=runner.replace('Object.assign(map,M.withAliases',"for(const r of JSON.parse(fs.readFileSync(path.join(root,'work/rules-research/sv-era-candidate-data.json'),'utf8')))map[r.d.id]='ILEX DP '+r.d.id;Object.assign(map,M.withAliases").replace('swsh-cached-decks.json','sv-mixed-fixture-decks.json').replaceAll('swsh-full-match-audit','sv-mixed-match-audit').replace("profile:index%2?'expanded':'swsh'","profile:index%2?'expanded':'sv'").replace('BW onward through Sword & Shield; twenty-four cached SWSH deck pairings, bounded 120 decisions each; historical SWSH/Expanded, exact replay and Undo','BW onward through SV; twelve constructed SV fixtures interleaved with twelve cached SWSH decks, 24 bounded 120-decision pairings; SV/Expanded, exact replay and Undo. Constructed SV fixtures are not tournament lists.');
fs.writeFileSync(path.join(__dirname,'sv-mixed-match-audit.cjs'),runner);console.log('Prepared 24 bounded mixed-era fixtures.');
