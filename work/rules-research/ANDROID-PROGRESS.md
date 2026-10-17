# Landscape follow-up — October 17, 2026

Kenneth reported that scrolling the match vertically took away from the Android experience. VersionCode 2 now uses a dedicated fixed-viewport landscape arena. Both fields, all Bench slots, Deck/Discard/Prize piles, opponent hand count and your hand remain visible together. Piles/counters stay upright and card tap/hold actions remain available. Small-height layouts preserve practical touch targets. Standard portrait behavior is retained.

Match controls, original bound new-match selectors, game log and sandbox access move into an anchored overlay in landscape and restore their original locations in portrait. Effect choices use a bounded overlay, compact card choices and visible confirmation buttons for ordinary Energy payments. Larger effect pools and large hands can scroll horizontally within their own controls. Landscape hand swipes pan without playing, while diagonal/upward card gestures still drag to play.

Final mobile suite: 59 passing checks. New cases assert document width/height and every field/pile/hand bound at 915×412, 800×360, 640×320, 640×312 and 1024×600; real touch tap/drag play; a full Bench/twenty-card hand; horizontal hand swipe without mutation; Energy-choice/confirmation visibility at small heights; actual touch Retreat completion; controls/log/settings accessibility and portrait restoration. Phone landscape screenshots and the compact Energy prompt were visually reviewed. 28 package checks, official signature/alignment checks pass. Same certificate as versionCode 1, so installation can update in place without clearing user data. No physical Android/emulator installation was performed; native-device limits below still apply. Desktop engine/release unchanged.

# Android release candidate — October 17, 2026

Kenneth authorized making the existing ILEX.GG program available on Android with intuitive touch controls. Android source lives under `work/android-build`. No rules automation scope was expanded, and no desktop release resources, ZIPs, real user profile or GitHub release were modified.

## Delivered artifact

- `outputs/ILEX.GG-Android.apk`: signed universal APK, package `gg.ilex.app`, versionName `1.12.0-android.2`, versionCode 2, minimum Android 8.0/API 26, compile/target SDK 36. Current Android System WebView is required; an ES5 compatibility screen explains updating an outdated provider.
- Size: 78,247,806 bytes. SHA-256: `30563c2107e075c12a5e02bf683ee95459ecc997cd3dbbb138ff5df7a2847555`.
- `outputs/ILEX.GG-Android-Install.md`: installation, controls, desktop-workspace transfer and offline-image instructions.
- `outputs/ILEX.GG-Android-build.json` and `outputs/ILEX.GG-Android-verification.json`: exact package hashes/checks.

## Implementation

Native Java Activity embeds bundled UI under a private, intercepted HTTPS appassets origin without a server or paid infrastructure. It includes the complete current card/rules/UI data, supplied music and pack artwork. Desktop rules engine hash remains `a7f812b8c255e0246245455792f1be041a86c7212b0a8e0fed6999360423ab59`.

Android-only CSS/JS adds phone/tablet portrait and landscape layouts, 48px standard controls, horizontally scrolling non-overlapping hands, collapsed match controls, long-press magnification, hand-card tap/placement options and pointer dragging for existing tabletop/effect destinations. Read-only fork validation highlights valid play destinations; commits still enter existing reducer/Undo paths. Journal/prompt/match guards reject stale gestures, cancellation never commits, and compatibility clicks are suppressed after drag/hold. Enlarged attacks/abilities/Retreat and Energy/effect prompts are retained. Back dismisses the focused dialog, cancels placement, returns home or backgrounds the app. Multitouch cancels an outstanding card gesture rather than committing it.

Native SAF dialogs export/import workspace JSON without storage permissions. Only INTERNET is requested. Android 13+ predictive Back callback is registered. Safe insets include system bars, cutouts and IME. Rotation retains the Activity/WebView. Background lifecycle saves state, suspends bot scheduling and audio without changing saved preferences, and pauses WebView timers; foreground restores scheduling policy.

236 exact verified scans are bundled (228 Base–Fossil cards plus eight Celebi selections). Other images download to private app storage from manifest-allowlisted HTTPS providers with size/SHA-256 validation, atomic promotion, bounded redirects, timeouts and per-file duplicate locking. Existing cache UI provides bulk pause/resume. Backgrounding pauses bulk work; generation guards prevent old workers from overwriting a resumed run's progress. Full image cache remains approximately 2.5 GB.

## Validation and explicit limits

`work/android-build/mobile-verification.json`: 59 passing Chromium mobile checks using real CDP touch events where applicable. Covers long-press read-only preview, tap placement, single drag attachment, cancellation, no duplicate commit, Basic Pokémon slot legality, Trainer placement, enlarged Retreat/attack options, Undo boundary retention, 360/412px phones, landscape, 800px tablet, gallery/decks/formats/custom/packs overflow, workspace reload persistence and lifecycle scheduling/audio preference hooks. Native bridge calls are mocked in that harness.

`outputs/ILEX.GG-Android-verification.json`: 28 package/static checks pass, including complete ZIP CRCs, byte-identical engine/data/pack modules, exact final mobile sources, every bundled scan hash, uncompressed/aligned resource table, universal DEX build, launcher/min/target SDK, exclusion of signing secrets and INTERNET-only permission. Official SDK apksigner verifies v2/v3 signatures; zipalign verifies stored-entry alignment. Menu/table phone screenshots are in outputs.

**No physical Android device or Android emulator was available.** ADB could not initialize its user directory in this sandbox; no device installation was performed. Native SAF dialogs, live Android image-cache downloads, actual Android lifecycle/audio and phone performance still need installed-device acceptance. Do not describe this as device-certified or Play Store-published.

## Rebuild and maintenance

See `work/android-build/README.md`, `download-tools.cjs`, `build.py`, `run-preview.cjs` and `verify.py`. Official SDK ZIPs were verified against repository SHA-1 metadata. SDK native ZIP-writing tools crash on this Windows host, so supported aapt2 directory outputs plus Python ZIP construction avoid that path; official signature/alignment verification still passes. APK signing key/password live only in ignored `work/android-build/signing/`. Preserve them privately for future updates; increase versionCode before shipping another version. Never include them in a source archive or public release.

Keep all prior backlog entries, Windows releases, cache/music integrations and deferred Unlimited/networking scopes intact. Android packaging is separate from future Play Store distribution or online multiplayer.
