#include "catalog.h"
#include <string.h>
#include <limits.h>
_Static_assert(sizeof(IlexCard)==ILEX_RECORD_SIZE,"Catalog record layout mismatch");
static uint32_t le32(const unsigned char *p) { return (uint32_t)p[0] | (uint32_t)p[1]<<8 | (uint32_t)p[2]<<16 | (uint32_t)p[3]<<24; }
int ilex_catalog_open(IlexCatalog *c, const char *path) {
    unsigned char h[ILEX_HEADER_SIZE]; long bytes;
    if (!c || !path) return 0;
    c->file = NULL; c->count = 0;
    FILE *f = fopen(path, "rb"); if (!f) return 0;
    if (fread(h,1,sizeof(h),f)!=sizeof(h) || memcmp(h,"ILXC",4) || le32(h+4)!=1 || le32(h+12)!=ILEX_RECORD_SIZE) { fclose(f); return 0; }
    uint32_t count = le32(h+8);
    if (count > (LONG_MAX-ILEX_HEADER_SIZE)/ILEX_RECORD_SIZE || fseek(f,0,SEEK_END)) { fclose(f); return 0; }
    bytes = ftell(f);
    if (bytes < 0 || (unsigned long)bytes != ILEX_HEADER_SIZE+(unsigned long)count*ILEX_RECORD_SIZE) { fclose(f); return 0; }
    c->file=f; c->count=count; return 1;
}
int ilex_catalog_read(IlexCatalog *c,uint32_t index,IlexCard *card) {
    if (!c || !card || !c->file || index>=c->count) return 0;
    if (fseek(c->file,(long)(ILEX_HEADER_SIZE+(unsigned long)index*ILEX_RECORD_SIZE),SEEK_SET)) return 0;
    if (fread(card,1,ILEX_RECORD_SIZE,c->file)!=ILEX_RECORD_SIZE) return 0;
    card->id[63]=0; card->name[127]=0; return 1;
}
void ilex_catalog_close(IlexCatalog *c) { if(c && c->file) { fclose(c->file); c->file=NULL; c->count=0; } }
