# Quality — north star

If it is not measured, it will drift. These are the rails, not a vibe.

| Rail | Bar |
| ---- | --- |
| Unit tests | **80%** line coverage on `Holdfast.Domain` + `Holdfast.Application` |
| Formatter | One tool, one command, CI fails on diff |
| Architecture tests | Dependency rules fail the build |
| Runtime peek | Agent (or you) booted a scene and looked |
| Performance | FPS and load times logged on a peek bench |

Presentation (`Holdfast.Godot`) is **not** in the 80%. Views are covered by peek + a few smoke clicks, not by mocking AnimationPlayer.

## Unit tests — 80%

- **xUnit** + **coverlet**. Gate: `dotnet test /p:CollectCoverage=true` with a `CoverageThreshold` of 80 on Domain and Application.
- Combat, dice, Grit, Incoming, Ledger buys, card `OnPlay` — these are the meat. They run **without Godot**.
- `IRandom` is injected. Tests pass a `FixedRandom` or a seed.
- Do not test JSON key names via combat. Test ContentService mapping in Application tests; test `OnPlay` with constructed cards.
- A new `Card` subclass ships with `OnPlay` tests in the same PR.

Out of scope for the 80%: particles, shaders, Godot input maps, store signing.

## Formatter — same everywhere

- **CSharpier** (or `dotnet format` if we refuse another binary — pick **CSharpier**, one style).
- `csharpier check .` on CI. `csharpier .` locally.
- `.editorconfig` committed. No per-dev Rider profiles as source of truth.
- `content/**/*.json` formatted with a single indent (2 spaces) in the same CI step.

## Architecture tests

`Holdfast.Architecture.Tests` using **NetArchTest.Rules** (or ArchUnitNET). Every PR.

Rules:

1. `Holdfast.Domain` types have no dependency on `Godot`, `GodotSharp`, `Holdfast.Godot`, `Holdfast.Infrastructure`.
2. `SettingsService` namespace does not depend on `Holdfast.Domain.Cards`, `Combat`, `Hold`, `Run`.
3. `Holdfast.Application` does not depend on `Holdfast.Godot`.
4. No `switch` on card `Id` inside `CombatService` (convention test: forbidden method/type list, or a simple source scan in that test project).
5. Godot view scripts live under `Holdfast.Godot` only.

If someone “just this once” imports a card into Settings, CI goes red. That is the point.

## Runtime

`dotnet test` green is not done. Peek must run (HTML5 or Linux) and show camp idle, a swing, a rope haul. See [docs/holdfast/engine.md](../docs/holdfast/engine.md).

## Performance

Bars and how we measure: [performance.md](performance.md).
