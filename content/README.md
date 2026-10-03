# Holdfast content (the experiment surface)

The game must read these files at boot. Do not hardcode hand size, starter copies, dice expressions, or Ledger prices in engine code.

| File | What you twist while playing |
| ---- | ---------------------------- |
| `tuning.json` | Hand, energy, HP, gold, map length, Runestone grants |
| `warrior/starter.json` | Warrior opening deck: counts, costs, dice |
| `runesmith/starter.json` | Runesmith opening deck |
| `ledger.json` | Node costs and what they unlock |

Change a number, reload, play. That is the loop. Values here are first guesses. A floor-4 rope (`showUp` 4 + four `perNode` 2 = 12) is meant to buy one cheap Frame node (cost 6).

## Dice strings

`"[N]d[S][+K]"` — `1d6`, `1d4+2`, `2d4`. `null` means no roll (Grit, Might, Inscribe). Printed range is derived, not stored. Might / Brace add after the roll in the engine, not in this string.

Pool cards, enemy intents, and the door are **not** in these files yet. Same shape when they land: JSON, not code.
