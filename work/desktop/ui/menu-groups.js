/* Menu navigation is presentation-only and never changes saved game state. */
var IlexMenuGroups=(()=>{
 const nav=document.querySelector('#mainmenu nav'),divider=document.querySelector('#mainmenu>.menu-divider');
 const groups={arena:['play','pocket','cubes','online'],vault:['decks','library','formats','custom','packs']};
 let current='home';
 const labels={arena:'Enter the Arena',vault:'Enter the Vault'};
 const optionLabels={play:'Play',pocket:'Pocket',cubes:'Cube Draft',online:'Private Multiplayer',decks:'Deck Builder',library:'Card Gallery',formats:'Formats',custom:'Custom Cards',packs:'Pack Opening'};
 const optionBalls={play:'level',pocket:'fast',cubes:'lure',online:'friend',decks:'moon',library:'heavy',formats:'sport',custom:'strange',packs:'love'};
 function ballImage(type,classes){return '<img class="'+classes+'" data-ball="'+type+'" src="v2-assets/balls/'+type+'.png" alt="" aria-hidden="true" decoding="async">';}
 function apricornIcon(type){return ballImage(type,'apricorn-ball official-ball');}
 const ballIcons={arena:ballImage('ultra','menu-ball ultra-ball official-ball'),vault:ballImage('master','menu-ball master-ball official-ball')};
 const rootButtons=Object.entries(labels).map(([group,label])=>{const b=document.createElement('button');b.dataset.menuGroup=group;b.innerHTML='<span class="menu-icon" aria-hidden="true">'+ballIcons[group]+'</span><span><strong>'+label+'</strong></span><span class="menu-arrow" aria-hidden="true">↗</span>';b.onclick=()=>show(group,true);nav.prepend(b);return b;});
 nav.prepend(rootButtons[0]);
 const back=document.createElement('button');back.dataset.menuBack='true';back.innerHTML='<span class="menu-icon" aria-hidden="true">‹</span><span><strong>Back to Main Menu</strong></span>';back.onclick=()=>show('home',true);nav.append(back);
 function apply(){nav.querySelectorAll('.menu-arrow').forEach(arrow=>arrow.remove());nav.dataset.menuLevel=current;for(const b of nav.querySelectorAll('button[data-tab]')){const icon=b.querySelector('.menu-icon'),type=optionBalls[b.dataset.tab];if(icon&&type&&icon.dataset.apricorn!==type){icon.dataset.apricorn=type;icon.dataset.v2='true';icon.innerHTML=apricornIcon(type);}b.querySelectorAll('small').forEach(description=>description.remove());b.hidden=current==='home'||!groups[current]?.includes(b.dataset.tab);const title=b.querySelector('strong'),label=optionLabels[b.dataset.tab];if(title&&label&&title.textContent!==label)title.textContent=label;}for(const b of rootButtons)b.hidden=current!=='home';back.hidden=current==='home';nav.setAttribute('aria-label',current==='home'?'Main menu':labels[current]);if(divider){divider.hidden=true;divider.replaceChildren();}}
 function show(group,focus=false){current=groups[group]?group:'home';apply();nav.scrollTop=0;if(focus)nav.querySelector('button:not([hidden])')?.focus({preventScroll:true});}
 const home=window.mainMenu;window.mainMenu=function(){show('home');return home.apply(this,arguments);};document.querySelector('#mainmenuButton').onclick=window.mainMenu;
 new MutationObserver(apply).observe(nav,{childList:true});show('home');return {show,group:()=>current};
})();
