# Kindling — draft spec

Working title. Setting and art come later. This is the mechanical core only.

Challenge anything. Numbers are draft targets, not balance.

**Status:** challenged. The inner loop as written is a Slay the Spire clone. See “Blocking problem” below. Do not treat the combat section as agreed.

## What this is

A one-hero card roguelike. You play the fights. You build the run like an autobattler: shop, tags, a small loadout.

Final output of the experiment is a playable POC. This doc is the first artifact.

## Locked from the scoping talk

- One playable character. Not a guild, not a TFT board of champions.
- Combat is an **untimed puzzle**. No APM. No real-time dodging, blocking, or aiming. A turn waits forever. The player may think, inspect, and undo tentative picks until they commit.
- Combat is honest. Incoming danger is visible before you commit.
- You make the fight decisions. Not watch-and-hope autobattle.
- Branching path, Slay the Spire style. Path choice is part of the game.
- Die, then go again. No endless mode in the first slice.
- Pause and resume mid-run. Phone-first, desktop too.
- First slice is one short run, end to end, easy to expand.
- Between runs, this same character gains new *options*, not raw +damage / +HP.

Rejected by the puzzle lock: Hades, Brotato, Vampire Survivors, and any combat whose skill is handspeed. Peglin’s physics toy is also out — the bounce is not a sit-and-think puzzle. Guildrun-style “place then spectate” is out as the *fight* verb; the shop may still be a puzzle.

## One-sentence pitch

You are one climber. Each fight you spend a small hand of cards against visible enemy intents. Between fights you shop, socket gear, and stack tags until the starter kit no longer plays like the starter kit.

## The loop

```
pick a path node
  → fight, event, shop, rest, or elite
  → if fight: play cards against visible intents until one side is dead
  → reward: card and/or gold and/or slot item
  → sometimes a shop (reroll, lock, combine)
  → tags on cards + slots may cross a breakpoint and change the rules
  → next node, harder
  → boss, win or die
  → unlock something for this character, start another run
```

A good run ends with a specialist. A bad run dies as a generalist who never committed.

## Blocking problem: this is a Slay the Spire clone

A screenshot of the current combat section is a StS screenshot: hand, energy, Block that falls off, enemy intent icons, Strike/Guard starter, Powers, relics, branching map, card-pick rewards.

Shop rerolls, 3 item slots, and tag breakpoints are **between-fight seasoning**. They do not change the thing you do every thirty seconds. StS already has passive relics, keyword synergies (poison, frost, orbs), and a shop. A player who knows StS is at home in this draft immediately. That is good for teaching and bad for “this is our game.”

The test we failed: **would a 10-second clip of a fight look like a different genre?** No.

Do not write content or code on top of this draft until we pick one sharp change to the inner loop, or we explicitly accept “StS-like with a fatter shop” as the product.

Wanting a puzzle does **not** escape StS. StS is already an untimed puzzle. The clone problem is the *verb* (spend energy, gain Block, answer this intent), not the pace.

Candidate **puzzle verbs** that still clear the screenshot test:

1. **Rewrite the hit.** Enemies telegraph tile and damage. Your turn is a puzzle: step away, push them, make them hit each other, or eat it on purpose (Into the Breach, Shogun Showdown, Cobalt Core). Strongest “sit and think” family. One-hero works on a line.
2. **Change the clocks.** Visible countdowns. Your turn is “who fires next, and can I stall or speed someone?” (Wildfrost). Still a board of units unless we shrink it to one hero plus slots.
3. **Spend the roll.** Dice into equipment. The puzzle is this roll, not a draw pile (Dicey Dungeons).
4. **Stoke.** Build tags on the hero during the fight. The puzzle is “can I light the engine this turn without dying?” Cards or skills are fuel. Slots are the payoff.

Shop/tags/slots can stay in any of these. They cannot be the only difference.

Out as combat: real-time action, physics toys, and spectating an autobattle.

## Combat

One hero. One or more enemies. Turn based.

At the start of your turn you get energy (draft: 3) and a hand (draft: 5). You play cards. They happen now. Then you end the turn. Enemies act.

Every enemy shows an **intent** before you play: attack for N, block, buff, or wait. No hidden rolls on “what will they do.” If an attack has a range, show the range. Prefer exact numbers.

**Block** absorbs incoming attack damage this turn, then falls off. You choose whether this turn is “answer the hit” or “spend HP to set up.”

That is the whole inner toy in this draft. It is also the StS verb. Treat this section as **not agreed**.

Whatever verb we pick: no turn clock, no input skill, inspect-anything-before-commit. If we keep cards, lifting one to read it must never play it.

## What you collect

### Cards (primary)

You start with a small, weak deck (draft: 8–10 cards, mostly Strike / Guard / one identity card).

After most fights you pick 1 of 3 cards, or skip. Shops sell cards. You can remove cards at rest or in shop.

Cards have a cost, a type (Attack / Skill / Power), and zero or more **tags**.

Powers stay in play for the rest of the fight. They are how a build becomes a machine.

### Slot items (the autobattler piece)

The hero has **3 slots**.

Slots hold items you buy or find. Items auto-trigger on a printed condition (start of turn, when you gain Block, when you play an Attack, and so on). You do not play items from hand.

