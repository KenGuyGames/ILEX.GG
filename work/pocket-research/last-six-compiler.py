from pathlib import Path
p=Path('work/pocket-candidate/ui/pocket-engine.js');s=p.read_text(encoding='utf-8').replace("let damage=Math.max(0,amount);if(!damage)return;", "let damage=Math.max(0,amount);if(!damage)return;const opposing=!slots(s.players[player]).includes(target);").replace("const defensive=passive(s,target),opposing=!slots(s.players[player]).includes(target);", "const defensive=passive(s,target);")
p.write_text(s,encoding='utf-8')
p=Path('work/pocket-research/attack-smoke.cjs');s=p.read_text().replace("if(c.ability?.passive?.attackNeedsBench)", "const required=a.automation.find(op=>op.kind==='attackRequirement')?.predicate?.names;if(required)p.bench=required.map((name,i)=>slot(cards.find(c=>c.name===name),202+i));if(c.ability?.passive?.attackNeedsBench)");p.write_text(s)
p=Path('work/pocket-research/compile.cjs');s=p.read_text(encoding='utf-8');a=s.index('function trainer(');i=s.index(' return null;',a)
s=s[:i]+r'''
 if(text==='Heal 20 damage from your Active Pokémon. If you healed any damage in this way, flip a coin. If heads, put this Lucky Ice Pop into your hand instead of the discard pile.')return[{kind:'icePop'}];
 if(text==='Attach 3 different types of Energy from your discard pile to your Ancient Pokémon in any way you like.')return[{kind:'recoverDistinct',left:3,used:[]}];
 if(text==="Look at your opponent's hand and put any number of Basic Pokémon you find there onto your opponent's Bench.")return[{kind:'revealHand',opponent:true},{kind:'putOpponentBasics'}];
 if(text==="Put a Basic Pokémon from your opponent's discard pile onto their Bench.")return[{kind:'chooseCard',opponent:true,zone:'discard',category:'Pokemon',stage:0,requiresBench:true,next:[{kind:'benchChosenDiscard',opponent:true}]}];
 if(text==="Put a random Item card, except any Team Rocket's Thieving Machine, from your opponent's discard pile into your hand.")return[{kind:'stealItem',excludeName:"Team Rocket's Thieving Machine"}];
''' +s[i:];i=s.index(' // Independent printed clauses');s=s[:i]+''' if(text==='You may move any amount of Energy from your Pokémon in play to your other Pokémon in any way you like.')return[hit,{kind:'moveAnyEnergy'}];
''' +s[i:];p.write_text(s,encoding='utf-8')
