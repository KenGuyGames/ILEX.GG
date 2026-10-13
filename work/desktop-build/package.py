import pathlib, json, hashlib, zipfile, concurrent.futures, shutil, datetime
root=pathlib.Path(__file__).resolve().parents[2]
app=root/'outputs/TCG Lab-win32-x64'
manifest=json.loads((app/'resources/app/ui/scan-manifest.json').read_text(encoding='utf-8'))
def verify(item):
    ident,entry=item
    data=(app/'resources'/entry['file']).read_bytes()
    assert len(data)==entry['bytes'],ident
    assert hashlib.sha256(data).hexdigest()==entry['sha256'],ident
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    list(pool.map(verify,manifest.items()))
assert len(manifest)==23736
checks=json.loads((root/'work/desktop-tests-v2/desktop-tests.json').read_text(encoding='utf-8'))
checks['persistence']=json.loads((root/'work/desktop-tests-v2/persistence.json').read_text())
checks['bundledScanHashesVerified']=len(manifest)
checks['testEnvironment']='Hidden desktop self-tests used --no-sandbox because the execution environment blocks nested Chromium sandbox processes. This switch is not enabled by the packaged launcher. Node integration remains disabled and context isolation enabled.'
checks['executableSHA256']=hashlib.sha256((app/'TCG Lab.exe').read_bytes()).hexdigest()
checks['checkedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat()
(app/'desktop-verification.json').write_text(json.dumps(checks,indent=2),encoding='utf-8')
shutil.copyfile(root/'work/desktop-tests-v2/desktop-preview.png',root/'outputs/TCG-Lab-desktop-preview.png')
(app/'README.md').write_text('''# TCG Lab desktop for Windows

Extract the entire ZIP, then double-click **TCG Lab.exe**. No Python, Node, separate browser, or installation is needed. Keep the executable, DLLs, locales and resources together. Windows 10/11, 64-bit.

All 23,736 scans from the bundled English index, including Pocket, are included and load offline. Card inspection still shows the local scan if online rules text is unavailable. Custom remote artwork and expanded official card text require internet access.

Your decks, custom cards, formats and game are saved in `%APPDATA%\\TCG Lab`. This is separate from your browser workspace. In the old browser version, choose Export workspace, then use Import workspace in the desktop app. Exports use a native Save dialog.

The simulator remains a two-player manual tabletop: effects, attacks, evolution and attachments are resolved by players. Coverage is one front image for every entry in the October 11, 2026 TCGdex English index; it does not establish every language, foil finish or printing variant globally. The source manifest and scan reports are in resources/app/ui.

The executable is unsigned, so Windows may display an unknown-publisher warning. Fan-made and unofficial; Pokemon names and artwork belong to their owners. Runtime licenses are included; font licenses are in resources/app/ui/fonts.

Desktop tests checked library images from every scan source, offline inspection, deck creation, custom cards, custom formats, dealing, draws, prizes, movement, counters, exports and persistence across launches. Every copied scan was verified against its SHA-256 manifest. See desktop-verification.json for results and the restricted test-environment limitation. The distributed launcher retains normal Chromium sandbox settings.
''',encoding='utf-8')
target=root/'outputs/TCG-Lab-Windows.zip'
with zipfile.ZipFile(target,'w',allowZip64=True,compression=zipfile.ZIP_DEFLATED,compresslevel=1) as z:
    for p in app.rglob('*'):
        if p.is_file():
            compression=zipfile.ZIP_STORED if p.parent.name=='scans' else zipfile.ZIP_DEFLATED
            z.write(p,p.relative_to(app.parent),compress_type=compression,compresslevel=1)
with zipfile.ZipFile(target) as z:
    assert len([n for n in z.namelist() if '/resources/scans/' in n])==23736
    assert 'TCG Lab-win32-x64/TCG Lab.exe' in z.namelist()
print(json.dumps({'zip':str(target),'bytes':target.stat().st_size,'verifiedScans':len(manifest),'executableSHA256':checks['executableSHA256']}))
