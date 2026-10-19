# Realistic Player research and implementation

Research date: October 18, 2026. Existing interaction scope remains BW onward through implemented XY; historical profiles remain available and Unlimited is deferred.

## Primary evidence

* [Treynor Wolfe, 2016 Madison Regional Champion: first-person tournament report](https://www.pokebeach.com/2016/06/1st-place-regionals-report-with-yveltal-maxies-and-the-future-of-night-march). Read the public portion only. His discussion emphasizes low-cost single-prize attackers, preparing multiple threats, reserving Bench space, conserving gust/recovery resources, and adjusting draw choices late in the game. His finals account also describes how an extra Bench Pokémon became a trapping liability near deck-out. This is evidence of those strategic considerations, not a complete move-by-move match transcript.
* [Official 2016 Worlds Masters top-cut deck analysis](https://www.pokemon.com/us/play-pokemon/worlds/2016/decks/masters). The champion's Mega Audino discussion highlights damage thresholds and healing that changes the number of attacks required for a knockout. The published lists also give period-appropriate competitive deck context.
* [Tord Reklev, Stéphane Ivanoff and Ross Cawthon: official Triple Play](https://www.pokemon.com/us/strategy/scarlet-violet-journey-together-triple-play-mamoswine-ex-salamence-ex-blaziken-ex). General principles include coordinating setup, mobility, follow-up attackers and prize routes. Later-era cards mentioned there are not added or implemented by this work.

## Translation into the local policy

These are implementation inferences, not claims that the sources prescribe the exact weights below. Realistic Player uses a deterministic bounded search over legal engine actions, keeping several candidate sequences across up to three actions. It values prize progress, credible follow-up attackers, useful cards retained in hand, and affordable attacks. It penalizes excess Energy, unnecessary Bench liabilities, predictable active-Pokémon losses and low-deck risk. Search/discard/target prompts get contextual priorities, and optional acceleration distributes toward attack readiness rather than dumping every Energy onto the Active.

Forecasts conceal the opponent's hand, deck and prizes and resample the bot's own unknown deck/prize pool. A second concealed sample rechecks leading first actions. These samples model uncertainty; they do not reveal the live RNG, future draw order or concealed prize locations. The actual engine still validates every committed move and prompt.

## Limits

This is a researched heuristic/search difficulty, not a model trained on match recordings, a reproduction of a particular champion, or proof of tournament strength. Printed-damage threat estimates cannot fully predict every combo, lock or damage modifier. Deeper than three-action combinations and adversarial future-turn search are not exhaustively explored. Scenario, hidden-information, replay/Undo, mixed-deck and head-to-head results must be reported separately from these research principles. No online service, paid infrastructure or runtime AI connection is used.
