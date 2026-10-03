# Kindling — draft spec

Working title. Mechanics are far enough that theme is blocking imagination. Setting is now in play; not locked.

Challenge anything. Numbers are draft targets, not balance.

**Status:** Slay the Spire fight with dice on damage and Block. Roguelite career. Slots/tags/TFT shop are cut. Class-vs-grind is an open issue. Theme is next. Still a draft, not code.

## What this is

A one-hero card roguelike in the Slay the Spire family, with an RPG spine between runs.

The fight is still StS-shaped: hand, energy, Block, intents. The number on the card is not. Damage and Block **roll**. A clip still looks like a card game. Call the structure a clone. The swing is ours.

The thing we will not clone is StS’s meta. StS lets a player who knows the game boot a fresh file and win. Kindling is tuned so a new climber usually dies around floor 4, comes home with currency, and the *character* is visibly further on than last time. Same person. Die, spend, go again. Hades / Rogue Legacy shape, not “unlock a card you might see in twenty runs.”

We tried to bolt TFT onto one body (3 slots, tag breakpoints). That is not TFT. TFT is mix-and-match units. Three holes plus a Flow trait that feeds draw and energy is extra rules everyone slams. Cut.

Final output of the experiment is a playable POC. This doc is the first artifact.

## Locked

- One playable character. Not a guild, not a TFT board of champions.
- Combat is an **untimed card puzzle**. No APM. No real-time dodging. A turn waits forever. Inspect a card without playing it. Undo nothing mid-resolution — play is immediate — but there is no clock.
- Combat is honest. Enemy intents are visible before you act. Dice are printed on the card **and** on the intent (`2d4+1`, range shown). You see the band before anyone rolls. You do not see the result until it resolves.
- You play the fight. Not watch-and-hope autobattle.
- Branching path, Slay the Spire style.
- Die, then go again. No endless mode in the first slice.
- Pause and resume mid-run. Phone-first, desktop too.
- First slice is one short climb, end to end, easy to expand. A naked character is **not** expected to finish it.
- Between runs, this same character grows at a **Camp**. Every run pays, including a floor-4 death. Growth is a mix of tools, access, and a little body. Not an infinite +damage stick.
- The game is **beatable**. First win is Brand 0. After that, a finite **Brand** ladder (StS Ascension shape) is why you come back. Each Brand is a named rule, not +10% HP. Beating the top Brand is beating Kindling. No endless number climb.
- No slots. No tags. No stoke-for-set-bonus. Run build is cards + relics + gold, like StS.

**Combat decision (this draft):** hand, energy, draw pile, discard, Block, intents. Damage and Block are dice on **both** sides, not flat numbers. No board. No stepping.

Rejected: Hades / Brotato / Vampire Survivors (APM). Peglin (physics). Guildrun spectate-combat. The 7-tile rewrite-the-hit fight (movement management). Dicey Dungeons (dice as the *whole* toy — allocate rolls to equipment). Wildfrost’s unit board. Three slots and TFT tags on one hero. StS’s fully flat damage/Block.

## One-sentence pitch

You are one climber. Each fight you spend a small hand of cards against visible enemy intents. Each death you come home weaker than the mountain and richer than last time, and you spend that on this person until the climb is possible.

## The loop

```
pick a path node
  → fight, event, shop, rest, or elite
  → if fight: draw, spend energy, answer intents, end turn
  → reward: card and/or gold
  → sometimes a shop (cards, remove, relic, later reroll)
  → next node, harder
  → boss, win or die
  → return to Camp with Kindling
  → spend on this character’s Ledger (until it is done)
  → after the first win: pick a Brand
  → start another run, same person
```

A good run ends with a specialist. A bad run dies as a generalist who never committed.

## Two progressions

**Run progression** — this climb only. Cards in the deck, gold, relics, HP. When the run ends, this is gone (except Kindling earned). Next run the deck is the starter again.

**Character progression** — this person, forever. The Ledger, shop tools, cards that can *appear* in future runs, max HP from Frame, which Brands you may pick. Death does not take this.

You lose the build. You keep the climber.

## Why a clone, and what the extras are for

Cards won because sequencing a hand is the fun we want. The line fight was more original and less fun. TFT-on-one-body was a costume. So: StS fight, with dice on the numbers, RPG career.

