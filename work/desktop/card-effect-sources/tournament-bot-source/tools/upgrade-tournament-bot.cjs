const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../..'),ui=process.env.ILEX_TOURNAMENT_UI||path.join(root,'work/tournament-bot-candidate/ui'),baseUI=process.env.ILEX_BOT_BASE_UI||path.join(root,'work/unlimited-candidate/ui');let s=fs.readFileSync(path.join(baseUI,'bot-ai.js'),'utf8').replace(/\r\n/g,'\n');
function replace(a,b){if(!s.includes(a))throw Error('Missing anchor '+a.slice(0,70));s=s.replace(a,b);}
replace("realistic:{label:'Realistic Player',candidates:56,lookahead:3}","realistic:{label:'Realistic Player',candidates:36,lookahead:10}");
replace('store.state.logs=store.state.logs.slice(-15);',`store.state.logs=store.state.logs.slice(-15);
  if(m._botForecast)return {store,spec:m.spec,journal:m._botKeepHistory?copy(m.journal):[],randomState:m.randomState,_botForecast:true,_botTournament:!!m._botTournament,_botPerspective:m._botPerspective,_botKeepHistory:!!m._botKeepHistory};`);
replace('return {store,spec:m.spec,journal:m._botKeepHistory?copy(m.journal):[],randomState:visibleSeed(m,id)^0x182b84f5^salt,_botForecastSalt:salt,_botKeepHistory:!!m._botKeepHistory};',`const spec={...m.spec,decks:m.spec.decks.map((d,i)=>i===store.state.players.indexOf(p)?d:{name:'Unknown opposing list',cards:{}})};
  return {store,spec,journal:m._botKeepHistory?copy(m.journal):[],randomState:visibleSeed(m,id)^0x182b84f5^salt,_botForecast:true,_botTournament:!!m._botTournament,_botPerspective:id,_botForecastSalt:salt,_botKeepHistory:!!m._botKeepHistory};`);
