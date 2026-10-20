from pathlib import Path
p=Path('work/desktop-build/cube-tests.cjs');s=p.read_text(encoding='utf-8').replace("const all=d.rounds.flatMap(r=>r.packs.flat());assert.equal(all.filter(e=>e.pool==='EXpansion').length,72);", "const all=d.rounds.flatMap(r=>[...r.packs.flat(),...r.grants.flat()]);assert.equal(d.rounds.flatMap(r=>r.grants.flat()).length,72);");p.write_text(s,encoding='utf-8')
