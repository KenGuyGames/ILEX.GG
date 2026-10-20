from pathlib import Path
import shutil
root=Path(__file__).resolve().parents[2]
target=root/'work/tournament-bot-resources/ui'
shutil.copytree(root/'work/tournament-bot-candidate/ui',target,dirs_exist_ok=True)
print('Independent resource-scaling candidate prepared; current comparison unchanged.',flush=True)
