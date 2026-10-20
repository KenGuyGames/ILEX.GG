const fs=require('fs'),path=require('path'),ui=path.resolve(__dirname,'../unlimited-candidate/ui');
let p=path.join(ui,'rules-match.js'),s=fs.readFileSync(p,'utf8');
if(!s.includes('function constructionIssues(')){
 const fn=`  function constructionIssues(counts,map,profile){
    const names=[];for(const [id,n]of Object.entries(counts)){if(!map[id])return null;if(!Number.isInteger(n)||n<1||n>200)return ['Invalid deck quantity.'];for(let i=0;i<n;i++)names.push(resolveCardName(map[id],profile));}
    if(names.length!==60)return ['Needs 60 cards (currently '+names.length+').'];
    const all=names.map(n=>prototypes.get(n));if(all.some(c=>!c))return null;
    const issues=[];for(const [tag,label]of [[R.CardTag.ACE_SPEC,'ACE SPEC'],[R.CardTag.RADIANT,'Radiant Pokémon'],[R.CardTag.STAR,'Pokémon Star']])if(all.filter(c=>c.tags.includes(tag)).length>1)issues.push('At most 1 '+label+' card is allowed in the entire deck.');
    const prism={};for(const c of all.filter(c=>c.tags.includes(R.CardTag.PRISM_STAR)))prism[c.name]=(prism[c.name]||0)+1;for(const [name,n]of Object.entries(prism))if(n>1)issues.push(name+': only 1 Prism Star with this name is allowed.');
    if(!new R.DeckAnalyser(names).isValid(R.Format.UNLIMITED)&&!issues.length)issues.push('Deck fails the game’s copy, Basic Pokémon, named-card or special-card construction rules.');
    return issues;
  }
`;
 s=s.replace('  function create(spec,',fn+'  function create(spec,');s=s.replace('prototypes,resolveCardName,','prototypes,resolveCardName,constructionIssues,');fs.writeFileSync(p,s);
}
p=path.join(ui,'rules-ui.js');s=fs.readFileSync(p,'utf8').replace("(f?.id==='expanded'?'expanded':'modern')","(f?.id==='unlimited'?'unlimited':f?.id==='expanded'?'expanded':'modern')").replaceAll("f.ruleProfile||'modern'","f.ruleProfile||(f.id==='unlimited'?'unlimited':'modern')");fs.writeFileSync(p,s);
p=path.join(ui,'app.js');s=fs.readFileSync(p,'utf8').replace("{id:'unlimited',name:'Unlimited',size:60","{id:'unlimited',name:'Unlimited',ruleProfile:'unlimited',size:60");
if(!s.includes('const unlimitedConstruction='))s=s.replace('function deckFormatIssues(d,f,lookup){',`function deckFormatIssues(d,f,lookup){
 const unlimitedConstruction=f&&(f.ruleProfile==='unlimited'||!f.ruleProfile&&f.id==='unlimited')&&+f.size===60&&+f.copies===4&&typeof RulesMatch!=='undefined'&&typeof ruleMap!=='undefined'?RulesMatch.constructionIssues(d.cards,ruleMap,'unlimited'):null;
 if(unlimitedConstruction){const issues=[...unlimitedConstruction],pool=String(f.sets||'').split(',').map(x=>x.trim()).filter(Boolean),bans=String(f.banned||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);for(const id of Object.keys(d.cards)){const c=lookup(id);if(!c||c.detailsUnavailable){issues.push(id+': could not verify details.');continue;}if(c.custom&&!f.custom)issues.push(c.name+': custom cards not allowed.');if(bans.includes(id.toLowerCase())||bans.includes(String(c.name).toLowerCase()))issues.push(c.name+' is banned.');if(pool.length&&!c.custom&&!limitlessPrintingAllowed(id,c,f,pool))issues.push(c.name+' is outside the allowed sets.');}return issues;}
`);fs.writeFileSync(p,s);
console.log('Unlimited default and effective construction validation staged; saved games and removed presets untouched.');
