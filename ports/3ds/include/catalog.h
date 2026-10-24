#ifndef ILEX_CATALOG_H
#define ILEX_CATALOG_H
#include <stdint.h>
#include <stdio.h>
#define ILEX_RECORD_SIZE 192u
#define ILEX_HEADER_SIZE 16u
#define ILEX_PAGE_SIZE 8u
typedef struct { char id[64]; char name[128]; } IlexCard;
typedef struct { FILE *file; uint32_t count; } IlexCatalog;
int ilex_catalog_open(IlexCatalog *catalog, const char *path);
int ilex_catalog_read(IlexCatalog *catalog, uint32_t index, IlexCard *card);
void ilex_catalog_close(IlexCatalog *catalog);
#endif
