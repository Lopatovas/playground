# Epic: Foundation

Stand up the Godot 4 C# solution and prove an agent can boot it and look.

## In

- Projects: Domain, Application, Infrastructure, Godot, unit + architecture tests.
- CSharpier, coverlet, NetArchTest wired. Empty Domain still meets the 80% gate (or the gate starts when combat lands — prefer a stub `DiceExpression` so the gate is real).
- `ContentService` reads `content/tuning.json` and both starters. No hardcoded Hew `1d6`.
- Peek scene: hearth plate, three portraits, a canned “play Hew” that goes through `AttackCard.OnPlay`.
- HTML5 **or** Linux export an agent can open. Screenshot required.

## Out

- Full map, Ledger UI, Brand, living walkers, store upload.

## Done

`dotnet test` green, architecture tests green, peek opened, JSON change to Hew dice shows up after reload.
