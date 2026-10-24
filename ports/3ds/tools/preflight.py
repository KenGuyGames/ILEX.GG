import json,os,shutil,sys
from pathlib import Path
port=Path(__file__).resolve().parents[1]
local=port.parents[1]/'work/3ds-sdk/msys64'
sdk=Path(os.environ.get('DEVKITPRO',str(local/'opt/devkitpro') if local.is_dir() else 'C:/devkitPro'))
arm=Path(os.environ.get('DEVKITARM',str(sdk/'devkitARM')))
def tool(name,folder): return bool(shutil.which(name)) or any((folder/(name+suffix)).is_file() for suffix in ('','.exe'))
checks={'libctru headers':(sdk/'libctru/include/3ds.h').is_file(),'libctru library':(sdk/'libctru/lib/libctru.a').is_file(),'ARM compiler':tool('arm-none-eabi-gcc',arm/'bin'),'make':tool('make',local/'usr/bin'),'3dsxtool':tool('3dsxtool',sdk/'tools/bin'),'smdhtool':tool('smdhtool',sdk/'tools/bin')}
result={'ready':all(checks.values()),'checks':checks,'sdk':str(sdk),'compiled':(port/'ilex-gg.3dsx').is_file(),'hardwareTested':False}
print(json.dumps(result,indent=2));sys.exit(0 if result['ready'] else 2)
