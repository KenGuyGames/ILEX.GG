 function realCountDamage(m,p,attack,base){
  const text=attack.text||'',match=text.match(/(\d+)\s+(more\s+)?damage\s+(?:for each|times(?: the number of)?|for every)\s+([^.!]+)/i);if(!match)return null;
  const subject=match[3];if(!/Pok[eé]mon/i.test(subject)||!/(?:Bench|in play)/i.test(subject))return null;
  if(/different|Evolved|Stage\s*\d/i.test(subject))return null;
  if(/\bthat\b|\bwith\b/i.test(subject)&&!/damage counters|Energy attached|Abilities/i.test(subject))return null;
  const op=m.store.state.players.find(x=>x!==p),owners=/both|each player/i.test(subject)?[p,op]:/opponent/i.test(subject)?[op]:/your/i.test(subject)?[p]:[];if(!owners.length)return null;
  let lists=owners.flatMap(owner=>/Bench/i.test(subject)?owner.bench.filter(l=>l.getPokemonCard()&&!l.isSecret):realSlots(owner));
  const type=subject.match(/\b(Grass|Fire|Water|Lightning|Psychic|Fighting|Darkness|Metal|Colorless|Dragon|Fairy)\s+Pok[eé]mon/i);
  if(type){const t=({grass:R.CardType.GRASS,fire:R.CardType.FIRE,water:R.CardType.WATER,lightning:R.CardType.LIGHTNING,psychic:R.CardType.PSYCHIC,fighting:R.CardType.FIGHTING,darkness:R.CardType.DARK,metal:R.CardType.METAL,colorless:R.CardType.COLORLESS,dragon:R.CardType.DRAGON,fairy:R.CardType.FAIRY})[type[1].toLowerCase()];lists=lists.filter(l=>{let types=realMemo(m).types.get(l);if(!types){types=l.getPokemonCard().cardType;try{const e=new R.CheckPokemonTypeEffect(l);m.store.reduceEffect(m.store.state,e);types=e.cardTypes;}catch{}realMemo(m).types.set(l,types);}return types.includes(t);});}
  const tags=[];if(/Pok[eé]mon[- ]GX/.test(subject))tags.push(R.CardTag.POKEMON_GX);if(/Pok[eé]mon[- ]EX/.test(subject))tags.push(R.CardTag.POKEMON_EX);if(/Pok[eé]mon[- ]ex/.test(subject))tags.push(R.CardTag.POKEMON_ex);if(/Pok[eé]mon V\b/.test(subject))tags.push(R.CardTag.POKEMON_V,R.CardTag.POKEMON_VMAX,R.CardTag.POKEMON_VSTAR,R.CardTag.POKEMON_VUNION);if(/Pok[eé]mon VMAX/.test(subject))tags.push(R.CardTag.POKEMON_VMAX);if(/Pok[eé]mon VSTAR/.test(subject))tags.push(R.CardTag.POKEMON_VSTAR);for(const [word,tag]of [['Ancient',R.CardTag.ANCIENT],['Future',R.CardTag.FUTURE],['Ultra Beast',R.CardTag.ULTRA_BEAST],['Team Plasma',R.CardTag.TEAM_PLASMA],['Fusion Strike',R.CardTag.FUSION_STRIKE],['Rapid Strike',R.CardTag.RAPID_STRIKE],['Single Strike',R.CardTag.SINGLE_STRIKE],['TAG TEAM',R.CardTag.TAG_TEAM]])if(subject.includes(word))tags.push(tag);if(tags.length)lists=lists.filter(l=>l.getPokemonCard().tags.some(t=>tags.includes(t)));
  if(/Basic Pok[eé]mon/i.test(subject))lists=lists.filter(l=>l.getPokemonCard().stage===R.Stage.BASIC);
  if(/with Abilities/i.test(subject))lists=lists.filter(l=>l.getPokemonCard().powers.some(p=>p.powerType===R.PowerType.ABILITY));
  if(/damage counters/i.test(subject))lists=lists.filter(l=>l.damage>0);if(/Energy attached/i.test(subject))lists=lists.filter(l=>realEnergy(m,owners.find(o=>realSlots(o).includes(l)),l).length>0);
  return (match[2]?base:0)+Number(match[1])*lists.length;
 }
