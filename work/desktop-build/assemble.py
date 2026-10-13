import pathlib, zipfile, shutil, json
from PIL import Image, ImageDraw
root=pathlib.Path(__file__).resolve().parents[2]
dest=root/'outputs/TCG Lab-win32-x64'
dest.mkdir(parents=True,exist_ok=True)
runtime=next((root/'work/electron-cache').rglob('electron-v44.7.0-win32-x64.zip'))
with zipfile.ZipFile(runtime) as z:
    for item in z.infolist():
        target=(dest/item.filename).resolve()
        assert target.is_relative_to(dest.resolve())
    z.extractall(dest)
(dest/'electron.exe').rename(dest/'TCG Lab.exe')
shutil.copytree(root/'work/desktop',dest/'resources/app',dirs_exist_ok=True)
shutil.copytree(root/'outputs/Pokemon-TCG-Lab/scans',dest/'resources/scans',dirs_exist_ok=True)
im=Image.new('RGBA',(256,256),(12,16,19,255));d=ImageDraw.Draw(im)
d.rounded_rectangle((12,12,244,244),radius=52,fill=(19,27,30),outline=(174,236,87),width=8)
d.ellipse((52,52,204,204),fill=(174,236,87))
d.rectangle((52,122,204,136),fill=(12,16,19))
d.ellipse((102,102,154,154),fill=(12,16,19))
d.ellipse((114,114,142,142),fill=(174,236,87))
im.save(root/'work/desktop/icon.ico',sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)])
shutil.copyfile(root/'work/desktop/icon.ico',dest/'resources/app/icon.ico')
(dest/'START HERE.txt').write_text('''TCG Lab for Windows 10/11 (64-bit)

Double-click TCG Lab.exe. No Python, Node, browser, or installation required.
Keep this entire folder together; resources contains all 23,736 scans.

Your desktop workspace is saved in %APPDATA%\\TCG Lab. To bring existing browser decks across, export the browser workspace and use Import workspace here.

Artwork is available offline. Expanded card text and custom remote artwork require internet access. Card effects are resolved manually.

This build is unsigned. Windows may show an unknown-publisher warning.
Fan-made and unofficial. Pokemon names and artwork belong to their owners.
''',encoding='utf-8')
print(json.dumps({'folder':str(dest),'scans':len(list((dest/'resources/scans').iterdir()))}))
