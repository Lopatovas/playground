# Kindling — MVP spec

Working title. World is the Hold. Still a draft. Numbers are targets, not balance. No code.

**Status:** blockers answered. This is the MVP spec. Challenge it.

## What this is

A one-hero card roguelike. Slay the Spire fight (hand, energy, Block, intents, branchy map) with **dice** on damage and Block for both sides. A dwarven **Hold** you leave to cut a way *out*. HP 0 is a massive injury; extraction drags you home. Between runs you spend **Runestones** at the Hold so this dwarf is further on. After the first exit, a finite **Brand** ladder is why you come back.

Two classes in the MVP so we test exclusive keywords and that the Camp/architecture can take a third later. Not four. Not a roster grind.

Call the fight a StS-like. Do not steal names, card text, art, or UI chrome.

## Locked

- Hold. Exit, not a Spire. Injury + extraction, not permadeath-as-lore.
- Untimed card puzzle. Honest dice: expression and range public, result on resolve.
- Enemy intents show the action and the damage/Block dice. Buffs exact.
- No slots, tags, TFT shop, movement line, spectate-combat, endless numbers.
- Phone first. Save anytime.
- RPG currency is **Runestones**. Shared Camp. Exclusive class engines.
- MVP classes: **Warrior** and **Runesmith**. Hunter/engineer is class 3, not in MVP.
- Warrior exclusive verb is **Grit** (feel no pain), not Ironclad Strength/Block as the class identity. Block still exists for everyone.
- Game is beatable at Brand 0. Brand 1–5 is the return loop. Top Brand is beating the game.
- A naked Warrior is not expected to exit. Die around floor 4, come home, buy a Ledger node.

## Pitch

You are a dwarf of the Hold. You walk the dark for a door and for what the old ones left. When you drop, they haul you back on the rope. You cut runestones into the hearth and go out again, meaner. The Warrior does not feel the nicks. The Runesmith makes the dice lie.

## The loop

```
pick a class at the Hold (Warrior first; Runesmith once unlocked)
  → pick Brand (0 until first exit)
  → walk a short branchy path toward the exit
  → fight: draw, spend energy, roll your dice, they roll theirs
  → card / gold / relic
  → shop, rest, elite, event
  → boss (the door) or the rope
  → return to the Hold with Runestones
  → spend on the Ledger
  → go out again
```

## World (MVP, thin)

**The Hold** is safe. Stone, hearth, rope-crews. This is the Camp.

**The dark** is the map. About ten nodes. You are cutting a way *out* and picking relics of the past. Enemies are what lives between the Hold and the door.

**The rope.** HP 0: you are down, not gone. Extraction ends the run. You keep Runestones. The deck is gone.

No plot dump. No named gods. Enough fiction to see the hearth and the rope.

## Two progressions

**This sortie (run).** Deck, gold, relics, HP, Grit/Runes you stacked in fights. Gone when the rope takes you.

**This Hold (character).** Runestones, Frame, Hearth, each class’s Spark pool, each class’s Brand clears. Kept.

You lose the build. You keep the Hold.

## Classes

Three guilds on the wall. MVP ships two.

| Guild | Archetype | Exclusive verb | MVP |
| ----- | --------- | -------------- | --- |
| Warrior (slayer / berserker) | Warrior | **Grit** | Yes |
| Runesmith | Mage | **Rune / Inscribe** | Yes |
| Hunter / engineer | Hunter | Mark / device (later) | No |

Pools do not mix. Warrior cards and relics never appear for the Runesmith. No “a bit of both.”

### Shared Camp, exclusive engines

Frame (HP, starting gold) and Hearth (shop reroll, rest upgrade, extra remove, extra event) are **Hold-wide**. Spark (cards into the pool, starter swaps) and Brands are **per class**.

A new class has a baby deck and a grown body. You can still get wrecked. You do not redo the HP/shop grind.

**Unlock Runesmith:** a Hearth node, cheap, available after a few Runestones *or* after Warrior Brand 0. MVP must be able to touch the second class without a second career.

### Warrior — Grit

Not Ironclad. Strength-stacking and Block-stacking are generic tools; they are not the guild.

**Grit** is a number on you this fight. Starts at 0. Stacks from Warrior cards. Falls off when the fight ends.

