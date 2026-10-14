// Printing-specific corrections verified against bundled scans. Keep the
// original canonical dataset unchanged and apply the same correction to rules
// compilation and offline display/search metadata.
module.exports=function(d){
 if(d.id==='ex9-79')return {...d,rules:d.rules.map(text=>text.replace(/Basic cards/g,'basic Energy cards'))};
 if(d.id==='np-39')return {...d,abilities:d.abilities.map(a=>({...a,text:a.text.replace('attacks do 40 damage','attacks do 40 more damage')}))};
 if(d.id==='ex5-61')return {...d,attacks:d.attacks.map(a=>a.name==='Ascension'?{...a,text:'Flip a coin. If heads, '+a.text[0].toLowerCase()+a.text.slice(1)}:a)};
 if(d.id==='ex6-107')return {...d,attacks:d.attacks.map(a=>a.name==='Crush and Burn'?{...a,text:'You may discard as many Energy cards as you like attached to your Pokémon in play. If you do, this attack does 30 damage plus 20 more damage for each Energy card you discarded.'}:a)};
 return d;
};
