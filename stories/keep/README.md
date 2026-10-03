# Epic: Keep

Pause and leave. Come back mid-run.

## In

- Save on leaving a node, on menu, at the Hold.
- `SaveService` writes `HoldProgress` + `RunState`.
- Load boots the right scene (Hold vs map vs fight — fight can snapshot or force node boundary; prefer save at node boundary for MVP).
- Rope still ends the run and keeps stones.

## Out

- Cloud saves. Undo last click.

## Done

Kill the process after a shop, relaunch, still in that shop with the same deck.
