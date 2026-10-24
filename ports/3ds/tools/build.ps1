param([switch]$NativeTest)
$ErrorActionPreference='Stop'
$port=Split-Path $PSScriptRoot -Parent
$root=Split-Path (Split-Path $port -Parent) -Parent
$bash=Join-Path $root 'work/3ds-sdk/msys64/usr/bin/bash.exe'
if(!(Test-Path $bash)){throw 'Workspace SDK missing; install devkitPro 3ds-dev first.'}
$posix='/'+$port.Substring(0,1).ToLower()+$port.Substring(2).Replace('\','/')
$command='export PATH=/usr/bin:/bin; source /etc/profile.d/devkit-env.sh; export PATH=$DEVKITPRO/tools/bin:$DEVKITARM/bin:$PATH; cd "{0}"; make -j2' -f $posix
if($NativeTest){$command+=' TARGET=ilex-test BUILD=build-test ILEX_EXTRA_CFLAGS=-DILEX_TEST_BUILD'}
& $bash --noprofile --norc -c $command
if($LASTEXITCODE){throw '3DS build failed'}

