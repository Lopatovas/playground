# Holdfast architecture

Godot 4 is the stage. C# domain is the game. JSON is the knobs.

Presentation (scenes, animation, input) talks to application services. Services talk to domain objects. Domain does not know Godot exists. A service that owns brightness does not know what a card is.

```
holdfast/
  src/
    Holdfast.Domain/           # pure C#, OOP game rules
    Holdfast.Application/      # services, use cases
    Holdfast.Infrastructure/   # JSON, disk save, OS settings
    Holdfast.Godot/            # scenes, views, particles, peek
  tests/
    Holdfast.Domain.Tests/
    Holdfast.Application.Tests/
    Holdfast.Architecture.Tests/
    Holdfast.Benchmarks/
  content/                     # already in repo; copied or linked at build
```

`Holdfast.Godot` references Application + Domain. Domain references nothing in this repo except itself.

## Layers

```mermaid
flowchart TB
  subgraph stage [Holdfast.Godot]
    Peek[Peek scene]
    Camp[Camp / intro / rope]
    FightView[Fight view]
    MapView[Map view]
    Hud[Cards HUD]
  end

  subgraph app [Holdfast.Application]
    Settings[SettingsService]
    Content[ContentService]
    Save[SaveService]
    Run[RunService]
    Combat[CombatService]
    Hold[HoldService]
  end

  subgraph domain [Holdfast.Domain]
    Cards[Card / OnPlay]
    Actors[Actor / Dwarf / Enemy]
    Encounter[Encounter]
    Dice[DiceExpression]
    Ledger[Ledger]
  end

  subgraph infra [Holdfast.Infrastructure]
    Json[JsonContentLoader]
    Disk[FileSaveStore]
    Prefs[SettingsStore]
  end

  subgraph data [content/]
    Tuning[tuning.json]
    Starters[starter.json]
    Prices[ledger.json]
  end

  FightView --> Combat
  Hud --> Combat
  Camp --> Hold
  MapView --> Run
  Peek --> Combat
  Peek --> Hold

  Combat --> Cards
  Combat --> Actors
  Combat --> Encounter
  Run --> Encounter
  Hold --> Ledger
  Content --> Json
  Json --> data
  Save --> Disk
  Settings --> Prefs

  Combat -.-> Settings
```

Dashed line on Settings: Combat may *read* a “screen shake” flag later. It still does not *own* volume or resolution.

## Play a card

```mermaid
sequenceDiagram
  participant Hud as Fight HUD
  participant Combat as CombatService
  participant Card as Card.OnPlay
  participant Dwarf as Dwarf
  participant Enemy as Enemy
  participant View as Fight view

  Hud->>Combat: Play(cardId, target)
  Combat->>Combat: spend energy, move card to discard
  Combat->>Card: OnPlay(PlayContext)
  Card->>Dwarf: roll / add Might or Brace / apply Grit or Rune
  Card->>Enemy: take hit or skip if Grit eats it
  Combat-->>Hud: PlayResult
  Combat-->>View: Perform(dwarfAnim, enemyAnim, particles)
```

`OnPlay` is rules. The view only performs what the result says.

## Ownership

```mermaid
flowchart LR
  subgraph settings [SettingsService]
    A[audio volume]
    B[brightness]
    R[resolution / vsync]
  end

  subgraph content [ContentService]
    J[load JSON]
    F[Card factory]
  end

  subgraph combat [CombatService]
    T[turns]
    P[play / end turn]
  end

  subgraph hold [HoldService]
    L[Ledger buy]
    S[Runestones]
  end

  settings -.-x combat
  settings -.-x hold
  content -.-x settings
  hold -.-x combat
```

Solid boxes are the only types that service may import from its own domain. Crosses are forbidden references (enforced in `quality/`).

Full type sketch: [domain.md](domain.md). Service list: [services.md](services.md). Solution and Godot boundary: [solution.md](solution.md).
