/* Advance only on entering home, never on an ordinary redraw or timer. */
var MainMenuArt=(()=>{
 const selections=[['hgss4-92','Celebi Prime','Triumphant'],['neo3-3','Celebi','Neo Revelation'],['neo4-106','Shining Celebi','Neo Destiny'],['ex10-117','Celebi ex','Unseen Forces'],['bw7-9','Celebi-EX','Boundaries Crossed'],['bw7-141','Celebi-EX','Boundaries Crossed'],['swsh8-245','Celebi V','Fusion Strike'],['smp-SM79','Shining Celebi','Black Star Promo']];
 let inMenu=false,initialized=false,index=0;
 function sync(home){
  if(!home){inMenu=false;return;}
  const pool=selections.filter(([id])=>find(id));if(!pool.length)return;
  if(!initialized||!inMenu){
   index=initialized?(index+1)%pool.length:0;
   const [id,name,set]=pool[index],card=find(id),host=document.querySelector('#menu-celebi'),img=host.querySelector('img');
   host.dataset.cardId=id;host.setAttribute('aria-label','Inspect '+name+' from '+set);
   img.hidden=false;img.src=image(card);img.alt=name+' — '+set;host.dataset.previewSrc=image(card);host.dataset.previewName=img.alt;
   img.onerror=()=>{img.onerror=null;img.src=image(find('hgss4-92'));};
   document.querySelector('#menu-celebi-caption').textContent=name+' · '+set;
   host.onclick=()=>inspect(id);
   initialized=true;
  }
  inMenu=true;
 }
 return {sync};
})();
