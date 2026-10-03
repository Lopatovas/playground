# Kindling — draft spec

Working title. Setting and art come later. This is the mechanical core only.

Challenge anything. Numbers are draft targets, not balance.

**Status:** thought-experiment lock. Combat is decided below so the run can be walked. Still a draft, not code.

## What this is

A one-hero puzzle roguelike on a short line. You rewrite incoming hits. You build the run like an autobattler: shop, three slots, public tags you stoke.

Not a deckbuilder. No energy, no draw pile, no hand of Strikes.

Final output of the experiment is a playable POC. This doc is the first artifact.

## Locked

- One playable character. Not a guild, not a TFT board of champions.
- Combat is an **untimed puzzle**. No APM. No real-time dodging. A turn waits forever. Inspect and undo until you commit.
- Combat is honest. Incoming danger is drawn on tiles before you commit.
- You make the fight decisions. Not watch-and-hope autobattle.
- Branching path, Slay the Spire style.
- Die, then go again. No endless mode in the first slice.
- Pause and resume mid-run. Phone-first, desktop too.
- First slice is one short run, end to end, easy to expand.
- Between runs, this same character gains new *options*, not raw +damage / +HP.

**Combat decision (this draft):** rewrite the hit on a 7-tile line. Skills on cooldown, not a shuffled deck. Tags are stoked on the hero during the fight. Slots and shop stay.

Rejected: Hades / Brotato / Vampire Survivors (APM). Peglin (physics). Guildrun spectate-combat. StS energy + Block + draw pile. Dice as the main toy (we already have enough). Wildfrost’s full unit board (fights the one-hero lock).

## One-sentence pitch

You are one climber on a short line. Enemies show which tiles they will strike. You step, push, and stoke until your kit ignites — or you are still standing on the painted tile when they swing.

## The loop

```
pick a path node
  → fight, event, shop, rest, or elite
  → if fight: see telegraphs → plan 2 actions → commit → they do exactly what they showed
  → reward: skill and/or gold and/or slot item
  → sometimes a shop (reroll, lock, combine)
  → tags on the hero + slots may cross a breakpoint and change the rules
  → next node, harder
  → boss, win or die
  → unlock something for this character, start another run
```

A good run ends with a specialist. A bad run dies as a generalist who never committed.

## Why this combat

The first draft was StS with a fatter shop. The screenshot was a hand, energy, and Block. That failed the clone test.

The verb we need is **get off the tile, or move the swing**, not **spend 3 energy to Block**. That is Into the Breach / Shogun / Cobalt, shrunk to one body so it fits a phone and the one-hero lock.

Stoke is how Kindling is not just a Shogun clone. The line is the puzzle. The tags are the build. The shop is the TFT minute.

| Game        | We steal                         | We do not steal            |
| ----------- | -------------------------------- | -------------------------- |
| StS         | Map, die-go-again, honest danger | Hand, energy, Block-as-game, relics-as-the-only-passives |
| Guildrun    | Shop, tags, combine, one-visit lock | Team, hex, spectate, rewind |
| Into the Breach | Telegraph on tiles, push, sit and think | 8×8, three mechs, grid HP |
| Shogun      | One hero on a line, cooldown kit | Attack queue of 3, facing tax |
| TFT/Brotato | Breakpoints, reroll, components  | A roster or live waves     |

## Combat

One hero. One to three enemies. A row of **7 tiles**. You occupy one. They occupy others. Empty tiles are just space.

### Telegraph

Before your turn, every enemy shows:

- whether they will **move** (and to where)
- which **tiles they will strike**, and for how much
- or a buff / wait

Intents are **relative to the enemy** (“cleave the two tiles in front of me”). If you push them or swap with them *before they act*, the swing moves with them. Kill them before they act and the swing is cancelled. Leave the painted tile and you are not hit.

No hidden roll on “what will they do.” Prefer exact numbers.

### Your turn

You have a **kit** of skills (start with 4, grow toward 7). Each skill is Ready or on Cooldown. No draw. No shuffle. No energy.

