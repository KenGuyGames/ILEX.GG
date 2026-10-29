# Realistic Player strategy update

Realistic Player now builds a working plan from its own declared deck: main attackers, evolution lines, support roles, recovery, backup attackers, and common Prize-race, discard-engine and mill objectives. It reevaluates the plan after each committed decision rather than reusing a forecasted action chain.

Card values depend on the board and remaining resources. Discard and search choices protect usable evolution lines, scarce Energy, recovery and future attackers. Benching weighs strategic benefit against occupied space and exposed Prizes. Limited GX/VSTAR allowances have an opportunity cost; using them to win, survive or establish an important attacker remains worthwhile.

Useful uncertain effects normally precede commitments. Coin-flip candidates are tested in opposing first-coin outcomes. Attachments normally follow useful draws/searches, with exceptions such as protecting Energy before a hand-discard effect. Supporter choices compare their resulting hands, disruption, gust targets and available attacks. Final-Prize threats and likely return attacks influence switching, targeting and risk-taking.

A full, legitimate own-deck search records inferred missing cards from the declared list and visible zones. Top-card windows do not reveal the rest of the deck. Observations replay from the journal, disappear when Undo removes the search, and update when a Prize is revealed into hand. Forecasts never use the opponent's hidden list, hand or Prize identities. Planning does not consume live randomness.

The algorithm is bounded, deterministic local search, not a trained tournament player. Tests include tactical decisions, the bundled format presets, complete controlled readiness matches, native Windows worker/controller behavior and save/Undo/restart. These are finite scenarios, not exhaustive match-up or tournament-strength certification.

Only Realistic Player changes. Easy, Normal and Hard retain their existing policies. GitHub 3.3.0 publishes the current Windows bot update. Android remains at the unchanged 3.2.0/code121 release; no New 3DS update is included. Multiplayer is the next development priority and remains experimental/beta.
