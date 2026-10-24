#include "native_test.h"
#include <3ds.h>
#include <stdio.h>
#include <stdlib.h>
#include <errno.h>
#include <string.h>
#include "quickjs.h"
#include "play.h"
#include "card_art.h"
#include "forest_ui.h"
#include "forest_audio.h"
#define SAVE "sdmc:/3ds/ilex-gg/match.json"
#define PAGE ILEX_CHOICE_PAGE
#define COMMAND_MS 90000
static char error[200];
static int loading=0,primaryValid=1;
static char currentModule[48]="menu",currentMethod[32]="load";static int lastSafeRevision=-1;
static int interrupt(JSRuntime *rt,void *opaque){(void)rt;u64 now=osGetTime();static u64 lastPoll=0;if(now-lastPoll>=100){hidScanInput();lastPoll=now;}return now>*(u64*)opaque||(loading&&(hidKeysHeld()&KEY_B));}
static void exception(JSContext *ctx){JSValue e=JS_GetException(ctx);const char *s=JS_ToCString(ctx,e);snprintf(error,sizeof(error),"%.180s",s?s:"Runtime exception");JSValue stack=JS_IsObject(e)?JS_GetPropertyStr(ctx,e,"stack"):JS_UNDEFINED;const char *trace=JS_IsString(stack)?JS_ToCString(ctx,stack):NULL;JSMemoryUsage usage;JS_ComputeMemoryUsage(JS_GetRuntime(ctx),&usage);FILE *f=fopen("sdmc:/3ds/ilex-gg/match-error.txt","w");if(f){fprintf(f,"ILEX.GG match diagnostic\nModule: %s\nOperation: %s\nLast saved actions: %d\nJS allocation (not peak): %lld\nError: %s\n%.2400s\n",currentModule,currentMethod,lastSafeRevision,(long long)usage.malloc_size,error,trace?trace:"");fclose(f);}JS_FreeCString(ctx,trace);JS_FreeValue(ctx,stack);JS_FreeCString(ctx,s);JS_FreeValue(ctx,e);JS_ResetUncatchableError(ctx);}
static JSValue call(JSContext *ctx,const char *method,int argc,JSValueConst *argv){
#ifdef ILEX_TEST_BUILD
 u64 operationStart=osGetTime();
#endif
snprintf(currentMethod,sizeof(currentMethod),"%.31s",method);JSValue global=JS_GetGlobalObject(ctx),object=JS_GetPropertyStr(ctx,global,"IlexPlay"),fn=JS_GetPropertyStr(ctx,object,method),result=JS_Call(ctx,fn,object,argc,argv);JS_FreeValue(ctx,fn);if(!JS_IsException(result)&&(!strcmp(method,"choose")||!strcmp(method,"tick")||!strcmp(method,"handChoose"))){JSValue health=JS_GetPropertyStr(ctx,object,"health");if(JS_IsFunction(ctx,health)){JSValue h=JS_Call(ctx,health,object,0,NULL);if(!JS_IsException(h)){JSValue failure=JS_GetPropertyStr(ctx,h,"failure");const char *text=JS_ToCString(ctx,failure);if(text&&*text){JS_FreeValue(ctx,result);result=JS_ThrowInternalError(ctx,"%s",text);}JS_FreeCString(ctx,text);JS_FreeValue(ctx,failure);}else{JS_FreeValue(ctx,result);result=h;h=JS_UNDEFINED;}JS_FreeValue(ctx,h);}JS_FreeValue(ctx,health);}JS_FreeValue(ctx,object);JS_FreeValue(ctx,global);if(JS_IsException(result))exception(ctx);
#ifdef ILEX_TEST_BUILD
 ilex_test_record(method,osGetTime()-operationStart);
#endif
 return result;}