We do not steal names, card text, or art. That is the only authenticity claim that holds.

If the Camp does not make a floor-4 death feel like the character grew, it has failed.

## Combat

One hero. One or more enemies. No positions.

At the start of your turn: energy is set to the base (draft: 3), you draw up (draft: 5), start-of-turn effects fire.

You play cards. They happen now. Energy cards cost energy. Then you end the turn. Unplayed cards discard. Enemies do what they telegraphed, and **their** damage and Block roll too.

**Intents** are public: attack, block, buff, wait. Attack and Block intents show a dice expression and a range (`2d4+1`, 3–9), not a single N. Buff and wait stay exact (“gain 1 Strength”). No hidden “what will they do.” The unknown is this roll, not the action.

**Block** absorbs incoming attack damage this turn, then falls off. The turn is “cover their *band*, or gamble the low end, or spend HP to set up.” Both sides can roll under.

**Powers** stay in play for the rest of the fight. They are how a deck becomes a machine.

Inspect never plays. Fat finger on a phone must not spend the card.

### Dice

StS is a calculator: they hit 9, Guard gives 8, you take 1. Kindling is a calculator with a roll.

- Attack and Block print a **dice expression**, not a flat number — on your cards and on their intents. Draft faces: `1d4`, `1d6`, `2d4`, plus a small flat (`1d6+2`).
- The card or intent also shows the range (`3–8`). You may stare at that forever.
- When it resolves, the dice roll. That is the number. No hidden modifier after the roll.
- Flat bonuses (a Power that says +2 to Attacks, their Strength) add **after** the roll.
- Energy, draw, “gain a Power,” and “gain Strength” do not roll unless the text says so.
- Bands stay tight. No `1d20` on a starter Strike or a floor-1 jab. Wide dice are a rare-card or boss identity, not the default.

Some of your cards may still be flat (`Block 6`) so “safe” vs “swingy” is a deck choice. Early enemies stay on small dice. Bosses may use more dice or a wider band.

**Example.** They intend `2d6` (2–12). You play `Guard — 2d4+2` (4–10). You are not covering the top. You can spend a second Block to push your band over theirs, or take the bet that they roll mid. Both roll. Maybe you live for free. Maybe you eat 8. That is the new decision: buy out of the overlap, or gamble it.

Relics can later reroll (yours or theirs), bump a face, or set a minimum. First slice can live without those.

## What you collect (this run)

### Cards

Starter deck: 8–10 cards. Weak, complete. Mostly cheap Attacks and Blocks, plus one identity card.

After most fights: pick 1 of 3 cards, or skip. Shops sell cards. Rest or shop can remove.

Cards have a cost, a type (Attack / Skill / Power), and a printed number or dice expression. Synergy lives in the cards — poison-like, block-like, draw-like as *deck* directions, plus safe-flat vs swingy-dice.

### Relics

Run-long rule rewrites. Extra energy, keep leftover Block, first card each fight is free — change a rule, not just a number.

### Gold

Spend in shops. No leftover-gold punishment.

## Player flow (one run, phone in hand)

### You open the game

The **Camp**. One climber by a fire. Ledger, max HP, Kindling.

First boot: Ledger almost empty. Thin starter deck. You are not ready for the boss. Begin the climb anyway.

### You look at the map

About ten nodes. Types visible. Exact enemies and shop stock hidden. Pick a fight. Close the app whenever. The run stays.

### You enter a fight

Two enemies. One intends `2d6` (2–12). One intends to buff. You have 3 energy and 5 cards. You may stare.

You play `2d4+2` Block and a `1d6` Strike. Your Block comes up 7. You end the turn. They roll `2d6` and hit 9. You take 2. Next time you might over-block the band, or stab the buffer and pray they roll low.

A few turns later the fight is over.

### You take a reward

1 of 3 cards, or gold, or skip. You are thinking about the deck, not a trait meter.

### You choose a path

Safe fight left. Elite then shop right. Still generic. That choice is the map’s job.

### You hit the shop

A merchant. Cards, a remove, sometimes a relic. Once the Ledger has unlocked it: a reroll.

Leave leftover gold. No punishment.

