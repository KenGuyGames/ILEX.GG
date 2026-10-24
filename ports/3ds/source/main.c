#include <3ds.h>
#include <stdio.h>
#include "catalog.h"
#include "rules_probe.h"
#include "play.h"
#include "card_art.h"
#include "forest_ui.h"
#include "forest_audio.h"
#include "native_test.h"
static PrintConsole top,bottom;
static const char *options[]={"Card Gallery","Audio Settings","Controls","Rules Diagnostics","Play Matches","Exit"};
int main(void){bool isNew=false;unsigned selected=4,screen=0;uint32_t cursor=0;IlexCatalog catalog={0};
 gfxInitDefault();gfxSetDoubleBuffering(GFX_TOP,false);gfxSetDoubleBuffering(GFX_BOTTOM,false);consoleInit(GFX_TOP,&top);consoleInit(GFX_BOTTOM,&bottom);
 ilex_ui_init();ilex_audio_init();APT_CheckNew3DS(&isNew);if(isNew)osSetSpeedupEnable(true);int loaded=ilex_catalog_open(&catalog,"sdmc:/3ds/ilex-gg/data/catalog.bin");bool dirty=true,running=true;
 while(aptMainLoop()&&running){hidScanInput();u32 keys=hidKeysDown();
#ifdef ILEX_TEST_BUILD
 keys=ilex_test_main_keys(selected,screen,isNew);
#endif
 if(keys&KEY_START)break;
 if(keys&KEY_SELECT){ilex_audio_settings();dirty=true;keys=0;}if(keys&KEY_B){screen=0;dirty=true;}
 if(keys&(KEY_UP|KEY_DOWN|KEY_LEFT|KEY_RIGHT|KEY_A))ilex_audio_effect("select");
 if(!screen){if(keys&KEY_DOWN){selected=(selected+1)%6;dirty=true;}if(keys&KEY_UP){selected=(selected+5)%6;dirty=true;}if(keys&KEY_TOUCH){touchPosition t;hidTouchRead(&t);if(t.py>=32&&t.py<224){selected=(t.py-32)/32;keys|=KEY_A;}}if(keys&KEY_A){if(selected==5)running=false;else screen=selected+1;dirty=true;}}
 else if(screen==1&&loaded&&catalog.count){if((keys&KEY_DOWN)&&cursor+1<catalog.count){cursor++;dirty=true;}if((keys&KEY_UP)&&cursor){cursor--;dirty=true;}if(keys&KEY_R){cursor=cursor+ILEX_PAGE_SIZE<catalog.count?cursor+ILEX_PAGE_SIZE:catalog.count-1;dirty=true;}if(keys&KEY_L){cursor=cursor>ILEX_PAGE_SIZE?cursor-ILEX_PAGE_SIZE:0;dirty=true;}if(keys&KEY_TOUCH){touchPosition t;hidTouchRead(&t);if(t.py>=32&&t.py<160){uint32_t next=cursor/ILEX_PAGE_SIZE*ILEX_PAGE_SIZE+(t.py-32)/16;if(next<catalog.count){cursor=next;dirty=true;}}}}
 if(dirty){
  if(screen==5){ilex_play(&top,&bottom);ilex_audio_scene(0);screen=0;dirty=true;continue;}
  if(screen==2){ilex_audio_settings();screen=0;dirty=true;continue;}
  if(screen==4){consoleSelect(&top);consoleClear();consoleSelect(&bottom);consoleClear();ilex_rules_probe();screen=0;dirty=true;continue;}
  ilex_ui_home("Pokemon TCG Simulator",isNew?"New 3DS / New 2DS":"New 3DS hardware required");
  if(!screen){ilex_ui_background(GFX_BOTTOM,"forest");ilex_ui_text(GFX_BOTTOM,15,9,"ILEX.GG",ILEX_GOLD,40);for(unsigned i=0;i<6;i++){ilex_ui_plaque(GFX_BOTTOM,10,33+i*32,300,28,selected==i);ilex_ui_text(GFX_BOTTOM,24,41+i*32,options[i],ILEX_CREAM,45);}ilex_ui_text(GFX_BOTTOM,12,226,"D-pad / Touch Choose   A Open   SELECT Audio",ILEX_GOLD,49);}
  else if(screen==1){ilex_ui_panel("Card Gallery","","L/R Page   D-pad Browse   B Back");if(!loaded)ilex_ui_text(GFX_BOTTOM,14,48,"Copy the complete SD data folder",ILEX_CREAM,46);else{uint32_t first=cursor/ILEX_PAGE_SIZE*ILEX_PAGE_SIZE;for(uint32_t i=first;i<first+ILEX_PAGE_SIZE&&i<catalog.count;i++){IlexCard c;if(ilex_catalog_read(&catalog,i,&c)){ilex_ui_box(GFX_BOTTOM,10,32+(i-first)*16,300,15,i==cursor?0x2b27:0x11c4,ILEX_GOLD);ilex_ui_text(GFX_BOTTOM,18,33+(i-first)*16,c.name,ILEX_CREAM,46);}}IlexCard c;if(ilex_catalog_read(&catalog,cursor,&c))ilex_inspect_art(c.id,c.name);}}
  else ilex_ui_panel("Controls","D-pad / Touch: choose an action\nA: confirm selection\nB: back\nX: inspect the selected card\nL / R: page through choices\nY: save the match\nSTART: pause / save and return\nSELECT: music and sound settings","B Return");
  dirty=false;
 }
 ilex_audio_update();gfxFlushBuffers();gfxSwapBuffers();gspWaitForVBlank();}
 ilex_catalog_close(&catalog);ilex_art_clear();ilex_audio_exit();ilex_ui_exit();gfxExit();return 0;
}
