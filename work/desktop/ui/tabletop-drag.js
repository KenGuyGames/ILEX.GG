/* Drag gestures describe intentions; the existing reducer commits every move. */
let tableDrag=null;
const dragOwner=()=>{const g=rulesMatch.store.state,p=RulesMatch.pending(rulesMatch)[0];return g.players.find(x=>x.id===(p?.getPerspectivePlayerId?.()??p?.playerId??g.players[g.activePlayer].id));};
const dragTarget=(player,active,index)=>({player:player===dragOwner().id?RulesMatch.R.PlayerType.BOTTOM_PLAYER:RulesMatch.R.PlayerType.TOP_PLAYER,slot:active?RulesMatch.R.SlotType.ACTIVE:RulesMatch.R.SlotType.BENCH,index});
function wireTableDrag(){
 if(tableMode!=='rules'||!rulesMatch||!document.querySelector('.felt-table'))return;
 const g=rulesMatch.store.state,owner=dragOwner(),pending=RulesMatch.pending(rulesMatch)[0];
 const opponent=rulesMatch.spec.opponent;
 if(opponent?.type==='bot'&&(pending?pending.playerId===opponent.botPlayer:g.players[g.activePlayer].id===opponent.botPlayer))return;
 const near=opponent?.type==='bot'?g.players.find(p=>p.id===opponent.humanPlayer):owner;
 const source=(el,value)=>{el.draggable=true;el.dataset.tableSource=JSON.stringify(value);el.querySelectorAll('img').forEach(i=>i.draggable=false);};
 document.querySelectorAll('.seat-half').forEach(half=>{
  const player=half.classList.contains('near-seat')?near:g.players.find(p=>p!==near);
  half.querySelectorAll('[data-seat-slot]').forEach((slot,i)=>{
   const active=slot.classList.contains('seat-active'),index=active?0:i,list=active?player.active:player.bench[index];
   slot.dataset.tableDrop=JSON.stringify({kind:'slot',player:player.id,active,index});
   const button=slot.querySelector('.seat-pokemon');
   if(list.getPokemonCard()&&!list.isSecret&&(player===owner||pending?.type==='Choose pokemon'))source(button,{kind:'pokemon',player:player.id,active,index});
   slot.querySelectorAll('.seat-energy>span').forEach((el,i)=>{
    const card=[...new Set([...list.cards,...(list.tools||[])])].filter(c=>c!==list.getPokemonCard())[i];
    if(player===owner&&card?.superType===RulesMatch.R.SuperType.ENERGY)source(el,{kind:'energy',player:player.id,active,index,cardIndex:list.cards.indexOf(card)});
   });
  });
  half.querySelector('.seat-discard').dataset.tableDrop=JSON.stringify({kind:'discard',player:player.id});
 });
 document.querySelectorAll('.near-hand .fan-card').forEach((el,index)=>{
  if(!pending&&g.phase===RulesMatch.R.GamePhase.PLAYER_TURN)source(el,{kind:'hand',player:owner.id,index});
  else if(pending?.type==='Choose cards'&&pending.cards===owner.hand)source(el,{kind:'hand',player:owner.id,index});
 });
 const felt=document.querySelector('.felt-table');felt.dataset.tableDrop=JSON.stringify({kind:'trainer',player:owner.id});
 if(!document.querySelector('.trainer-play-zone'))felt.insertAdjacentHTML('beforeend','<div class="trainer-play-zone" data-table-drop=\'{"kind":"trainer","player":'+owner.id+'}\'>PLAY TRAINER / STADIUM</div>');
 if(pending){
  const panel=document.querySelector('.pending-effect');
  if(panel&&!panel.querySelector('.drag-choice-zone'))panel.insertAdjacentHTML('afterbegin','<div class="drag-choice-zone" data-table-drop=\'{"kind":"choice"}\'>Drop a card here to choose it for this effect. Confirm multiple selections below.</div>');
  panel?.querySelectorAll('[data-choice]:not(:disabled)').forEach(el=>source(el,{kind:'choice',row:+el.dataset.choice,prompt:pending.id}));
  if(['Attach energy','Move energy','Discard energy'].includes(pending.type)){
   const rows=assignmentRows(pending);
   panel.querySelectorAll('[data-assign]').forEach((input,i)=>{
    const label=input.closest('label'),row=rows[i];
    if(!label.querySelector('.assignment-card')){label.insertAdjacentHTML('afterbegin','<span class="assignment-card">'+(ruleArt(row.card)?'<img src="'+esc(ruleArt(row.card))+'" alt="'+esc(row.card.name)+'" '+previewAttrs(row.card)+'>':'')+'</span>');source(label.querySelector('.assignment-card'),{kind:'assignment',row:i,prompt:pending.id});}
   });
  }
 }
 document.querySelector('.seat-player-bar span').textContent='Drag to play · Right-click to magnify · Click for actions';
}
function dragCard(d){const p=rulesMatch.store.state.players.find(x=>x.id===d.player);return d.kind==='hand'?p?.hand.cards[d.index]:d.kind==='energy'?(d.active?p?.active:p?.bench[d.index])?.cards[d.cardIndex]:null;}
function dragIntent(d,z){
 const R=RulesMatch.R,g=rulesMatch.store.state,owner=dragOwner(),p=RulesMatch.pending(rulesMatch)[0];
 if(!d||!z)return null;
 if(p){
  if(d.kind==='assignment'&&d.prompt===p.id){
   if(p.type==='Discard energy'&&z.kind==='discard'&&z.player===owner.id)return {assignment:d.row};
   if(['Attach energy','Move energy'].includes(p.type)&&z.kind==='slot'){
    const t=dragTarget(z.player,z.active,z.index);if(RulesMatch.targets(rulesMatch,p).some(x=>JSON.stringify(x.target)===JSON.stringify(t)))return {assignment:d.row,target:t};
   }return null;
  }
  const rows=promptRows(p);let row;
  if(d.kind==='choice'&&d.prompt===p.id)row=rows[d.row];
  else if(d.kind==='pokemon'&&p.type==='Choose pokemon')row=rows.find(r=>JSON.stringify(r.value)===JSON.stringify(dragTarget(d.player,d.active,d.index)));
  else if(d.kind==='energy'&&p.type==='Choose energy')row=rows.find(r=>r.card===dragCard(d));
  else if(d.kind==='hand'&&p.type==='Choose cards')row=rows.find(r=>r.card===dragCard(d));
  if(!row||row.blocked)return null;
  if(z.kind==='choice')return {choice:row.value};
  if(p.type==='Choose pokemon'&&z.kind==='slot'&&z.active&&z.player===d.player&&!d.active)return {choice:row.value};
  if(p.type==='Choose energy'&&z.kind==='discard'&&z.player===owner.id)return {choice:row.value};
  if(p.type==='Choose cards'&&d.kind==='hand'&&z.kind==='slot'&&z.player===owner.id){
   const message=String(p.message);if((z.active&&message.includes('ACTIVE'))||(!z.active&&message.includes('BENCH')))return {choice:row.value};
  }return null;
 }
 if(g.phase!==R.GamePhase.PLAYER_TURN||d.player!==g.players[g.activePlayer].id)return null;
 if(d.kind==='hand'){
  const card=dragCard(d);if(!card)return null;
  if(card.superType===R.SuperType.ENERGY&&owner.energyPlayedTurn===g.turn&&!owner.usedDragonsWish&&!g.rules.unlimitedEnergyAttachments)return null;
  const trainer=card.superType===R.SuperType.TRAINER&&card.trainerType!==R.TrainerType.TOOL;
  if(trainer&&(z.kind==='trainer'||z.kind==='slot'&&z.player===owner.id))return {action:{type:'play',player:d.player,index:d.index,target:z.kind==='slot'?dragTarget(z.player,z.active,z.index):dragTarget(owner.id,true,0)}};
  if(!trainer&&z.kind==='slot'&&z.player===owner.id)return {action:{type:'play',player:d.player,index:d.index,target:dragTarget(z.player,z.active,z.index)}};
 }
 if(d.kind==='pokemon'&&z.kind==='slot'&&z.player===d.player&&d.active!==z.active){
  const index=d.active?z.index:d.index;if(owner.bench[index]?.getPokemonCard())return {action:{type:'retreat',player:d.player,index}};
 }
 return null;
}
function commitTableDrop(d,z){
 const intent=dragIntent(d,z);if(!intent){toast('Drop on a highlighted destination for this card or choice.');return false;}
 if(intent.action){ruleAction(intent.action);return true;}
 const p=RulesMatch.pending(rulesMatch)[0];
 if(intent.assignment!==undefined){
  const input=document.querySelector('[data-assign="'+intent.assignment+'"]');
  if(p.type==='Discard energy')input.checked=true;else input.value=JSON.stringify(intent.target);
  input.closest('label').classList.add('drag-assigned');return true;
 }
 const key=JSON.stringify(intent.choice);
 if(!promptChoice.some(v=>JSON.stringify(v)===key))promptChoice.push(intent.choice);
 if(p.type==='Choose pokemon'&&p.options.min===1&&p.options.max===1)ruleAction({type:'prompt',id:p.id,value:[intent.choice]});
 else {drawRulePrompt(p);wireTableDrag();}return true;
}
function clearTableDrag(){tableDrag=null;document.body.classList.remove('dragging-card');document.querySelectorAll('.drop-ready,.drop-hover').forEach(el=>el.classList.remove('drop-ready','drop-hover'));}
document.addEventListener('dragstart',e=>{
 const node=e.target.closest('[data-table-source]');if(!node){if(e.target.closest('.seated-experience'))e.preventDefault();return;}
 tableDrag={...JSON.parse(node.dataset.tableSource),journal:rulesMatch.journal.length,pending:RulesMatch.pending(rulesMatch)[0]?.id};
 e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain','ILEX.GG card');document.body.classList.add('dragging-card');
 document.querySelectorAll('[data-table-drop]').forEach(el=>{if(dragIntent(tableDrag,JSON.parse(el.dataset.tableDrop)))el.classList.add('drop-ready');});
});
document.addEventListener('dragover',e=>{
 if(!tableDrag)return;const el=e.target.closest('[data-table-drop]');if(!el)return;
 if(dragIntent(tableDrag,JSON.parse(el.dataset.tableDrop))){e.preventDefault();e.dataTransfer.dropEffect='move';document.querySelectorAll('.drop-hover').forEach(x=>x.classList.remove('drop-hover'));el.classList.add('drop-hover');}
});
document.addEventListener('drop',e=>{
 if(!tableDrag)return;e.preventDefault();e.stopPropagation();const d=tableDrag,el=e.target.closest('[data-table-drop]');clearTableDrag();
 if(d.journal!==rulesMatch.journal.length||d.pending!==RulesMatch.pending(rulesMatch)[0]?.id)return toast('The game changed. Drag the card again.');
 if(el)commitTableDrop(d,JSON.parse(el.dataset.tableDrop));
});
document.addEventListener('dragend',clearTableDrag);
document.addEventListener('keydown',e=>{if(e.key==='Escape')clearTableDrag();});
const dragRulesTable=rulesTable;rulesTable=function(){dragRulesTable();wireTableDrag();};
const dragPrompt=drawRulePrompt;drawRulePrompt=function(p){dragPrompt(p);wireTableDrag();};