replace("if(!history.some(h=>h.type==='ability'&&h.player===id&&h.name===a.name&&JSON.stringify(h.target)===JSON.stringify(s.target)))", "if(m._botTournament||!history.some(h=>h.type==='ability'&&h.player===id&&h.name===a.name&&JSON.stringify(h.target)===JSON.stringify(s.target)))");
replace("if(!p)break;const a=prompt(f,p,difficulty);", "if(!p)break;if(f._botTournament&&['Choose cards','Order cards','Choose prize','Coin flip','Shuffle deck','Shuffle hand','Show cards','Show pokemon'].includes(p.type))f._botInformationChanged=true;const a=prompt(f,p,difficulty);");
replace('for(let n=0;n<45;n++)','for(let n=0;n<(difficulty===\'realistic\'?120:45);n++)');
const from=s.indexOf(' function realMissing('),to=s.indexOf(' function realAttacks(',from);
s=s.slice(0,from)+` function realMissing(map,cost){
  // One multitype entry is ONE flexible unit; homogeneous repeats and explicit
  // providedGroups are independent units. Maximum matching handles overlap.
  const units=map.flatMap(e=>(e.providedGroups||[e.provides]).flatMap(g=>new Set(g).size>1?[g]:g.map(t=>[t]))),needs=cost.filter(t=>t!==R.CardType.NONE&&t!==R.CardType.ANY),assigned=new Map();
  const match=(u,t)=>t===R.CardType.COLORLESS||u.includes(t)||u.includes(R.CardType.ANY);
  needs.sort((a,b)=>units.filter(u=>match(u,a)).length-units.filter(u=>match(u,b)).length);
  function assign(n,seen){for(let i=0;i<units.length;i++){if(seen.has(i)||!match(units[i],needs[n]))continue;seen.add(i);if(!assigned.has(i)||assign(assigned.get(i),seen)){assigned.set(i,n);return true;}}return false;}
  let matched=0;for(let n=0;n<needs.length;n++)if(assign(n,new Set()))matched++;return needs.length-matched;
 }
`+s.slice(to);
replace('new R.CheckAttackCostEffect(p,a)','new R.CheckAttackCostEffect(p,a,list)');
replace(' function realPrintedDamage(',fs.readFileSync(path.join(__dirname,'tournament-damage.fragment.js'),'utf8')+' function realPrintedDamage(');
replace("return damage;\n }\n function realDamage", "const counted=realCountDamage(m,p,attack,damage);return counted===null?damage:counted;\n }\n function realDamage");
replace('if(c.powers.length)value+=12;',"if(c.powers.some(a=>!/(?:when|whenever) you play (?:this )?Pok[eé]mon[\\s\\S]*(?:hand|Bench)|when you put this[\\s\\S]*Bench/i.test(a.text||'')))value+=12;");
replace("if(g.phase===R.GamePhase.FINISHED)return g.players[g.winner]?.id===id?1000000:-1000000;", "if(g.phase===R.GamePhase.FINISHED)return g.winner===R.GameWinner.DRAW?0:g.players[g.winner]?.id===id?1000000:-1000000;");
replace("value-=18+(prizeCount(op)<=2?25:0)","value-=42+(prizeCount(op)<=realPrize(l)?35:0)");
replace("const realPrize=l=>{const c=l.getPokemonCard();return c?.tags?.some(t=>[R.CardTag.POKEMON_EX,R.CardTag.POKEMON_ex,R.CardTag.POKEMON_GX,R.CardTag.LEGEND,R.CardTag.DUAL_LEGEND].includes(t))||c?._hgssLegend?2:1;};",`const realPrize=l=>{const c=l.getPokemonCard(),tags=c?.tags||[];if(c?._hgssLegend&&Number.isFinite(c._hgssLegendPrizes))return c._hgssLegendPrizes;if(tags.some(t=>[R.CardTag.POKEMON_VMAX,R.CardTag.POKEMON_VUNION,R.CardTag.TAG_TEAM,R.CardTag.POKEMON_SV_MEGA].includes(t)))return 3;return tags.some(t=>[R.CardTag.POKEMON_V,R.CardTag.POKEMON_VSTAR,R.CardTag.POKEMON_EX,R.CardTag.POKEMON_ex,R.CardTag.POKEMON_GX,R.CardTag.DUAL_LEGEND].includes(t))?2:1;};`);
replace(' function realisticPrompt(',fs.readFileSync(path.join(__dirname,'tournament-prompts.fragment.js'),'utf8')+' function realisticPrompt(');
replace('let owner=actor(m,q.getPerspectivePlayerId?.()??q.playerId);if(!owner)return null;m=fork(m,owner.id);',"const origin=m.journal.slice().reverse().find(a=>a.type!=='prompt');let owner=actor(m,q.getPerspectivePlayerId?.()??q.playerId);if(!owner)return null;m=fork(m,owner.id);");
replace("  if(q.type==='Choose prize'){", "  const tactical=realCounterPrompt(m,q,owner,out);if(tactical)return tactical;\n  if(q.type==='Choose prize'){");
replace('const damage=Math.max(0,...realAttacks(m,owner,owner.active).filter(a=>a.missing===0).map(a=>realDamage(m,owner.active,x.list,a.attack)));', 'const hint=powerDamageHint(m,owner,origin),damage=hint??Math.max(0,...realAttacks(m,owner,owner.active).filter(a=>a.missing===0).map(a=>realDamage(m,owner.active,x.list,a.attack)));');
replace('Math.max(0,...attacks.map(a=>(Number(a.attack.damage)||0)/(a.missing+1)))*2','Math.max(0,...attacks.map(a=>realPrintedDamage(m,owner,x.list,a.attack,true)/(a.missing+1)))*2');
replace("if(c.superType===R.SuperType.POKEMON){\n   if(c.stage!==R.Stage.BASIC)",`if(c.superType===R.SuperType.POKEMON){
   if(c._hgssLegend)return 25+Math.min(20,(c.hp||0)*.1)+(cards.some(x=>x.name===c.name&&x._hgssLegend&&x._hgssLegendHalf!==c._hgssLegendHalf)?100:0);
   if(c._swshUnionGroup!==undefined){if(p.assembledVUNIONs?.includes(c.name))return 2;const parts=new Set([...cards,...p.discard.cards].filter(x=>x._swshUnionGroup===c._swshUnionGroup).map(x=>x._swshUnionPart));return 25+parts.size*18+(!parts.has(c._swshUnionPart)&&parts.size===3?100:0);}
   if(c.stage!==R.Stage.BASIC)`);
