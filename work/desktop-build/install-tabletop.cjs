const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'../..'),ui=path.join(root,'work/desktop/ui');
function edit(name,fn){const file=path.join(ui,name);fs.writeFileSync(file,fn(fs.readFileSync(file,'utf8')));}
edit('index.html',s=>s.includes('tabletop.js')?s:s.replace('<link rel="stylesheet" href="ilex-theme.css">','<link rel="stylesheet" href="ilex-theme.css"><link rel="stylesheet" href="tabletop.css">').replace('<script src="rules-ui.js"></script>','<script src="rules-ui.js"></script><script src="tabletop.js"></script>'));
edit('rules-ui.js',s=>{
 if(s.includes('renderSeatedTable(g,prompt)'))return s;
 const start=s.indexOf('  $(\'#app\').innerHTML+=`<div class="rules-board">');
 const end=s.indexOf('  wireSelectors();if(prompt)drawRulePrompt(prompt);',start);
 if(start<0||end<0)throw Error('Table render anchor missing');
 s=s.slice(0,start)+`  $('#app').innerHTML+=renderSeatedTable(g,prompt)+\`<details class="panel"><summary>Game log</summary><div class="log">\${g.logs.slice(-80).reverse().map(l=>esc(friendly(l.message))+' '+esc(Object.entries(l.params||{}).filter(([k])=>k!=='timestamp').map(([k,v])=>k+': '+v).join(' · '))).join('<br>')}</div></details>\`;
`+s.slice(end);
 s=s.replace('  wireSelectors();if(prompt)drawRulePrompt(prompt);',`  const settings=$('#rp1').closest('.panel');const fold=document.createElement('details');fold.className='match-settings';fold.innerHTML='<summary>Match settings · '+esc(RulesMatch.profiles[rulesMatch.spec.profile].name)+'</summary>';settings.before(fold);fold.append(settings);
  wireSelectors();if(prompt)drawRulePrompt(prompt);`);
 // Public stacks can be examined using the same magnifier.
 s=s.replace("p.discard.cards.map(c=>'<p>'+esc(c.name)+'</p>')","p.discard.cards.map(c=>'<div class=\"discard-preview\" '+previewAttrs(c)+'>'+(ruleArt(c)?'<img src=\"'+esc(ruleArt(c))+'\" alt=\"'+esc(c.name)+'\">':'')+'<span>'+esc(c.name)+'</span></div>')");
 s=s.replace("p.lostzone.cards.map(c=>'<p>'+esc(c.name)+'</p>')","p.lostzone.cards.map(c=>'<div class=\"discard-preview\" '+previewAttrs(c)+'>'+(ruleArt(c)?'<img src=\"'+esc(ruleArt(c))+'\" alt=\"'+esc(c.name)+'\">':'')+'<span>'+esc(c.name)+'</span></div>')");
 return s;
});
const dest=path.join(root,'outputs/ILEX.GG-win32-x64/resources/app/ui');
for(const file of ['index.html','rules-ui.js','tabletop.js','tabletop.css','ilex-card-back.svg'])fs.copyFileSync(path.join(ui,file),path.join(dest,file));
console.log('Seated table and card magnifier installed');
