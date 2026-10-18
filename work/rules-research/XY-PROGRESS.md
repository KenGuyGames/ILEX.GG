# Complete XY release — October 17, 2026

ILEX.GG 1.13.0 is complete and verified locally: **2,208/2,208 XY-era printings, zero pending**. Includes Kalos Starter, XY through Evolutions, all 216 catalog XY promos, six Yellow A alternates, Double Crisis, Generations/Radiant Collection, eight 30-card Trainer Kit decks and McDonald’s 2014–16. Interaction scope is **Black & White onward through implemented XY**, also the standing baseline for future implementation work; Unlimited remains deferred. Preserve all earlier historical rule profiles and UI/cache/pack/audio/Android landscape features. No subagents were used and no GitHub publication occurred.

Final engine: `16d55cd679249a61253728235c1150e95d2160f4587cdb7751aa58f941b39769`. Fifty-two expected-result checks, all 2,787 printed Pokémon attacks plus both Trainer Tool attacks, 1,604 branch cases, Ability/Trainer audits, 16 bounded mixed-deck games (1199 decisions) with exact replay/Undo, shared historical/bot/Undo regressions and native v81 fresh/restored checks pass. Two cached 59-card lists were completed only in cloned rollout fixtures and are identified in the reports; user decks were not changed. Native v79’s restart failure was an inherited screenshot-harness preference cleanup defect, repaired before v80. Raw failing reports remain historical evidence, not final passes.

Windows EXE, compact ZIP and full Offline ZIP are updated and integrity verified; all 23,736 scan hashes and 3333 provenance files pass. Android **1.13.0-android.3 / versionCode 3** uses the exact previous signing certificate, with 59 touch/landscape checks and 28 APK/static checks plus SDK signature/alignment verification. Install over the existing APK to retain local state. **Physical Android/emulator acceptance remains pending**; do not claim device certification or Play Store publication.

Read `work/rules-research/xy-final-release-evidence.json`, `xy-source-validation.json` and `XY-FULL-PROGRESS.md` for exact evidence and finite-test limitations. `stage-xy.py`, `package-xy.py` and `publish-android-xy.py` are the current release scripts. Do not run the old first-wave inventory/checkpoint scripts over the complete XY release. Expanded mechanics now have their own profile; format card pools/bans are separate and no new official banlist is supplied.

Earlier first-wave notes below are historical and superseded by this completed release.

---

# XY automation — first source batch, October 17, 2026

## Standing authorization

Kenneth authorized starting the XY era and explicitly changed the interaction baseline to **Black & White onward**. This is also the standing baseline for future implementation batches, to support Expanded. Include newer sets only as they are implemented. Preserve historical formats/saved matches and shared older-era regression suites; do not deliberately expand pre-BW interaction sweeps. Unlimited remains deferred. This replaces earlier HGSS/Call of Legends interaction baselines for new work. See `INTERACTION-SCOPE.json`.

## First batch

Source covers **Kalos Starter Set 39/39 and XY base 146/146**: 185 printings. Kalos adds 33 compiled Pokémon and six reused/era-aware Trainers. The XY base set reuses native handlers with targeted repairs rather than treating existing name mappings as proof of complete behavior. Fairy typing was added to the shared printing compiler. Historical XY rules enable the compiled BW effect framework while keeping first-turn Supporters, no first-turn attack and legacy Burn distinct from current Expanded rules.

The catalog inventory currently contains 2,208 XY-era printings across main sets, promos, alternates, Generations/Double Crisis, Trainer Kits and McDonald's groups. **2,023 remain outside this first reviewed batch**, including Flashfire onward and promos/supplements. Existing native mappings for these later entries are not counted as completed XY interaction validation. `ui/xy-coverage.json` tracks reviewed batches separately.

## Shared repairs

