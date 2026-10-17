(()=>{
 const checks=[],check=(value,name)=>{if(!value)throw Error(name);checks.push(name);};
 const deck={cards:{'base1-1':2,'base1-58':3,'base1-32':3,'base1-43':4,'bw10-88':3,'bw10-84':1,'bw6-116':4,'pl1-104':4,'bw1-106':2,'bw6-117':4}};
 const before=JSON.stringify(deck),host=document.createElement('div');host.innerHTML=visualDeckCards(deck);
 const ids=label=>[...host.querySelectorAll('section[aria-label="'+label+'"] [data-deck-card]')].map(x=>x.dataset.deckCard);
 check(JSON.stringify(ids('Pokémon'))===JSON.stringify(['base1-43','base1-32','base1-1','base1-58']),'Rendered evolution lines remain together in copy-count order');
 check(JSON.stringify(ids('Trainer cards'))===JSON.stringify(['bw10-84','bw6-116','bw10-88','pl1-104']),'Rendered Trainers use Supporter Item Tool Stadium order');
 check(JSON.stringify(ids('Energy cards'))===JSON.stringify(['bw1-106','bw6-117']),'Rendered Basic Energy precedes Special Energy');
 check(JSON.stringify(deck)===before,'Rendering leaves deck contents and saved insertion order unchanged');
 check(host.querySelectorAll('.deck-card-quantity').length===10&&host.querySelectorAll('.deck-copy-badge').length===10,'Sorted printings retain quantity controls and copy badges');
 return {passed:true,checks};
})()
