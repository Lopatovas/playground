# Kindling — draft spec

Working title. Setting and art come later. This is the mechanical core only.

Challenge anything. Numbers are draft targets, not balance.

**Status:** Slay the Spire fight, roguelite character. Shop/slots/tags are extras. The meta is the thing we are changing on purpose. Still a draft, not code.

## What this is

A one-hero card roguelike in the Slay the Spire family, with an RPG spine between runs.

The fight is still StS: hand, energy, Block, intents. A 10-second clip is a StS clip. Call that a clone.

The thing we will not clone is StS’s meta. StS lets a player who knows the game boot a fresh file and win. Kindling is tuned so a new climber usually dies around floor 4, comes home with currency, and the *character* is visibly further on than last time. Same person. Die, spend, go again. Hades / Rogue Legacy shape, not “unlock a card you might see in twenty runs.”

Final output of the experiment is a playable POC. This doc is the first artifact.

## Locked

- One playable character. Not a guild, not a TFT board of champions.
- Combat is an **untimed card puzzle**. No APM. No real-time dodging. A turn waits forever. Inspect a card without playing it. Undo nothing mid-resolution — play is immediate — but there is no clock.
- Combat is honest. Enemy intents are visible before you act.
- You play the fight. Not watch-and-hope autobattle.
- Branching path, Slay the Spire style.
- Die, then go again. No endless mode in the first slice.
- Pause and resume mid-run. Phone-first, desktop too.
- First slice is one short climb, end to end, easy to expand. A naked character is **not** expected to finish it.
- Between runs, this same character grows at a **Camp**. Every run pays, including a floor-4 death. Growth is a mix of tools, access, and a little body. Not an infinite +damage stick.

**Combat decision (this draft):** hand, energy, draw pile, discard, Block, intents. No board. No stepping. No push-the-enemy-off-the-tile.

Rejected: Hades / Brotato / Vampire Survivors (APM). Peglin (physics). Guildrun spectate-combat. The 7-tile rewrite-the-hit fight (movement management). Dice as the main toy. Wildfrost’s unit board.

## One-sentence pitch

You are one climber. Each fight you spend a small hand of cards against visible enemy intents. Each death you come home weaker than the mountain and richer than last time, and you spend that on this person until the climb is possible.

## The loop

```
pick a path node
  → fight, event, shop, rest, or elite
  → if fight: draw, spend energy, answer intents, end turn
  → reward: card and/or gold and/or slot item
  → sometimes a shop (reroll, lock, combine)
  → tags may cross a breakpoint and change the rules
  → next node, harder
  → boss, win or die
  → return to Camp with Kindling
  → spend on this character’s Ledger
  → start another run, same person, slightly more built
```

A good run ends with a specialist. A bad run dies as a generalist who never committed.

## Why a clone, and what the extras are for

Cards won because sequencing a hand is the fun we want: this Attack now, this setup now, this Block because they are swinging 14. The line fight was more original and less fun. So we took the clone.

We do not steal names, card text, or art. That is the only authenticity claim that holds.

Shop, slots, and tags are still *run seasoning*. The meta is not. If the Camp does not make a floor-4 death feel like the character grew, it has failed.

## Combat

One hero. One or more enemies. No positions.

At the start of your turn: energy is set to the base (draft: 3), you draw up (draft: 5), start-of-turn effects fire.

You play cards. They happen now. Energy cards cost energy. Then you end the turn. Unplayed cards discard. Enemies act exactly as their intents showed.

**Intents** are public: attack for N, block, buff, wait. Prefer exact numbers. No hidden “what will they do.”

**Block** absorbs incoming attack damage this turn, then falls off. The turn is still “answer the hit or spend HP to set up.” That is the card game. We are not ashamed of it.

**Powers** stay in play for the rest of the fight. They are how a deck becomes a machine.

Slots trigger on their printed conditions (start of turn, when you gain Block, when you play an Attack, when you Stoke). You do not play items from hand.

Inspect never plays. Fat finger on a phone must not spend the card.

## What you collect

### Cards (primary)

Starter deck: 8–10 cards. Weak, complete. Mostly cheap Attacks and Blocks, plus one identity card.

After most fights: pick 1 of 3 cards, or skip. Shops sell cards. Rest or shop can remove.

Cards have a cost, a type (Attack / Skill / Power), and zero or more **tags**. Some Skills are Stokes: they put an ember on you.

### Slot items

Three slots. Buy or find. Auto-trigger. Carry tags. Rearrange after you see the next fight’s enemies, not mid-fight.

### Relics

