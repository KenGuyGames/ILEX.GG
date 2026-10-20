from pathlib import Path
p=Path('work/cube-candidate/ui/cube-ui.js');s=p.read_text(encoding='utf-8')
s=s.replace("if(!c){$('#app').innerHTML+=cubeImportPanel();bindCubeImport();return;}","if(!c){$('#app').innerHTML+='<div class=\"panel\"><p>No cubes in your library.</p><button onclick=\"newCube()\">New cube</button>'+cubeRestoreButton()+'</div>'+cubeImportPanel();bindCubeImport();return;}")
s=s.replace('<button onclick="cubeAddEntry()">Add a card</button></div>', '<button onclick="cubeAddEntry()">Add a card</button><button onclick="deleteCube()">Delete cube</button>${cubeRestoreButton()}</div>')
s+='''
function cubeRestoreButton(){return state.deletedCubes?.length?'<button onclick="restoreDeletedCube()">Restore deleted cube</button>':'';}
function deleteCube(){
 const cube=currentCube();if(!cube)return;
 const id=cube.id;
 modal('<h2>Delete cube?</h2><p>Remove '+esc(cube.name)+' from your cube library? Your drafted decks, saved formats and current match will be kept. You can restore the cube afterward.</p><div class="row"><button id="cube-delete-cancel">Cancel</button><button id="cube-delete-confirm">Delete cube</button></div>');
 $('#cube-delete-cancel').onclick=()=>$('#modal').close();
 $('#cube-delete-confirm').onclick=()=>{
  const index=state.cubes.findIndex(c=>c.id===id);if(index<0)return $('#modal').close();
  const [removed]=state.cubes.splice(index,1);(state.deletedCubes??=[]).push({cube:removed,deletedAt:new Date().toISOString()});
  activeCubeId=state.cubes[Math.min(index,state.cubes.length-1)]?.id||'';cubeListPage=0;cubeListQuery='';cubeListFilter='Core';
  if(state.cubeDrafts.some(d=>d.cubeId===id&&d.id===state.activeCubeDraftId))state.activeCubeDraftId='';
  save();$('#modal').close();cubeScreen();toast('Cube deleted. Restore deleted cube can bring it back.');
 };
}
function restoreDeletedCube(){
 const entry=state.deletedCubes?.at(-1);if(!entry)return;
 if(state.cubes.some(c=>c.id===entry.cube.id))return toast('A cube with this ID is already in your library');
 state.deletedCubes.pop();state.cubes.push(entry.cube);activeCubeId=entry.cube.id;cubeListPage=0;cubeListQuery='';cubeListFilter='Core';save();cubeScreen();toast('Cube restored');
}
'''
p.write_text(s,encoding='utf-8')
