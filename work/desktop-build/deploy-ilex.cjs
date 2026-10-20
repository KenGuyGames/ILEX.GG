const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'../..');
const old=path.join(root,'outputs/TCG Lab-win32-x64'),dest=path.join(root,'outputs/ILEX.GG-win32-x64');
fs.cpSync(old,dest,{recursive:true});
fs.renameSync(path.join(dest,'TCG Lab.exe'),path.join(dest,'ILEX.GG.exe'));
fs.cpSync(path.join(root,'work/desktop'),path.join(dest,'resources/app'),{recursive:true});
fs.copyFileSync(path.join(root,'work/desktop/rules-self-test.cjs'),path.join(dest,'resources/app/self-test.cjs'));
fs.writeFileSync(path.join(dest,'START HERE.txt'),'ILEX.GG for Windows 10/11 (64-bit)\r\n\r\nDouble-click ILEX.GG.exe. Keep the entire folder together.\r\nYour previous TCG Lab workspace loads automatically.\r\n');
(async()=>{const {resedit}=await import('@electron/packager/resedit');await resedit(path.join(dest,'ILEX.GG.exe'),{iconPath:path.join(root,'work/desktop/icon.ico'),productVersion:'1.4.0',fileVersion:'1.4.0',productName:'ILEX.GG',win32Metadata:{CompanyName:'ILEX.GG',FileDescription:'ILEX.GG Pokemon TCG simulator',ProductName:'ILEX.GG',InternalName:'ILEX.GG',OriginalFilename:'ILEX.GG.exe'}});console.log('ILEX.GG desktop deployed and branded');})().catch(e=>{console.error(e);process.exitCode=1});
