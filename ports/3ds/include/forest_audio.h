#pragma once
#include <3ds.h>
#include "quickjs.h"
void ilex_audio_init(void);
void ilex_audio_exit(void);
void ilex_audio_scene(int battle);
void ilex_audio_effect(const char *name);
void ilex_audio_observe(JSContext *ctx);
void ilex_audio_reset(void);
void ilex_audio_update(void);
void ilex_audio_settings(void);
const char *ilex_audio_status(void);
unsigned ilex_audio_test_events(void);
