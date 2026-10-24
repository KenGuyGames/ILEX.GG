#include "forest_audio.h"
#include "forest_ui.h"
#include "native_test.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
typedef struct {s16 *samples;size_t bytes;ndspWaveBuf wave;} Voice;
static Voice voices[5];static int backend=0,channels[5],scene=-1,musicVolume=30,effectsVolume=70,muted=0,suspended=0;static unsigned nextVoice=1,eventCount=0;static int lastSerial=-1;static aptHookCookie hook;
static char cryQueue[3][24];static unsigned cryCount=0,cryIndex=0;static u64 nextCry=0;
static const char *state="Audio not initialized";
static void stopVoice(int i){if(!backend)return;if(backend==1){CSND_SetPlayState(channels[i],0);csndExecCmds(true);}else ndspChnWaveBufClear(channels[i]);}
static void volume(int i){float v=(muted||suspended)?0:(i?effectsVolume:musicVolume)/100.0f;if(backend==1){u32 vol=CSND_VOL(v,0);CSND_SetVol(channels[i],vol,vol);}else if(backend==2){float mix[12]={v,v};ndspChnSetMix(channels[i],mix);}}
static int playFile(int i,const char *name,int loop){if(!backend)return 0;char path[200];snprintf(path,sizeof(path),"sdmc:/3ds/ilex-gg/media/%s.pcm",name);FILE *f=fopen(path,"rb");if(!f){state="Audio asset missing - copy media/";return 0;}fseek(f,0,SEEK_END);long n=ftell(f);rewind(f);if(n<2||n>16*1024*1024||(n&1)){fclose(f);return 0;}stopVoice(i);linearFree(voices[i].samples);memset(&voices[i],0,sizeof(Voice));Voice *v=&voices[i];v->samples=linearAlloc(n);if(!v->samples){fclose(f);state="Audio memory unavailable";return 0;}int ok=fread(v->samples,1,n,f)==(size_t)n;fclose(f);if(!ok){linearFree(v->samples);v->samples=NULL;return 0;}v->bytes=n;
 float level=(muted||suspended)?0:(i?effectsVolume:musicVolume)/100.0f;
 if(backend==1){CSND_FlushDataCache(v->samples,n);Result r=csndPlaySound(channels[i],SOUND_FORMAT_16BIT|(loop?SOUND_REPEAT:SOUND_ONE_SHOT),22050,level,0,v->samples,v->samples,n);if(R_FAILED(r)){state="CSND playback failed";return 0;}csndExecCmds(true);}
 else {DSP_FlushDataCache(v->samples,n);ndspChnReset(channels[i]);ndspChnSetInterp(channels[i],NDSP_INTERP_LINEAR);ndspChnSetRate(channels[i],22050);ndspChnSetFormat(channels[i],NDSP_FORMAT_MONO_PCM16);volume(i);v->wave.data_vaddr=v->samples;v->wave.nsamples=n/2;v->wave.looping=loop;ndspChnWaveBufAdd(channels[i],&v->wave);}
 eventCount++;return 1;
}
static void pauseHook(APT_HookType type,void *param){(void)param;if(type==APTHOOK_ONSUSPEND||type==APTHOOK_ONSLEEP){suspended=1;for(int i=0;i<5;i++){volume(i);if(backend==2)ndspChnSetPaused(channels[i],true);}if(backend==1)csndExecCmds(false);}else if(type==APTHOOK_ONRESTORE||type==APTHOOK_ONWAKEUP){suspended=0;for(int i=0;i<5;i++){volume(i);if(backend==2)ndspChnSetPaused(channels[i],false);}if(backend==1)csndExecCmds(false);}}
void ilex_audio_init(void){FILE *f=fopen("sdmc:/3ds/ilex-gg/audio.cfg","r");if(f){int v,m,e,u;if(fscanf(f,"ILEXAUDIO %d %d %d %d",&v,&m,&e,&u)==4&&v==1&&m>=0&&m<=100&&e>=0&&e<=100&&(u==0||u==1)){musicVolume=m;effectsVolume=e;muted=u;}fclose(f);}
 if(R_SUCCEEDED(csndInit())){int n=0;for(int i=0;i<32&&n<5;i++)if(csndChannels&BIT(i))channels[n++]=i;if(n==5){backend=1;state="CSND audio ready";}else csndExit();}
 if(!backend&&R_SUCCEEDED(ndspInit())){backend=2;for(int i=0;i<5;i++)channels[i]=i;ndspSetOutputMode(NDSP_OUTPUT_STEREO);state="DSP audio ready";}
 if(!backend)state="Audio unavailable; check DSP firmware";
 aptHook(&hook,pauseHook,NULL);ilex_audio_scene(0);
}
void ilex_audio_exit(void){aptUnhook(&hook);for(int i=0;i<5;i++){stopVoice(i);linearFree(voices[i].samples);voices[i].samples=NULL;}if(backend==1)csndExit();else if(backend==2)ndspExit();backend=0;}
void ilex_audio_scene(int battle){battle=!!battle;if(scene==battle)return;scene=battle;playFile(0,battle?"battle":"menu",1);}
void ilex_audio_effect(const char *name){if(muted||suspended||!effectsVolume)return;if(!name||strspn(name,"abcdefghijklmnopqrstuvwxyz0123456789-")!=strlen(name))return;playFile(nextVoice,name,0);nextVoice=nextVoice%3+1;}
const char *ilex_audio_status(void){return state;}
unsigned ilex_audio_test_events(void){return eventCount;}
void ilex_audio_reset(void){lastSerial=-1;cryCount=cryIndex=0;stopVoice(4);}
void ilex_audio_update(void){if(muted||suspended){cryCount=cryIndex=0;return;}if(cryIndex<cryCount&&osGetTime()>=nextCry){if(playFile(4,cryQueue[cryIndex++],0))nextCry=osGetTime()+voices[4].bytes*1000/44100+60;}}
void ilex_audio_observe(JSContext *ctx){const char *code="IlexPlay.presentation?.()";JSValue v=JS_Eval(ctx,code,strlen(code),"audio-view",0);if(JS_IsException(v)){JSValue e=JS_GetException(ctx);JS_FreeValue(ctx,e);JS_FreeValue(ctx,v);return;}if(JS_IsObject(v)){JSValue s=JS_GetPropertyStr(ctx,v,"serial"),b=JS_GetPropertyStr(ctx,v,"battle");int32_t serial=-1;JS_ToInt32(ctx,&serial,s);ilex_audio_scene(JS_ToBool(ctx,b));JS_FreeValue(ctx,s);JS_FreeValue(ctx,b);if(lastSerial>=0&&serial>lastSerial){JSValue events=JS_GetPropertyStr(ctx,v,"events"),len=JS_GetPropertyStr(ctx,events,"length");int32_t count=0;JS_ToInt32(ctx,&count,len);for(int i=0;i<count&&i<4;i++){JSValue e=JS_GetPropertyUint32(ctx,events,i);const char *name=JS_ToCString(ctx,e);if(name)ilex_audio_effect(name);JS_FreeCString(ctx,name);JS_FreeValue(ctx,e);}JS_FreeValue(ctx,len);JS_FreeValue(ctx,events);JSValue cries=JS_GetPropertyStr(ctx,v,"cries"),cl=JS_GetPropertyStr(ctx,cries,"length");int32_t cn=0;JS_ToInt32(ctx,&cn,cl);cryIndex=cryCount=0;nextCry=0;for(int i=0;i<cn&&i<3;i++){JSValue id=JS_GetPropertyUint32(ctx,cries,i);int32_t value=0;JS_ToInt32(ctx,&value,id);JS_FreeValue(ctx,id);if(value>0)snprintf(cryQueue[cryCount++],24,"cry-%ld",(long)value);}JS_FreeValue(ctx,cl);JS_FreeValue(ctx,cries);ilex_audio_update();}lastSerial=serial;}JS_FreeValue(ctx,v);}
void ilex_audio_settings(void){unsigned selected=0;bool dirty=true;while(aptMainLoop()){hidScanInput();u32 keys=hidKeysDown();
#ifdef ILEX_TEST_BUILD
 keys=ilex_test_audio_keys();
#endif
 if(keys&(KEY_B|KEY_START|KEY_SELECT))break;
 if(keys&KEY_DOWN){selected=(selected+1)%3;dirty=true;}if(keys&KEY_UP){selected=(selected+2)%3;dirty=true;}if(keys&KEY_TOUCH){touchPosition t;hidTouchRead(&t);if(t.py>=50&&t.py<146){selected=(t.py-50)/32;keys|=KEY_A;}}
 if(keys&(KEY_LEFT|KEY_RIGHT|KEY_A)){if(selected==2)muted=!muted;else{int *vol=selected==0?&musicVolume:&effectsVolume;*vol+=keys&KEY_LEFT?-10:10;if(*vol>100)*vol=0;if(*vol<0)*vol=100;}for(int i=0;i<5;i++)volume(i);if(backend==1)csndExecCmds(true);ilex_audio_effect("select");dirty=true;}
 if(dirty){ilex_ui_home("Audio Settings",state);ilex_ui_panel("Music & Sound Effects","","D-pad Left/Right Adjust    B Return");char labels[3][60];snprintf(labels[0],60,"Music volume              %d%%",musicVolume);snprintf(labels[1],60,"Sound effects             %d%%",effectsVolume);snprintf(labels[2],60,"Mute all audio            %s",muted?"ON":"OFF");for(int i=0;i<3;i++){ilex_ui_box(GFX_BOTTOM,12,50+i*32,296,28,i==selected?0x2b27:0x1a05,ILEX_GOLD);ilex_ui_text(GFX_BOTTOM,20,58+i*32,labels[i],ILEX_CREAM,46);}dirty=false;}gfxFlushBuffers();gfxSwapBuffers();gspWaitForVBlank();}
 FILE *f=fopen("sdmc:/3ds/ilex-gg/audio.cfg.tmp","w");if(f){int ok=fprintf(f,"ILEXAUDIO 1 %d %d %d\n",musicVolume,effectsVolume,muted)>0;if(fflush(f))ok=0;if(fclose(f))ok=0;if(ok){remove("sdmc:/3ds/ilex-gg/audio.cfg.bak");rename("sdmc:/3ds/ilex-gg/audio.cfg","sdmc:/3ds/ilex-gg/audio.cfg.bak");if(rename("sdmc:/3ds/ilex-gg/audio.cfg.tmp","sdmc:/3ds/ilex-gg/audio.cfg"))rename("sdmc:/3ds/ilex-gg/audio.cfg.bak","sdmc:/3ds/ilex-gg/audio.cfg");}}
}
