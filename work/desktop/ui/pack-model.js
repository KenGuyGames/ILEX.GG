/* Independent simulation: no match engine calls and no deck availability restrictions. */
(function(root){
 const BOOST=1.12;
 const finishes=typeof module!=='undefined'&&module.exports?require('./pack-finishes.js'):root.PackFinishes;
 const parallelFinishes=['reverse','pokeball','masterball','friendball','loveball','quickball','duskball','energy-symbols','team-rocket'];
 const ascendedPatterns=['pokeball','friendball','loveball','quickball','duskball','team-rocket'];
 const specials=typeof module!=='undefined'&&module.exports?require('./pack-specials.js'):root.PackSpecials;
 const reverseIds=new Set(finishes.reverse);
 const subsetParents={exu:'ex10',sma:'sm115','swsh4.5sv':'swsh4.5','swsh12.5gg':'swsh12.5',swsh9tg:'swsh9',swsh10tg:'swsh10',swsh11tg:'swsh11',swsh12tg:'swsh12',cel25cc:'cel25','30th-c':'30th'};
 const packSetId=id=>{const set=id.slice(0,id.lastIndexOf('-'));return subsetParents[set]||set;};
 const sources=[{title:'Base Set pack study (153 packs)',url:'https://www.cs.sjsu.edu/~stamp/cv/papers/pokemon.pdf'},{title:'Booster contents and historical sizes',url:'https://bulbapedia.bulbagarden.net/wiki/Booster_pack_(TCG)'},{title:'Official modern booster contents',url:'https://support.pokemon.com/hc/en-us/articles/360000981613-What-can-I-expect-in-a-Pok%C3%A9mon-Trading-Card-Game-booster-pack'}];
 const basic=d=>d.category==='Energy'&&(d.subtypes||[]).includes('Basic')&&(!d.rarity||['Common','None'].includes(d.rarity));
 function tier(d){const r=d.rarity||'';if(basic(d))return 'energy';if(/^(AR|RT|SH)\d/.test(d.number||''))return 'subset';if(r==='Common')return 'common';if(r==='Uncommon')return 'uncommon';if(r==='Rare')return 'rare';if(r==='Rare Holo')return 'holo';if(/Holo Star|Secret|Rainbow|Shining|Hyper|Special Illustration|Mega Hyper|Black White/.test(r))return 'secret';if(/Illustration Rare|Gallery|Radiant|Amazing|Prism|BREAK|Prime|Shiny/.test(r))return 'bonus';if(/Holo (?:EX|GX|V|LV)|Ultra|Double Rare|LEGEND|ACE/.test(r))return 'ultra';return null;}
 function shape(id){
  if(/^(base[1-5]|gym[12]|neo[1-4])$/.test(id))return {era:'Wizards',common:['base1','base4'].includes(id)?5:7,uncommon:3,energy:['base1','base4'].includes(id)?2:0,reverse:0};
  if(id==='lc')return {era:'Legendary Collection',common:6,uncommon:3,reverse:1};
  if(/^(ecard[1-3]|ex(?:[1-9]|1[0-6]))$/.test(id))return {era:/^ex/.test(id)?'EX':'e-Card',common:5,uncommon:2,reverse:1};
  if(/^(dp[1-7]|pl[1-4]|hgss[1-4]|col1|bw(?:[1-9]|10)|xy(?:[1-9]|1[0-2]))$/.test(id))return {era:/^(dp|pl)/.test(id)?'DP / Platinum':'HGSS / BW / XY',common:5,uncommon:3,reverse:1};
  if(/^(sm(?:[1-9]|1[0-2])|swsh(?:[1-9]|1[0-2]))$/.test(id))return {era:/^sm/.test(id)?'Sun & Moon':'Sword & Shield',common:5,uncommon:3,reverse:1,energy:1};
  if(/^me(?:0[1-5]|02\.5)$/.test(id))return {era:'Mega Evolution',common:4,uncommon:3,reverse:2,energy:1,modern:true};
  if(/^sv(?:0[1-9]|10|03\.5|04\.5|06\.5|08\.5|10\.5[bw])$/.test(id))return {era:'Scarlet & Violet',common:4,uncommon:3,reverse:2,energy:1,modern:true};
  if(['sm3.5','sm7.5','sm115','swsh3.5','swsh4.5','swsh10.5','swsh12.5'].includes(id))return {era:id.startsWith('sm')?'Sun & Moon':'Sword & Shield',common:5,uncommon:3,reverse:1,energy:1};
  if(['bw11','g1'].includes(id))return {era:id==='bw11'?'HGSS / BW / XY':'XY special',common:3,uncommon:3,reverse:1,radiant:2};
  if(id==='dc1')return {era:'XY special',common:3,uncommon:2,reverse:1};
  if(id==='dv1')return {era:'HGSS / BW / XY',common:0,uncommon:0,slots:['allHolo','allHolo','allHolo','allHolo','allHolo'],allFoil:true};
  if(id==='det1')return {era:'Sun & Moon',common:3,uncommon:0,allFoil:true};
  if(id==='cel25')return {era:'Sword & Shield',common:0,uncommon:0,slots:['celebration','celebration','classicOrMain','rareHit'],allFoil:true};
  if(id==='30th')return {era:'Mega Evolution',common:0,uncommon:0,energy:1,modern:true,slots:['allFoil','allFoil','allFoil','pikachu','rareHit','energy'],allFoil:true};
  return null;
 }
 function build(cards,sets,details){
  const profiles=[];const grouped=new Map();for(const c of cards){const id=c.id.slice(0,c.id.lastIndexOf('-'));if(!grouped.has(id))grouped.set(id,[]);grouped.get(id).push(c);}
  for(const set of sets){const layout=shape(set.id);if(!layout)continue;const own=grouped.get(set.id)||[],pools={common:[],uncommon:[],rare:[],holo:[],ultra:[],secret:[],bonus:[],subset:[],energy:[],reverse:[],double:[],full:[],illustration:[],special:[],hyper:[],ace:[],radiant:[],allHolo:[],celebration:[],classic:[],pikachu:[],allFoil:[],pokeball:[],masterball:[],friendball:[],loveball:[],quickball:[],duskball:[],'energy-symbols':[],'team-rocket':[]};
   for(const c of own){const d=details[c.id]||{},rc=/^RC/i.test(d.number||c.id.slice(c.id.lastIndexOf('-')+1));if(layout.radiant&&rc){pools.radiant.push(c.id);continue;}const t=layout.modern?({'Double Rare':'double','Ultra Rare':'full','Illustration Rare':'illustration','Special Illustration Rare':'special','Hyper Rare':'hyper','ACE SPEC Rare':'ace','Mega Hyper Rare':'hyper','Black White Rare':'hyper','MEGA_ATTACK_RARE':'special','Futuristic Rare':'hyper'}[d.rarity]||tier(d)):tier(d);if(t)pools[t].push(c.id);for(const kind of parallelFinishes.slice(1))if(finishes.special[c.id]?.[kind])pools[kind].push(c.id);if(set.id==='dv1')pools.allHolo.push(c.id);if(set.id==='cel25'&&['rare','holo'].includes(t))pools.celebration.push(c.id);if(d.rarity==='Pikachu Rare')pools.pikachu.push(c.id);if(set.id==='30th'&&['common','rare'].includes(t))pools.allFoil.push(c.id);if(t==='energy'&&!layout.energy&&d.rarity==='Common')pools.common.push(c.id);if(['common','uncommon','rare','holo'].includes(t)||t==='energy'&&reverseIds.has(c.id))pools.reverse.push(c.id);}
   // Dedicated subsets occupy the parallel-foil slot, never the ordinary common/rare slot.
   const subsetId=Object.keys(subsetParents).find(id=>subsetParents[id]===set.id&&!['cel25cc','30th-c'].includes(id));
   if(subsetId)pools.subset.push(...(grouped.get(subsetId)||[]).map(c=>c.id));
   if(set.id==='cel25'||set.id==='30th')pools.classic=(grouped.get(set.id==='30th'?'30th-c':'cel25cc')||[]).map(c=>c.id);
   if(layout.energy&&!pools.energy.length){const from=layout.modern?'sve':/^sm|^swsh/.test(set.id)?'sm1':set.id;pools.energy=(grouped.get(from)||[]).filter(c=>basic(details[c.id]||{})).map(c=>c.id);}
   if(set.id==='sv08.5'){pools.reverse=pools.reverse.filter(id=>finishes.special[id]?.reverse);const types=new Set();for(const id of pools.energy){const name=details[id]?.name;if(!types.has(name)){types.add(name);pools.reverse.push(id);}}}
   if(set.id==='me02.5')pools.reverse=pools.reverse.filter(id=>finishes.special[id]?.plainReverse);
   if(/^ecard[23]$/.test(set.id))pools.reverse=pools.reverse.filter(id=>!/^H/i.test(details[id]?.number||''));
   if(!layout.slots&&((layout.common&&!pools.common.length)||(layout.uncommon&&!pools.uncommon.length)||!(pools.rare.length||pools.holo.length)||layout.reverse&&!pools.reverse.length)||layout.energy&&!pools.energy.length||layout.radiant&&!pools.radiant.length)continue;
   const modern=layout.modern,rareOdds=[];
   const add=(kind,rate)=>{if(pools[kind].length)rareOdds.push({kind,base:rate,boosted:rate*BOOST});};
   if(modern){add('double',1/6);add('full',1/15);if(set.id==='30th'){add('classic',1/10);add('illustration',1/10);add('special',1/32);add('hyper',1/54);}}else{if(pools.rare.length)add('holo',pools.ultra.length?.23:1/3);add('ultra',layout.era==='EX'?.1:/^(dp|pl)/.test(set.id)?.06:.12);add('secret',/^(ecard|ex)/.test(set.id)?.009:.015);if(!layout.reverse)add('bonus',.012);}
   const baseKind=modern&&pools.rare.length?'rare':pools.rare.length?'rare':'holo';
   const total=rareOdds.reduce((n,x)=>n+x.boosted,0);rareOdds.unshift({kind:baseKind,base:1-rareOdds.reduce((n,x)=>n+x.base,0),boosted:1-total});
   const bonusOdds=[];const bonus=(kind,rate,slotIndex=(layout.reverse||1)-1)=>{if(pools[kind].length)bonusOdds.push({kind,base:rate,boosted:rate*BOOST,slotIndex});};
   if(layout.reverse){if(modern){bonus('illustration',1/13);bonus('special',1/32);bonus('hyper',1/54);bonus('ace',1/20,0);bonus('bonus',1/5);bonus('masterball',/^sv10\.5[bw]$/.test(set.id)?1/15:1/20,0);if(set.id!=='me02.5')bonus('pokeball',1/3,0);}else{bonus('bonus',/^hgss/.test(set.id)?.1:.07);bonus('subset',.1);}if(/^ecard[23]$/.test(set.id)){
     // Crystal Pokemon were available as both regular holo and parallel foil.
     bonus('secret',.009);
    }}
   if(set.id==='me02.5'){for(const [slot,kinds]of [[0,ascendedPatterns],[1,['energy-symbols']]]){const upgrades=bonusOdds.filter(o=>o.slotIndex===slot),base=1-upgrades.reduce((n,o)=>n+o.base,0),boosted=1-upgrades.reduce((n,o)=>n+o.boosted,0),total=pools.reverse.length+kinds.reduce((n,k)=>n+pools[k].length,0);for(const kind of kinds)if(pools[kind].length)bonusOdds.push({kind,slotIndex:slot,base:base*pools[kind].length/total,boosted:boosted*pools[kind].length/total,cosmetic:true});}}
   profiles.push({id:set.id,name:set.name,...layout,pools,rareOdds,bonusOdds,specials:specials.build(set.id,own,details,BOOST),count:layout.slots?.length||layout.common+layout.uncommon+(layout.reverse||0)+(layout.energy||0)+(layout.radiant||0)+1,rateLabel:set.id==='base1'?'Simulated pack collation':'Simulated pack collation',note:'Independent packs; no guaranteed box hits. Cards are uniform within each modeled tier. Unpublished chase odds and subset collation are estimates.'});
  }return profiles;
 }
 function pick(pool,rng,used){const available=pool.filter(id=>!used.has(id)),ids=available.length?available:pool;if(!ids.length)throw Error('Empty booster slot');const id=ids[Math.floor(rng()*ids.length)];used.add(id);return id;}
 function weighted(odds,rng,key='boosted'){const n=rng();let sum=0;for(const o of odds){sum+=o[key];if(n<sum)return o.kind;}return odds.at(-1).kind;}
 function generate(profile,rng=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296,options={}){
  if(!profile)throw Error('Choose a supported booster set');const result=[],used=new Set();
  const put=(pool,slot,finish)=>{const id=pick(profile.pools[pool],rng,used);result.push({id,slot,finish:finish||(profile.allFoil?'holo':undefined)||(['holo','ultra','secret','bonus','subset','double','full','illustration','special','hyper','ace'].includes(pool)||profile.modern&&pool==='rare'?'holo':'normal'),tier:pool,revealed:false});};
  if(profile.slots){for(const kind of profile.slots){if(kind==='rareHit'){const selected=weighted(profile.rareOdds,rng);put(selected,selected==='classic'?'Classic Collection':'Rare slot');}else if(kind==='classicOrMain'){const classic=profile.pools.classic.length&&rng()<.28;put(classic?'classic':'celebration',classic?'Classic Collection':'Holo');}else put(kind,kind==='energy'?'Basic Energy':kind==='pikachu'?'Pikachu rare':'Holo');}return result;}
  for(let i=0;i<profile.common;i++)put('common','Common');for(let i=0;i<profile.uncommon;i++)put('uncommon','Uncommon');
  for(let i=0;i<(profile.energy||0);i++)put('energy','Basic Energy');
  for(let i=0;i<(profile.reverse||0);i++){let kind='reverse';const chance=rng();let sum=0;for(const o of profile.bonusOdds.filter(o=>o.slotIndex===i)){sum+=o.boosted;if(chance<sum){kind=o.kind;break;}}put(kind,kind==='reverse'?'Reverse foil':'Bonus slot',parallelFinishes.includes(kind)?kind:kind==='secret'&&/^ecard[23]$/.test(profile.id)?'reverse':undefined);}
  for(let i=0;i<(profile.radiant||0);i++)put('radiant','Radiant Collection','holo');
  put(weighted(profile.rareOdds,rng),'Rare slot');return options.special===false?result:specials.roll(profile,result,rng);
 }
 const api={BOOST,parallelFinishes,subsetParents,packSetId,sources,basic,tier,shape,build,generate,weighted};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PackModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