- Pokémon Catcher uses the coin-flip erratum under XY rules for older EPO/DEX handlers and the Kalos printing, while the historical BW profile retains its original behavior for those sources.
- Tree Slam requires two Bench targets when two exist and only one when one exists; it does not allow choosing fewer damage recipients than required.
- Hand Mega Evolution now validates and commits before ending the turn. Invalid same-turn evolution cannot end a turn. Existing Spirit Link skip flags remain honored on hand play.
- Evosoda now dispatches the shared evolution event from the actual deck source under XY rules. It clears evolution effects/conditions, avoids incorrectly treating the card as played from hand, shuffles and then ends the turn for Mega Evolution. This source-zone mechanism is available for future Trainer-driven evolution. Later Spirit Link/other evolution-card integrations still need their own batch tests.
- Shared attachment helpers now move Energy from their actual source zone instead of leaving it in the deck while adding it only to the auxiliary Energy list. Attachment origin remains explicit for downstream effects.
- Energy search capacity accounts for eligible types and available destinations. Zero/one eligible Fairy Energy and scarce Bench space no longer create an impossible Geomancy choice. Hidden-zone type searches may fail.
- Attachment validation no longer returns early after a valid-type check, so distinct-target restrictions still apply. Duplicate use of one physical Energy card is rejected.
- Bot attachment planning tries distributed destinations before falling back to an empty legal search, preserving horizontal/other UI behavior and allowing Geomancy to put Fairy Energy on two different BW Pokémon.

## Evidence and limits

`xy-first-checkpoint.json` binds final source and reports to engine `63fae0b21180762f1b784323c443d15efe498fa73ee76773d49b8ae184bc73c4`. Final attack smoke: 253/253; isolated repair rerun: 8/8 scenarios. Power audit: 16 resolved/8 unavailable, zero failures; Trainer audit: 40 resolved/2 legality rejections, zero failures. All three 35-decision fixtures pass exact replay/Undo. Shared current-hash checks: BW66, HGSS32, DP109, EX170; Undo7 passes. Focused suite covers 15 expected-result cases: Fairy identity, Mega/invalid timing, Evosoda, Tree Slam one/two targets, Forest's Curse Active/Bench behavior, BW Garbotoxin versus XY Ability locks, Fairy Garden with BW Pokémon, Catcher historical/XY behavior, Geomancy restrictions/capacity and BW Mew-EX copying an XY Mega attack.

The first-wave attack smoke covers all **253 printed attacks**, with BW/XY-only fixture cards. An earlier four-branch pass exposed four Geomancy failures; retain `xy-first-sweep-report.json` and its log as pre-repair evidence rather than presenting it as final. The four originally failing branches have a separate final repair report. Power audit records both resolved actions and unavailable/passive cases; unavailable cases are not asserted as successfully activated. Trainer audits have analogous legality-only rejections. Three bounded mixed BW/XY fixtures run 35 decisions each and compare exact saved-game replay and Undo; these are finite construction fixtures, not tournament matchup certification.

BW/HGSS/DP/EX shared focused tests and Undo regressions are retained to catch common-engine damage, without widening the deliberate interaction scope. Desktop native certification, Windows packaging, Android rebuilding and physical Android verification are **not part of this source checkpoint**. The released EXE, ZIPs and Android APK remain unchanged from their prior verified builds. Do not claim the packaged apps contain this batch yet.

## Sources

- Official [XY base rulebook](https://assets.pokemon.com/assets/cms2-en-uk/pdf/trading-card-game/rulebook/xy1-rulebook-en.pdf): Mega Evolution, turn rules and Fairy-era rules.
- Official [Phantom Forces rulebook](https://assets.pokemon.com/assets/cms2/pdf/trading-card-game/rulebook/xy4-rulebook-en.pdf): historical Mega Evolution rules, retained as later-era reference.
- Cached printed text and card identities: `work/card-sources/pokemon-tcg-data-master/cards/en/xy0.json`, `xy1.json`, bundled scan manifest and existing verified BW records.

## Continue

Keep first-wave source/finite validation separate from packaged releases. Next expansion is Flashfire; finish the rest of XY in batches, including supplements, with **BW onward** as the interaction pool. Preserve all forest/pack/audio/foil/deck/Android touch and landscape work. No subagents were used or authorized.
