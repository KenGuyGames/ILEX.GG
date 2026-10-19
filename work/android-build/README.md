# ILEX.GG Android source — 1.19.0

The published APK is `1.19.0-android.27` / versionCode 27, for Android 8.0+ with a current Android System WebView. Install over the previous signed release to retain workspace/cache. Physical device/emulator acceptance remains pending. Android multiplayer is deferred.

This folder contains the Java Activity/host bridge, Android manifest, mobile styles/scripts, build/verification tools and mobile evidence. The release uses the same Mega-era engine as Windows, 439 verified startup/demo scans and 209 finish images. `release-extra-scans.txt` supplies the additional era scans; verifier defaults match code27 and439 images.

Android packaging is separate from the Windows Node.js build. It needs JDK17, the official Android SDK tools, verified scan resources (set `ILEX_ANDROID_SCAN_ROOT`), and the original local signing key for an in-place update. `download-tools.cjs` retrieves SDK tools; `build.py` builds/signs and `verify.py` checks the package. The toolchain, key/password, downloaded scans, generated build folders and native test profiles are excluded from GitHub. The existing packaging scripts depend on those local resources and are not a complete clean-clone Android release pipeline. A build signed with a different key cannot update the installed official APK in place.

The included Windows source has its own self-contained install/run/rebuild instructions in the root README. Mobile Chromium/bridge checks are simulations; native pickers, live caching, lifecycle/audio and performance still require installed-device acceptance.
