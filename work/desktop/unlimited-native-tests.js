(async()=>{
 const M=RulesMatch,R=M.R,checks=[],check=(v,s)=>{if(!v)throw Error('Unlimited native: '+s);checks.push(s);};
 const old={match:rulesMatch,tab,mode:tableMode,suspended:botSuspended,focus:seatFocus,paused:state.botPaused,formats:state.formats.slice(),setupFormat:matchSetupFormat,setupDecks:matchSetupDecks.slice()};
 check(M.profiles.unlimited.unlimitedRules&&M.profiles.unlimited.svEraRules&&M.profiles.unlimited.wotcPowerConditions,'All-era profile uses current turn/Tool rules and legacy Power conditions');
 const format={id:'qa-unlimited',name:'Unlimited native fixture',ruleProfile:'unlimited',sets:'',banned:'',copies:4,size:60,prizes:6,custom:true};state.formats.push(format);
 check(rulesProfileFor({format:format.id})==='unlimited','Format selects the Unlimited profile');
 const good={name:'Good',format:format.id,cards:{'bw1-1':4,'base1-71':1,'sve-001':55}},bad={name:'Bad',format:format.id,cards:{'bw1-1':4,'base1-71':1,'bw7-137':1,'sve-001':54}};
 check(!deckFormatIssues(good,format,id=>cardMetadata[id]).length,'Deck UI accepts one old Computer Search using current ACE SPEC rules');
 check(deckFormatIssues(bad,format,id=>cardMetadata[id]).some(s=>s.includes('ACE SPEC')),'Deck UI rejects two ACE SPEC across old/new printings');
 const deck={name:'Unlimited saved fixture',cards:{'bw1-1':4,'base1-91':2,'sve-001':54}},natural=M.create({profile:'unlimited',seed:73,decks:[deck,deck],format},ruleMap);
 for(let i=0;i<18&&natural.store.state.phase!==R.GamePhase.FINISHED;i++){const p=M.pending(natural)[0],id=p?.playerId??natural.store.state.players[natural.store.state.activePlayer].id;M.apply(natural,BotAI.choose(natural,id,'easy'));}
 const saved={spec:natural.spec,journal:natural.journal,undoHistory:M.undoPoints(natural)},restored=M.restore(saved,ruleMap);
 const snap=m=>JSON.stringify({turn:m.store.state.turn,phase:m.store.state.phase,random:m.randomState,players:m.store.state.players.map(p=>[p.hand,p.deck,p.discard,...p.prizes,p.active,...p.bench].map(l=>l.cards.map(c=>[c._labId,c.fullName,c.trainerType,c.name])))});
 check(snap(natural)===snap(restored),'Unlimited saved replay preserves effective rules and original printing IDs');
 if(natural.journal.length){M.checkpoint(natural,natural.journal.length-1);const undo=M.undoAction(natural,ruleMap),expected=M.restore({spec:natural.spec,journal:natural.journal.slice(0,-1)},ruleMap);check(snap(undo)===snap(expected),'Unlimited Undo preserves exact replay');}
 const m=M.create({profile:'unlimited',seed:7,decks:[{name:'Display',cards:{'bw1-1':4,'sve-001':56}},{name:'Display',cards:{'bw1-1':4,'sve-001':56}}],format},ruleMap);
 for(let i=0;i<200&&M.pending(m).length;i++)M.apply(m,BotAI.prompt(m,M.pending(m)[0],'easy'));
 const [p,o]=m.store.state.players;m.store.state.turn=5;m.store.state.activePlayer=0;let serial=0;
 const put=(id,list)=>{const c=R.CardManager.getInstance().getCardByName(M.resolveCardName(ruleMap[id],'unlimited'));c._labId=id;c.id=-(980000+serial++);list.cards.push(c);return c;};
 for(const owner of [p,o]){for(const l of [owner.active,...owner.bench]){l.cards=[];l.tools=[];l.energies.cards=[];l.damage=0;l.specialConditions=[];}owner.hand.cards=[];}
 put('base1-2',p.active);put('ex1-7',p.bench[0]);put('hgss4-96',p.bench[1]);put('me01-003',p.bench[2]);put('sm1-96',p.bench[3]);put('base3-3',p.bench[4]);put('sv01-081',o.active);put('xy1-1',o.bench[0]);put('swsh1-138',o.bench[1]);put('sve-003',p.active);const bill=put('base1-91',p.hand);put('xy4-97',p.hand);
 check(bill.trainerType===R.TrainerType.SUPPORTER&&bill._labId==='base1-91','Original Bill artwork/ID uses effective Supporter classification');
 botSuspended=true;botGeneration++;clearTimeout(botTimer);rulesMatch=m;matchSetupFormat=format.id;matchSetupDecks=['',''];tab='play';tableMode='rules';state.botPaused=true;render();
 check($('#ruleprofile').value==='unlimited','Live table retains Unlimited profile');
 check(document.querySelectorAll('[data-power-marker]').length===4,'Unlimited exposes both players’ independent GX and VSTAR markers');
 for(const img of document.querySelectorAll('.seat-half img')){try{await img.decode();}catch(e){throw Error('Unlimited scan decode: '+img.src+' '+String(e));}}
 const before=JSON.stringify({journal:m.journal,random:m.randomState});openCardActions(p.id,0,true);check(cardActionDialog.open,'Enlarged historical Pokémon opens in an Unlimited match');await cardActionDialog.querySelector('img').decode();check(cardActionView.entries.some(e=>e.kind==='attack')&&cardActionView.entries.some(e=>e.kind==='retreat'),'Historical attacks and Retreat retain enlarged actions');cardActionDialog.close();check(JSON.stringify({journal:m.journal,random:m.randomState})===before,'Cross-era inspection is read-only');
 p.usedGX=true;p.usedVSTAR=false;play();check(document.querySelector('[data-marker-player="'+p.id+'"][data-power-marker="gx"]').dataset.used==='true'&&document.querySelector('[data-marker-player="'+p.id+'"][data-power-marker="vstar"]').dataset.used==='false','GX use never consumes VSTAR');
 window.unlimitedNativeCleanup=()=>{rulesMatch=old.match;tab=old.tab;tableMode=old.mode;botSuspended=old.suspended;seatFocus=old.focus;state.botPaused=old.paused;state.formats=old.formats;matchSetupFormat=old.setupFormat;matchSetupDecks=old.setupDecks;render();delete window.unlimitedNativeCleanup;};
 return {passed:true,checks,scope:'Cross-era rules/deck validation/table/markers/replay/Undo; actual external two-PC and physical Android remain unverified'};
})()