Items also have tags. They are how you force a trait without drawing the right card.

You may rearrange items *after* you see the next fight’s enemy types, before the fight starts. You may not change them mid-fight.

### Relics (run-long rules)

Relics are not slotted. They sit in a list and rewrite a rule for the rest of the run (extra energy, keep leftover Block, first card each fight is free, and so on).

Draft: you start with 0–1, find more at elites / boss / rare events. No cap in the first slice.

### Gold

Spend in shops. Interest or leftover-gold tricks can wait.

## Tags

Tags are the TFT juice on one body.

A tag is a keyword on a card or item: draft set for the first slice is **Burn**, **Guard**, **Flow**.

Breakpoints are public:

| Tag   | 2 pieces                         | 4 pieces                              |
| ----- | -------------------------------- | ------------------------------------- |
| Burn  | Your Attacks apply 1 Burn        | Burn ticks twice                      |
| Guard | +2 Block whenever you gain Block | When you gain Block, deal 2           |
| Flow  | Draw 1 when you play 3 cards     | The third card each turn costs 0      |

“Piece” = a card *in the deck* or an item *in a slot*. Unplayed cards still count. That keeps the shop/deck-building decision honest: you committed, the trait is on.

Exact breakpoint math is here to be challenged. The rule we keep: **the player can see the count and the next threshold at all times.**

## The map

One act. Draft shape:

- ~10 nodes from start to boss
- 2–3 branches most rows
- Node types: fight, elite, shop, rest, event, treasure, boss
- First slice contents: several normal fights, 1 elite, 1 shop, 1 rest, 1–2 events, 1 treasure, 1 boss

You see the node types ahead. You do not see the exact enemy or the exact shop stock until you enter (except: once you enter a fight node, you see the enemies and may still swap slot items before the first turn).

Pathing is a resource. Taking the elite means a relic and a harder fight. Taking rest means an upgrade or heal instead of a card.

## The shop

This is not a thin merchant. It is the other half of the game.

On a shop node you have gold and a stock of:

- cards
- slot items / components
- one relic, sometimes
- a remove
- a reroll button
- a lock on a single offer (it stays if you leave and… no: first slice shops are one visit; lock just holds an offer across rerolls)

**Combine:** two matching component items become a stronger item in the same slot family. Brotato/TFT shape, tiny catalog.

You can leave unspent gold. No punishment.

## Failure and retry

HP is the run. Hit 0, the run is over. No rewind, no extra life.

You get a short recap (what you stacked, where you died). Then the between-run screen. Then a new run.

Save exists whenever you leave a node or open a menu. Phone lock, app background, desktop close: the run is still there.

## Between runs

One character. The climb is the same person getting new tools.

After any run (win or loss) you may unlock **one** thing from a small list, if you met its condition. Examples of the *kind* of unlock, not the list:

- a new starter card that replaces one Strike
- a fourth tag that can appear in shops
- a new slot item family
- a new event
- a harder optional modifier (Ascension-like), unlocked by a win

Do not unlock “+5 HP” or “+1 damage.” Those flatten the run.

First slice can ship with a single starting kit and 2–3 unlocks so the die-go-again loop has a carrot. The full unlock tree waits.

## First-slice content budget

Enough to prove the loop, small enough to build.

| Thing              | Draft count | Notes                                      |
| ------------------ | ----------- | ------------------------------------------ |
| Playable character | 1           | One identity, 2–3 viable directions        |
| Starter cards      | 8–10        | Weak, complete                           |
| Card pool          | ~18–24      | Include tag payoffs and a few Powers       |
| Slot items         | ~8          | 3 families, common + combined              |
| Relics             | ~8          | At least 2 that change a rule, not a stat  |
| Enemies            | ~8          | Mix of “hit hard,” “buff,” “summon/status” |
| Elites             | 1           | Tests whether you specialized              |
| Boss               | 1           | Two-phase or a rule twist                  |
| Events             | 2           | Real choices, not flavor text              |
| Tags               | 3           | Burn, Guard, Flow                          |

Win condition: beat the boss. Lose condition: HP hits 0. Either way, you can start again in under a minute.

A run that does nothing but pick the safest path and add random cards should usually lose to the boss. A run that commits to a tag should feel obviously different by node 6.

## Non-goals (first slice)

- Story, named lore, voiced characters
- Multiple characters or classes
- Party / hex grid / summoned team as the main toy
- Queue-and-watch combat
- Endless mode, daily run, leaderboards
- PvP, accounts, live ops
- Meta stat sticks
- Copying names, card text, or art from other games
- Final art pipeline (spike that before production, not in this spec)

## Platform notes (not locked)

Phone is the main way this will be played. Desktop should work.

That implies: big tap targets, inspect-without-playing for cards, save anytime, a fight that is a few turns not a fifteen-minute puzzle.

Engine and asset pipeline are **not** in this spec. Best tool for the job after the core is stable. Art generation is a later spike.

## What “done” means for this draft

If we agree on this file, the next document is a thin content list (the actual starter deck, the 3 tags’ card names, the boss rule). Not code. Not setting.

If we do not agree, edit this file first.
