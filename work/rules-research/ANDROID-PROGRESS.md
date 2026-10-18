# XY interaction audit — Android versionCode 6

ILEX.GG **1.13.3** completes the deeper XY interaction audit with repairs across printing identity, Ancient Traits, temporary types, named conditions, attack protection, Energy movements and native attack timing.

1. Pyroar Flare Command pays from its own slot on the Bench or Active, accepts attached Fire-providing Energy, and rejects missing costs or targets before payment.
2. XY Venipede uses its printed 70 HP, 20 Poison Sting damage and three-Energy retreat, independently of the BW source constructor.
3. Delta Evolution permission belongs only to the actual trait evolution card being played from hand, not unrelated copies on either field or in hand.
4. Dry Skin queries the current attacker type and respects damage that ignores defender effects.
5. Light of Life recognizes both Yveltal and Yveltal-EX through shared named-condition parsing, including BW copied attacks.
6. Cross Slicer and Time Freeze use attack-effect events, respecting protection and normal switch/turn cleanup.
7. Burning Energy records actual eligible discards before native reducers move cards and returns to the same in-play Pokemon, with negative controls for other attackers and Trainers.
8. A shared attached-Energy view covers regular attachments and Pokemon-as-Energy zones for Enhanced Hammer, Shuppet, Xerosic, Jirachi, Groudon-EX and Dragonite-EX.
9. Energy discards route through attack prevention and the correct physical zone; Xerosic puts each card in its owner discard pile.
10. Stardust grants its shield only after a successful discard from the opponent Active; Bench-only Special Energy and blocked discards do not grant it.
11. Dragonite-EX, Greninja and Pyroar native attack indexes match their printing; Mist Slash uses the normal damage/KO pipeline with correct bypass flags and attacker bonuses; Inferno Onrush applies recoil.
12. Hyper Beam, Rip Claw and Stardust resolve defensive-Energy discards after damage, so Shield Energy still reduces that attack.

Final engine `0b857042401c6731b0a2250cd963fae7d9a35f5b8f97ce80892950821fb6cf68`. **56 new expected-result cases**, complete printed HP/type/retreat/cost/damage audit of **2,208 XY printings** and static native attack-index audit of **1,499 native-backed Pokemon printings** pass. Repeated all 52 original XY focused checks, 2,787 printed Pokemon attacks and both Tool attacks, 1,604 branch cases, Power/Trainer audits, 16 bounded scoped deck games (1200 decisions) with exact replay/Undo, 44 Basic Energy checks and shared historical/bot/Undo regressions. Native **v87 fresh/restored** suites pass, including Town Map and animation recovery. Earlier interrupted candidate runs predate the final Shield Energy timing repair and are historical, not release passes.

Windows EXE and compact/offline ZIPs are updated and integrity verified; all 23,736 scans and 3339 provenance files pass. Android **1.13.3-android.6 / versionCode 6** preserves the original signing certificate, with 59 touch/landscape, 54 presentation checks over three sizes and 28 APK checks passing. Install over the existing APK. Physical Android/emulator acceptance remains pending.

Scope remains BW onward through implemented XY, with Unlimited deferred and older rule profiles retained. No new cardpool, banlist, networking, subagents or GitHub publication. Finite tests do not prove every board state. See `work/rules-research/xy-interaction-release.json`, `package-xy-interactions.py` and `publish-android-xy-interactions.py`.

---

# Basic Energy update — Android versionCode 5

ILEX.GG **1.13.2** corrects Basic Darkness Energy receiving the older Special Darkness self-damage and attack bonus. The shared name-based reducer also affected Basic Metal Energy; it is now restricted to printings explicitly labeled Special Energy. Forty-two mapped Basic Darkness/Metal printings, including era Trainer Kits, pass expected-result checks for Energy type/provision, outgoing and incoming damage, and no extra holder damage at end of turn. Two Special Darkness controls (Neo Genesis and EX Ruby/Sapphire) retain their printed behavior, for 44 targeted checks total.

Final engine `6896c3d0e8ca0ece986fbe7f669288916d9ef95742d954ce0838af1a2028607c`. All 52 XY focused checks, 2,787 printed Pokemon attacks, both Tool attacks, 1,604 branch cases, Power/Trainer audits, 16 bounded scoped deck games with replay/Undo and shared historical/bot/Undo regressions pass again. Native v84 fresh/restored suites pass, retaining the Town Map/animation regressions. Prior XY 2,208/2,208 inventory and BW-onward scope remain unchanged; Unlimited remains deferred.

EXE and both Windows ZIPs are updated and integrity verified, preserving all 23,736 scans and source provenance. Android **1.13.2-android.5 / versionCode 5** preserves the original signing certificate; all 59 touch/landscape, 54 additional presentation checks over three sizes, and 28 APK checks pass. Install over the existing APK. Physical Android/emulator acceptance remains pending. Evidence: `work/rules-research/basic-energy-release.json`. Current repair scripts: `package-basic-energy.py` and `publish-android-basic-energy.py`. No subagents or GitHub publication.

---

# Town Map / animation update — Android versionCode 4

ILEX.GG **1.13.1** repairs Town Map's revealed holo Prize layout and attack animation stalls. The inner Prize grid is positioned relative to its own pile without inheriting outer pile offsets; Android's foil host is also explicitly positioned. Grass impact progress is clamped to [0,1], preventing negative ellipse radii. Canvas callback exceptions finish the effect, and a completion timer releases gameplay if animation frames stop. These are presentation changes; engine `16d55cd679249a61253728235c1150e95d2160f4587cdb7751aa58f941b39769` and the complete 2,208-printing XY coverage remain unchanged. Unlimited remains deferred.

Native v83 fresh/restored suites pass, including 18 focused checks each for both Town Map printings with all six holo Prizes, Grass damage continuation, deliberate canvas failure, lost frames and Skip. The same 18 checks pass at Android 800×360, 640×312 and 360×800, alongside all 59 touch/landscape and 28 APK checks. An initial fixture omitted the required Trainer play target; a portrait assertion was corrected to measure pile-relative position rather than page scrolling. Those earlier failed runs are retained as historical evidence.

EXE and both Windows ZIPs are updated and integrity verified, preserving all 23,736 scans and prior provenance. Android **1.13.1-android.4 / versionCode 4** preserves the original signing certificate; install over the existing app. Physical Android/emulator acceptance remains pending. See `work/rules-research/table-repair-release.json`, `package-table-repair.py` and `publish-android-table-repair.py`. No subagents or GitHub publication.

---

# XY engine update — Android versionCode 3 (October 17, 2026)

Signed APK updated to 1.13.0-android.3 with complete XY automation and the same engine as the verified Windows 1.13.0 release (`16d55cd679249a61253728235c1150e95d2160f4587cdb7751aa58f941b39769`). The original signing certificate is preserved exactly. All 59 emulated touch/landscape checks and 28 APK/static checks pass, together with official SDK signature/alignment checks. Existing one-screen landscape controls, image cache, workspace import/export, audio lifecycle behavior and saved data are retained. Install over the previous app, without uninstalling. Physical Android/emulator acceptance is still pending. See `xy-android-release.json` and `xy-final-release-evidence.json`. Older “desktop unchanged” statements below refer to their earlier releases.

---

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
