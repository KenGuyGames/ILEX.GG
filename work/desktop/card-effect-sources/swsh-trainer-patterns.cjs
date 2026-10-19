const previous=require('./sm-trainer-patterns.cjs');
module.exports=d=>{
 const text=(d.rules||[])[0]||'';let m;
 if(d.name==='Agatha')return [{op:'swsh',kind:'agatha'}];
 if(d.name==='Café Master')return [{op:'swsh',kind:'cafeMaster'}];
 if(m=text.match(/^Draw 2 cards\. If you drew any cards in this way, flip a coin\. If heads, attach a (Lightning|Water|Fire) Energy card from your discard pile to 1 of your Benched Pokémon\.$/))return [{op:'swsh',kind:'drawCoinAttach',energy:m[1]}];
 if(d.name==='Egg Incubator')return [{op:'swsh',kind:'eggIncubator'}];
 if(d.name==='Blunder Policy')return [{op:'tool',kind:'swshBlunder'}];
 return previous(d);
};
