# Android 1.22.0-android.41 installation

Download ILEX.GG-Android.apk from the 1.22.0 GitHub release. Requires Android 8+ with a current Android System WebView. Allow installation from the browser/file manager when Android requests it, then install over the prior ILEX.GG app. The original signing certificate is retained; do not uninstall first if you want to keep local workspace/cache. Export your workspace before replacing or moving devices.

This build includes Cube Drafting and the current desktop card engine, 1,137 startup/demo scans and 209 finish images. Other images download as viewed and remain cached. Cube drafts/matches are local/bot only; Android multiplayer is deferred. Physical Android acceptance remains pending; Chromium touch/layout and APK static/signature checks are documented separately.

Android source is in work/android-build. Rebuilding needs JDK17, official Android SDK tools, Python, the artwork resources and your own signing material. The original signing key/password and SDK binaries are excluded. A different signing key cannot update the installed release in place.

The default manifest/source corresponds to code41. release-extra-scans.txt lists the bundled startup scan IDs; build.py needs the verified scan files from a local artwork cache. The source archive does not include that complete cache.
