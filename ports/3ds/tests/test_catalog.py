import importlib.util,json,struct,tempfile,unittest
from pathlib import Path
port=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('exporter',port/'tools/export_catalog.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
tmp_root=port/'staging/test-tmp';tmp_root.mkdir(parents=True,exist_ok=True)
class CatalogTests(unittest.TestCase):
 def test_roundtrip_and_determinism(self):
  with tempfile.TemporaryDirectory(dir=tmp_root) as tmp:
   tmp=Path(tmp);src=tmp/'cards.json';src.write_text(json.dumps([{'id':'z','name':'Shaymin-EX'},{'id':'a','name':'Nidoran♀'}]));a=m.export(src,tmp/'a');b=m.export(src,tmp/'b');data=(tmp/'a/catalog.bin').read_bytes();self.assertEqual(a,b);self.assertEqual(struct.unpack('<4sIII',data[:16]),(b'ILXC',1,2,192));self.assertEqual(len(data),400);self.assertEqual(data[16:80].split(b'\0')[0],b'a');self.assertEqual(a['runtimePageBytes'],1536)
 def test_duplicate_ids_rejected(self):
  with tempfile.TemporaryDirectory(dir=tmp_root) as tmp:
   tmp=Path(tmp);src=tmp/'cards.json';src.write_text(json.dumps([{'id':'a','name':'A'},{'id':'a','name':'B'}]));self.assertRaises(ValueError,m.export,src,tmp/'out')
 def test_overlong_ids_rejected(self):
  with tempfile.TemporaryDirectory(dir=tmp_root) as tmp:
   tmp=Path(tmp);src=tmp/'cards.json';src.write_text(json.dumps([{'id':'x'*64,'name':'A'}]));self.assertRaises(ValueError,m.export,src,tmp/'out')
 def test_real_catalog_every_printing_preserved(self):
  source=m.REPO/'work/v2-candidate/ui/cards.json'
  with tempfile.TemporaryDirectory(dir=tmp_root) as tmp:
   dest=Path(tmp);result=m.export(source,dest);data=(dest/'catalog.bin').read_bytes();ids=[m.RECORD.unpack_from(data,16+i*192)[0].split(b'\0')[0].decode() for i in range(result['cards'])];self.assertEqual(set(ids),{c['id'] for c in json.loads(source.read_text())});self.assertEqual(len(data),16+192*result['cards'])
if __name__=='__main__':unittest.main()
