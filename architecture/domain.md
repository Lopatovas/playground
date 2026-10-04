# Domain (OOP)

Pure C#. No `Godot` usings. No file paths. No volume sliders.

JSON becomes these objects via `ContentService` + a factory. The factory knows `type: "Attack"` → `AttackCard`. The card then owns what happens.

## Cards

```mermaid
classDiagram
  class Card {
    <<abstract>>
    +string Id
    +string Name
    +int Cost
    +CardType Type
    +PlayResult OnPlay(PlayContext ctx)*
  }

  class AttackCard {
    +DiceExpression? Damage
    +PlayResult OnPlay(PlayContext ctx)
  }

  class SkillCard {
    +DiceExpression? Block
    +PlayResult OnPlay(PlayContext ctx)
  }

  class PowerCard {
    +IEffect Effect
    +PlayResult OnPlay(PlayContext ctx)
  }

  class PlayContext {
    +Actor Source
    +IReadOnlyList~Actor~ Targets
    +Encounter Encounter
    +IRandom Random
  }

  class PlayResult {
    +IReadOnlyList~Event~ Events
    +string PerformKey
  }

  Card <|-- AttackCard
  Card <|-- SkillCard
  Card <|-- PowerCard
  Card ..> PlayContext
  Card ..> PlayResult
```

`OnPlay` is the only place a card mutates the fight. No `switch (card.Id)` in CombatService.

Starters map like this (first guess, from `content/`):

| Id | Class | Kind |
| -- | ----- | ---- |
| Hew / Chip | `AttackCard` | roll damage, add source Might |
| Raise / Ward-cut | `SkillCard` | roll Block, add source Brace |
| Numb | `SkillCard` | `source.Grit += 2` (Warrior only; factory refuses on Runesmith) |
| Set Shoulder / Steady Hand | `SkillCard` | +Might or +Brace this fight |
| First Cut | `PowerCard` | Inscribe: next Attack adds `+1d4` |

New cards are a new subclass *or* a new `IEffect` plugged into `PowerCard` / `SkillCard`. Do not grow a god `Card` with 40 optional fields.

`PerformKey` is a string the view uses (`hew`, `raise`, `numb`). Domain does not play animations.

## Actors

```mermaid
classDiagram
  class Actor {
    <<abstract>>
    +int Hp
    +int MaxHp
    +int Block
    +int Might
    +int Brace
    +Hit Incoming(Hit hit)
    +void GainBlock(int amount)
  }

  class Dwarf {
    +ClassId Class
    +int Energy
    +int Grit
    +RuneList Runes
    +Deck Deck
  }

  class Enemy {
    +Intent Intent
    +void Telegraph()
    +void ResolveIntent(Encounter enc)
  }

  class Hit {
    +int Rolled
    +int Might
    +int Total
  }

  Actor <|-- Dwarf
  Actor <|-- Enemy
  Actor ..> Hit
```

`Actor.Incoming`:

1. `Hit.Total = rolled + attacker.Might`
2. If target is a `Dwarf` and `Total < Grit` → miss, Block untouched
3. Else apply Block + Brace, leftover to HP

Enemies do not have Grit. Runes live on `Dwarf` and only the Runesmith kit writes them.

## Combat and dice

- `DiceExpression` parses `1d6`, `1d4+2`, `2d4`. `null` = no roll.
- `Encounter` owns both sides, turn, discard, exhaust, who is telegraphing.
- `CombatService` starts encounters and calls `Card.OnPlay`. It does not implement Hew.

## Hold

`Ledger`, `LedgerNode`, `RunestonePurse`, `BrandTrack` are domain. Buying a node is `HoldService` applying a node effect to `HoldProgress`. Frame/Hearth/Spark stay as in the spec.
