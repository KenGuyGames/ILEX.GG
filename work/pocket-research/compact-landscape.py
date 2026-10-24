from pathlib import Path
p=Path('work/pocket-candidate/ui/pocket.css');s=p.read_text()+'''
.pocket-battle-mode #app{min-height:0}.pocket-battle-mode footer{display:none}.pocket-battle-mode .pocket-tabs{margin-top:0}.pocket-battle-mode #pocket-content>.toolbar{margin-top:0}
@media(max-height:550px) and (orientation:landscape){.pocket-battle-mode header{height:38px}.pocket-battle-mode header .brand{font-size:18px}.pocket-battle-mode header button{padding:4px 8px;min-height:25px;font-size:10px}.pocket-battle-mode .pocket-player{grid-template-rows:18px minmax(0,1fr) 24px}.pocket-battle-mode .pocket-slot{padding:1px}.pocket-battle-mode .pocket-hand button{padding:0}}
''';p.write_text(s)
