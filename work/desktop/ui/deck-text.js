var DeckText=(()=>{
  const norm=s=>String(s||'').replace(/[★☆]/g,'Star').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘]/g,"'").replace(/[^a-z0-9{}]/gi,'').toLowerCase();
  const number=s=>String(s).toLowerCase().replace(/^0+(?=\d)/,'');
  const nameKey=s=>{s=String(s);const token=s.match(/^(?:Basic\s+)?\{([GRWLPFDMYN])\}\s+Energy$/i);if(token)s=({G:'Grass',R:'Fire',W:'Water',L:'Lightning',P:'Psychic',F:'Fighting',D:'Darkness',M:'Metal',Y:'Fairy',N:'Colorless'})[token[1].toUpperCase()]+' Energy';return norm(s.replace(/^Basic\s+(?=\w+\s+Energy$)/i,''));};
  let cached;
  function index(library,metadata,codes){
    if(cached?.library===library&&cached.metadata===metadata&&cached.codes===codes)return cached;
    const names=new Map(),printings=new Map(),setIds=Object.keys(codes).sort((a,b)=>b.length-a.length);
    for(const c of library){const key=nameKey(metadata[c.id]?.name||c.name);if(!names.has(key))names.set(key,[]);names.get(key).push(c);const sid=setIds.find(s=>c.id.startsWith(s+'-'));if(!sid)continue;const num=number(metadata[c.id]?.number||c.id.slice(sid.length+1));for(const code of new Set([codes[sid]?.toUpperCase(),sid.toUpperCase()])){const k=code+'|'+num;if(!printings.has(k))printings.set(k,[]);printings.get(k).push(c);}}
    return cached={library,metadata,codes,names,printings};
  }
  function parse(text,library,metadata,codes){
    const lookup=index(library,metadata,codes);
    const errors=[],entries=[],totals={};let declared=null;
    for(const [i,raw] of text.replace(/^\uFEFF/,'').split(/\r?\n/).entries()){
      const line=raw.trim();if(!line||/^\*{2,}|^#|^\/\//.test(line))continue;
      if(/^(?:Pok[eé]mon|Trainer|Energy)(?:s)?\s*:/i.test(line))continue;
      const total=line.match(/^Total(?:\s+Cards)?\s*:\s*(\d+)/i);if(total){declared=+total[1];continue;}
      const m=line.match(/^\*?\s*(\d+)\s+(.+?)\s*$/);
      if(!m){errors.push({line:i+1,text:line,error:'Expected quantity and card name.'});continue;}
      const qty=+m[1];if(!Number.isInteger(qty)||qty<1||qty>200){errors.push({line:i+1,text:line,error:'Quantity must be between 1 and 200.'});continue;}
      const tail=m[2].match(/^(.*?)\s+([A-Za-z0-9_-]+)\s+([A-Za-z]*\d+[A-Za-z]*|\d+\/\d+|[A-Za-z!?])\s*(?:PH)?$/i);
      let name=m[2],pool=[];
      if(tail){name=tail[1];const code=tail[2].toUpperCase(),num=number(tail[3].split('/')[0]);
        pool=lookup.printings.get(code+'|'+num)||[];
        pool=pool.filter(c=>nameKey(metadata[c.id]?.name||c.name)===nameKey(name));
      }else{
        pool=lookup.names.get(nameKey(name))||[];
        if(pool.length>1&&pool.every(c=>metadata[c.id]?.category==='Energy'&&metadata[c.id]?.energyType==='Normal'))pool=[pool[0]];
        if(pool.length>1&&pool.some(c=>metadata[c.id]?.category==='Trainer')&&!pool.some(c=>metadata[c.id]?.category==='Pokemon'))pool=[pool.find(c=>metadata[c.id]?.category==='Trainer')];
        if(pool.length>1){errors.push({line:i+1,text:line,error:'Multiple printings match. Add a set code and collector number.'});continue;}
      }
      if(pool.length!==1){errors.push({line:i+1,text:line,error:pool.length?'Ambiguous printing.':'No exact name, set and number match.'});continue;}
      entries.push({id:pool[0].id,qty,name:metadata[pool[0].id]?.name||pool[0].name});totals[pool[0].id]=(totals[pool[0].id]||0)+qty;
    }
    const count=Object.values(totals).reduce((a,b)=>a+b,0);
    if(declared!==null&&declared!==count&&!errors.length)errors.push({line:0,error:`Declared total ${declared} differs from parsed total ${count}.`});
    if(!entries.length&&!errors.length)errors.push({line:0,error:'No card lines found.'});
    return {entries,cards:totals,count,errors};
  }
  function format(deck,library,metadata,codes){
    const groups={Pokemon:[],Trainer:[],Energy:[]},unavailable=[];
    for(const [id,qty] of Object.entries(deck.cards)){
      const c=library.find(x=>x.id===id),d=metadata[id],sid=Object.keys(codes).filter(s=>id.startsWith(s+'-')).sort((a,b)=>b.length-a.length)[0];
      if(!c||c.custom||!d||!codes[sid]){unavailable.push(id);continue;}
      (groups[d.category]||groups.Trainer).push({qty,line:`${qty} ${d.name} ${codes[sid]} ${d.number}`});
    }
    if(unavailable.length)throw Error('These entries have no Limitless-compatible printing: '+unavailable.join(', '));
    return Object.entries(groups).map(([k,rows])=>`${k==='Pokemon'?'Pokémon':k}: ${rows.reduce((n,r)=>n+r.qty,0)}\n${rows.map(r=>r.line).join('\n')}`).join('\n\n')+`\n\nTotal Cards: ${Object.values(deck.cards).reduce((n,q)=>n+q,0)}\n`;
  }
  return {parse,format};
})();
