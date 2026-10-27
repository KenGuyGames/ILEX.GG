# Ken Guy Rules

Choose **Alternate Mode → Ken Guy Rules** in Play, or in the private host setup. Select the underlying format and decks as usual. Ken Guy Rules and New Rule are separate alternate modes; this does not combine their decks or effects.

1. Each player has a separate, once-per-game **Go Fuck Yourself GX** action during the opponent's turn. It does not spend a normal GX attack. It is unavailable until both players have completed their first turn. If an effect is resolving, that effect finishes before the opponent's turn ends. An attack that already ends the turn does not cause an additional turn to be skipped.
2. Both players draw 13 during setup and choose six face-down Prize cards before choosing their starting Pokémon. A Prize selection must leave a legal starting Pokémon. Normal format mulligan rules still apply. Ken Guy uses six Prizes even if the underlying format normally uses fewer.
3. The first player may attack or play a Supporter during the first turn, overriding the format's opening permission, but may not do both. Ordinary card costs, the Supporter allowance, and other format restrictions still apply.
4. Concede is unavailable, including through the game-action API. Leaving the screen still preserves the match.
5. Running out of cards in the deck does not immediately lose the game. Whenever a player must take their opening turn draw and their deck is empty, their opponent takes **one Prize**, then the turn continues. Taking the last Prize wins normally, making empty decks an endgame timer. A skipped or prevented opening draw—including the High 5 draw-skip penalty—awards no Prize. Failed draw effects at other times do not award Prizes. Existing local saved matches adopt this on future draw attempts without changing their recorded history. Victories can come from taking all Prizes, leaving the opponent with no Pokémon in play, or resolving a card effect that explicitly says to win the game (such as Unown HAND). The High 5 loss exception also applies.
6. Playing a hand-discarding card with no other cards in hand triggers a High 5 after that card's effect finishes. This includes optional entry effects such as Dedechange only if that effect was used. The acting player chooses **Offer High 5** or **Decline**. If they decline, their turn ends. If they offer, the opponent chooses **Accept High 5** or **Decline**. Acceptance lets the acting player continue. Opponent refusal ends the acting player's turn **and** rolls exactly one penalty against the refusing opponent:

| Probability | Penalty |
|---|---|
| 9% | The offering player takes two of their remaining Prizes. Taking the last Prizes wins normally. |
| 30% | The refusing opponent skips their normal draw at the beginning of their next turn. Other draw effects remain available. |
| 30% | The refusing opponent cannot play any Trainer cards during their next turn: Items, Supporters, Tools or Stadiums. Existing cards in play are not discarded. |
| 30% | The refusing opponent's Pokémon have no Abilities during their next turn, including relevant hand/discard Abilities. Historical Powers/Bodies retain their format definitions unless the cube unifies them as Abilities. |
| 1% | The refusing opponent immediately loses the game. This is the explicit exception to rule 5. |

The turn restrictions activate on that opponent's next actual turn and expire when it ends. Penalty results appear on the table. The roll is deterministic within the saved journal; Undo and another refusal do not reroll it. Private matches require opponent approval for Undo. Bots offer/accept High 5 by default, and can risk refusal to prevent a visible knockout threat after spending their separate GX action.

Windows and Android include the mode. In Android landscape, open **Match controls** for its controls; the hand stays visible. The native New 3DS alpha is unchanged. Physical Android and two-PC internet acceptance have not been performed for this update.

Card interaction corrections: Rose requests High 5 only when its Energy attachment causes the hand-discard instruction to resolve. Rejected plays cannot trigger a later High 5. The Trainer penalty covers paired Stadiums as well as ordinary Trainers. Existing saves retain their recorded history and use these corrections for future actions.
