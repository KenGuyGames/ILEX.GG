from pathlib import Path
p=Path('work/pocket-research/attack-smoke.cjs');s=p.read_text();s=s.replace("for(const c of cards)for(const [index,a]", "const profiles=process.env.POCKET_BRANCHES?8:1;for(let profile=0;profile<profiles;profile++)for(const c of cards)for(const [index,a]")
needle="try{const original=JSON.stringify(s)"
s=s.replace(needle,"""s.random=(s.random+profile*100003)>>>0;
if(profile===1){p.active.damage=Math.min(20,c.hp-10);o.active.damage=10;o.active.conditions=['Poisoned'];p.active.energy=a.cost.map(t=>t==='C'?'G':t);}
if(profile===2){p.points=2;o.points=1;p.active.tool={id:cards.find(c=>c.name==='Giant Cape').id,key:701};p.hand=[{id:cards.find(c=>c.name==='Giant Cape').id,key:702},{id:cards.find(c=>c.name==='Rocky Helmet').id,key:703},{id:basic[0].id,key:704},{id:basic[1].id,key:705}];p.active.firstShieldUsed=true;p.active.attackUses=1;}
if(profile===3){p.active.damage=c.hp-10;o.active.damage=R.top(o.active).hp-10;p.bench.forEach(t=>t.damage=10);o.bench.forEach(t=>t.damage=10);}
if(profile===4){p.bench=[];o.bench=[];}
if(profile===5){p.active.evolved=s.turn;p.active.promoted=s.turn;p.active.promotedTop=c.id;if(c.stage>0){const from=cards.find(x=>x.name===c.evolvesFrom&&x.stage===c.stage-1);if(from)p.active.stack.unshift({id:from.id,key:801});}s.eventsHistory.push({type:'knockout',player:p.id,cause:'attack',pokemonType:'Darkness',turn:4,points:1},{type:'attack',player:p.id,name:'Sweets Relay',turn:3});s.stadium={player:p.id,ref:{id:cards.find(c=>c.name==='Training Area').id,key:802}};}
if(profile===6)o.active.effects.push({kind:'preventAttacks',expires:8});
if(profile===7){p.hand=[];o.hand=[];p.deck=[];o.deck=[];o.active.energy=[];}
const needed=a.automation.find(op=>op.kind==='attackRequirement')?.predicate?.names||c.ability?.passive?.attackNeedsBench;if(needed)p.bench=needed.map((name,i)=>slot(cards.find(c=>c.name===name),202+i));
try{const original=JSON.stringify(s)""")
s=s.replace("{card:c.id,attack:a.name,error:e.message}","{card:c.id,attack:a.name,profile,error:e.message}")
s=s.replace("'attack-smoke.json'", "profiles>1?'attack-branches.json':'attack-smoke.json'")
p.write_text(s)
