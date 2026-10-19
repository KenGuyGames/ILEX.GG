(async()=>{
 const M=RulesMatch,R=M.R,checks=[],check=(v,s)=>{if(!v)throw Error('Mega native: '+s);checks.push(s);},old={match:rulesMatch,tab,mode:tableMode,suspended:botSuspended,focus:seatFocus,paused:state.botPaused};
 check(M.profiles.mega?.svEraRules&&M.profiles.mega?.bwEraRules,'Mega profile uses modern BW-onward framework');
 const cov=await fetch('mega-coverage.json').then(r=>r.json());check(cov.available===1293,'All 1293 standard-game Mega printings mapped');
 for(const prefix of ['mee','me01','mep','me02','me02.5','me03','me04','me05','30th','30th-c']){const c=cards.find(c=>c.id.startsWith(prefix+'-')&&ruleMap[c.id]);check(!!c,prefix+' catalog playable');const im=new Image();im.src=ruleArt({_labId:c.id});await im.decode();check(im.naturalWidth>0,prefix+' original scan decodes');}
 for(let n=89;n<=110;n++){const id='mep-'+String(n).padStart(3,'0');check(!!ruleMap[id],id+' distinct promo mapping');const im=new Image();im.src=ruleArt({_labId:id});await im.decode();check(im.naturalWidth>0,id+' verified source scan decodes');}
 check(!ruleMap['mep-Museum']&&!ruleMap['30th-R'],'Collection-only and unconfirmed printings excluded from standard automation');
 const deck={name:'Mega desktop fixture',cards:{'bw1-1':4,'bw1-105':56}},m=M.create({profile:'mega',seed:7,decks:[deck,deck]},ruleMap);
 for(let i=0;i<200&&M.pending(m).length;i++)M.apply(m,BotAI.prompt(m,M.pending(m)[0],'easy'));
 check(!M.pending(m).length,'Mega match setup resolves');const [p,o]=m.store.state.players;m.store.state.turn=5;m.store.state.activePlayer=0;let serial=0;
 const put=(id,list)=>{const c=R.CardManager.getInstance().getCardByName(ruleMap[id]);c._labId=id;c.id=-(970000+serial++);list.cards.push(c);return c;};
 for(const owner of [p,o]){for(const l of [owner.active,...owner.bench]){l.cards=[];l.tools=[];l.energies.cards=[];l.damage=0;l.specialConditions=[];}owner.hand.cards=[];}
 put('me01-003',p.active);put('me01-060',p.bench[0]);put('me02-029',p.bench[1]);put('me02.5-084',p.bench[2]);put('me05-048',p.bench[3]);put('30th-021',p.bench[4]);put('me04-061',o.active);put('me05-027',o.bench[0]);
 for(let i=0;i<4;i++)put('sve-001',p.active);put('mep-093',p.hand);put('me01-120',p.hand);
 check(p.active.getPokemonCard().stage===R.Stage.STAGE_2,'Modern Mega is its printed Stage 2');check(p.active.getPokemonCard().tags.includes(R.CardTag.POKEMON_SV_MEGA),'Modern Mega keeps three-Prize tag');
 botSuspended=true;botGeneration++;clearTimeout(botTimer);rulesMatch=m;tab='play';tableMode='rules';state.botPaused=true;render();
 check([...document.querySelectorAll('.seat-active img')].some(img=>img.alt==='Mega Venusaur ex'),'Modern Mega renders on table');
 for(const img of document.querySelectorAll('.seat-half img'))await img.decode();
 const before=JSON.stringify({journal:m.journal,random:m.randomState});openCardActions(p.id,0,true);check(cardActionDialog.open,'Mega enlarged actions open');await cardActionDialog.querySelector('img').decode();check(cardActionView.entries.some(e=>e.kind==='attack')&&cardActionView.entries.some(e=>e.kind==='retreat'),'Mega attacks and Retreat use enlarged view');check([...cardActionDialog.querySelectorAll('.scan-action')].every(b=>!b.textContent.trim()),'Mega printed action regions remain transparent');cardActionDialog.close();check(JSON.stringify({journal:m.journal,random:m.randomState})===before,'Mega inspection preserves journal and randomness');
 const halves=['30th-c-019','30th-c-020'].map(id=>{const c=R.CardManager.getInstance().getCardByName(ruleMap[id]);c._labId=id;return c;}),composite=await LegendDisplay.compose(ruleArt(halves[0]),ruleArt(halves[1]),halves[0]._labId),legend=new Image();legend.src=composite;await legend.decode();check(legend.naturalHeight>legend.naturalWidth,'Classic LEGEND halves compose into an upright complete card');
 window.megaNativeCleanup=()=>{rulesMatch=old.match;tab=old.tab;tableMode=old.mode;botSuspended=old.suspended;seatFocus=old.focus;state.botPaused=old.paused;render();delete window.megaNativeCleanup;};
 return {passed:true,printings:1293,checks};
})()
