"""Rewrite selected ZIP entries while preserving unchanged compressed bytes."""
import copy, shutil, zipfile

def rewrite(source, destination, replacements, additions=None):
    additions = additions or {}
    with zipfile.ZipFile(source) as old, zipfile.ZipFile(destination, 'w', allowZip64=True) as new:
        infos = sorted(old.infolist(), key=lambda item: item.header_offset)
        if len({item.filename for item in infos}) != len(infos):
            raise ValueError('Duplicate source ZIP entries')
        with open(source, 'rb') as raw:
            for index, item in enumerate(infos):
                if item.filename in replacements:
                    value = replacements[item.filename]
                    if value is not None:
                        new.write(value, item.filename, compress_type=item.compress_type)
                    continue
                end = infos[index + 1].header_offset if index + 1 < len(infos) else old.start_dir
                raw.seek(item.header_offset)
                clone = copy.copy(item)
                clone.header_offset = new.fp.tell()
                new._writecheck(clone)
                new._didModify = True
                remaining = end - item.header_offset
                while remaining:
                    chunk = raw.read(min(4 * 1024 * 1024, remaining))
                    if not chunk:
                        raise EOFError(item.filename)
                    new.fp.write(chunk)
                    remaining -= len(chunk)
                new.filelist.append(clone)
                new.NameToInfo[clone.filename] = clone
                new.start_dir = new.fp.tell()
            for name, value in additions.items():
                if name in new.NameToInfo:
                    raise ValueError('Duplicate added entry ' + name)
                new.write(value, name, compress_type=zipfile.ZIP_DEFLATED)

if __name__ == '__main__':
    import pathlib, contextlib
    test_folder=pathlib.Path(__file__).resolve().parents[1]/'tournament-bot-final/zip-selftest'
    test_folder.mkdir(parents=True,exist_ok=True)
    with contextlib.nullcontext(test_folder) as folder:
        folder = pathlib.Path(folder)
        old, new = folder/'old.zip', folder/'new.zip'
        replacement = folder/'changed.txt'
        replacement.write_bytes(b'changed\n')
        with zipfile.ZipFile(old, 'w', allowZip64=True) as archive:
            archive.writestr('stored', b'preserved'*1000, compress_type=zipfile.ZIP_STORED)
            archive.writestr('compressed', b'preserved'*1000, compress_type=zipfile.ZIP_DEFLATED)
            archive.writestr('changed', b'old')
            archive.writestr('removed', b'old')
        rewrite(old, new, {'changed': replacement, 'removed': None}, {'added': replacement})
        with zipfile.ZipFile(new) as archive:
            assert archive.testzip() is None
            assert archive.read('stored') == b'preserved'*1000
            assert archive.read('compressed') == b'preserved'*1000
            assert archive.read('changed') == b'changed\n'
            assert archive.read('added') == b'changed\n'
            assert 'removed' not in archive.namelist()
        print('Raw ZIP preservation and replacement integrity checks pass.')
