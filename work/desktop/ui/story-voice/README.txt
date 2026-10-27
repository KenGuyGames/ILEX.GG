Future campaign voice acting

All dialogue has a stable id, canonical speakerId and delivery direction. lines.json is an unrecorded cue manifest, not a list of available audio files. The game continues using the Mega Man X word chirp; no voice API, synthetic dialogue, voice actor recording or new playback setting is enabled.

Use id as the recording key. Keep ids stable when fixing text. Assign a new id for a genuinely new line, and retain an alias when replacing an existing cue. Audition actors against conversational exchanges, not isolated slogans. Journal and memory cues should retain the same character identity. False Rowan is an imitation performed as Rowan; contextual direction should preserve that distinction. Player voice casting can remain optional. Narration need not be voiced in the final production.

A later playback implementation should respect effects/voice volume, mute, cancellation on skip/navigation/background, exact line-id matching, absent-clip text fallback and accessible instant text. Clip completion must not auto-advance saved story progress.

Shared takes: voiceId groups identical text, actor and direction across routes, so a single recorded take can serve several line ids. Use voiceId as the eventual audio recording filename; use id for scene/progress and cue lookup. The recording-script.csv export includes both.
