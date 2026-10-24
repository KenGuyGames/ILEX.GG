#ifndef ILEX_CARD_ART_H
#define ILEX_CARD_ART_H
#include "quickjs.h"
#include <stddef.h>
size_t ilex_inspect_length(void);
void ilex_board_art(JSContext *ctx,JSValueConst view);
void ilex_inspect_art(const char *id,const char *text);
void ilex_card_preview(const char *id);
void ilex_card_draw_bottom(const char *id,int x,int y,int w,int h);
void ilex_art_clear(void);
#endif
