#pragma once
#include <3ds.h>
#include "quickjs.h"
#define ILEX_CHOICE_PAGE 5
#define ILEX_CHOICE_Y 42
#define ILEX_CHOICE_HEIGHT 18
#define ILEX_HAND_Y 154
#define ILEX_HAND_PAGE 7
#define ILEX_CREAM 0xef36
#define ILEX_GOLD 0xcd69
#define ILEX_GREEN 0x8d8f
void ilex_ui_init(void);
void ilex_ui_exit(void);
void ilex_ui_background(gfxScreen_t screen,const char *name);
void ilex_ui_box(gfxScreen_t screen,int x,int y,int w,int h,u16 fill,u16 border);
void ilex_ui_text(gfxScreen_t screen,int x,int y,const char *text,u16 color,int limit);
void ilex_ui_plaque(gfxScreen_t screen,int x,int y,int w,int h,int selected);
void ilex_ui_image(gfxScreen_t screen,const u16 *pixels,int sw,int sh,int x,int y,int w,int h);
void ilex_ui_home(const char *title,const char *detail);
void ilex_ui_panel(const char *title,const char *body,const char *footer);
void ilex_ui_choices(JSContext *ctx,JSValueConst view,unsigned cursor,int count,unsigned handCursor,int handFocus,const char *error,const char *status);
void ilex_ui_progress(const char *title,int current,int total);
void ilex_ui_sparks(unsigned frame);
