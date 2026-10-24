from pathlib import Path
p=Path('work/pocket-candidate/ui/pocket-engine.js');s=p.read_text(encoding='utf-8');i=s.index('  function restore(saved)')
s=s[:i]+'''  function legalActions(s,player=s.active){
   const p=s.players[player],possible=[];
   if(s.phase==='finished')return [];
   if(s.prompt)return s.prompt.player===player?s.prompt.options.map(value=>({type:'choice',player,value})):[];
   if(s.phase==='setup'){if(p.ready)return [];const basics=p.hand.filter(r=>card(r).category==='Pokemon'&&card(r).stage===0);return basics.map(r=>({type:'setup',player,active:r.key,bench:basics.filter(x=>x!==r).slice(0,3).map(x=>x.key)}));}
   if(s.active!==player)return [];
   possible.push({type:'pass',player});
   for(const ref of p.hand){const c=card(ref);if(c.category==='Trainer')possible.push({type:'trainer',player,card:ref.key});else if(c.stage===0)possible.push({type:'bench',player,card:ref.key});else for(let index=0;index<=p.bench.length;index++)possible.push({type:'evolve',player,card:ref.key,slot:index});}
   for(let index=0;index<=p.bench.length;index++){possible.push({type:'energy',player,slot:index},{type:'ability',player,slot:index});if(top(slot(p,index)).fossil)possible.push({type:'discardFossil',player,slot:index});}
   for(let index=0;index<attacksFor(p.active).length;index++)possible.push({type:'attack',player,index});
   const cost=retreatCost(s,p);for(const target of p.bench)possible.push({type:'retreat',player,target:target.key,energy:p.active.energy.map((_,i)=>i).slice(0,cost)});
   possible.push({type:'stadium',player});
   return possible.filter(a=>{try{apply(s,a);return true}catch{return false}});
  }
  function chooseBotAction(s,player){
   const actions=legalActions(s,player);if(!actions.length)return null;
   function score(t){const p=t.players[player],o=t.players[1-player];if(t.phase==='finished')return t.winner===player?100000:t.winner==='tie'?0:-100000;let n=(p.points-o.points)*1000+(p.hand.length-o.hand.length)*3;
    for(const [owner,sign] of [[p,1],[o,-1]])for(const l of slots(owner)){n+=sign*(30+l.energy.length*13+top(l).stage*12-l.damage*.3);if(owner.active===l)n+=sign*Math.max(0,...attacksFor(l).filter(a=>pay(l.energy,a.cost)).map(a=>a.damage||0))*.8;}
    return n;
   }
   // Planning uses an independent forecast, never the match's future coin sequence.
   let best=actions[0],highest=-Infinity;for(const a of actions){let value=-Infinity;try{const forecast=copy(s);forecast.random=(s.turn*2654435761+s.journal.length*1013904223)>>>0;const t=apply(forecast,a);value=score(t)+(a.type==='attack'?15:0)+(a.type==='pass'?-20:0);if(t.prompt?.player===player){const choices=legalActions(t,player);value=Math.max(value,...choices.map(c=>{try{return score(apply(t,c))}catch{return -Infinity}}));}}catch{}if(value>highest){highest=value;best=a;}}
   return best;
  }
''' +s[i:];s=s.replace('retreatCost,attacksFor};','retreatCost,attacksFor,legalActions,chooseBotAction};');p.write_text(s,encoding='utf-8')
p=Path('work/pocket-candidate/ui/pocket-ui.js');s=p.read_text(encoding='utf-8');a=s.index(' function scheduleBot(){');b=s.index(' function go(next)',a)
s=s[:a]+''' function scheduleBot(){clearTimeout(botTimer);const m=store().match;if(!m||store().botPaused||m.spec.opponent!=='bot'||m.phase==='finished'||document.hidden)return;const ready=m.phase==='setup'&&!m.players[1].ready||m.prompt?.player===1||m.phase==='turn'&&m.active===1;if(!ready)return;botTimer=setTimeout(()=>{if(store().match!==m||tab!=='pocket'||section!=='battle'||store().botPaused)return;const a=rules.chooseBotAction(m,1);if(a)act(a,true)},350);}
 function resumeBot(){store().botPaused=false;save();battleScreen();}
''' +s[b:]
s=s.replace('function act(action){safely', 'function act(action,bot=false){safely').replace('s.match=rules.apply(s.match,action);save();','s.match=rules.apply(s.match,action);if(!bot)store().botPaused=false;save();')
s=s.replace('s.match=rules.undo(s.match);save();','s.match=rules.undo(s.match);s.botPaused=true;save();')
s=s.replace('<button onclick="PocketUI.endMatch()">Close match</button>', '<button onclick="PocketUI.endMatch()">Close match</button>${s.botPaused&&m.spec.opponent===\'bot\'?\'<button onclick="PocketUI.resumeBot()">Resume bot</button>\':\'\'}')
s=s.replace('act,undo,endMatch,hand', 'act,undo,resumeBot,endMatch,hand')
s=s.replace('PocketUI.retreat(${player},${b.key})', 'PocketUI.retreat(${player},${b.key})')
p.write_text(s,encoding='utf-8')