### The run changes shape

Deck gets weirder. You path toward the elite for a rule-relic, or toward rest because you are low.

### Elite, rest, boss

Elite: a hand-puzzle that punishes a mushy deck. Relic that rewrites a rule.

Rest: heal. Upgrade-a-card unlocks on the Ledger.

Boss: honest intents plus a twist (second phase, they punish Powers). Commit or die.

### You go again

HP 0 ends the run. Recap: floors cleared, Kindling earned. Back to Camp. Buy a Ledger node — a bit of HP, cards into the pool, shop reroll, rest upgrades. The climber looks different. You go again.

A new player is supposed to die around floor 4 the first time and still do this loop. A player who already “knows StS” should still be underbuilt for the boss until the Ledger has a few nodes.

After the first win you pick a Brand at Camp and climb the same map under extra rules. That is the comeback loop. It has a top.

## The map

One act. ~10 nodes. 2–3 branches most rows. Fight, elite, shop, rest, event, treasure, boss.

See types ahead. See exact enemies when you enter a fight.

## The shop

A merchant, not a TFT board.

Stock: cards, a remove, sometimes a relic. **Reroll** once Hearth has unlocked it. One visit.

No components, no combine, no lock-for-traits. If reroll is not enough spice, we add it later. We do not add slots to save it.

## Failure and retry

HP is the run. Hit 0, over. No rewind. You keep Kindling from the attempt.

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

A small tree on this one character. First slice: about **12 nodes**. You buy from the left. Some nodes require a neighbor.

**Spark (tools)**  
Cards enter the *run pool*. A starter card replaces one Strike.

**Frame (body)**  
Small, capped: +HP, starting gold. Two or three nodes total in the first slice. Enough that floor 4 stops being a coin flip. Not enough that floor 1 is a joke forever.

**Hearth (access)**  
You do **not** start with the full game.

- Shop reroll
- Rest site’s upgrade action
- One extra event type
- A second remove per run, or a cheaper remove

No slot unlocks. There are no slots.

**Brand (mastery)**  
Not a shop column you buy with Kindling. It is the post-win ladder. See below.

### How the first hours are supposed to feel

| Session        | Character                            | Typical end        |
| -------------- | ------------------------------------ | ------------------ |
| Run 1          | Thin pool, no reroll, no upgrades, low HP | Die ~floor 4  |
| Runs 2–4       | A bit of HP, a few pool cards        | Floor 6–8          |
| Mid Ledger     | Shop reroll, rest upgrade, starter swap | Boss is in reach |
| First win      | Ledger mostly done. Brand 1 unlocks  | You beat the game once |

The climb does not get longer. The climber gets closer to being allowed to finish it. That is campaign one.

### Brand (the reason you come back)

StS Ascension, stolen cleanly: a finite ladder of harder rules. You choose the Brand at Camp before a run. Winning at Brand N unlocks N+1. You can always play a lower Brand.

**Brand 0** is the first win — the mountain with no extra rules. That is a real win. The game is beatable here.

First slice proves **Brand 1–5**. Later we can grow it toward ~15–20. There is a top. Beating the top Brand is beating Kindling. Stop.

Each rung is a **named rule**, not “enemies have 8% more HP” as the only joke. Draft rungs (names are placeholders):

| Brand | Rule |
| ----- | ---- |
| 1 | Elites can appear one node earlier. |
| 2 | Rest heals less. |
| 3 | Enemies gain a small start-of-fight buff. |
| 4 | One extra curse-like dead card in the starter deck. |
| 5 | Boss takes a second phase, or punishes the deck type you leaned on. |

Later rungs can stack. Playing Brand 5 means 1–5 are all on.

A Brand win is a win. Recap, maybe a leftover Spark card into the pool, then the next rung is available. You are not grinding for +damage. You are climbing a harder puzzle on a finished character.

### What we still will not do

No infinite +1 damage every run. No “I have 400 HP and the act is a corridor.” No endless mode where numbers rise until you die and that is the only end. After the Ledger is bought, the forever loop is Brand, and Brand ends.

## First-slice content budget

