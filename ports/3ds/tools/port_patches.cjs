/* Port-local corrections, applied in memory with assertions. Canonical Windows files are untouched. */
function change(source,needle,replacement,label){if(!source.includes(needle))throw Error('Port patch no longer matches: '+label);return source.replace(needle,replacement);}
function patch(file,source){
 if(/card-list\.ts$/.test(file))source=change(source.replace(/\r\n/g,'\n'),"if (a.name < b.name) {\n        return -1;\n      } else {\n        return 1;\n      }","if(a.name===b.name && (globalThis as any).IlexStableSortRules!==false)return 0;\n      return a.name<b.name?-1:1;",'deterministic duplicate-card sort');
 if(/attach-energy-prompt\.ts$/.test(file)){
  source="import {matchesPromptFilter} from './prompt-card-filter';\n"+source;
  source=change(source,'const cardList = this.cardList;',`const destination=t.to;
      if(!destination||![PlayerType.BOTTOM_PLAYER,PlayerType.TOP_PLAYER].includes(destination.player)||this.playerType!==PlayerType.ANY&&destination.player!==this.playerType||!this.slots.includes(destination.slot)||!Number.isInteger(destination.index)||destination.index<0||destination.slot===SlotType.ACTIVE&&destination.index!==0)throw new GameError(GameMessage.INVALID_PROMPT_RESULT);
      if(this.options.blockedTo.some(b=>b.player===destination.player&&b.slot===destination.slot&&b.index===destination.index))throw new GameError(GameMessage.INVALID_PROMPT_RESULT);
      const targetOwner=destination.player===PlayerType.BOTTOM_PLAYER?player:state.players.find(p=>p!==player),targetList=destination.slot===SlotType.ACTIVE?targetOwner?.active:targetOwner?.bench[destination.index];
      if(!targetList?.getPokemonCard())throw new GameError(GameMessage.INVALID_PROMPT_RESULT);
      const cardList = this.cardList;`,'AttachEnergy destination constraints');
  source=change(source,'transfers.push({ to: t.to, card });',`if(!matchesPromptFilter(card,this.filter))throw new GameError(GameMessage.INVALID_PROMPT_RESULT);
      transfers.push({ to: t.to, card });`,'AttachEnergy printed filter');
 }
 if(/move-energy-prompt\.ts$/.test(file)){
  source="import {matchesPromptFilter} from './prompt-card-filter';\n"+source;
  source=change(source,'return result.every(r => r.card !== undefined);',`if(result.length<this.options.min||this.options.max!==undefined&&result.length>this.options.max)return false;
    const seen=new Set<Card>();
    return result.every(r=>{if(!r.card||seen.has(r.card)||!matchesPromptFilter(r.card,this.filter))return false;seen.add(r.card);
      if([r.from,r.to].some(t=>!t||![PlayerType.BOTTOM_PLAYER,PlayerType.TOP_PLAYER].includes(t.player)||this.playerType!==PlayerType.ANY&&t.player!==this.playerType||!this.slots.includes(t.slot)||!Number.isInteger(t.index)||t.index<0||t.slot===SlotType.ACTIVE&&t.index!==0))return false;
      if(r.from.player===r.to.player&&r.from.slot===r.to.slot&&r.from.index===r.to.index)return false;
      if(this.options.blockedFrom.some(t=>t.player===r.from.player&&t.slot===r.from.slot&&t.index===r.from.index)||this.options.blockedTo.some(t=>t.player===r.to.player&&t.slot===r.to.slot&&t.index===r.to.index))return false;
      return true;});`,'MoveEnergy scope and cardinality');
  source=change(source,'const cardList = StateUtils.getTarget(state, player, t.from);',`const destination=StateUtils.getTarget(state,player,t.to);
      if(!destination?.getPokemonCard?.())throw new GameError(GameMessage.INVALID_PROMPT_RESULT);
      if(this.options.blockedMap.some(b=>b.source.player===t.from.player&&b.source.slot===t.from.slot&&b.source.index===t.from.index&&b.blocked.includes(t.index)))throw new GameError(GameMessage.INVALID_PROMPT_RESULT);
      const cardList = StateUtils.getTarget(state, player, t.from);`,'MoveEnergy blocked source indices');
 }
 if(/choose-cards-prompt\.ts$/.test(file)){
  source=change(source,'if (this.options.blocked.length > 0) {',`const qualified=Object.keys(filter).some(key=>(filter as any)[key]!==undefined)||this.options.blocked.length>0;
    const searchMessage=String(message);
    if(cards===player.deck&&cards.cards.length>0&&!cards.isPublic&&qualified&&!/SETUP|DISCARD|LOST|REVEAL/.test(searchMessage)&&/HAND|BENCH|EVOL|POKEMON|ATTACH|SEARCH/.test(searchMessage))this.options.min=0;
    if (this.options.blocked.length > 0) {`,'Qualified hidden-deck searches may fail to find');
 }
 return source;
}
module.exports={patch};