replace("if(x.c.superType===R.SuperType.ENERGY&&realSlots(owner)","if(x.c._swshUnionGroup!==undefined&&!owner.assembledVUNIONs?.includes(x.c.name))v-=150;\n    if(x.c.superType===R.SuperType.ENERGY&&realSlots(owner)");
replace("const setupDiscards=discard&&!rows.every", "const unionGroups=new Set([...planCards,...owner.discard.cards,...owner.deck.cards,...owner.prizes.flatMap(l=>l.cards)].filter(c=>c._swshUnionGroup!==undefined&&!owner.assembledVUNIONs?.includes(c.name)).map(c=>c._swshUnionGroup));\n   const setupDiscards=discard&&!rows.every");
replace("rows.filter(x=>march?x.c.attacks?.some(a=>a.name==='Night March'):revenge&&x.c.superType===R.SuperType.POKEMON).length", "rows.filter(x=>unionGroups.has(x.c._swshUnionGroup)|| (march?x.c.attacks?.some(a=>a.name==='Night March'):revenge&&x.c.superType===R.SuperType.POKEMON)).length");
// Keep all existing prompt implementations. Search uses the engine, not printed
// damage, for the resulting Knock Outs, protection, costs and alternate wins.
const start=s.indexOf(' function realisticChoose('),end=s.indexOf(' function choose(',start);
s=s.slice(0,start)+fs.readFileSync(path.join(__dirname,'tournament-search.fragment.js'),'utf8')+s.slice(end);
replace('diagnostics:()=>copy(realisticLast)', 'diagnostics:()=>copy(realisticLast),energyDeficit:realMissing,prizeValue:realPrize,printedPotential:(m,id,index=0,attack=0)=>{const f=fork(m,id),p=actor(f,id),l=[p.active,...p.bench][index];return realPrintedDamage(f,p,l,l.getPokemonCard().attacks[attack]);},clearPlan:()=>{realPlan=null;}');
const attacksStart=s.indexOf(' function realAttacks('),attacksEnd=s.indexOf(' function realCountDamage(',attacksStart);
s=s.slice(0,attacksStart)+` function realAttacks(m,p,list){
  const memo=realMemo(m).attacks;if(memo.has(list))return memo.get(list);
  const card=list.getPokemonCard();if(!card)return [];
  if(list!==p.active&&card.powers?.some(a=>/use the attacks|use any attack/i.test(a.text||''))){
   const f=fork(m,p.id),fp=actor(f,p.id),i=p.bench.indexOf(list);if(i>=0){const old=fp.active;fp.active=fp.bench[i];fp.bench[i]=old;const result=realAttacks(f,fp,fp.active);memo.set(list,result);return result;}
  }
  const map=realEnergy(m,p,list);let available=card.attacks;
  if(list===p.active)try{available=RulesMatch.attacks(m,p);}catch{}
  if(card.powers?.some(a=>/use the attacks of any of your Basic/i.test(a.text||'')))available=[...available,...realSlots(p).filter(l=>l!==list&&l.getPokemonCard()?.stage===R.Stage.BASIC).flatMap(l=>l.getPokemonCard().attacks)];
  const attacks=available.filter(a=>!(a.gxAttack&&p.usedGX)&&!(a._swshVstar&&p.usedVSTAR)&&!(a._swshLostZoneMinimum>p.lostzone.cards.length)).map(a=>{let cost=a.cost;try{const e=new R.CheckAttackCostEffect(p,a,list);m.store.reduceEffect(m.store.state,e);cost=e.cost;}catch{}return {attack:a,missing:realMissing(map,cost),cost};});memo.set(list,attacks);return attacks;
 }
`+s.slice(attacksEnd);
replace('return 12+(bench===0?38:0)',`const drawText=(c.powers||[]).map(a=>a.text||'').join(' '),until=drawText.match(/draw cards until you have (\\d+)/i),onPlay=/(?:when|whenever) you (?:play|put) this/i.test(drawText);
   const drawBonus=onPlay&&until&&bench<5?Math.max(0,Number(until[1])-Math.max(0,cards.length-1))*22:0;
   return drawBonus+12+(bench===0?38:0)`);
replace('energyDeficit:realMissing,','energyDeficit:realMissing,availableAttacks:(m,id,index=0)=>{const f=fork(m,id),p=actor(f,id);return realAttacks(f,p,[p.active,...p.bench][index]).map(a=>({name:a.attack.name,missing:a.missing}));},');
replace("  const tactical=realCounterPrompt(m,q,owner,out);",`  if(q.type==='Choose attack'){
   const enemy=m.store.state.players.find(p=>p!==owner),energy=realEnergy(m,owner,owner.active);
   const choices=q.cards.flatMap((c,index)=>c.attacks.map(attack=>{let cost=attack.cost;try{const e=new R.CheckAttackCostEffect(owner,attack,owner.active);m.store.reduceEffect(m.store.state,e);cost=e.cost;}catch{}const missing=realMissing(energy,cost);return {index,attack:attack.name,score:realDamage(m,owner.active,enemy.active,attack)-missing*1000};})).sort((a,b)=>b.score-a.score);
   for(const c of choices){const a=out({index:c.index,attack:c.attack});if(a)return a;}
  }
  const tactical=realCounterPrompt(m,q,owner,out);`);