| Thing              | Draft count | Notes                                      |
| ------------------ | ----------- | ------------------------------------------ |
| Playable character | 1           | One identity, 2–3 viable directions        |
| Starter cards      | 8–10        | Weak, complete, dice on Attack/Block. Tuned for a *naked* climber |
| Card pool          | ~18–24      | Several locked behind Spark                |
| Relics             | ~8          | At least 2 change a rule, not a stat       |
| Enemies            | ~8          | Early floors must be able to kill a newbie |
| Elites             | 1           | Tests whether you specialized              |
| Boss               | 1           | Tuned for a mid-Ledger character           |
| Events             | 2           | One may be locked                          |
| Ledger nodes       | ~12         | Spark / Frame / Hearth                     |
| Brands             | 0 + 1–5     | Finite. Expand later. Named rules          |

Win: beat the boss at the Brand you chose. Brand 0 is a real win. Beating the top Brand is beating the game. Lose: HP 0, keep Kindling. Another run after a Camp spend.

A safest-path generalist with an empty Ledger should not see the boss. A committed deck on a grown Ledger should feel different by node 6.

## Non-goals (first slice)

- Story, named lore, voiced characters
- Multiple characters
- Party / hex grid / summoned team as the main toy
- Movement combat, a line of tiles, push-to-dodge
- Queue-and-watch combat
- Slots, tag breakpoints, stoke-for-set-bonus
- Endless mode, infinite stat climb, daily run, leaderboards
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

If this card lock, dice-on-numbers, Camp/Ledger, and Brand ladder hold, next is a thin content list: starter deck with dice expressions, eight enemy intents, the boss twist, the 12 Ledger nodes, Brand 1–5 rules. Not code. Not setting.

If the RPG career is wrong after all, edit this file first.

## Open issues (do not solve in passing)

Parked. Theme next. Do not lock a class model until we can picture who these people are.

1. **Classes vs the grind.** StS classes are real engines (Ironclad ≠ Silent: own starter, pool, relics, verb). If each engine is also its own RPG character, picking a new one means grinding Camp from zero. That will suck. Options on the table, not picked: (a) no classes, only in-run decks; (b) shared Camp / exclusive engines; (c) StS-style full kits and a thinner RPG; (d) subclass nodes on one person. (a) is not a class. (d) muddies exclusive gimmicks.

2. **Dice swing vs puzzle.** Both sides roll. A bad pair of rolls can ignore a correct play. How much of a run is allowed to die to variance before it feels cheap?

3. **Look-and-feel clone.** Same fight structure. If the screen also looks like StS, we are a knockoff even with dice. Theme and UI have to carry difference.

4. **First-slice power curve.** Boss tuned for a mid-Ledger climber. Easy to miss and make run 1 hopeless or run 6 trivial.

5. **Art pipeline.** Still a later spike. Theme will decide what we even need to generate.

## Theme (scratch, not locked)

Mechanics first left us unable to picture the Camp, the climb, or a second class. Setting is now in the way of design, not after it.

What the theme has to wear:

- one person who dies and sits down at a Camp
- a Ledger they spend into
- Kindling as currency
- cards, and dice on the numbers
- a short branchy climb
- Brands as a finite harder ladder
- later: more than one exclusive engine (if we keep classes)

Not a Spire. Not their characters. Working title Kindling is a placeholder; it can die with the theme.

Candidate directions (pick, mix, or throw out):

**From us, earlier:** last fire / Ledger-as-debt / the table / not-a-tower.

**From the owner, now:**

5. **The Hold.** A dwarven safe-hold. Adventurers leave to fight through monsters for relics of the past. The gimmick is punching a way *out*. “Death” is a massive injury; an extraction team drags you home. Camp writes itself. Class fantasy is the weak point (everyone is “an adventurer from the hold”).

6. **Elemental plane.** Fire / water / earth / air as the whole theme. Draft verbs: fire = damage and burn, water = heal, earth = Block, air = many small hits. Classes write themselves. A full reason to return to a Camp is the weak point.

7. **Hold cut into elemental strata** (unpicked mix). Safe-hold + extraction from 5. The “outside” is fire galleries, drowned halls, living stone, howling shafts. Classes are hold guilds with exclusive verbs, not generic adventurers. Not locked.

Do not write lore, names of gods, or a plot until one of these is the picture.
