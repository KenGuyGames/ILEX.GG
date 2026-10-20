const path=require('node:path');
(async()=>{
  const {resedit}=await import('@electron/packager/resedit');
  const root=path.resolve(__dirname,'../..');
  await resedit(path.join(root,'outputs/TCG Lab-win32-x64/TCG Lab.exe'),{
    iconPath:path.join(root,'work/desktop/icon.ico'),productVersion:'1.1.0',fileVersion:'1.1.0',productName:'TCG Lab',
    win32Metadata:{CompanyName:'TCG Lab',FileDescription:'Pokemon TCG Lab desktop simulator',ProductName:'TCG Lab',InternalName:'TCG Lab',OriginalFilename:'TCG Lab.exe'}
  });
  console.log('Executable branding complete');
})().catch(e=>{console.error(e);process.exitCode=1});