You get **2 actions**. A step to an adjacent tile costs 1. A Ready skill costs 1, unless printed otherwise. You may step twice, step then skill, skill then step, or two skills.

You may plan, inspect, and undo freely. Nothing is real until **Commit**. Then your actions resolve in the order you queued them, then enemies do exactly what they still have left to do.

A fight is a few of these turns, not a fifteen-minute exam.

### Skills (the kit, not a deck)

Skills are collected, upgraded, and removed like equipment. After a fight you pick 1 of 3, or skip. Shops sell them. Rest upgrades one.

Starter kit (draft, names are placeholders):

| Skill   | Does                                      | CD  |
| ------- | ----------------------------------------- | --- |
| Step    | Always available. Adjacent tile.          | —   |
| Strike  | Hit an adjacent enemy for 4.              | 0   |
| Push    | Move an adjacent enemy 1 tile along the line. | 1 |
| Ward    | Gain 3 Ward this turn only. Emergency, not the game. | 1 |
| Stoke   | Gain 1 ember of a tag you choose (Burn / Guard / Flow). | 1 |

Later skills add reach, swaps, extra stokes, or “strike every painted tile.” They are how a kit becomes a machine. They are not Powers that sit in a card zone.

Cooldown ticks down by 1 at the start of your turn.

### Ward

Ward absorbs incoming strike damage this turn, then falls off. It exists so eating a hit is a choice, not a mis-tap. If Ward is how you win fights, the design has slipped back toward StS. The main answer is the tile.

### Slots

Three slots on the hero. Items auto-trigger on a printed condition (start of turn, after you Strike, when you gain Ward, when you Stoke). You do not play items.

Items have tags. They are the TFT commitment you bought.

After you see the next fight’s enemy types, you may rearrange items. Not mid-fight.

### Relics

Run-long rule rewrites. Not slotted. Examples of *kind*: leftover Ward carries; the first Stoke each fight is free; Push also deals 1. At least some relics change a rule, not a number.

### Resolution order (draft)

1. Your committed actions, in order. If an action kills an enemy, their remaining intent dies with them.
2. Slot triggers that say “after you act.”
3. Enemies that still have intents, in a shown order (left to right is fine).
4. Burn and other end-of-turn ticks.
5. New telegraphs for the next turn.

## Tags

Tags live **on the hero this fight**, plus whatever is in the slots.

- **Embers:** you Stoke them during the fight. They reset when the fight ends.
- **Slot pieces:** count for the whole fight because you socketed them. This is the shop commitment.

The HUD always shows `Burn 1/2`, `Guard 0/2`, `Flow 2/4` — count and next threshold.

| Tag   | 2 pieces                         | 4 pieces                            |
| ----- | -------------------------------- | ----------------------------------- |
| Burn  | Your Strikes apply 1 Burn        | Burn ticks twice                    |
| Guard | +2 Ward whenever you gain Ward   | When you gain Ward, deal 2 adjacent |
| Flow  | After 2 actions, gain a free Step | Your second skill each turn costs 0 |

Burn: a stack on an enemy. Ticks at step 4 above.

A live tag should change how you solve the next telegraph. If it only adds a number, it is a bad tag.

## Player flow (one run, phone in hand)

### You open the game

One climber. HP, three slots, a kit of four skills, tags at 0/0/0. Begin the climb.

If you already died once, one new toy is in the pool. You did not get +HP.

### You look at the map

About ten nodes. Types visible: fight, elite, shop, rest, event, treasure, boss. Exact enemies and shop stock hidden.

You pick the first fight. Close the app whenever. The run stays.

### You enter a fight

A brute stands two tiles away. The two tiles in front of it are painted for 8. You are on one of them.

You stare. You can:

- step back, then Strike (you live, they live, next telegraph will be worse or better)
- step in and Strike if that kills them before they swing
- Push them so the cleave hits the empty tile, or their ally
- Stoke Burn and eat 8 (or 5, if you Ward) to start an engine

You commit. The paint was the truth.

