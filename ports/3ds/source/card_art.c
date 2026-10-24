#include <3ds.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include "card_art.h"
#include "forest_ui.h"
typedef struct {char id[96];unsigned char *rgb;} Texture;
static size_t inspectLength=0;
static Texture cache[24];static unsigned next=0;
static int valid_id(const char *s){size_t n=strlen(s);if(!n||n>=96||strstr(s,".."))return 0;for(size_t i=0;i<n;i++)if(!isalnum((unsigned char)s[i])&&s[i]!='-'&&s[i]!='_'&&s[i]!='.'&&s[i]!='%'&&s[i]!='!')return 0;return 1;}
static unsigned char *read_texture(const char *id,const char *suffix,size_t size){if(!valid_id(id))return NULL;char path[224];snprintf(path,sizeof(path),"sdmc:/3ds/ilex-gg/art/%s.%s",id,suffix);FILE *f=fopen(path,"rb");if(!f)return NULL;unsigned char *rgb=malloc(size);if(!rgb){fclose(f);return NULL;}int ok=fread(rgb,1,size,f)==size;fclose(f);if(!ok){free(rgb);return NULL;}return rgb;}
static unsigned char *thumb(const char *id){for(unsigned i=0;i<24;i++)if(!strcmp(cache[i].id,id))return cache[i].rgb;Texture *t=&cache[next++%24];free(t->rgb);t->rgb=read_texture(id,"thumb",54*76*3);snprintf(t->id,sizeof(t->id),"%.95s",id);return t->rgb;}
/* libctru consoleInit uses RGB565, including its framebuffer allocation. */
static void blit_screen(gfxScreen_t screen,unsigned char *rgb,int sw,int sh,int x,int y,int w,int h){u16 *fb=(u16*)gfxGetFramebuffer(screen,GFX_LEFT,NULL,NULL);for(int dy=0;dy<h&&y+dy<240;dy++)for(int dx=0;dx<w&&x+dx<(screen==GFX_TOP?400:320);dx++){unsigned dest=(x+dx)*240+239-(y+dy),src=3*((dy*sh/h)*sw+dx*sw/w);unsigned r,g,b;if(rgb){r=rgb[src];g=rgb[src+1];b=rgb[src+2];}else{int edge=dx<2||dy<2||dx>=w-2||dy>=h-2;r=edge?190:20;g=edge?170:80;b=edge?45:35;}fb[dest]=((r>>3)<<11)|((g>>2)<<5)|(b>>3);}}
static int32_t number(JSContext *ctx,JSValueConst o,const char *key){JSValue v=JS_GetPropertyStr(ctx,o,key);int32_t n=0;JS_ToInt32(ctx,&n,v);JS_FreeValue(ctx,v);return n;}

