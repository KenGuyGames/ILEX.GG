from pathlib import Path
p=Path('work/pocket-candidate/ui/pocket-engine.js');s=p.read_text(encoding='utf-8');a=s.index("   else if(op.kind==='choosePokemon')");b=s.index("   else if(op.kind===",a+12);chunk=s[a:b].replace('slots(owner).filter(t=>','slots(owner).filter(t=>targetCanResolve(s,p,t,op.next)&&');s=s[:a]+chunk+s[b:];p.write_text(s,encoding='utf-8')