When an enemy attack resolves:

1. They roll their damage `D`.
2. If `D < Grit`, the hit is nothing. You felt no pain. Block is not spent.
3. If `D >= Grit`, it is a real hit. Block applies as usual. You take `max(0, D − Block)`.

You are stacking a **floor**. Nicks bounce. Real swings still put you on the rope.

That is the dice conversation. A `2d4` jab dies to Grit 5. A `2d6+2` boss swing still lands.

In-class directions (2–3 decks, same verb):

- **Numb:** stack Grit, ignore the bottom of their band, stab when they buff.
- **Fury:** still a Warrior — bigger attack dice, spend Grit as a cost or ignore it. Secondary, not the clone of Strength as the whole class.
- **Guard-and-grit:** Block the top, Grit the bottom, live through overlap.

Starter identity card: something that gives 1–2 Grit. Starter Attacks/Blocks are generic dice so the guild is the Grit card, not the Strike.

### Runesmith — Inscribe

Tests a second keyword family so the architecture is not “Warrior-shaped.”

**Rune:** a persistent this-fight effect on you (a small list, not a board). Example kinds: *next Attack adds +1d4*, *1s on your rolls become 2s*, *the first hit each turn against you rerolls*.

**Inscribe:** a card that puts a Rune on you, or changes the next dice you roll.

The Runesmith does not have Grit. The Warrior does not Inscribe. If a relic talks to Runes, it is a Runesmith relic.

In-class directions: dice-cheat (rerolls, floors), extra dice, persistent shield-runes.

Unlock kit is thin, like Warrior run 1, plus the Hold body you already bought.

## Combat

One dwarf. One or more enemies. No positions.

Start of turn: energy 3, draw to 5, start-of-turn effects (Grit does *not* tick down unless a card says so).

Play cards. They happen now. Dice on Attack and Block roll on resolve. End turn. Enemies do the telegraphed action; their Attack/Block dice roll.

**Block** (everyone): absorbs this turn, then falls off.

**Grit** (Warrior only): floor against incoming `D`, this fight.

**Runes** (Runesmith only): persist this fight until spent or the fight ends.

Inspect never plays.

### Dice

Printed as `2d4+1` with range `3–9`. Tight bands (`1d4`, `1d6`, `2d4`). No `1d20` on a starter. Flat bonuses add after the roll. Energy and draw do not roll.

Some cards may be flat (`Block 6`) so safe vs swingy is a deck choice.

**Example (Warrior).** They intend `2d6` (2–12). You have Grit 5 and play `2d4` Block. If they roll 4, you take 0 (Grit). If they roll 10, Block rolls and you take the rest. You could have stacked more Grit instead of Blocking and gambled they stay under 5.

## What you collect (this sortie)

**Cards.** Starter 8–10, class-locked. After fights: 1 of 3 from *this class’s* pool, or skip. Shop sells from this pool. Remove at rest/shop.

**Relics.** Rule rewrites. Some shared (extra energy). Some class-locked (Grit +1 at fight start; first Inscribe each fight is free).

**Gold.** Shop. No leftover tax.

**Runestones.** Earned every rope, including floor 1. Not gold. Not spent in the dark. Spent at the Hold.

## The Hold (Camp) and the Ledger

### Runestones

Every sortie pays:

- show-up
- per node you actually walked
- extra elite / treasure / door (boss)
- first-time bonus the first time you meet an enemy or node type

A floor-4 rope must buy **at least one** Ledger node.

### Ledger

~12 Hold-wide nodes (Frame + Hearth) plus a short **Spark** branch per class (~6 each).

**Spark (per class)**  
Cards enter *that* class’s pool. A starter card replaces one Strike for that class.

**Frame (shared)**  
Capped: +HP, starting gold. Two or three nodes. Not an infinite stick.

**Hearth (shared)**  
Shop reroll. Rest upgrade. Extra remove. Extra event. **Unlock Runesmith.**

**Brand**  
Not bought with Runestones. Per class. See below.

### First hours

