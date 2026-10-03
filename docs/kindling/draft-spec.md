# Kindling — draft spec

Working title. Setting and art come later. This is the mechanical core only.

Challenge anything. Numbers are draft targets, not balance.

**Status:** this is a Slay the Spire clone with extra shop furniture. We chose that. Still a draft, not code.

## What this is

A one-hero card roguelike in the Slay the Spire family.

Hand, energy, draw pile, Block, visible intents, branching map, card rewards, relics, die and go again. That is StS. We picked it because that fight is more fun than movement management. Shop, slots, and tags are extras. They do not pass the screenshot test. A 10-second clip of a fight is a StS clip.

Call it a clone. Do not dress it up as a new genre.

Final output of the experiment is a playable POC. This doc is the first artifact.

## Locked

- One playable character. Not a guild, not a TFT board of champions.
- Combat is an **untimed card puzzle**. No APM. No real-time dodging. A turn waits forever. Inspect a card without playing it. Undo nothing mid-resolution — play is immediate — but there is no clock.
- Combat is honest. Enemy intents are visible before you act.
- You play the fight. Not watch-and-hope autobattle.
- Branching path, Slay the Spire style.
- Die, then go again. No endless mode in the first slice.
- Pause and resume mid-run. Phone-first, desktop too.
- First slice is one short run, end to end, easy to expand.
- Between runs, this same character gains new *options*, not raw +damage / +HP.

**Combat decision (this draft):** hand, energy, draw pile, discard, Block, intents. No board. No stepping. No push-the-enemy-off-the-tile.

Rejected: Hades / Brotato / Vampire Survivors (APM). Peglin (physics). Guildrun spectate-combat. The 7-tile rewrite-the-hit fight (movement management). Dice as the main toy. Wildfrost’s unit board.

## One-sentence pitch

You are one climber. Each fight you spend a small hand of cards against visible enemy intents. Between fights you shop, socket gear, and stack tags until the starter deck no longer plays like the starter deck.

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
  → unlock something for this character, start another run
```

A good run ends with a specialist. A bad run dies as a generalist who never committed.

## Why a clone, and what the extras are for

Cards won because sequencing a hand is the fun we want: this Attack now, this setup now, this Block because they are swinging 14. The line fight was more original and less fun. So we took the clone.

We do not steal names, card text, or art. That is the only authenticity claim that holds.

Shop, slots, and tags are still in the draft as *run seasoning* — a fatter merchant, three auto items, public breakpoints you stoke this fight. They might make a run feel a bit more like TFT between nodes. They do not make the game not-StS. If they fail to matter by node 6, cut them and we have a short StS-like slice. That is an acceptable POC for a playground.

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

One climber. HP, three slots, a small deck, tags at 0/0/0. Begin the climb. If you already died, one new toy is in the pool. No +HP.

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

HP 0 ends the run. Recap, maybe one unlock. Same person, new option. Die, go again.

## The map

One act. ~10 nodes. 2–3 branches most rows. Fight, elite, shop, rest, event, treasure, boss.

See types ahead. See exact enemies when you enter a fight, and may still swap slots before the first turn.

## The shop

The other half of the game.

Stock: cards, slot items / components, sometimes a relic, a remove, reroll, lock (holds one offer across rerolls; shops are one visit).

**Combine:** two matching components become a stronger item in that family.

## Failure and retry

HP is the run. Hit 0, over. No rewind.

Save on leaving a node or opening a menu.

## Between runs

Unlock options: a starter card that replaces one Strike, a fourth tag in the shop pool, a new item family, a new event, an optional harder modifier after a win.

Do not unlock +5 HP or +1 damage.

First slice: one starting kit, 2–3 unlocks.

## First-slice content budget

| Thing              | Draft count | Notes                                      |
| ------------------ | ----------- | ------------------------------------------ |
| Playable character | 1           | One identity, 2–3 viable directions        |
| Starter cards      | 8–10        | Weak, complete                             |
| Card pool          | ~18–24      | Stokes, payoffs, a few Powers              |
| Slot items         | ~8          | 3 families, common + combined              |
| Relics             | ~8          | At least 2 change a rule, not a stat       |
| Enemies            | ~8          | Hit hard, buffer, status, “punish setup”   |
| Elites             | 1           | Tests whether you specialized              |
| Boss               | 1           | Two-phase or a rule twist                  |
| Events             | 2           | Real choices                               |
| Tags               | 3           | Burn, Guard, Flow                          |

Win: beat the boss. Lose: HP 0. Another run in under a minute.

A safest-path generalist should usually lose the boss. A committed tag should feel different by node 6.

## Non-goals (first slice)

- Story, named lore, voiced characters
- Multiple characters
- Party / hex grid / summoned team as the main toy
- Movement combat, a line of tiles, push-to-dodge
- Queue-and-watch combat
- Endless mode, daily run, leaderboards
- PvP, accounts, live ops
- Meta stat sticks
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
