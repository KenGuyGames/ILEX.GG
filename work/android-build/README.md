# ILEX.GG for Android

Install `outputs/ILEX.GG-Android.apk` on Android 8.0 or newer with a current Android System WebView. This is a signed, universal APK with no CPU-specific libraries. It opens as an installed app and bundles the same rules engine, card index, formats, bot, deck builder, custom-card tools, audio and pack simulator as the current Windows release. Online multiplayer and Unlimited interaction validation remain deferred.

Version `1.12.0-android.2` (versionCode 2) is an in-place update signed with the original key. Install over the existing app; do not uninstall if you want to keep its local workspace and image cache.

## Install and transfer a workspace

1. Copy the APK to your phone/tablet and open it. Android may ask you to allow installation from the app you used to open the file.
2. Open ILEX.GG from your launcher. Update Android System WebView/Chrome through the Play Store if prompted by the compatibility screen.
3. To bring over your Windows decks and saves, choose **Export workspace** in Windows, transfer the JSON to Android, and choose **Import workspace** on the Android main menu. Import replaces that device's current workspace; use Export first if you want to retain it. There is no cloud synchronization.

The app includes 236 verified scans: Base–Fossil and the eight rotating Celebi menu cards. Other images download as viewed, with expected file size and SHA-256 checks before caching in private app storage. Use **Download card images** on the main menu to cache the complete collection (about 2.5 GB). Pause/resume is available; bulk downloading pauses when leaving the app. Rules, bundled card text, decks, formats and already-cached images work offline. Uncached images need a connection. Android handles the export/import file picker without broad storage permissions.

## Touch controls

- Tap a field Pokémon for enlarged attacks, Powers and Retreat choices.
- Hold a revealed card to magnify it without playing it.
- Tap a hand card, choose **Place on table**, then tap a highlighted destination. **More play options** retains special hand effects and attachment options.
- Drag a hand card vertically onto the table to play it; swipe horizontally through your hand. Field cards and effect-choice cards also support touch dragging.
- Choose Energy payments and other effect resolutions in the normal prompt. Canceling a drag does not play the card.
- Expand **Match controls** to end a turn, Undo, change bot controls or concede. Existing bot/local undo behavior is preserved.
- Use Android Back to dismiss a preview/choice dialog, cancel placement or return to the main menu. Back from the main menu backgrounds the app.

Landscape matches now keep both fields, both Benches, Deck/Discard/Prize piles and your hand inside one viewport. Match controls, new-match settings, sandbox access and the game log open in an overlay; effect prompts overlay the field and ordinary Energy choices include their Confirm button without vertical scrolling. Swipe horizontally for a large hand. Portrait retains its scrolling layout and enlarged card inspection remains available. Audio and bot timers pause in the background without changing the saved mute or pause preferences.

## Verification and limits

`mobile-verification.json` records Chromium touch-emulation checks, including real touch-event long presses, tap placement, drag attachment, cancellation, duplicate-commit prevention, Pokémon/Trainer targets, enlarged actions, persistence, layout at phone/tablet sizes and audio lifecycle controls. `outputs/ILEX.GG-Android-build.json` records the APK SHA-256 and unchanged engine hash. Android SDK tools verify the package, v2/v3 signatures and alignment.

No physical Android device or Android emulator was available for this build. Android file pickers, real-device rendering/audio, cache downloads and lifecycle integration still need an on-device acceptance pass. Emulated UI tests use a mocked native bridge; they are not a substitute for an installed-device test.

## Build on this workstation

1. Run `node work/android-build/download-tools.cjs` from the project root to download checksum-verified official Google SDK archives. Extract platform/build-tools/platform-tools archives into the matching `toolchain` folders. SDK 36 build tools extract to `android-16`; platform to `android-36`.
2. Set `ILEX_JAVA_HOME` if necessary (defaults to the installed JDK 17 at `C:/Program Files/Java/jdk-17.0.2`). Run `python work/android-build/build.py` with the project's Python runtime.
3. Run `node work/android-build/run-preview.cjs` for desktop Chromium mobile UI checks. It uses an isolated copy of the existing Electron runtime; no desktop release resources or real workspace are changed. Windows may require granting `ALL APPLICATION PACKAGES` read/execute access to that isolated preview-runtime directory, as for existing native desktop tests.

The native SDK ZIP writer crashes on this Windows host. The build uses the SDK's supported directory outputs and Python ZIP packaging, followed by official `zipalign -c` and `apksigner verify` checks. `resources.arsc` is stored and aligned. No Gradle service, remote hosting, paid infrastructure or Android Studio installation is required.

Signing key/password remain local under `signing/`, excluded by `.gitignore`. Keep them backed up privately: future APK updates must use the same key and a higher manifest versionCode to retain installed data. Neither key nor password is included in the APK. Uninstalling/clearing app storage removes that device's workspace and cached images; export first.