static char *read_file(const char *path,size_t *length){FILE *f=fopen(path,"rb");if(!f)return NULL;fseek(f,0,SEEK_END);long n=ftell(f);rewind(f);if(n<=0||n>8*1024*1024){fclose(f);return NULL;}char *s=malloc(n+1);if(!s){fclose(f);return NULL;}if(fread(s,1,n,f)!=(size_t)n){free(s);fclose(f);return NULL;}fclose(f);s[n]=0;*length=n;return s;}
static int save(JSContext *ctx){JSValue v=call(ctx,"snapshot",0,NULL);if(JS_IsException(v))return 0;size_t n=0;const char *s=JS_ToCStringLen(ctx,&n,v);int ok=0;if(s&&n<2*1024*1024){FILE *f=fopen(SAVE ".tmp","wb");if(f){ok=fwrite(s,1,n,f)==n;if(fflush(f))ok=0;if(fclose(f))ok=0;if(ok){int moved=0;if(primaryValid){if(remove(SAVE ".bak")&&errno!=ENOENT)ok=0;if(ok){if(!rename(SAVE,SAVE ".bak"))moved=1;else if(errno!=ENOENT)ok=0;}}else if(remove(SAVE)&&errno!=ENOENT)ok=0;if(ok&&rename(SAVE ".tmp",SAVE)){if(moved)rename(SAVE ".bak",SAVE);ok=0;}if(ok)primaryValid=1;}}}JS_FreeCString(ctx,s);JS_FreeValue(ctx,v);if(!ok)snprintf(error,sizeof(error),"Save failed. Check SD free space.");return ok;}
static int restore(JSContext *ctx,PrintConsole *top,PrintConsole *bottom,u64 *deadline){
 for(unsigned attempt=0;attempt<2;attempt++){size_t n;char *saved=read_file(attempt?SAVE ".bak":SAVE,&n);if(!saved)continue;*deadline=osGetTime()+300000;JSValue arg=JS_NewStringLen(ctx,saved,n),progress=call(ctx,"beginRestore",1,&arg);free(saved);JS_FreeValue(ctx,arg);int ok=!JS_IsException(progress),done=0,deferred=0;int32_t index=0,total=0;u64 nextDraw=0;
  while(ok){JSValue d=JS_GetPropertyStr(ctx,progress,"done"),defer=JS_GetPropertyStr(ctx,progress,"moduleChange"),i=JS_GetPropertyStr(ctx,progress,"index"),t=JS_GetPropertyStr(ctx,progress,"total");done=JS_ToBool(ctx,d);deferred=JS_ToBool(ctx,defer);JS_ToInt32(ctx,&index,i);JS_ToInt32(ctx,&total,t);JS_FreeValue(ctx,d);JS_FreeValue(ctx,defer);JS_FreeValue(ctx,i);JS_FreeValue(ctx,t);JS_FreeValue(ctx,progress);if(done)break;
   if(!aptMainLoop()){JSValue cancelled=call(ctx,"cancelRestore",0,NULL);JS_FreeValue(ctx,cancelled);snprintf(error,sizeof(error),"Restore cancelled");return 0;}hidScanInput();if(hidKeysDown()&KEY_B){JSValue cancelled=call(ctx,"cancelRestore",0,NULL);JS_FreeValue(ctx,cancelled);snprintf(error,sizeof(error),"Restore cancelled");return 0;}
   if(osGetTime()>=nextDraw){ilex_ui_progress(attempt?"Restoring backup":"Restoring match",index,total);gfxFlushBuffers();gfxSwapBuffers();nextDraw=osGetTime()+100;}
   u64 sliceEnd=osGetTime()+12;unsigned steps=0;do{*deadline=osGetTime()+COMMAND_MS;JSValue amount=JS_NewInt32(ctx,1);progress=call(ctx,"stepRestore",1,&amount);JS_FreeValue(ctx,amount);ok=!JS_IsException(progress);if(!ok)break;JSValue complete=JS_GetPropertyStr(ctx,progress,"done");int completeNow=JS_ToBool(ctx,complete);JS_FreeValue(ctx,complete);if(completeNow||osGetTime()>=sliceEnd||++steps>=8)break;JS_FreeValue(ctx,progress);}while(1);
   gspWaitForVBlank();
  }
  if(!ok){JS_FreeValue(ctx,progress);*deadline=osGetTime()+COMMAND_MS;JSValue cancelled=call(ctx,"cancelRestore",0,NULL);JS_FreeValue(ctx,cancelled);}else{primaryValid=attempt==0;error[0]=0;
#ifdef ILEX_TEST_BUILD
   ilex_test_restored(attempt!=0,index,deferred);
#endif
   return 1;}
 }
 if(!error[0]){snprintf(error,sizeof(error),"No readable match save found.");}return 0;
}
static void fatal(PrintConsole *bottom,const char *message){(void)bottom;ilex_ui_panel("Unable to start match",message,"B / START Return");while(aptMainLoop()){hidScanInput();if(hidKeysDown()&(KEY_B|KEY_START))break;gfxFlushBuffers();gfxSwapBuffers();gspWaitForVBlank();}}
void ilex_play(PrintConsole *top,PrintConsole *bottom){
 bool isNew=false;APT_CheckNew3DS(&isNew);if(!isNew){consoleSelect(bottom);consoleClear();printf("New 3DS / New 2DS required");return;}
 char module[48]="menu";int showBoot=1,restoreOnLoad=0;
 reload_runtime:;
 snprintf(currentModule,sizeof(currentModule),"%.47s",module);lastSafeRevision=-1;
 char status[100]="";unsigned cursor=0,handCursor=0;int handFocus=0;int previousActions=-1;u64 pulseUntil=0;unsigned pulseFrame=0;u64 nextTick=0,deadline=osGetTime()+300000;
 JSRuntime *rt=JS_NewRuntime();if(!rt){fatal(bottom,"Runtime allocation failed");return;}JS_SetMemoryLimit(rt,64*1024*1024);JS_SetMaxStackSize(rt,512*1024);JS_SetInterruptHandler(rt,interrupt,&deadline);JSContext *ctx=JS_NewContext(rt);if(!ctx){JS_FreeRuntime(rt);fatal(bottom,"Context allocation failed");return;}
 error[0]=0;ilex_ui_home("Loading Your Match","Preparing the rules engine");ilex_ui_panel("Please Wait","Loading cards and rules...\n\nB Cancel","Your saved match is preserved");gfxFlushBuffers();gfxSwapBuffers();gspWaitForVBlank();
 char engineFile[80],dataFile[80];if(!strcmp(module,"menu")||!strcmp(module,"starter")||!strcmp(module,"unassigned")){snprintf(engineFile,sizeof(engineFile),"base-engine.js");snprintf(dataFile,sizeof(dataFile),!strcmp(module,"starter")?"starter-data.js":!strcmp(module,"unassigned")?"unassigned-data.js":"map.js");}else{snprintf(engineFile,sizeof(engineFile),"modules/%s-engine.js",module);snprintf(dataFile,sizeof(dataFile),"modules/%s-data.js",module);}
 const char *playFile="play.js";
#ifdef ILEX_TEST_BUILD
 playFile="native-test-play.js";
#endif
 const char *files[]={"platform.js",engineFile,"rules-match.js","bot-ai.js",dataFile,"library-index.js",playFile,"presentation.js"};int fileCount=8;if(!strcmp(module,"menu")){files[0]="platform.js";files[1]="library-index.js";files[2]="lobby.js";fileCount=3;}int loaded=1;u64 loadStarted=osGetTime();FILE *profile=fopen("sdmc:/3ds/ilex-gg/load-profile.txt","w");if(profile)fprintf(profile,"Module %s\n",module);
 loading=1;for(int i=0;i<fileCount;i++){u64 fileStart=osGetTime();snprintf(currentMethod,sizeof(currentMethod),"load %d/%d",i+1,fileCount);char loadText[130];snprintf(loadText,sizeof(loadText),"Loading %s\n\n%d / %d runtime files",module,i+1,fileCount);ilex_ui_panel("Preparing Match",loadText,"B Cancel");gfxFlushBuffers();gfxSwapBuffers();gspWaitForVBlank();char path[180];snprintf(path,sizeof(path),"sdmc:/3ds/ilex-gg/runtime/%s",files[i]);size_t n;char compiledPath[190];snprintf(compiledPath,sizeof(compiledPath),"%s.qbc",path);char *s=read_file(compiledPath,&n);int compiled=s!=NULL;if(!s)s=read_file(path,&n);if(!s){snprintf(error,sizeof(error),"Missing runtime/%s",files[i]);loaded=0;break;}
#ifdef ILEX_TEST_BUILD
 ilex_test_runtime_file(compiled,n);FILE *progress=fopen("sdmc:/3ds/ilex-gg/native-load.txt","wb");if(progress){fprintf(progress,"%s %lu",files[i],(unsigned long)n);fclose(progress);}
#endif
 JSValue v=compiled?JS_ReadObject(ctx,(const uint8_t*)s,n,JS_READ_OBJ_BYTECODE):JS_Eval(ctx,s,n,files[i],JS_EVAL_TYPE_GLOBAL);if(compiled&&!JS_IsException(v))v=JS_EvalFunction(ctx,v);free(s);if(JS_IsException(v)){exception(ctx);loaded=0;}JS_FreeValue(ctx,v);if(profile)fprintf(profile,"%s %llu ms\n",files[i],(unsigned long long)(osGetTime()-fileStart));if(!loaded)break;}if(profile){fprintf(profile,"Total %llu ms\n",(unsigned long long)(osGetTime()-loadStarted));fclose(profile);}
#ifdef ILEX_TEST_BUILD
 ilex_test_record("runtimeLoad",osGetTime()-loadStarted);
#endif

 
#ifdef ILEX_TEST_BUILD
 if(loaded&&!ilex_test_load(ctx)){snprintf(error,sizeof(error),"Native test setup failed");loaded=0;}
#endif
 loading=0;ilex_audio_reset();if(loaded)ilex_audio_observe(ctx);int boot=showBoot,paused=0,inspection=0,dirty=1;if(restoreOnLoad&&loaded){int restored=restore(ctx,top,bottom,&deadline);restoreOnLoad=0;boot=restored?0:1;}char inspectText[8192]="",inspectId[96]="";size_t inspectOffset=0,inspectPages[32]={0};unsigned inspectPage=0;
 JSValue view=JS_UNDEFINED;int32_t count=0;int automatic=0;
 while(aptMainLoop()){
  hidScanInput();u32 keys=hidKeysDown();deadline=osGetTime()+COMMAND_MS;
#ifdef ILEX_TEST_BUILD
  deadline=osGetTime()+300000;
  keys=ilex_test_play_keys(ctx,view,boot,loaded,inspection,cursor,count,handCursor,handFocus,error);
  deadline=osGetTime()+COMMAND_MS;
  if(ilex_test_finished())break;
#endif
  if(!loaded){if(keys&(KEY_B|KEY_START))break;if(keys&KEY_A){restoreOnLoad=1;showBoot=0;JS_FreeValue(ctx,view);ilex_art_clear();JS_FreeContext(ctx);JS_FreeRuntime(rt);goto reload_runtime;}if(dirty){char detail[450];snprintf(detail,sizeof(detail),"%.46s\n%.46s\n%.46s\n\nA: Recover last SD save\nB: Return, keep saved match\n\nDetails: match-error.txt",error,strlen(error)>46?error+46:"",strlen(error)>92?error+92:"");ilex_ui_panel("Match Paused by an Error",detail,"Your last valid SD save is preserved");dirty=0;}gfxFlushBuffers();gfxSwapBuffers();gspWaitForVBlank();continue;}
  if(keys&KEY_SELECT){ilex_audio_settings();if(inspection){ilex_inspect_art(inspectId,inspectText+inspectOffset);ilex_ui_panel("Card Inspection","X / B: return to match\nL / R: more card text","Your match is unchanged");}else if(!JS_IsUndefined(view))ilex_board_art(ctx,view);dirty=1;keys=0;}
  if(keys&(KEY_DOWN|KEY_UP|KEY_L|KEY_R))ilex_audio_effect("select");
  if(boot){if(keys&KEY_B)break;if(keys&KEY_A){boot=0;dirty=1;}if(keys&KEY_X){if(restore(ctx,top,bottom,&deadline)){boot=0;dirty=1;}else dirty=1;}if(keys&KEY_TOUCH){touchPosition t;hidTouchRead(&t);
#ifdef ILEX_TEST_BUILD
 ilex_test_touch(&t);
#endif
if(t.py>=48&&t.py<80){boot=0;dirty=1;}else if(t.py>=88&&t.py<120){if(restore(ctx,top,bottom,&deadline)){boot=0;}dirty=1;}}
   if(!boot){dirty=1;continue;}
   if(dirty){ilex_ui_home("Play Matches","Imported Windows decks");ilex_ui_panel("Play Matches","","B Return   SELECT Audio");ilex_ui_box(GFX_BOTTOM,12,48,296,32,0x1a05,ILEX_GOLD);ilex_ui_text(GFX_BOTTOM,24,58,"A  New Match",ILEX_CREAM,44);ilex_ui_box(GFX_BOTTOM,12,88,296,32,0x1a05,ILEX_GOLD);ilex_ui_text(GFX_BOTTOM,24,98,"X  Resume Saved Match",ILEX_CREAM,44);ilex_ui_text(GFX_BOTTOM,14,150,error,ILEX_GOLD,46);dirty=0;}goto frame;}
  if(inspection){if(keys&(KEY_B|KEY_X|KEY_A)){inspection=0;dirty=1;keys=0;}else{if(keys&KEY_R){size_t next=inspectOffset+ilex_inspect_length();if(next>inspectOffset&&next<strlen(inspectText)&&inspectPage<31){inspectPages[++inspectPage]=next;inspectOffset=next;}}if(keys&KEY_L)inspectOffset=inspectPages[inspectPage?--inspectPage:0];if(keys&(KEY_L|KEY_R)){ilex_inspect_art(inspectId,inspectText+inspectOffset);}goto frame;}}
  if(keys&KEY_START){paused=!paused;dirty=1;}
  if(paused){if(keys&KEY_B){paused=0;dirty=1;}if(keys&KEY_A){JSValue match=call(ctx,"state",0,NULL);int empty=JS_IsNull(match);JS_FreeValue(ctx,match);if(empty||save(ctx))break;dirty=1;}if(dirty){char pauseText[280];snprintf(pauseText,sizeof(pauseText),"A: Save and return to menu\nB: Resume match\nSELECT: Audio settings\n\n%s",error);ilex_ui_panel("Match Paused",pauseText,"Your match stays on this SD card");dirty=0;}goto frame;}
  if(keys&KEY_Y){if(save(ctx))snprintf(status,sizeof(status),"Match saved");dirty=1;}
  int handAction=-1;JSValue hv=JS_IsObject(view)?JS_GetPropertyStr(ctx,view,"hand"):JS_UNDEFINED,hc=JS_IsObject(hv)?JS_GetPropertyStr(ctx,hv,"cards"):JS_UNDEFINED,hl=JS_IsObject(hc)?JS_GetPropertyStr(ctx,hc,"length"):JS_UNDEFINED;int32_t handCount=0;JS_ToInt32(ctx,&handCount,hl);JS_FreeValue(ctx,hl);JS_FreeValue(ctx,hc);JS_FreeValue(ctx,hv);
  if(handCount>0){if(handCursor>=(unsigned)handCount)handCursor=handCount-1;if(keys&(KEY_LEFT|KEY_CPAD_LEFT)){handCursor=handCursor?handCursor-1:handCount-1;handFocus=1;dirty=1;}if(keys&(KEY_RIGHT|KEY_CPAD_RIGHT)){handCursor=(handCursor+1)%handCount;handFocus=1;dirty=1;}}
  if(keys&(KEY_UP|KEY_DOWN|KEY_L|KEY_R))handFocus=0;
  if(!automatic){if(keys&KEY_DOWN&&count){cursor=(cursor+1)%count;dirty=1;}if(keys&KEY_UP&&count){cursor=(cursor+count-1)%count;dirty=1;}if(keys&KEY_R&&count){cursor=(cursor+PAGE<count)?cursor+PAGE:count-1;dirty=1;}if(keys&KEY_L&&count){cursor=cursor>=PAGE?cursor-PAGE:0;dirty=1;}
   if(keys&KEY_B){JSValue v=call(ctx,"back",0,NULL);JS_FreeValue(ctx,v);cursor=0;dirty=1;}
   if(keys&KEY_TOUCH){touchPosition t;hidTouchRead(&t);
#ifdef ILEX_TEST_BUILD
 ilex_test_touch(&t);
#endif
if(t.py>=ILEX_HAND_Y-2&&t.py<ILEX_HAND_Y+56&&handCount){if(t.px<14)handCursor=handCursor>=7?handCursor-7:0;else if(t.px>=305)handCursor=handCursor+7<(unsigned)handCount?handCursor+7:handCount-1;else{unsigned pick=handCursor/7*7+(t.px-14)/41;if(pick<(unsigned)handCount){handCursor=pick;handFocus=1;handAction=pick;}}dirty=1;keys&=~KEY_A;}else if(t.px<252&&t.py>=ILEX_CHOICE_Y&&t.py<ILEX_CHOICE_Y+PAGE*ILEX_CHOICE_HEIGHT){handFocus=0;unsigned i=cursor/PAGE*PAGE+(t.py-ILEX_CHOICE_Y)/ILEX_CHOICE_HEIGHT;if(i<(unsigned)count){cursor=i;keys|=KEY_A;}}}
   if(keys&KEY_X&&(count||handCount)){JSValue arg=JS_NewInt32(ctx,handFocus?handCursor:cursor),v=call(ctx,handFocus?"handInspect":"inspect",1,&arg);const char *s=JS_ToCString(ctx,v);snprintf(inspectText,sizeof(inspectText),"%.8100s",s?s:"");inspectOffset=0;inspectPage=0;inspectPages[0]=0;JS_FreeCString(ctx,s);JS_FreeValue(ctx,v);inspection=1;JSValue cardId=call(ctx,handFocus?"handCard":"inspectCard",1,&arg);const char *idText=JS_ToCString(ctx,cardId);snprintf(inspectId,sizeof(inspectId),"%.95s",idText?idText:"");if(idText)ilex_inspect_art(idText,inspectText);JS_FreeCString(ctx,idText);JS_FreeValue(ctx,cardId);JS_FreeValue(ctx,arg);goto frame;}
   if((keys&KEY_A&&(count||handFocus))||handAction>=0){int useHand=handAction>=0||handFocus;JSValue arg=JS_NewInt32(ctx,useHand?handCursor:cursor),v=call(ctx,useHand?"handChoose":"choose",1,&arg);if(JS_IsException(v)){JS_FreeValue(ctx,v);JS_FreeValue(ctx,arg);loaded=0;dirty=1;goto frame;}const char *s=JS_ToCString(ctx,v);if(s&&*s)snprintf(error,sizeof(error),"%.180s",s);else error[0]=0;JS_FreeCString(ctx,s);JS_FreeValue(ctx,v);JS_FreeValue(ctx,arg);cursor=0;dirty=1;}
  }
  if(automatic&&osGetTime()>=nextTick){JSValue v=call(ctx,"tick",0,NULL);if(JS_IsException(v)){JS_FreeValue(ctx,v);loaded=0;dirty=1;goto frame;}const char *s=JS_ToCString(ctx,v);if(s&&*s){snprintf(error,sizeof(error),"%.180s",s);automatic=0;paused=1;}JS_FreeCString(ctx,s);JS_FreeValue(ctx,v);nextTick=osGetTime()+35;cursor=0;dirty=1;}
  if(dirty){JS_FreeValue(ctx,view);view=call(ctx,"view",0,NULL);if(JS_IsException(view)){loaded=0;dirty=1;goto frame;}
   JSValue request=JS_GetPropertyStr(ctx,view,"loadRuntime");const char *requested=JS_IsString(request)?JS_ToCString(ctx,request):NULL;if(requested&&*requested){int valid=!strcmp(requested,"starter")||!strcmp(requested,"unassigned")||(strlen(requested)==4&&requested[0]=='f'&&requested[1]>='0'&&requested[1]<='9'&&requested[2]>='0'&&requested[2]<='9'&&requested[3]>='0'&&requested[3]<='9');if(valid){snprintf(module,sizeof(module),"%.47s",requested);JSValue resume=JS_GetPropertyStr(ctx,view,"resumeRequested");restoreOnLoad=JS_ToBool(ctx,resume);JS_FreeValue(ctx,resume);showBoot=0;JS_FreeCString(ctx,requested);JS_FreeValue(ctx,request);JS_FreeValue(ctx,view);ilex_art_clear();JS_FreeContext(ctx);JS_FreeRuntime(rt);goto reload_runtime;}snprintf(error,sizeof(error),"Invalid format module");}JS_FreeCString(ctx,requested);JS_FreeValue(ctx,request);
   JSValue a=JS_GetPropertyStr(ctx,view,"auto"),rs=JS_GetPropertyStr(ctx,view,"rows"),len=JS_GetPropertyStr(ctx,rs,"length");automatic=JS_ToBool(ctx,a);JS_ToInt32(ctx,&count,len);JS_FreeValue(ctx,a);JS_FreeValue(ctx,len);if(cursor>=(unsigned)count)cursor=0;
   JSValue board=JS_GetPropertyStr(ctx,view,"board");if(JS_IsUndefined(board))ilex_ui_home("Choose a Format / Deck","Your Windows library, offline");else ilex_board_art(ctx,view);JS_FreeValue(ctx,board);
   ilex_ui_choices(ctx,view,cursor,count,handCursor,handFocus,error,status);JS_FreeValue(ctx,rs);
   JSValue selected=JS_NewInt32(ctx,handFocus?handCursor:cursor),art=call(ctx,handFocus?"handCard":"inspectCard",1,&selected);const char *artId=JS_ToCString(ctx,art);if(artId&&*artId)ilex_card_preview(artId);JS_FreeCString(ctx,artId);JS_FreeValue(ctx,art);JS_FreeValue(ctx,selected);
   ilex_audio_observe(ctx);
   JSValue n=JS_Eval(ctx,"IlexPlay.state()?.journal.length ?? -1",strlen("IlexPlay.state()?.journal.length ?? -1"),"revision",0);int32_t revision=-1;JS_ToInt32(ctx,&revision,n);JS_FreeValue(ctx,n);if(revision>=0&&revision!=previousActions){if(save(ctx)){lastSafeRevision=revision;if(previousActions>=0&&revision>previousActions)pulseUntil=osGetTime()+260;previousActions=revision;snprintf(status,sizeof(status),"Autosaved: %ld actions",(long)revision);}}
   dirty=0;
  }
 frame:
 ilex_audio_update();
 if(loaded&&!boot&&!paused&&!inspection&&JS_IsObject(view)&&osGetTime()<pulseUntil){ilex_board_art(ctx,view);ilex_ui_sparks(pulseFrame++);}
#ifdef ILEX_TEST_BUILD
 ilex_test_frame(ctx,view,inspection);
#endif
 gfxFlushBuffers();gfxSwapBuffers();gspWaitForVBlank();
 }
 ilex_art_clear();JS_FreeValue(ctx,view);JS_FreeContext(ctx);JS_FreeRuntime(rt);
}




