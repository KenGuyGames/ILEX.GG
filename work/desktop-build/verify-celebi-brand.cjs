const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto'),root=path.resolve(__dirname,'../..'),ui=path.join(root,'work/desktop/ui'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const {NtExecutable,NtExecutableResource,Resource}=await import('resedit');
 const icon=fs.readFileSync(path.join(root,'work/desktop/icon.ico')),count=icon.readUInt16LE(4),payloads=[];
 for(let i=0;i<count;i++){const p=6+16*i,size=icon.readUInt32LE(p+8),offset=icon.readUInt32LE(p+12);payloads.push(sha(icon.subarray(offset,offset+size)));}
 const exe=fs.readFileSync(path.join(root,'work/dp-desktop-candidate/ILEX.GG.exe')),entries=NtExecutableResource.from(NtExecutable.from(exe)).entries,groups=Resource.IconGroupEntry.fromEntries(entries),sizes=groups.flatMap(g=>g.icons.map(i=>i.width||256));
 for(const n of [16,24,32,48,64,128,256])assert(sizes.includes(n),'Embedded Windows icon '+n);
 const embedded=entries.filter(e=>e.type===3).map(e=>sha(Buffer.from(e.bin)));assert(payloads.every(p=>embedded.includes(p)),'All embedded icon images match source ICO');
 const silhouette=fs.readFileSync(path.join(ui,'ilex-card-back.svg'),'utf8').match(/<path d="([^"]+)"/)[1];
 for(const file of ['ilex-icon.svg','ilex-mark.svg','presentation.js'])assert(fs.readFileSync(path.join(ui,file),'utf8').includes(silhouette),file+' uses the exact sleeve silhouette');
 assert(fs.readFileSync(path.join(root,'work/android-build/launcher-icon.xml'),'utf8').includes(silhouette));
 assert(fs.readFileSync(path.join(ui,'presentation.js'),'utf8').includes('<strong>ILEX</strong>'),'Tails remains distinct');
 const report={passed:true,windowsIconSizes:sizes,allSevenWindowsPayloadsMatch:true,sameSleeveSilhouette:true,distinctTails:true,iconSha256:sha(icon),executableSha256:sha(exe),physicalAndroidAcceptancePending:true};fs.writeFileSync(path.join(root,'work/rules-research/celebi-brand-assets.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
