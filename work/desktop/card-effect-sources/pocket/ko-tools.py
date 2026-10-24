from pathlib import Path
p=Path('work/pocket-research/compile.cjs');s=p.read_text(encoding='utf-8').replace("'Memory Light':{previousAttacks:true}","'Electrical Cord':{koMoveEnergy:'L',amount:2,unique:true,type:'Lightning'},'Memory Light':{previousAttacks:true}")
a=s.index('function ability(');i=s.index(' return null;',a);s=s[:i]+r'''
 if(text==='If this Pokémon is in the Active Spot and is Knocked Out by damage from an attack from your opponent\'s Pokémon, move all [F] Energy from this Pokémon to 1 of your Benched Pokémon.')return{passive:{koMoveEnergy:'F'}};
 if(text==='If this Pokémon is in the Active Spot and is damaged by an attack from your opponent\'s Pokémon, take a [W] Energy from your Energy Zone and attach it to 1 of your Benched Pokémon.')return{passive:{reflectEnergy:'W'}};
 if(text==='This Pokémon may have up to 2 Pokémon Tool cards attached to it.')return{passive:{twoTools:true}};
''' +s[i:];p.write_text(s,encoding='utf-8')
p=Path('work/pocket-candidate/ui/pocket-engine.js');s=p.read_text(encoding='utf-8');a=s.index('  function tool(l){');b=s.index('  function stadium(s)',a)
s=s[:a]+'''  const attachedTools=l=>[l?.tool,...(l?.extraTools||[])].filter(Boolean);
  function removeTool(l,ref){if(l.tool?.key===ref.key){l.tool=(l.extraTools||[]).shift()||null;}else l.extraTools=(l.extraTools||[]).filter(r=>r.key!==ref.key);}
  function toolInfo(l,ref){const t=ref&&card(ref).program?.find(x=>x.kind==='attachTool')?.tool,c=top(l);if(!t||t.type&&t.type!==c.subtype||t.stage!==undefined&&t.stage!==c.stage||t.tag&&!c.tags.includes(t.tag)||t.minRetreat!==undefined&&c.retreat<t.minRetreat)return {};return t;}
  function tool(l){const result={},sum=['hp','reflect','reduce','retreat','attackBonus','pointBonus','knockoutDraw'];for(const ref of attachedTools(l))for(const [key,value] of Object.entries(toolInfo(l,ref)))result[key]=sum.includes(key)?(result[key]||0)+value:key==='koDrawTo'?Math.max(result[key]||0,value):value;return result;}
  function canAttachTool(s,l){return attachedTools(l).length<(passive(s,l).twoTools?2:1);}
''' +s[b:]
a=s.index('  function toolEnd(s){');b=s.index('  function checkKnockouts(s)',a)
s=s[:a]+'''  function toolEnd(s){for(const p of s.players)for(const l of slots(p))for(const ref of attachedTools(l)){
   const t=toolInfo(l,ref);if(t.ownTurn&&s.active!==p.id||t.active&&p.active!==l)continue;
   if(t.discardOpponentEnd&&s.active!==p.id){p.discard.push(ref);removeTool(l,ref);}
   if(t.endHeal)heal(s,l,t.endHeal);
   if(t.endDamage&&s.players[1-p.id].active){s.players[1-p.id].active.damage+=t.endDamage;s.players[1-p.id].active.lastDamage={turn:s.turn,cause:'effect'};}
   if(t.cureBerry&&l.conditions.length){l.conditions=[];p.discard.push(ref);removeTool(l,ref);}
   if(t.healBerry&&l.damage>0&&maximumHp(l,s)-l.damage<=maximumHp(l,s)/2){const before=l.damage;heal(s,l,t.healBerry);if(l.damage<before){p.discard.push(ref);removeTool(l,ref);}}
  }}
''' +s[b:]
s=s.replace("if(l.tool)p.discard.push(l.tool);", "p.discard.push(...attachedTools(l));")
s=s.replace("if(target?.tool){owner.discard.push(target.tool);target.tool=null;}", "if(target){owner.discard.push(...attachedTools(target));target.tool=null;target.extraTools=[];}")
s=s.replace("need(target&&!target.tool,'Choose a Pokémon without a Tool');target.tool=op.ref;", "need(target&&canAttachTool(s,target),'Choose a Pokémon with room for a Tool');if(!target.tool)target.tool=op.ref;else (target.extraTools??=[]).push(op.ref);")
s=s.replace("slots(p).some(t=>!t.tool)","slots(p).some(t=>canAttachTool(s,t))")
s=s.replace("(!op.noTool||!t.tool)","(!op.noTool||canAttachTool(s,t))")
s=s.replace("for(const t of slots(owner))if(t.tool){if(op.toHand&&owner.hand.length<10)owner.hand.push(t.tool);else owner.discard.push(t.tool);t.tool=null;}","for(const t of slots(owner))for(const ref of attachedTools(t)){if(op.toHand&&owner.hand.length<10)owner.hand.push(ref);else owner.discard.push(ref);removeTool(t,ref);}")
s=s.replace("source:l.key,sourceKind:op.sourceKind,bench:op.bench", "source:l?.key,sourceKind:op.sourceKind,bench:op.bench")
s=s.replace("attachZone(s,p,target,op.type,1);const next={...op.next,player:p.id,source:l.key", "if(op.next.origin==='move'){target.energy.push(op.type);event(s,'energy',{player:p.id,target:target.key,origin:'move',energy:op.type});}else attachZone(s,p,target,op.type,1);const next={...op.next,player:p.id,source:l?.key")
s=s.replace("if(attackKO&&wasActive){if(hitter", "if(attackKO&&wasActive){const moveType=ability.koMoveEnergy||held.koMoveEnergy;if(moveType&&p.bench.length){const moving=l.energy.filter(t=>t===moveType).slice(0,held.koMoveEnergy?held.amount:undefined);for(const type of moving){const index=p.energyDiscard.lastIndexOf(type);if(index>=0)p.energyDiscard.splice(index,1);}if(moving.length)pending.push(held.unique?{kind:'distributeEnergy',player:p.id,types:moving,bench:true,unique:true,origin:'move'}:{kind:'choosePokemon',player:p.id,bench:true,optional:true,next:[{kind:'attachMoved',types:moving}]});}if(hitter")
s=s.replace("const p=s.players.find(p=>!p.active&&p.bench.length);", "if(pending.length){s.queue.unshift(...pending,{kind:'checkKO',player:s.active});return;}const p=s.players.find(p=>!p.active&&p.bench.length);")
i=s.index("   else if(op.kind==='offerAbility')");s=s[:i]+'''   else if(op.kind==='attachMoved'){const target=slots(p).find(t=>t.key===op.target);if(target){target.energy.push(...op.types);for(const type of op.types)event(s,'energy',{player:p.id,target:target.key,origin:'move',energy:type});}}
''' +s[i:]
s=s.replace("if((tool(target).poisonAttacker", "if(passive(s,target).reflectEnergy)s.queue.unshift({kind:'choosePokemon',player:1-player,source:target.key,sourceKind:'ability',bench:true,optional:true,next:[{kind:'zoneEnergy',amount:1,type:passive(s,target).reflectEnergy}]});\n    if((tool(target).poisonAttacker")
s=s.replace('chooseBotAction,attackCost,providedEnergy};','chooseBotAction,attackCost,providedEnergy,attachedTools};')
p.write_text(s,encoding='utf-8')
