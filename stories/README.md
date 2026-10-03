# Stories

Epics only. Each folder is one epic. The README in the folder is the epic.

| Epic | What |
| ---- | ---- |
| [foundation](foundation/README.md) | Godot + C# solution, peek, JSON load, agent can click |
| [combat](combat/README.md) | Card OOP, dice, encounter, Might / Brace / Block |
| [warrior](warrior/README.md) | Grit and the Warrior kit |
| [runesmith](runesmith/README.md) | Rune / Inscribe and the Runesmith kit |
| [sortie](sortie/README.md) | Map, rewards, shop, rest, door |
| [hold](hold/README.md) | Camp, Ledger, Runestones |
| [brand](brand/README.md) | Brand 0–5 |
| [stagecraft](stagecraft/README.md) | Intro, performs, living camp, rope haul |
| [keep](keep/README.md) | Save / pause mid-run |
| [shell](shell/README.md) | Settings, phone chrome |
| [ship](ship/README.md) | Exports, CI binaries |

Order is the dependency order. Stagecraft can start as soon as peek exists; it does not wait for Brand.