A few puzzles later the fight is over.

### You take a reward

1 of 3 skills, gold, or a slot component — or skip. You are thinking about a tag.

Socket a Burn piece. HUD says Burn 1/2.

### You choose a path

Safe fight left. Elite then shop right. Still generic. That choice is the map’s job.

### You hit the shop

Actions, slot parts, maybe a relic, a remove, a reroll, a lock.

You lock a Guard component, reroll, buy a second Burn piece, socket it. Burn 2. Strikes now apply 1 Burn. You bought that. You did not draw it.

Leave leftover gold. No punishment.

### The run changes shape

Slots fill. One tag is live. You path toward the elite for a rule-relic, or toward rest because you ate too many painted tiles to stoke.

See the next enemies. Swap slots. Start the puzzle.

### Elite, rest, boss

Elite: a puzzle that punishes a generalist. Relic that rewrites a rule.

Rest: heal or upgrade one skill.

Boss: honest telegraphs plus a twist (second phase, a tile they own, they invert a tag). Commit or die.

### You go again

HP 0 ends the run. Recap: tags, kit, where you died. Then one unlock if you earned it. Under a minute later, same person, new option. Not endless floors. Die, go again.

## The map

One act. Draft shape:

- ~10 nodes from start to boss
- 2–3 branches most rows
- Node types: fight, elite, shop, rest, event, treasure, boss
- First slice: several normal fights, 1 elite, 1 shop, 1 rest, 1–2 events, 1 treasure, 1 boss

You see node types ahead. You see exact enemies when you enter a fight node, and may still swap slots before the first turn.

## The shop

The other half of the game.

Stock: skills, slot items / components, sometimes a relic, a remove, reroll, lock (holds one offer across rerolls; shops are one visit).

**Combine:** two matching components become a stronger item in that family.

## Failure and retry

HP is the run. Hit 0, over. No rewind.

Save on leaving a node or opening a menu. Phone lock, background, desktop close: the run is still there.

## Between runs

Same character. Unlock *options*: a starter skill that replaces Strike, a fourth tag in the shop pool, a new item family, a new event, an optional harder modifier after a win.

Do not unlock +5 HP or +1 damage.

First slice: one starting kit, 2–3 unlocks.

## First-slice content budget

| Thing              | Draft count | Notes                                      |
| ------------------ | ----------- | ------------------------------------------ |
| Playable character | 1           | One identity, 2–3 viable directions        |
| Starter skills     | 4           | Strike, Push, Ward, Stoke                  |
| Skill pool         | ~16–20      | Reach, swap, extra stoke, tag payoffs      |
| Slot items         | ~8          | 3 families, common + combined              |
| Relics             | ~8          | At least 2 change a rule, not a stat       |
| Enemies            | ~8          | Cleave, poke, bumper, buffer, painter      |
| Elites             | 1           | Tests whether you specialized              |
| Boss               | 1           | Two-phase or a rule twist                  |
| Events             | 2           | Real choices                               |
| Tags               | 3           | Burn, Guard, Flow                          |

Win: beat the boss. Lose: HP 0. Either way, another run in under a minute.

A safest-path generalist should usually lose the boss. A committed tag should feel different by node 6.

## Non-goals (first slice)

- Story, named lore, voiced characters
- Multiple characters
- Party / hex grid / summoned team as the main toy
- A shuffled deck, energy, or Block-as-the-game
- Queue-and-watch combat
- Endless mode, daily run, leaderboards
- PvP, accounts, live ops
- Meta stat sticks
- Copying names, text, or art from other games
- Final art pipeline (spike that before production)

## Platform notes (not locked)

Phone first. Desktop should work.

Big tap targets. Inspect never commits. Save anytime. A fight is a few turns.

Engine and art pipeline are not in this spec.

## What “done” means for this draft

If this combat lock holds, next is a thin content list: the starter kit’s exact numbers, eight enemies’ telegraphs, the boss twist. Not code. Not setting.

If the line-and-stoke fight is wrong, edit this file first.
