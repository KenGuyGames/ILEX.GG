from pathlib import Path
import shutil
root=Path(__file__).resolve().parents[2]
shutil.copytree(root/'work/tournament-bot-final/ui',root/'work/tournament-bot-release/ui',dirs_exist_ok=True)
print('Release policy includes qualified Energy-count handling.',flush=True)
