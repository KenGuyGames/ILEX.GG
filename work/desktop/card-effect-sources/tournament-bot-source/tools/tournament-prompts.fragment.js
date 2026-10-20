 function damagePriority(m,owner,row,damage){
  const hp=Math.max(10,realHp(row.list)+row.list.damage),prizes=realPrize(row.list),enemy=row.target.player===R.PlayerType.TOP_PLAYER,active=row.list===owner.active;
  if(enemy)return Math.min(damage,hp)*.6+(damage>=hp?1200*prizes:0);
  return -Math.min(damage,hp)*(active?2:.45)-(damage>=hp?1800*prizes:0)-(active&&hp-damage<50?80:0);
 }
 function realCounterPrompt(m,q,owner,out){
  if(!['Put damage','Move damage','Remove damage'].includes(q.type))return null;
  const rows=targets(m,q),key=t=>JSON.stringify(t),caps=new Map((q.maxAllowedDamage||[]).map(x=>[key(x.target),x.damage]));
  if(q.type==='Put damage'){
   const step=q.options.damageMultiple||10,enemy=rows.filter(x=>x.target.player===R.PlayerType.TOP_PLAYER).slice(0,12);let best,bestValue=-Infinity;
   const limit=x=>Math.max(0,Math.floor((caps.has(key(x.target))?caps.get(key(x.target))-x.list.damage:q.damage)/step)*step);
   for(let mask=0;mask<2**enemy.length;mask++){
    const assigned=new Map(),selected=[];let left=q.damage,okay=true;
    for(let i=0;i<enemy.length;i++)if(mask&(1<<i)){const x=enemy[i],n=Math.ceil(realHp(x.list)/step)*step;if(n>left||n>limit(x)){okay=false;break;}assigned.set(key(x.target),n);selected.push(x);left-=n;}if(!okay)continue;
    const order=enemy.filter(x=>!selected.includes(x)).sort((a,b)=>realPrize(b.list)/Math.max(1,realHp(b.list))-realPrize(a.list)/Math.max(1,realHp(a.list))).concat(selected);
    for(const x of order){const n=Math.min(left,limit(x)-(assigned.get(key(x.target))||0));if(n>0){assigned.set(key(x.target),(assigned.get(key(x.target))||0)+n);left-=n;}if(left===0)break;}
    if(left&&!q.options.allowPlacePartialDamage)continue;const value=enemy.reduce((sum,x)=>sum+damagePriority(m,owner,x,x.list.damage+(assigned.get(key(x.target))||0))-damagePriority(m,owner,x,x.list.damage),0),moves=enemy.filter(x=>assigned.get(key(x.target))>0).map(x=>({target:x.target,damage:assigned.get(key(x.target))}));
    if(value>bestValue&&valid(m,q,moves)){bestValue=value;best=moves;}
   }return best===undefined?null:out(best);
  }
  const blocked=(t,items)=>(items||[]).some(x=>key(t)===key(x)),damage=new Map(rows.map(x=>[key(x.target),x.list.damage])),moves=[],minimum=q.options.min??0,maximum=q.options.max??rows.reduce((n,x)=>n+Math.floor(x.list.damage/10),0);let source,destination;
  while(moves.length<maximum){let best;
   for(const from of rows){const fk=key(from.target);if(blocked(from.target,q.options.blockedFrom)||q.options.singleSourceTarget&&source&&source!==fk)continue;
    for(const to of rows){const tk=key(to.target);if(fk===tk||blocked(to.target,q.options.blockedTo)||(q.options.singleDestinationTarget||q.options.sameTarget)&&destination&&destination!==tk)continue;
     const available=Math.min(Math.floor(damage.get(fk)/10),maximum-moves.length,caps.has(tk)?Math.floor((caps.get(tk)-damage.get(tk))/10):maximum-moves.length);
     for(let n=1;n<=available;n++){const gain=damagePriority(m,owner,from,damage.get(fk)-n*10)+damagePriority(m,owner,to,damage.get(tk)+n*10)-damagePriority(m,owner,from,damage.get(fk))-damagePriority(m,owner,to,damage.get(tk));if(!best||gain>best.gain)best={from,to,fk,tk,n,gain};}
    }
   }
   if(!best||best.gain<=0&&moves.length>=minimum)break;
   for(let i=0;i<best.n;i++)moves.push({from:best.from.target,to:best.to.target});source=best.fk;destination=best.tk;damage.set(source,damage.get(source)-best.n*10);damage.set(destination,damage.get(destination)+best.n*10);
  }
  return moves.length>=minimum?out(moves):null;
 }
 function powerDamageHint(m,owner,origin){
  if(origin?.player!==owner.id||origin.type!=='ability')return null;
  const cards=[...realSlots(owner).map(l=>l.getPokemonCard()),...owner.hand.cards,...owner.discard.cards],card=cards.find(c=>c.powers?.some(p=>p.name===origin.name)),text=card?.powers.find(p=>p.name===origin.name)?.text||'';
  const counters=text.match(/(?:put|place)\s+(\d+)\s+damage counters?\s+on\s+(?:1 of |one of |each of )?(?:your opponent|the opponent|the Defending)/i),hit=text.match(/(?:do|does|put)\s+(\d+)\s+damage\s+(?:to|on)\s+(?:1 of |one of |each of )?(?:your opponent|the opponent|the Defending)/i);
  return counters?Number(counters[1])*10:hit?Number(hit[1]):null;
 }
