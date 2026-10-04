# Solution and Godot boundary

## Projects

| Project | Kind | References |
| ------- | ---- | ---------- |
| `Holdfast.Domain` | class lib, `net8` | — |
| `Holdfast.Application` | class lib | Domain |
| `Holdfast.Infrastructure` | class lib | Application, Domain |
| `Holdfast.Godot` | Godot 4 C# game | Application, Infrastructure, Domain |
| `*.Tests` | xUnit | the lib under test |
| `Holdfast.Architecture.Tests` | xUnit + NetArchTest | all of the above |
| `Holdfast.Benchmarks` | peek scene + optional BenchmarkDotNet | Domain, Godot peek |

Godot 4 C# game project is the only one with `.tscn` / `.godot`. Domain tests run with `dotnet test` and no display.

## What is allowed in a `.tscn`

- Layout, cameras, AnimationPlayer, particles, input
- A thin view that holds an `Encounter` or `HoldProgress` id and calls a service
- `PerformKey` → animation

Not allowed:

- Dice math
- Grit / Might / Brace rules
- Ledger prices
- `if (card.Name == "Hew")`

## Peek

`Peek` is a Godot scene, not a service. It constructs a tiny canned fight and camp from ContentService and plays them. Agents open the HTML5 or Linux export and click. See [engine peek](../docs/holdfast/engine.md).

## Content at runtime

`content/` stays at repo root. Infrastructure copies or reads it as `res://content` (or a exported pack). Changing JSON and reloading is a ContentService call, not a recompile.
