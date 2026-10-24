from pathlib import Path
p=Path('work/pocket-research/effect-smoke.cjs');s=p.read_text().replace("let c=choose(op);", "let c=op.active&&matches(R.top(owner.active),op)?R.top(owner.active):choose(op);")
s=s.replace("if(op.kind==='drawScaled')", "if(op.kind==='zoneEnergyEach')p.bench[1]=slot(choose({names:op.names}),203);\n if(op.kind==='cureRandom')p.active.conditions=['Poisoned'];\n if(op.kind==='drawScaled')")
s=s.replace("slot(c,a.onlyBench||a.activeType||a.activeTag?202:201)","slot(c,a.onlyActive?201:202)")
p.write_text(s)