replace(' function realPrintedDamage(',fs.readFileSync(path.join(__dirname,'tournament-scaled-resources.fragment.js'),'utf8')+' function realPrintedDamage(');
replace('attack,planning=false){','attack,planning=false,override){');
const resourceStart=s.indexOf('  if(/Energy attached to both'),resourceEnd=s.indexOf('  const counted=',resourceStart);if(resourceStart<0||resourceEnd<0)throw Error('Resource scaling anchors');s=s.slice(0,resourceStart)+'  const resourceDamage=realResourceDamage(m,p,list,attack,override);if(resourceDamage!==null)return resourceDamage;\n'+s.slice(resourceEnd);
replace('Math.min(damage,160)', 'Math.min(damage,Math.max(60,...enemy.map(realHp)))');
replace('value+=Math.min(units,cost)*5-Math.max(0,units-cost)*12;',"const scales=row.attacks.some(a=>/Energy[\\s\\S]*attached/i.test(a.attack.text||'')&&realResourceDamage(m,p,l,a.attack)!==null);value+=Math.min(units,cost)*5-(scales?0:Math.max(0,units-cost)*12);");
replace('return before>after?(before-after)*20+(after===0?55:0)+(x.list===owner.active?20:5):0;',`const op=m.store.state.players.find(p=>p!==owner),hp=realHp(op.active),oldDamage=realPrintedDamage(m,owner,x.list,a.attack,true,map),newDamage=realPrintedDamage(m,owner,x.list,a.attack,true,next),boost=Math.max(0,Math.min(hp,newDamage)-Math.min(hp,oldDamage));return Math.max(before>after?(before-after)*20+(after===0?55:0)+(x.list===owner.active?20:5):0,boost+(newDamage>=hp&&oldDamage<hp?80:0));`);
replace('function realDamage(m,attacker,target,attack){','function realDamage(m,attacker,target,attack,override){');
replace('owner?realPrintedDamage(m,owner,attacker,attack):','owner?realPrintedDamage(m,owner,attacker,attack,false,override):');
replace('oldDamage=realPrintedDamage(m,owner,x.list,a.attack,true,map),newDamage=realPrintedDamage(m,owner,x.list,a.attack,true,next)', 'oldDamage=realDamage(m,x.list,op.active,a.attack,map),newDamage=realDamage(m,x.list,op.active,a.attack,next)');
replace("const drawBonus=onPlay&&until&&bench<5?Math.max(0,Number(until[1])-Math.max(0,cards.length-1))*22:0;",`const postPlayHand=Math.max(0,cards.length-(cards.some(x=>x.id===c.id)?1:0)),fixedDraw=drawText.match(/discard your hand and draw (\\d+) cards/i),availableBench=bench<p.bench.length;
   const drawBonus=onPlay&&availableBench?Math.max(0,Number((until||fixedDraw)?.[1]||0)-postPlayHand)*22:0;
   const supporterAvailable=p.supporterTurn!==m.store.state.turn&&!cards.some(x=>x.trainerType===R.TrainerType.SUPPORTER),supporterSearch=onPlay&&availableBench&&supporterAvailable&&/search your deck for (?:a|1) Supporter/i.test(drawText)?60:0;`);
replace('return drawBonus+12+', 'return supporterSearch+drawBonus+12+');
replace('  const draw=hand.some(', '  value-=Math.min(op.hand.cards.length,10)*4;\n  if(op.deck.cards.length<4)value+=(4-op.deck.cards.length)*45;\n  const draw=hand.some(');
replace('if(/draw|professor|colress|\\bbill\\b|\\bn\\b/.test(text))', 'if(realOwnDraw(c))');
replace("&&/draw|professor|colress/i.test(c.name+' '+c.text)", '&&realOwnDraw(c)');
replace(' function realisticPrompt(',fs.readFileSync(path.join(__dirname,'tournament-discard.fragment.js'),'utf8')+' function realisticPrompt(');
replace("const origin=m.journal.slice().reverse().find(a=>a.type!=='prompt');", "const previous=m.journal.slice().reverse(),last=previous.find(a=>a.type!=='prompt'),origin=last&&{...last,copiedAttackName:previous.find(a=>a.type==='prompt'&&a.value?.attack)?.value.attack};");
replace('  const tactical=realCounterPrompt(m,q,owner,out);','  const discarded=realDiscardPrompt(m,q,owner,origin,out);if(discarded)return discarded;\n  const tactical=realCounterPrompt(m,q,owner,out);');
fs.writeFileSync(path.join(ui,'bot-ai.js'),s);
let b=fs.readFileSync(path.join(baseUI,'bot-ui.js'),'utf8').replace("15000);","45000);");fs.writeFileSync(path.join(ui,'bot-ui.js'),b);
console.log('Isolated turn planning, correct Energy/Prize models, repeatable powers and public-board replies generated.');
