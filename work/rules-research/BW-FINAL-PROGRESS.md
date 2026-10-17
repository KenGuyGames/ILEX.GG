# Complete BW era — October16,2026

## Authorized scope

Kenneth requested the rest of Black & White, including era promos. Scope: BW1–11 through Legendary Treasures, Dragon Vault, all101 catalog BW Black Star Promo entries, both BW Trainer Kits and the2011/2012 McDonalds collections. Interactions limited to HGSS1–4/Call of Legends and supplements plus this BW pool. Unlimited, XY-era expansion work and broader older-era sweeps remain deferred. No subagents used. Release1.12.0 is verified locally; prior1.11.0 evidence is retained separately. Backlog and all existing UI/cache/pack/LEGEND/music features preserved.

## Candidate coverage

1521/1521 printings, zero pending:888 added since the633-printing release. New groups: Dragons Exalted128, Dragon Vault21, Boundaries Crossed153, Plasma Storm138, Plasma Freeze122, Plasma Blast105, Legendary Treasures140, BW45–BW10157, McDonalds2011/201224. Cumulative methods1394 native reuse,108 compiled Pokemon,19 compiled Trainers. All printed attack costs, damage, stats, Ability types, Dragon typing and Team Plasma tags retained.

## Shared implementation and repairs

- First Ticket has simultaneous pregame choices: one user goes first without the deciding coin, both users cancel into the normal coin; ordinary turn play is forbidden. Setup/replay checks pass.
- Mew-EX Versatile uses the shared passive copied-attack list, preserving costs and not inheriting donors' Powers; tested with HGSS Basic and assembled LEGEND attacks.
- Team Plasma Badge membership reconciles across field and other zones, removes its runtime tag when the Tool disappears and preserves printed membership.
- Promo effects include Jumpluff return with attachments, Weak Barrier, Justified, Intuition after actual hand evolution, Psyscan and Champions Festival through shared effect gates.
- BW Supporter copy handlers cover the full pool for Smeargle, including Colress/Hugh/Caitlin/Iris/Ghetsis/Shadow Triad/Grunt/Skyla/Elesa and Cedric. Ghetsis treats Tools as Items under era rules.
- Cedric checks actual feet/inches instead of manual adjudication.1632 Pokemon printings in the scoped HGSS/BW pool have height metadata from scan metadata bars, matched to cached species/forme heights;194 scans have no detected metadata line and remain ineligible. Narrow review recovered16 ordinary/promotional lines; Sky Forme Shaymin's1ft4in is explicitly corrected. See bw-height-* artifacts, bw-card-heights.json and source notes.
- Added validated hand/discard Ability controls, stale-view and opponent-action guards, plus bot candidates; Propagation and Busybody work through the existing journal/prompt/Undo system. Garbotoxin blocks these while preserving HGSS Pokemon Powers.
- Full-Bench search guards repaired Shaymin, Cradily, Genesect and Kangaskhan; Ursaring Picnic Weather completes harmlessly when no placement is possible.
- Damakinesis counter movement accounts for existing defender damage; bot movement honors source/destination restrictions and caps.
- Rock Paper Scissors choices are private and seeded for bots, avoiding perpetual ties.
- Native shred attacks share defender-effect bypass handling; G Booster bypasses Safeguard, pays two Energy units and G Scope retains Bench-only no-Weakness damage.
- Ten BW source classes and two HGSS classes use the common Energy-unit helper: flexible Blend Energy counts as one, DCE as two, including X Ball, Helix Force and Lanturn Powerful Spark. Bot scoring uses the same unit count.

## Validation status

Final engine a7f812b8c255e0246245455792f1be041a86c7212b0a8e0fed6999360423ab59. All66 focused expected-result checks,2206 printed Pokemon attacks plus both Trainer Tool attacks,5196 additional new-card branch scenarios, Power/Trainer audits and18 scoped real-deck rollouts (1596 decisions) with replay/Undo pass. Shared HGSS32/DP109/EX170/WOTC-focused127/bot17 plus3 full games/Undo7 regressions pass. Nativev58 fresh/restored passes inherited UI, LEGEND, pack, persistence and BW checks. Desktop preview reviewed.

ILEX.GG1.12.0 EXE and both Windows archives are updated. All23736 scan hashes and1940 provenance files verified. Compact ZIP 209186721 bytes; offline ZIP 2776324870 bytes. Both archive CRC and embedded-engine checks pass. Exact evidence: bw-final-release-evidence.json and outputs/ILEX.GG-win32-x64/desktop-verification.json. No GitHub publication.

Initial discovery found full-Bench errors, a constrained counter prompt, an RPS bot loop and expected restrictions on Slaking/Slowbro. Fixtures now satisfy the printed restrictions; focused cases retain positive/negative checks. Two imported decklists (Fluffychomp, Flareon) fail construction before any decision; the final rollout selection records and excludes invalid source lists instead of changing user decks. Earlier v57 and initial attack/rollout reports predate the final Energy/shred/height repairs and are not release evidence.

Finite fixtures and bounded rollouts are not exhaustive proof of every board state. Source implementation coverage is separate from release verification. No GitHub publication.
