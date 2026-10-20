 function realOwnDraw(card){
  return (card.text||'').split(/[.!]/).some(text=>/\bdraws?\b/i.test(text)&&(!/your opponent\b[^.!]*\bdraws?\b/i.test(text)||/each player|both players|you and your opponent|\byou (?:may )?draw\b/i.test(text)));
 }
 function realResourceDamage(m,p,list,attack,override){
  const text=attack.text||'',base=Number(attack.damage)||0,op=m.store.state.players.find(x=>x!==p);
  const counter=text.match(/(\d+)\s+(more\s+)?damage\s+(?:for each|times(?: the number of)?)\s+damage counters?\s+on\s+([^.!]+)/i);
  if(counter){const target=/opponent|Defending/i.test(counter[3])?op.active:list;return (counter[2]?base:0)+Number(counter[1])*Math.floor(target.damage/10);}
  const match=text.match(/(\d+)\s+(more\s+)?damage\s+(?:for each|times(?: the (?:amount|number) of)?)\s+([^.!]+)/i);
  if(!match||!(/Energy(?: cards?)? attached/i.test(match[3])))return null;
  const subject=match[3],symbol=subject.match(/\[([GRWLPFDMNCY])\]/i),word=subject.match(/\b(Grass|Fire|Water|Lightning|Psychic|Fighting|Darkness|Metal|Colorless|Dragon|Fairy)\s+Energy/i),types={g:R.CardType.GRASS,r:R.CardType.FIRE,w:R.CardType.WATER,l:R.CardType.LIGHTNING,p:R.CardType.PSYCHIC,f:R.CardType.FIGHTING,d:R.CardType.DARK,m:R.CardType.METAL,c:R.CardType.COLORLESS,n:R.CardType.DRAGON,y:R.CardType.FAIRY,grass:R.CardType.GRASS,fire:R.CardType.FIRE,water:R.CardType.WATER,lightning:R.CardType.LIGHTNING,psychic:R.CardType.PSYCHIC,fighting:R.CardType.FIGHTING,darkness:R.CardType.DARK,metal:R.CardType.METAL,colorless:R.CardType.COLORLESS,dragon:R.CardType.DRAGON,fairy:R.CardType.FAIRY},type=symbol?types[symbol[1].toLowerCase()]:word?types[word[1].toLowerCase()]:undefined;
  const units=map=>map.flatMap(e=>(e.providedGroups||[e.provides]).flatMap(g=>new Set(g).size>1?[g]:g.map(t=>[t]))),matches=g=>type===undefined||g.includes(type)||g.includes(R.CardType.ANY),count=map=>/Energy cards? attached/i.test(subject)?map.filter(e=>units([e]).some(matches)).length:units(map).filter(matches).length;
  let maps;if(/both Active|this Pok[eé]mon and (?:the |your opponent.s )?(?:Defending|Active)/i.test(subject))maps=[override||realEnergy(m,p,list),realEnergy(m,op,op.active)];
  else if(/(?:all|each) (?:of )?(?:the )?Pok[eé]mon in play|both players/i.test(subject))maps=m.store.state.players.flatMap(owner=>realSlots(owner).map(l=>l===list&&override?override:realEnergy(m,owner,l)));
  else if(/opponent|Defending/i.test(subject))maps=[realEnergy(m,op,op.active)];
  else if(/(?:all|each) (?:of )?your Pok[eé]mon/i.test(subject))maps=realSlots(p).map(l=>l===list&&override?override:realEnergy(m,p,l));
  else if(/this Pok[eé]mon|but not used|attached to (?:it|[A-Z][a-z]+)/i.test(subject))maps=[override||realEnergy(m,p,list)];else return null;
  const basic=/\bBasic(?:\s+(?:\[[A-Z]\]|[A-Za-z]+))?\s+Energy/i.test(subject),distinct=/\bdifferent\b|\btypes? of\b/i.test(subject);if(distinct&&!basic)return null;
  if(basic)maps=maps.map(map=>map.filter(e=>e.card?.energyType===R.EnergyType.BASIC));
  let n=distinct?new Set(maps.flatMap(map=>map.flatMap(e=>(e.card.provides||e.provides).filter(t=>t!==R.CardType.ANY&&t!==R.CardType.NONE)))).size:maps.reduce((sum,map)=>sum+count(map),0);
  if(/but not used to pay/i.test(subject)){let cost=attack.cost;try{const e=new R.CheckAttackCostEffect(p,attack,list);m.store.reduceEffect(m.store.state,e);cost=e.cost;}catch{}const other=units(maps[0]).filter(g=>!matches(g)).map(provides=>({provides}));n=Math.max(0,n-realMissing(other,cost));const limit=text.match(/Extra[\s\S]*?after (?:the )?(\d+)(?:st|nd|rd|th)/i);if(limit)n=Math.min(n,Number(limit[1]));}
  let bonus=Number(match[1])*n;const cap=text.match(/can(?:not|'t) add more than (\d+) damage/i);if(cap)bonus=Math.min(bonus,Number(cap[1]));return (match[2]?base:0)+bonus;
 }
