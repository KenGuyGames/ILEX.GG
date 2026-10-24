# ILEX.GG — New 3DS / New 2DS forest/audio Alpha 3 (starter-only public release)

Experimental native ARM11 homebrew for New Nintendo 3DS, New 3DS XL and New Nintendo 2DS XL. This public bundle contains only the Ember Grove and Tidal Grove Base Set starter decks. No imported Windows deck lists, formats, profiles or saves are included.

## Install

For HOME Menu installation, extract ILEX.GG-New3DS-CIA-SD.zip to your SD root, keeping the full 3ds/ilex-gg directory. On an already configured CFW console, use FBI to install cias/ILEX.GG-New3DS-Playable-Alpha.cia. The CIA alone is insufficient: runtime, artwork, catalog and media must remain on SD. Homebrew Launcher users can instead extract ILEX.GG-New3DS-Playable-Alpha.zip and launch its 3DSX. The original Nintendo 3DS/2DS is not a validated target.

Replace the program/runtime/art/data/media together. Keep match.json, match.json.bak and audio.cfg when updating. The public starter-only bundle cannot restore imported-format matches from a private full-library build; keep a backup of that older private bundle if you need those saves. The CIA and 3DSX share SD saves. Do not distribute personal saves or imported libraries accidentally.

## Play and controls

Choose Play Matches, then Base Set starters and a deck; a separate starter entry may also be available. The native dual-screen table includes offline card scans, forest art, HP/Energy/condition labels, card inspection and a lightweight bot. D-pad/A or touch select; L/R page; X inspects; Y saves; START pauses; SELECT opens music/effects settings. Committed actions autosave with backup recovery. Save replay shows progress and can be cancelled.

This Alpha adds forest menus, Celebi showcase, native play-table presentation, menu/battle music, 18 effects and 1,340 species/form cries. It is not the complete Windows app: deck editing/import UI, full-pool independent play, packs, Pocket, cube drafting and networking are not available here. The full printing catalog is a browser, not a claim that every card is playable in this starter-only runtime.

## Validation and limits

The release ARM11 executable/CIA payload is unchanged from the developer forest/audio Alpha 3. Earlier Alpha CIA installation, playing, saving and resuming were reported on New 3DS XL; this forest/audio update still needs physical display, audio, sleep, SD durability, peak-memory and performance acceptance. Emulator accepted audio commands are not a listening test. Public starter runtime source/bytecode and complete starter matches are checked separately in public-release.json. Original imported-library test totals are not relabeled as starter-only acceptance.

QuickJS heap cap64MiB; 512KiB JS stack and1MiB native stack. One bounded music buffer,24 thumbnail cache entries and bounded effect/cry voices; all cry files are not loaded simultaneously. Preserve source notices and asset credits. Unofficial fan-made homebrew, not affiliated with Nintendo or The Pokemon Company.

## Source

ILEX.GG-New3DS-Source-Alpha.zip contains the public native source, QuickJS notices, starter runtime and build tools. devkitARM/libctru and CIA tools are separate prerequisites; no SDK, private library or emulator profile is bundled. Set ILEX_QJS_X86 to the exact QuickJS-NG0.17.0 32-bit host compiler for bytecode generation. Install assets from the matched SD bundle; rebuild documentation describes the native source rather than promising a one-command fresh SDK setup.


### Native rebuild outline

From the source repository root, install devkitPro's 3ds-dev package and set DEVKITPRO/DEVKITARM according to its official setup. Copy the matched public SD bundle to an isolated SD folder. On a configured devkitPro shell, run `make -C ports/3ds`; use the generated 3DSX/SMDH with the public runtime/art/data/media. The Windows `tools/build.ps1` helper assumes a workspace-local SDK at work/3ds-sdk/msys64; use normal make with a system devkitPro installation.

To regenerate bytecode, provide the matching QuickJS-NG0.17.0 32-bit Windows compiler through ILEX_QJS_X86, then run `node ports/3ds/tools/build_bytecode.cjs` from the repository root and copy the complete runtime folder to the SD folder. The source compiler creates its own temporary private directory; this is not an imported library.

`tools/build_cia.py` is the original workstation packaging helper. It additionally expects makerom0.19.0, bannertool1.2.3, ctrtool1.3.0, Pillow and locally generated release/release-symbols reports. Those original private-build reports are deliberately not supplied as public starter-only evidence. Use the released CIA unless you have recreated the native payload/symbol checks and adapted those helper paths/reports. The CIA-SD bundle is the supported installation path; a new clean SDK/CIA rebuild has not been certified by this publication.
