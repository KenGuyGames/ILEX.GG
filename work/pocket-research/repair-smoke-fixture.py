from pathlib import Path
p=Path('work/pocket-research/attack-smoke.cjs');s=p.read_text().replace("o.active=slot(basic[3],301);", "if(c.ability?.passive?.attackNeedsBench)p.bench=c.ability.passive.attackNeedsBench.map((name,i)=>slot(cards.find(c=>c.name===name),202+i));o.active=slot(basic[3],301);");p.write_text(s)