| Session | You | Typical end |
| ------- | -- | ----------- |
| Warrior run 1 | Thin pool, low HP, no reroll | Rope ~floor 4, buy a node |
| Warrior runs 2–4 | A bit of HP, a few Warrior cards | Floor 6–8 |
| Mid Ledger | Reroll, rest upgrade, Grit starter | Door is in reach |
| Warrior Brand 0 | First exit | Runesmith unlock if not bought already |
| Runesmith run 1 | Grown Frame/Hearth, baby Rune deck | Can die. Not a second Frame grind |
| Brand 1–5 on a class | Same dark, extra rules | Return loop |

### Brand (per class)

Finite. Named rules. Win N unlocks N+1 for *this* class. Brand 0 is a real win.

MVP proves **1–5**. Later we can grow the ladder. Beating the top Brand on a class is beating that guild’s mountain. Beating the top on both is beating the MVP.

Draft rungs (stack):

| Brand | Rule |
| ----- | ---- |
| 1 | Elites can appear one node earlier |
| 2 | Rest heals less |
| 3 | Enemies start with a small buff |
| 4 | One dead card in the starter deck |
| 5 | The door (boss) grows a second phase, or punches the verb you stacked (Grit or Runes) |

## Map and shop

One act. ~10 nodes. 2–3 branches. Fight, elite, shop, rest, event, treasure, **door** (boss).

Types visible. Exact enemies when you enter.

Shop: cards of *this* class, remove, sometimes a relic. Reroll once Hearth has it. One visit.

## Failure

HP 0: the rope. Recap. Hold. Spend. Again. No rewind.

Save on leaving a node, menu, or the Hold.

## MVP content budget

| Thing | Draft count | Notes |
| ----- | ----------- | ----- |
| World | Hold | Exit + rope. Thin. |
| Classes | 2 | Warrior, Runesmith. Hunter later. |
| Warrior starter | 8–10 | Dice Attack/Block + 1 Grit card |
| Warrior pool | ~18–22 | Several behind Spark. Grit payoffs, some Fury |
| Runesmith starter | 8–10 | Dice Attack/Block + 1 Inscribe |
| Runesmith pool | ~18–22 | Several behind Spark. Rune payoffs |
| Shared relics | ~6 | Rule rewrites |
| Class relics | ~4 each | Talk to Grit or Runes |
| Enemies | ~8 | Tight dice. Must be able to rope a newbie |
| Elite | 1 | Punishes a mushy deck |
| Door (boss) | 1 | Tuned for mid-Ledger. Phase or verb-punch at Brand 5 |
| Events | 2 | One locked behind Hearth |
| Ledger | ~12 shared + ~6 Spark/class | Frame capped |
| Brands | 0 + 1–5 per class | Finite |

Win: beat the door at the Brand you chose. Lose: rope, keep Runestones.

A safest-path generalist with an empty Ledger should not see the door. A committed Grit (or Rune) deck on a grown Ledger should feel different by node 6.

## Architecture test (why two classes)

The MVP is not “two games.” It is proof that:

- a class is a **verb + pool + Spark + Brand track**
- the Hold is **one** Frame/Hearth
- adding Hunter later is a new verb and a new Spark, not a new RPG

If Runesmith requires a copy-paste of the Warrior loop with numbers filed off, the architecture failed.

## Non-goals (MVP)

- Story dump, voiced characters
- Hunter/engineer
- Party, hex, movement combat, autobattle
- Slots, tags, TFT shop
- Endless mode, dailies, PvP
- Infinite +damage
- Ironclad Strength as the Warrior’s whole identity
- Shared card pools
- Their names, card text, art, UI chrome
- Final art pipeline (spike after this spec holds)

## Market and IP (not legal advice)

The genre is full. Trademark is their *name*. Copyright is their art and card text. Rules are not a mark. Do not look like their screen. Original Hold look. This is not a lawyer.

## Platform

Phone first. Desktop should work. Big targets. Inspect ≠ play. Engine and art not in this spec.

## Still open (tune, not blockers)

- How swingy is too swingy (dice vs Grit).
- Exact Runestone grants and Ledger prices.
- Look-and-feel so this is not a Spire with beards.
- Art pipeline.
- Hunter as class 3 after MVP holds.

## What “done” means

If this file holds, next is a **content list**: Warrior starter with dice, ~12 named Grit cards, Runesmith starter, eight enemy intents, the door, the Ledger nodes and prices. Still not code.

If Grit or two-class Camp is wrong, edit this file first.
