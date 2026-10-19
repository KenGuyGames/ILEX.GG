/* Exact random-deal odds. No game state or hidden information is read. */
(function(root){
 'use strict';
 function distribution(size,copies,draw){
  if(![size,copies,draw].every(Number.isSafeInteger)||size<1||size>10000||copies<0||copies>size||draw<0||draw>size)throw Error('Enter whole counts within the deck size (1–10,000).');
  const lo=Math.max(0,draw-(size-copies)),hi=Math.min(copies,draw),logs=[];
  let log=0;
  for(let k=lo;k<=hi;k++){
   if(k>lo)log+=Math.log(copies-k+1)+Math.log(draw-k+1)-Math.log(k)-Math.log(size-copies-draw+k);
   logs.push(log);
  }
  const peak=Math.max(...logs),weights=logs.map(x=>Math.exp(x-peak)),sum=weights.reduce((a,b)=>a+b,0);
  return Array.from({length:hi+1},(_,k)=>k<lo?0:weights[k-lo]/sum);
 }
 const api={distribution};
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.DeckOdds=api;
 if(typeof document==='undefined')return;
 root.openDeckOdds=function(){
  const deck=state.decks.find(d=>d.id===activeDeck);
  if(!deck)return;
  const entries=Object.entries(deck.cards).filter(([,n])=>n>0),size=entries.reduce((s,[,n])=>s+n,0);
  if(!entries.length){toast('Add cards to this deck to check odds.');return;}
  const record=id=>({...find(id),...(typeof cardMetadata!=='undefined'?cardMetadata[id]||{}:{}),...state.custom.find(c=>c.id===id)});
  const format=state.formats.find(f=>f.id===deck.format),prizes=Number.isSafeInteger(+format?.prizes)?+format.prizes:6;
  modal(`<section class="deck-odds"><span class="eyebrow">PLAN YOUR OPENING</span><h2>Odds checker</h2><p>${esc(deck.name)} · ${size} cards</p><label>Card<select id="odds-card">${entries.map(([id,n])=>`<option value="${esc(id)}">${esc(record(id).name||id)} · ${esc(id)} · ${n} copies</option>`).join('')}</select></label><label class="odds-group"><input id="odds-group" type="checkbox" checked> Combine printings with the same card name</label><div class="odds-inputs"><label>Opening hand size<input id="odds-hand" type="number" min="0" max="${size}" step="1" value="${Math.min(7,size)}"></label><label>Prize count<input id="odds-prizes" type="number" min="0" max="${size}" step="1" value="${Math.min(Math.max(0,prizes),Math.max(0,size-Math.min(7,size)))}"></label></div><div id="odds-results" aria-live="polite"></div><p class="odds-note">Exact random-deal probabilities, before mulligans, choosing a starting Pokémon, or card effects. Prize odds are unconditional, before seeing your hand; they are not independent of hand odds. Uses the actual deck size, including drafts. Same-name grouping combines printings, not different names or evolution stages.</p></section>`);
  const update=()=>{
   const id=$('#odds-card').value,name=record(id).name,group=$('#odds-group').checked;
   const copies=entries.reduce((s,[key,n])=>s+(key===id||(group&&name&&record(key).name===name)?n:0),0);
   const hand=Number($('#odds-hand').value),prize=Number($('#odds-prizes').value),target=$('#odds-results');
   try{
    if($('#odds-hand').value===''||$('#odds-prizes').value==='')throw Error('Enter both counts.');
    if(hand+prize>size)throw Error('Opening hand and Prizes together cannot exceed the deck size.');
    const h=distribution(size,copies,hand),p=distribution(size,copies,prize);
    const pct=x=>(100*x).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})+'%';
    const atLeastOne=a=>a.slice(1).reduce((s,x)=>s+x,0);
    target.innerHTML=`<p><strong>${copies} matching ${copies===1?'copy':'copies'}</strong> in ${size} cards</p><div class="odds-summary"><div><span>At least one in opening hand</span><strong>${pct(atLeastOne(h))}</strong></div><div><span>At least one in Prizes</span><strong>${pct(atLeastOne(p))}</strong></div></div><div class="odds-table"><table><caption>Exact number of matching copies</caption><thead><tr><th scope="col">Copies</th><th scope="col">Opening hand</th><th scope="col">Prizes</th></tr></thead><tbody>${Array.from({length:Math.max(h.length,p.length)},(_,k)=>`<tr><th scope="row">${k}</th><td>${pct(h[k]||0)}</td><td>${pct(p[k]||0)}</td></tr>`).join('')}</tbody></table></div>`;
   }catch(e){target.innerHTML=`<p role="alert">${esc(e.message)}</p>`;}
  };
  for(const id of ['odds-card','odds-group','odds-hand','odds-prizes'])$('#'+id).addEventListener('input',update);
  update();
 };
})(typeof globalThis!=='undefined'?globalThis:this);