Run-long rule rewrites. Not slotted. Extra energy, keep leftover Block, first card each fight is free — change a rule, not just a number.

### Gold

Spend in shops. No leftover-gold punishment.

## Tags

Burn, Guard, Flow.

Count for a fight =

- embers you Stoked this fight (play a Stoke, or an item that Stokes)
- plus one per slotted item that has that tag

Deck contents do **not** count. You have to light it or buy it.

HUD always shows `Burn 1/2` and the next threshold. Embers reset when the fight ends. Slot pieces stay.

| Tag   | 2 pieces                         | 4 pieces                           |
| ----- | -------------------------------- | ---------------------------------- |
| Burn  | Your Attacks apply 1 Burn        | Burn ticks twice                   |
| Guard | +2 Block whenever you gain Block | When you gain Block, deal 2        |
| Flow  | Draw 1 when you play 3 cards     | The third card each turn costs 0   |

A live tag should change the next hand, not just add a number.

## Player flow (one run, phone in hand)

### You open the game

The **Camp**. One climber by a fire. You see their Ledger (the skill tree), current HP max, how many slots they have unlocked, Kindling in the purse.

First boot: the Ledger is almost empty. One slot. Thin starter deck. You are not ready for the boss. Begin the climb anyway.

### You look at the map

About ten nodes. Types visible. Exact enemies and shop stock hidden. Pick a fight. Close the app whenever. The run stays.

### You enter a fight

Two enemies. One intends 9. One intends to buff. You have 3 energy and 5 cards. You may stare.

You Block 8 and Strike the buffer, or you Stoke Burn and take the 9 because you want the engine. Cards resolve when played. You end the turn. They do what they showed.

A few turns later the fight is over. Not a fifteen-minute exam.

### You take a reward

1 of 3 cards, gold, or a slot component — or skip. Socket Burn. HUD says Burn 1/2. Nothing ignited yet.

### You choose a path

Safe fight left. Elite then shop right. Still generic. That choice is the map’s job.

### You hit the shop

Cards, slot parts, maybe a relic, a remove, a reroll, a lock.

You lock a Guard component, reroll, buy a second Burn piece, socket it. Next fight you only need one Stoke to hit Burn 2. You bought that. You did not draw it.

Leave leftover gold. No punishment.

### The run changes shape

Deck gets weirder. Slots fill. You path toward the elite for a rule-relic, or toward rest because you took too many “stoke and eat it” turns.

See the next enemies. Swap slots. Draw the opening hand.

### Elite, rest, boss

Elite: a hand-puzzle that punishes a mushy deck. Relic that rewrites a rule.

Rest: heal or upgrade one card.

Boss: honest intents plus a twist (second phase, they punish Powers, they invert a tag). Commit or die.

### You go again

HP 0 ends the run. Recap: floors cleared, Kindling earned. Back to Camp. The Ledger has something you can afford — a bit of HP, a second slot, three cards added to the pool, shop reroll. You buy it. The climber looks different. You go again.

A new player is supposed to die around floor 4 the first time and still do this loop. A player who already “knows StS” should still be underbuilt for the boss until the Ledger has a few nodes. The mountain is tuned for a grown character, not a theorycrafter on a blank file.

## The map

One act. ~10 nodes. 2–3 branches most rows. Fight, elite, shop, rest, event, treasure, boss.

See types ahead. See exact enemies when you enter a fight, and may still swap slots before the first turn.

## The shop

The other half of the game.

Stock: cards, slot items / components, sometimes a relic, a remove, reroll, lock (holds one offer across rerolls; shops are one visit).

**Combine:** two matching components become a stronger item in that family.

## Failure and retry

HP is the run. Hit 0, over. No rewind. You keep Kindling from the attempt. That is the point.

Save on leaving a node, opening a menu, or sitting at Camp.

## Between runs — Camp and Ledger

This is the RPG. StS’s unlock-a-card-into-the-pool is too thin. We want: die at four, sit down, the person is further on.

### Kindling (currency)

Every run pays, including a wipe on node 1.

Draft grant:

- a small show-up amount
- more per node cleared
- extra for elite / treasure / boss
- a first-time bonus the first time you meet an enemy type or node type

A floor-4 death must buy **at least one** Ledger node. If it does not, the numbers are wrong.

### The Ledger

A small tree on this one character. First slice: about **12 nodes**, four columns. You buy from the left. Some nodes require a neighbor.

**Spark (tools)**  
Cards enter the *run pool*. A starter card replaces one Strike. A Stoke is added to the opening kit.

