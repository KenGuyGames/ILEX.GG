/* Ken Guy Rules v1. Optional, journalled, separate from New Rule and the GX attack allowance. */
globalThis.IlexKenGuy=(()=>{
 'use strict';const R=()=>globalThis.TCGRules,own=(s,id)=>s.players.find(p=>p.id===id),board=p=>[p.active,...p.bench].filter(l=>l.getPokemonCard());
 const discardsHand=text=>/discard\s+(?:your\s+(?:entire\s+)?hand|all\s+(?:(?:of\s+)?the\s+)?cards\s+(?:in|from)\s+your\s+hand)/i.test(text||'');
 function init(store,spec){if(spec.kenGuy.version!==1)throw Error('Unsupported Ken Guy Rules version');const s=store.state;s.kenGuy={version:1,gxUsed:{},completedTurns:{},firstTurnChoice:null,pendingGX:null,inFlight:null,highFives:[],penalties:[],pendingHighFiveEnd:null,highFiveForfeit:null,emptyDrawPrizeFromAction:spec.kenGuy.emptyDrawPrizeFromAction,actionIndex:-1,interactionFixesFromAction:spec.kenGuy.interactionFixesFromAction,emptyDrawAwards:[]};Object.assign(s.rules,{alternativeSetup:true,firstTurnUseSupporter:true,attackFirstTurn:true});if(s.rules.cubeRules)s.rules.cubeRules={...s.rules.cubeRules,prizes:6,firstTurnSupporter:true,firstTurnAttack:true};}
 function bindHands(s){if(!s.kenGuy)return;for(const p of s.players)Object.defineProperty(p.hand,'_kenHand',{value:{state:s,player:p.id},configurable:true,enumerable:false});}
 function correctedInteractions(s){const k=s.kenGuy;return !!k&&k.actionIndex>=(k.interactionFixesFromAction??Infinity);}
 function beforeAction(m,a){const s=m.store.state,k=s.kenGuy;if(!k)return null;k.actionIndex=m.journal.length;bindHands(s);if(a.type==='concede')throw Error('Conceding is disabled in Ken Guy Rules');if(a.type==='play'){const p=own(s,a.player),card=p?.hand.cards[a.index];if(card&&p.hand.cards.length===1&&(discardsHand(card.text)||card.powers?.some(power=>discardsHand(power.text))))k.inFlight={player:p.id,cardId:card.id,turn:s.turn,observed:false,awaiting:false};}return null;}
 function beforeEffect(st,s,e){const k=s.kenGuy;if(!k)return null;
  if(e.type==='DRAW_CARD_FOR_TURN_EFFECT'&&activePenalty(s,e.player.id,'skip-draw'))throw Error('High 5 penalty: no opening draw this turn');
  if(['PLAY_SUPPORTER_EFFECT','PLAY_ITEM_EFFECT','PLAY_STADIUM_EFFECT','PLAY_POKEMON_TOOL_EFFECT'].includes(e.type)&&activePenalty(s,e.player.id,'no-trainers'))throw Error('High 5 penalty: no Trainer cards this turn');
  if(e.type==='POWER_EFFECT'&&abilityBlocked(s,e.player,e.card,e.power))throw Error('High 5 penalty: this player’s Pokémon have no Abilities this turn');
  if(s.turn===1&&e.type==='USE_ATTACK_EFFECT'&&(k.firstTurnChoice==='supporter'||e.player.supporterTurn>0))throw Error('First turn: choose a Supporter or an attack, not both');if(s.turn===1&&e.type==='PLAY_SUPPORTER_EFFECT'&&k.firstTurnChoice==='attack')throw Error('First turn: choose an attack or a Supporter, not both');return {hand:e.player?.hand.cards.length,cardInHand:e.player?.hand.cards.includes(e.trainerCard),phase:s.phase};}
 function afterEffect(st,s,e,t){const k=s.kenGuy;if(!k||e.preventDefault)return;
  if(e.type==='CHECK_POKEMON_POWERS_EFFECT'&&abilityBlocked(s,e.player,e.target))e.powers=e.powers.filter(p=>!isAbility(s,p));
  if(s.turn===1&&e.type==='ATTACK_EFFECT')k.firstTurnChoice='attack';
  if(s.turn===1&&e.type==='PLAY_SUPPORTER_EFFECT'&&!e.player.hand.cards.includes(e.trainerCard))k.firstTurnChoice='supporter';
  const f=k.inFlight,source=e.trainerCard||e.card;
  if(f&&source?.id===f.cardId&&e.player?.id===f.player&&(t?.hand===0||t?.hand===1&&t?.cardInHand)&&['TRAINER_EFFECT','POWER_EFFECT'].includes(e.type)&&discardsHand(e.type==='POWER_EFFECT'?e.power?.text:source.text))f.observed=true;
  if(e.type==='MOVE_CARDS_EFFECT')discardAttempt(e.source,e.destination,e.cards||[]);
  if(s.winner!==R().GameWinner.NONE&&!victoryAllowed(s,s.winner)){s.winner=R().GameWinner.NONE;if(s.phase===R().GamePhase.FINISHED)s.phase=t.phase;}
 }
 function discardAttempt(source,dest,cards){const h=source._kenHand,k=h?.state.kenGuy,f=k?.inFlight;if(f&&!f.awaiting&&h.player===f.player&&dest===own(h.state,h.player).discard&&source.cards.every(c=>c.id===f.cardId)&&cards.every(c=>c.id===f.cardId))f.observed=true;}
 function canInterrupt(m,id){const s=m.store.state,k=s.kenGuy,p=own(s,id),active=s.players[s.activePlayer];return !!k&&!!p&&p!==active&&!k.gxUsed[id]&&!k.pendingGX&&s.players.every(x=>(k.completedTurns[x.id]||0)>=1)&&[R().GamePhase.PLAYER_TURN,R().GamePhase.ATTACK].includes(s.phase);}
 function interrupt(m,id){if(!canInterrupt(m,id))throw Error('Go Fuck Yourself GX is unavailable');const s=m.store.state,k=s.kenGuy;k.gxUsed[id]=true;k.pendingGX={requester:id,target:s.players[s.activePlayer].id,turn:s.turn};drain(m);}
 function endTurn(m,turn,player){const s=m.store.state;if(s.phase!==R().GamePhase.FINISHED&&s.turn===turn&&s.players[s.activePlayer]?.id===player)m.store.reduceEffect(s,new (R().EndTurnEffect)(own(s,player)));}
 function highFivePrompt(player,message,values,stage){const p=new (R().SelectPrompt)(player,message,values,{allowCancel:false});p.kenHighFive=true;p.kenHighFiveStage=stage;return p;}
 function drain(m){const s=m.store.state,k=s.kenGuy;if(!k||m.store.hasPrompts())return;
  const f=k.inFlight;if(f&&!f.awaiting){if(f.observed&&s.phase!==R().GamePhase.FINISHED){f.awaiting=true;
   m.store.prompt(s,highFivePrompt(f.player,'High 5! You played a hand-discarding card with no other cards in hand.',['Offer High 5','Decline'],'offer'),choice=>{
    const opponent=s.players.find(p=>p.id!==f.player),record={player:f.player,opponent:opponent.id,turn:f.turn,accepted:choice===0};
    if(choice===1){k.highFives.push(record);k.inFlight=null;k.pendingHighFiveEnd={turn:f.turn,player:f.player};drain(m);return;}
    m.store.prompt(s,highFivePrompt(opponent.id,own(s,f.player).name+' offers a High 5. Declining ends their turn and gives you one random penalty.',['Accept High 5','Decline'],'response'),response=>{
     record.opponentAccepted=response===0;k.highFives.push(record);k.inFlight=null;
     if(response===1){record.roll=Math.floor(Math.random()*100);record.penalty=penaltyForRoll(record.roll);k.pendingHighFiveEnd={turn:f.turn,player:f.player};applyPenalty(m,record);}
     drain(m);
    });
   });return;}k.inFlight=null;}
  const end=k.pendingHighFiveEnd;if(end){k.pendingHighFiveEnd=null;endTurn(m,end.turn,end.player);if(m.store.hasPrompts())return;}
  const q=k.pendingGX;if(q){k.pendingGX=null;endTurn(m,q.turn,q.target);}
 }
 function penaltyForRoll(roll){if(!Number.isInteger(roll)||roll<0||roll>99)throw Error('Invalid penalty roll');return roll<9?'take-two-prizes':roll<39?'skip-draw':roll<69?'no-trainers':roll<99?'no-abilities':'lose-game';}
 function applyPenalty(m,record){const s=m.store.state,k=s.kenGuy,actor=own(s,record.player);
  if(record.penalty==='lose-game'){k.highFiveForfeit=record.opponent;R().endGame(m.store,s,s.players.indexOf(actor));return;}
  if(record.penalty==='take-two-prizes'){R().TAKE_X_PRIZES(m.store,s,actor,2,{},()=>{R().checkState(m.store,s,()=>drain(m));});return;}
  k.penalties.push({player:record.opponent,kind:record.penalty,issuedTurn:s.turn,activeTurn:null,ended:false});
 }
 function beginTurn(s,p){for(const penalty of s.kenGuy.penalties)if(penalty.player===p.id&&penalty.activeTurn===null&&s.turn>penalty.issuedTurn)penalty.activeTurn=s.turn;}
 function turnEnded(s,p){for(const penalty of s.kenGuy.penalties)if(penalty.player===p.id&&penalty.activeTurn===s.turn)penalty.ended=true;}
 function activePenalty(s,id,kind){return !!s.kenGuy?.penalties.some(p=>p.player===id&&p.kind===kind&&p.activeTurn===s.turn&&!p.ended);}
 function isAbility(s,p){return p?.powerType===R().PowerType.ABILITY||s.rules.cubeRules?.unifiedAbilities&&[0,1,6].includes(p?.powerType);}
 function abilityBlocked(s,p,c,power){if(!p||!c||power?.exemptFromAbilityLock||power?.powerType!==undefined&&!isAbility(s,power)||!activePenalty(s,p.id,'no-abilities'))return false;return board(p).some(l=>l.getPokemonCard()===c)||p.hand.cards.includes(c)||p.discard.cards.includes(c);}
 function penaltyLabel(kind){return {'take-two-prizes':'The offering player takes 2 Prizes.','skip-draw':'The declining opponent skips their next opening draw.','no-trainers':'The declining opponent cannot play Trainers during their next turn.','no-abilities':'The declining opponent’s Pokémon have no Abilities during their next turn.','lose-game':'The declining opponent immediately loses the game.'}[kind]||'';}
 function emptyOpeningDraw(st,s,p,onComplete){const k=s.kenGuy;if(!k||k.actionIndex<k.emptyDrawPrizeFromAction||p.deck.cards.length)return false;const recipient=s.players.find(x=>x!==p);
  if(k.emptyDrawAwards.some(e=>e.turn===s.turn&&e.player===p.id)){onComplete();return true;}
  k.emptyDrawAwards.push({turn:s.turn,player:p.id,recipient:recipient.id,count:1});
  R().TAKE_X_PRIZES(st,s,recipient,1,{},()=>{if(s.phase===R().GamePhase.FINISHED)return;s.phase=R().GamePhase.BETWEEN_TURNS;R().checkState(st,s,()=>{if(s.phase!==R().GamePhase.FINISHED)onComplete();});});return true;
 }
 function afterAction(m){drain(m);}
 function victoryAllowed(s,winner){if(winner===R().GameWinner.DRAW)return false;const p=s.players[winner],o=s.players.find(x=>x!==p);return !!p&&!!o&&(s.kenGuy?.cardWin?.winner===winner||s.kenGuy?.highFiveForfeit===o.id||p.prizes.every(l=>!l.cards.length)||board(o).length===0);}
 function publicView(s){const k=s.kenGuy;return k?{version:1,gxUsed:{...k.gxUsed},completedTurns:{...k.completedTurns},firstTurnChoice:k.firstTurnChoice,pendingGX:k.pendingGX?{...k.pendingGX}:null,highFives:k.highFives.slice(-10).map(r=>({...r,message:penaltyLabel(r.penalty)})),penalties:k.penalties.map(p=>({...p})),emptyDrawAwards:k.emptyDrawAwards.slice(-12)}:null;}
 function botPrompt(m,p){if(p.kenHighFive){const decline=p.kenHighFiveStage==='response'&&m.store.state.kenGuy.gxUsed[p.playerId]&&lethalThreat(m,p.playerId);return {type:'prompt',id:p.id,value:decline?1:0};}if(!p.options?.kenGuyPrizes)return null;const cards=p.cards.cards.map((c,i)=>({c,i})),value=c=>c.superType===R().SuperType.ENERGY?1:c.superType===R().SuperType.POKEMON?(c.stage===R().Stage.BASIC?15:5):12;cards.sort((a,b)=>value(a.c)-value(b.c));let result=null,tries=0;const visit=(start,chosen)=>{if(result||++tries>5000)return;if(chosen.length===6){try{if(p.validate(p.decode(chosen,m.store.state),m.store.state))result={type:'prompt',id:p.id,value:chosen};}catch{}return;}for(let i=start;i<cards.length;i++)visit(i+1,[...chosen,cards[i].i]);};visit(0,[]);return result;}
 function lethalThreat(m,id){const s=m.store.state,p=own(s,id),o=s.players[s.activePlayer];if(!p||p===o||s.turn===1&&s.kenGuy.firstTurnChoice==='supporter')return false;try{const hp=new (R().CheckHpEffect)(p,p.active);m.store.reduceEffect(s,hp);for(const a of globalThis.RulesMatch.attacks(m,o)){const cost=new (R().CheckAttackCostEffect)(o,a),energy=new (R().CheckProvidedEnergyEffect)(o,o.active);m.store.reduceEffect(s,cost);m.store.reduceEffect(s,energy);if(Number.parseFloat(a.damage)>=hp.hp-p.active.damage&&R().StateUtils.checkEnoughEnergy(energy.energyMap,cost.cost))return true;}}catch{}return false;}
 function botAction(m,id){if(!canInterrupt(m,id)||m.store.hasPrompts())return null;const s=m.store.state,p=own(s,id),o=s.players[s.activePlayer];try{const hp=new (R().CheckHpEffect)(p,p.active);m.store.reduceEffect(s,hp);for(const a of globalThis.RulesMatch.attacks(m,o)){const cost=new (R().CheckAttackCostEffect)(o,a),energy=new (R().CheckProvidedEnergyEffect)(o,o.active);m.store.reduceEffect(s,cost);m.store.reduceEffect(s,energy);if(Number.parseFloat(a.damage)>=hp.hp-p.active.damage&&R().StateUtils.checkEnoughEnergy(energy.energyMap,cost.cost))return {type:'ken-gx',player:id};}}catch{}return null;}
 return {correctedInteractions,emptyOpeningDraw,penaltyForRoll,applyPenalty,beginTurn,turnEnded,activePenalty,abilityBlocked,penaltyLabel,init,bindHands,beforeAction,beforeEffect,afterEffect,discardAttempt,canInterrupt,interrupt,afterAction,victoryAllowed,publicView,botPrompt,botAction};
})();
