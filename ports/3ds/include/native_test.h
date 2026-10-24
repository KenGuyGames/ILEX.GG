#ifndef ILEX_NATIVE_TEST_H
#define ILEX_NATIVE_TEST_H
#ifdef ILEX_TEST_BUILD
#include <3ds.h>
#include "quickjs.h"
int ilex_test_finished(void);
void ilex_test_restored(int backup,int commands,int deferred);
void ilex_test_runtime_file(int compiled,size_t bytes);
void ilex_test_record(const char *name,u64 ms);
u32 ilex_test_main_keys(unsigned selected,unsigned screen,bool isNew);
u32 ilex_test_play_keys(JSContext *ctx,JSValueConst view,int boot,int loaded,int inspection,unsigned cursor,int count,unsigned handCursor,int handFocus,const char *error);
void ilex_test_touch(touchPosition *touch);
void ilex_test_frame(JSContext *ctx,JSValueConst view,int inspection);
u32 ilex_test_audio_keys(void);
void ilex_test_capture(const char *name,gfxScreen_t screen);
int ilex_test_load(JSContext *ctx);
#endif
#endif
