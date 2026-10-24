from pathlib import Path
p=Path('work/pocket-research/compile.cjs');s=p.read_text(encoding='utf-8').replace("scale:'namedBench',names:m[3].split(' or ')","scale:m[3]==='Pokémon'?'ownBench':'namedBench',...(m[3]==='Pokémon'?{}:{names:m[3].split(' or ')})");p.write_text(s,encoding='utf-8')