**Frame (body)**  
Small, capped: +HP, starting gold. Two or three nodes total in the first slice. Enough that floor 4 stops being a coin flip. Not enough that floor 1 is a joke forever.

**Hearth (access)**  
This is most of the feel. You do **not** start with the full game.

- Slot 2, then slot 3
- Shop reroll, then combine
- The rest site’s upgrade action
- One extra event type

**Brand (mastery)**  
After the first win: an optional harder modifier. Not before.

### How the first hours are supposed to feel

| Session        | Character                         | Typical end        |
| -------------- | --------------------------------- | ------------------ |
| Run 1          | 1 slot, no reroll, thin pool, low HP | Die ~floor 4    |
| Runs 2–4       | Second slot, a bit of HP, a few pool cards | Floor 6–8    |
| Mid Ledger     | 3 slots, shop toys, starter swap  | Boss is in reach   |
| First win      | Brand column opens                | Die-go-again with a twist |

The climb does not get longer. The climber gets closer to being allowed to finish it.

### What we still will not do

No infinite +1 damage every run. No “I have 400 HP and the act is a corridor.” After the first-slice Ledger is bought, further growth is new tools and optional hardness, not a bigger stick.

## First-slice content budget

| Thing              | Draft count | Notes                                      |
| ------------------ | ----------- | ------------------------------------------ |
| Playable character | 1           | One identity, 2–3 viable directions        |
| Starter cards      | 8–10        | Weak, complete. Tuned for a *naked* climber |
| Card pool          | ~18–24      | Several locked behind Spark                |
| Slot items         | ~8          | 3 families. Slots 2–3 locked behind Hearth |
| Relics             | ~8          | At least 2 change a rule, not a stat       |
| Enemies            | ~8          | Early floors must be able to kill a newbie |
| Elites             | 1           | Tests whether you specialized              |
| Boss               | 1           | Tuned for a mid-Ledger character           |
| Events             | 2           | One may be locked                          |
| Tags               | 3           | Burn, Guard, Flow                          |
| Ledger nodes       | ~12         | Spark / Frame / Hearth / Brand             |

Win: beat the boss. Lose: HP 0, keep Kindling. Another run after a Camp spend.

A safest-path generalist with an empty Ledger should not see the boss. A committed tag on a grown Ledger should feel different by node 6.

## Non-goals (first slice)

- Story, named lore, voiced characters
- Multiple characters
- Party / hex grid / summoned team as the main toy
- Movement combat, a line of tiles, push-to-dodge
- Queue-and-watch combat
- Endless mode, daily run, leaderboards
- PvP, accounts, live ops
- Infinite meta stat sticks (a capped Frame column is allowed)
- Copying names, card text, art, UI chrome, or audio from other games
- Calling it Slay the Spire, a Spire, or using Mega Crit character names
- Final art pipeline (spike that before production)

## Market and IP (not legal advice)

The genre is already full. Dream Quest came first. After StS: Monster Train (and 2), Wildfrost, Vault of the Void, Roguebook, Across the Obelisk, Griftlands, Cobalt Core, StarVaders, Dawncaster, Night of the Full Moon, plus a long tail of Steam “roguelike deckbuilders.” Mega Crit is shipping Slay the Spire 2. A playground StS-like is not a new category. It is another entry.

**Trademark** protects names, logos, and “is this from Mega Crit?” It does not protect “3 energy, 5 cards, Block, intents.” Kindling (or any original title) is not their mark. Using *Slay the Spire*, *the Spire*, *Ironclad*, *Silent*, *Defect*, *Watcher*, *Neow*, or their logo as our name or marketing is how you get a trademark problem.

**Copyright** protects their art, music, code, card wording, and character designs. It does not, in ordinary US practice, protect the rules of the game. Copying Bash / Neutralize / Fiend Fire text, their portraits, or their intent icons is how you get a copyright problem.

**The ugly middle** is look-and-feel. A game that is the same rules *and* the same screen (energy orbs, card frame, map dots, relic row) can still get in trouble as a knockoff even if the name is new. Tetris-style clone cases live here. Original cards, original look, original map language.

We already said: original name, original content, no stolen text or art. That is the bar. This is not a lawyer. If this ever leaves the playground, get one.

## Platform notes (not locked)

Phone first. Desktop should work.

Big tap targets. Inspect never plays. Save anytime. A fight is a few turns.

Engine and art pipeline are not in this spec.

## What “done” means for this draft

If this card lock holds, next is a thin content list: starter deck, a dozen cards, eight enemy intents, the boss twist. Not code. Not setting.

If cards-plus-shop is wrong after all, edit this file first.
