#include <3ds.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "quickjs.h"
#include "rules_probe.h"
u32 __stacksize__ = 1024 * 1024;
static int deadline(JSRuntime *rt, void *opaque) {
    (void)rt; hidScanInput();
    return osGetTime() > *(u64 *)opaque || (hidKeysHeld() & KEY_B);
}
static int load(JSContext *ctx, const char *name) {
    char path[160]; snprintf(path,sizeof(path),"sdmc:/3ds/ilex-gg/runtime/%s",name);
    char compiledPath[180];snprintf(compiledPath,sizeof(compiledPath),"%s.qbc",path);FILE *f=fopen(compiledPath,"rb");int compiled=f!=NULL;if(!f)f=fopen(path,"rb"); if(!f){printf("Missing: %s\n",name);return 0;}
    fseek(f,0,SEEK_END); long n=ftell(f); rewind(f);
    if(n<1 || n>8*1024*1024){fclose(f);printf("Invalid script size\n");return 0;}
    char *source=malloc((size_t)n+1); if(!source){fclose(f);return 0;}
    if(fread(source,1,n,f)!=(size_t)n){free(source);fclose(f);return 0;}
    fclose(f); source[n]=0;
    JSValue result=compiled?JS_ReadObject(ctx,(const uint8_t*)source,n,JS_READ_OBJ_BYTECODE):JS_Eval(ctx,source,n,name,JS_EVAL_TYPE_GLOBAL);if(compiled&&!JS_IsException(result))result=JS_EvalFunction(ctx,result);free(source);
    int ok=!JS_IsException(result); JS_FreeValue(ctx,result);
    if(!ok){JSValue e=JS_GetException(ctx);const char *s=JS_ToCString(ctx,e);printf("%s: %.220s\n",name,s?s:"exception");JS_FreeCString(ctx,s);JS_FreeValue(ctx,e);}
    return ok;
}
void ilex_rules_probe(void) {
    bool isNew=false;APT_CheckNew3DS(&isNew);
    if(!isNew){printf("New 3DS / New 2DS required.\n");return;}
    u64 start=osGetTime(), end=start+300000;
    JSRuntime *rt=JS_NewRuntime();if(!rt){printf("Runtime allocation failed\n");return;}
    JS_SetMemoryLimit(rt,64*1024*1024);JS_SetMaxStackSize(rt,512*1024);JS_SetInterruptHandler(rt,deadline,&end);
    JSContext *ctx=JS_NewContext(rt);
    if(!ctx){printf("Context allocation failed\n");JS_FreeRuntime(rt);return;}
    const char *files[]={"platform.js","base-engine.js","rules-match.js","bot-ai.js","map.js","probe.js"};int ok=1;
    for(unsigned i=0;i<6 && ok;i++){printf("Loading %s...\n",files[i]);gfxFlushBuffers();ok=load(ctx,files[i]);}
    if(ok){const char *expr="JSON.stringify(IlexProbeResult)";JSValue v=JS_Eval(ctx,expr,strlen(expr),"result",JS_EVAL_TYPE_GLOBAL);const char *s=JS_ToCString(ctx,v);printf("\n%.900s\n",s?s:"Result unavailable");JS_FreeCString(ctx,s);JS_FreeValue(ctx,v);}
    JSMemoryUsage memory;JS_ComputeMemoryUsage(rt,&memory);
    printf("\nElapsed: %llu ms\nJS allocated: %lld bytes\n64 MiB cap; B cancels.\n",(unsigned long long)(osGetTime()-start),(long long)memory.malloc_size);
    JS_FreeContext(ctx);JS_FreeRuntime(rt);
}