size_t ilex_inspect_length(void){return inspectLength;}
void ilex_card_draw_bottom(const char *id,int x,int y,int w,int h){if(id&&*id)blit_screen(GFX_BOTTOM,thumb(id),54,76,x,y,w,h);}
void ilex_card_preview(const char *id){if(!id||!*id)return;blit_screen(GFX_BOTTOM,thumb(id),54,76,263,51,48,68);}
void ilex_board_art(JSContext *ctx,JSValueConst view){
 JSValue board=JS_GetPropertyStr(ctx,view,"board");if(JS_IsUndefined(board)){JS_FreeValue(ctx,board);return;}
 ilex_ui_background(GFX_TOP,"table");char title[70];snprintf(title,sizeof(title),"ILEX.GG                 TURN %ld",(long)number(ctx,view,"turn"));ilex_ui_text(GFX_TOP,12,3,title,ILEX_GOLD,63);
 for(unsigned p=0;p<2;p++){
  JSValue side=JS_GetPropertyUint32(ctx,board,p),header=JS_GetPropertyStr(ctx,side,"header"),slots=JS_GetPropertyStr(ctx,side,"slots");const char *hs=JS_ToCString(ctx,header);ilex_ui_text(GFX_TOP,12,p?129:18,hs?hs:"",ILEX_CREAM,63);JS_FreeCString(ctx,hs);JS_FreeValue(ctx,header);
  unsigned total=number(ctx,slots,"length");if(total>9)total=9;
  for(unsigned i=0;i<total;i++){
   JSValue card=JS_GetPropertyUint32(ctx,slots,i),id=JS_GetPropertyStr(ctx,card,"id"),name=JS_GetPropertyStr(ctx,card,"name"),secret=JS_GetPropertyStr(ctx,card,"secret");const char *is=JS_ToCString(ctx,id),*ns=JS_ToCString(ctx,name);int hidden=JS_ToBool(ctx,secret);
   int x=173,y=p?139:30,w=54,h=75;
   if(i){unsigned n=i-1;if(total<=6){x=n<3?10+n*45:252+(n-3)*45;w=36;h=50;}else{x=n<4?9+n*37:237+(n-4)*37;w=29;h=40;}y=p?156:45;}
   ilex_ui_box(GFX_TOP,x-2,y-2,w+4,h+4,0x11c4,i?0x5bcb:ILEX_GOLD);
   if(hidden||(is&&*is))blit_screen(GFX_TOP,hidden?NULL:thumb(is),54,76,x,y,w,h);
   if(hidden||(is&&*is)){char stats[50];snprintf(stats,sizeof(stats),i?"%ld %ldE":"%ldHP E%ld",(long)number(ctx,card,"hp"),(long)number(ctx,card,"energy"));
    ilex_ui_text(GFX_TOP,x-(i?0:2),y+h+1,stats,i?ILEX_CREAM:ILEX_GOLD,i?7:11);
    if(i)ilex_ui_text(GFX_TOP,x,y-12,ns?ns:"",ILEX_CREAM,6);
    else {int hp=number(ctx,card,"hp"),max=number(ctx,card,"maxHp"),bar=max>0?(w*hp/max):0;if(bar>w)bar=w;if(bar<0)bar=0;ilex_ui_box(GFX_TOP,x,y+h-3,w,3,0x3905,0x3905);ilex_ui_box(GFX_TOP,x,y+h-3,bar,3,hp*3<max?0xeaa7:0x7d6f,0x7d6f);}
    if(!i){JSValue condition=JS_GetPropertyStr(ctx,card,"condition");const char *cs=JS_ToCString(ctx,condition);if(cs&&*cs)ilex_ui_text(GFX_TOP,x+w+5,y+h-15,cs,0xfba9,10);JS_FreeCString(ctx,cs);JS_FreeValue(ctx,condition);}
    int tools=number(ctx,card,"tools");if(tools){char t[12];snprintf(t,sizeof(t),"T%u",tools);ilex_ui_text(GFX_TOP,x+w-12,y, t,ILEX_GOLD,2);}
   }
   JS_FreeCString(ctx,is);JS_FreeCString(ctx,ns);JS_FreeValue(ctx,id);JS_FreeValue(ctx,name);JS_FreeValue(ctx,secret);JS_FreeValue(ctx,card);
  }
  if(total<=6){for(int pile=0;pile<2;pile++){int x=355,y=(p?151:40)+pile*39;ilex_ui_box(GFX_TOP,x+2,y+2,27,32,0x0944,0x738a);ilex_ui_box(GFX_TOP,x,y,27,32,0x1a68,ILEX_GOLD);ilex_ui_text(GFX_TOP,x+4,y+9,pile?"DIS":"DEK",ILEX_CREAM,3);}}
  JS_FreeValue(ctx,slots);JS_FreeValue(ctx,side);
 }
 JSValue cue=JS_GetPropertyStr(ctx,view,"cue");const char *cs=JS_ToCString(ctx,cue);ilex_ui_box(GFX_TOP,8,117,384,10,0x11c4,0x3b4b);ilex_ui_text(GFX_TOP,13,116,cs?cs:"",ILEX_GOLD,62);JS_FreeCString(ctx,cs);JS_FreeValue(ctx,cue);JS_FreeValue(ctx,board);
}
void ilex_inspect_art(const char *id,const char *text){
 unsigned char *rgb=read_texture(id,"rgb",162*226*3);ilex_ui_background(GFX_TOP,"forest");if(rgb){ilex_ui_box(GFX_TOP,2,5,166,230,0x11c4,ILEX_GOLD);blit_screen(GFX_TOP,rgb,162,226,4,7,162,226);free(rgb);}
 int x=rgb?177:12,limit=rgb?35:62;ilex_ui_box(GFX_TOP,x-4,5,400-x,230,0x11c4,0x5bcb);const char *at=text;for(int row=0;row<16&&*at;row++){unsigned n=0;while(at[n]&&at[n]!='\n'&&n<(unsigned)limit)n++;if(n==(unsigned)limit&&at[n]&&at[n]!='\n'){unsigned split=n;while(split&&at[split]!=' ')split--;if(split)n=split;}char line[80];snprintf(line,sizeof(line),"%.*s",(int)n,at);ilex_ui_text(GFX_TOP,x,9+row*13,line,ILEX_CREAM,limit);at+=n;if(*at=='\n'||*at==' ')at++;}inspectLength=(size_t)(at-text);ilex_ui_text(GFX_TOP,x,221,"L/R Text  B Back",ILEX_GOLD,35);
}
void ilex_art_clear(void){for(unsigned i=0;i<24;i++){free(cache[i].rgb);cache[i].rgb=NULL;cache[i].id[0]=0;}next=0;}
