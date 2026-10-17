/* Rendered finishes use the base scan; no image is represented as a distinct scan. */
var PackFinish=(()=>{
 const names={normal:'Regular',holo:'Foil',reverse:'Reverse Holo',pokeball:'Poké Ball Reverse Holo',masterball:'Master Ball Reverse Holo',friendball:'Friend Ball Reverse Holo',loveball:'Love Ball Reverse Holo',quickball:'Quick Ball Reverse Holo',duskball:'Dusk Ball Reverse Holo','energy-symbols':'Energy Symbols Reverse Holo','team-rocket':'Team Rocket Reverse Holo'};
 const isReverse=finish=>Object.hasOwn(names,finish)&&!['normal','holo'].includes(finish);
 const className=finish=>isReverse(finish)?'finish-surface finish-'+finish:'';
 const energyTypes=['Grass','Fire','Water','Lightning','Psychic','Fighting','Darkness','Metal','Dragon','Colorless','Fairy'];
 const layer=(finish,energy='Colorless')=>isReverse(finish)?'<span class="finish-pattern" data-energy-symbol="'+(energyTypes.includes(energy)?energy:'Colorless')+'" aria-hidden="true"></span>':'';
 function decorate(host,finish,energy='Colorless'){host.querySelectorAll(':scope>.finish-pattern').forEach(el=>el.remove());host.classList.remove('finish-surface',...Object.keys(names).map(k=>'finish-'+k));if(isReverse(finish)){host.classList.add('finish-surface','finish-'+finish);host.insertAdjacentHTML('beforeend',layer(finish,energy));}}
 return {label:finish=>names[finish]||'Regular',isReverse,className,layer,decorate};
})();
