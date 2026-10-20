/* Trusted local Android host; desktop builds retain their Electron bridge. */
(()=>{
 let sequence=0;const pending=new Map(),listeners=new Set();
 window.__ilexNativeReply=(id,result,error)=>{const p=pending.get(id);if(!p)return;pending.delete(id);error?p.reject(Error(error)):p.resolve(result)};
 window.__ilexCacheStatus=s=>listeners.forEach(fn=>fn(s));
 function call(method,args=[]){return new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});try{IlexAndroid.postMessage(JSON.stringify({id,method,args}))}catch(e){pending.delete(id);reject(e)}})}
 if(window.IlexAndroid)window.desktop={importCube:url=>call('importCube',[url]),exportJSON:(name,data)=>call('export',[name,data]),cardCacheStatus:()=>call('status'),downloadCardCache:()=>call('download'),pauseCardCache:()=>call('pause'),onCardCacheProgress:fn=>{listeners.add(fn);return()=>listeners.delete(fn)}};
 document.documentElement.classList.add('ilex-mobile');
})();
