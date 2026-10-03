# Epic: Combat

The fight is domain objects, not a scene script.

## In

- `Card` / `AttackCard` / `SkillCard` / `PowerCard` with `OnPlay`.
- `Actor`, `Dwarf`, `Enemy`, `Hit`, `Encounter`.
- `DiceExpression`, injected `IRandom`.
- Might, Brace, Block. Energy, draw 5, discard.
- Enemy intents: show action + dice; buffs exact; roll on resolve.
- `CombatService` only orchestrates. No `switch (id)`.
- Unit tests for Incoming, rolls, energy, end turn. This is the 80% core.

## Out

- Grit (Warrior epic). Runes (Runesmith epic). Map rewards. Animation (Stagecraft consumes `PerformKey`).

## Done

A headless test plays a Hew and a Raise against a dummy enemy and the numbers match the spec. Peek can show one fight without a map.
