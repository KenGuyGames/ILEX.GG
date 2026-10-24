/* No card engine is needed to select a format or locate an SD save. */
var IlexPlay=(()=>{
 let request='',resume=false,message='Choose a format';
 const formats=IlexFormats;
 function view(){return{title:message,rows:formats.map(f=>f.name+' ('+(f.playable??f.decks)+'/'+f.decks+')'),auto:false,loadRuntime:request,resumeRequested:resume};}
 function choose(i){if(!Number.isInteger(i)||!formats[i])return'Choose a format';const f=formats[i];if(f.available===false)return message=f.reason||'No playable decks';request=f.id;return'';}
 function beginRestore(text){const saved=JSON.parse(text);if(saved.version!==1||!saved.spec||!Array.isArray(saved.journal))throw Error('Unsupported match save');const id=saved.spec.format?.id,found=id?formats.find(f=>f.formatId===id):null;if(id&&!found)throw Error('Saved format is not installed');request=found?.id||saved.module||'starter';if(!formats.some(f=>f.id===request))throw Error('Saved card module is not installed');resume=true;return{done:true,moduleChange:true,index:0,total:0};}
 return{view,choose,beginRestore,cancelRestore(){},back(){},inspect:i=>formats[i]?.reason||formats[i]?.name||'',inspectCard:()=>'',state:()=>null,finished:()=>false,automationState:()=>({menu:'formats'}),health:()=>({failure:'',revision:-1}),presentation:()=>({serial:0,events:[],cries:[],battle:false})};
})();
