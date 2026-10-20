const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../..'),rows=require('../rules-research/unlimited-card-inventory.json'),reprints=require('../unlimited-candidate/ui/unlimited-reprints.json');
const ids=['base1-2','ex1-7','dp3-7','hgss4-96','bw5-63','xy1-1','sm1-96','swsh1-138','sv01-086','me01-003'],energy={Grass:'sve-001',Fire:'sve-002',Water:'sve-003',Lightning:'sve-004',Psychic:'sve-005',Fighting:'sve-006',Darkness:'sve-007',Metal:'sve-008',Fairy:'xy1-140'},named=name=>rows.find(r=>r.d.name===name&&r.d.supertype==='Pokémon'),decks=[];
const trainer=name=>reprints.groups.find(g=>g.category==='Trainer'&&g.name===name)?.reference||rows.find(r=>r.d.supertype==='Trainer'&&r.d.name===name)?.d.id;
for(const id of ids){const r=rows.find(r=>r.d.id===id);if(!r)throw Error('Missing '+id);const cards={},line=[],seen=new Set();let c=r;while(c&&!seen.has(c.d.name)){seen.add(c.d.name);line.push(c);const from=c.d.evolvesFrom||c.d.evolveFrom;c=from?rows.find(x=>x.era===r.era&&x.d.name===from)||named(from):null;}for(const x of line)cards[x.d.id]=4;
 cards['base3-3']=(cards['base3-3']||0)+1;
 Object.assign(cards,{'base1-88':2,'base1-91':2,'base1-94':2,'base1-95':2,'ex2-88':2,'neo1-103':1});
 for(const [name,n]of [['Ultra Ball',3],['Nest Ball',3],['Boss’s Orders',1]]){const t=trainer(name)||trainer(name.replace('’',"'"));if(t)cards[t]=n;}
 const types=new Set(line.flatMap(x=>[...(x.d.types||[]),...(x.d.attacks||[]).flatMap(a=>a.cost||[])]).filter(t=>energy[t]));if(!types.size)types.add('Water');let left=60-Object.values(cards).reduce((a,b)=>a+b,0);for(const [i,t]of [...types].entries()){const n=Math.floor(left/(types.size-i));if(n<1)throw Error('Fixture too large');cards[energy[t]]=n;left-=n;}
 decks.push({name:'Constructed '+r.era+' Unlimited fixture: '+r.d.name,cards});}
fs.writeFileSync(path.join(root,'work/rules-research/unlimited-mixed-fixture-decks.json'),JSON.stringify(decks,null,2));
let s=fs.readFileSync(path.join(__dirname,'mega-mixed-match-audit.cjs'),'utf8').replaceAll('mega-candidate','unlimited-candidate').replaceAll('mega-mixed','unlimited-mixed');
s=s.replace("for(const r of JSON.parse(fs.readFileSync(path.join(root,'work/rules-research/unlimited-candidate-data.json'),'utf8')))map[r.d.id]='ILEX DP '+r.d.id;",'');
s=s.replace("profile:index%2?'expanded':'mega'","profile:'unlimited'");
s=s.replace("const pair=[decks[index],decks[(index+1)%decks.length]]","const pair=[decks[index],decks[(index+Number(process.env.ILEX_MATCH_OFFSET||1))%decks.length]]");
s=s.replace("'unlimited-mixed-match-audit'+","'unlimited-mixed-match-audit-offset'+(process.env.ILEX_MATCH_OFFSET||'1')+");
s=s.replace('scope:\'BW onward through Mega; constructed Mega/SV interaction fixtures and cached SWSH decks in 24 bounded 120-decision pairings; exact replay and Undo. Constructed fixtures are not tournament lists.\'','scope:\'Unlimited all ten era fixtures with mixed Trainer reprints and Fossil Ditto; bounded120 decisions with replay/Undo. Constructed fixtures are not tournament lists.\'');
// Compare the effective transformed identity as well as physical zones.
s=s.replace("cards:l.cards.map(c=>[c.id,c.fullName]),tools:","cards:l.cards.map(c=>[c.id,c.fullName,c.name,c.hp,c.stage,c.cardType,c.tags,c.powers?.map(p=>p.name)]),tools:");
fs.writeFileSync(path.join(__dirname,'unlimited-mixed-match-audit.cjs'),s);console.log('Prepared ten mixed-era decks with historical Ditto, old Trainer printings and modern rules.');
