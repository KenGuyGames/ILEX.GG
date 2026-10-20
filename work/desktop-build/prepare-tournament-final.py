from pathlib import Path
import shutil
root=Path(__file__).resolve().parents[2]
shutil.copytree(root/'work/tournament-bot-resources/ui',root/'work/tournament-bot-final/ui',dirs_exist_ok=True)
print('Separate final discard-quantity candidate prepared.',flush=True)
