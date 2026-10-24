from pathlib import Path
p=Path('work/android-build/preview/main.cjs');s=p.read_text(encoding='utf-8');needle="  if(process.env.ILEX_ANDROID_MUTANT_CHECKS"
if 'ILEX_ANDROID_POCKET_CHECKS' not in s:
 i=s.index(needle);s=s[:i]+"  if(process.env.ILEX_ANDROID_POCKET_CHECKS==='1'){const proof=await require(path.join(root,'../pocket-research/mobile-tests.cjs'))(win,root,evalJS);fs.writeFileSync(path.join(root,'../pocket-research/mobile-tests.json'),JSON.stringify(proof,null,2));fs.writeFileSync(path.join(root,'mobile-verification.json'),JSON.stringify(proof,null,2));console.log('Pocket mobile checks passed');app.exit(0);return;}\n"+s[i:]
p.write_text(s,encoding='utf-8')
