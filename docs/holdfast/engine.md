# Engine decision

Phone first, desktop too, card UI, JSON content, playground speed. The bottleneck is *change a number, reload, play* — not Steam on day one.

## Weighted

| Option | Why it could win | Why it loses |
| ------ | ---------------- | ------------ |
| **Phaser 3 + TypeScript + Vite + PWA** | One language. Scenes for Hold / map / fight. JSON import + Vite HMR. AI portraits are PNGs. Phone is a tab. Capacitor later if a store matters. | Canvas text is fiddlier than HTML. Not a native binary. |
| React + Vite + PWA | Cards and the Ledger *are* UI. Crisp phone text, CSS layout, forms. Same JSON/HMR loop. | Fight juice (dice, fly-ins, map) is extra work. Easy to ship a menu, not a game. |
| Godot 4 | Real 2D engine. One project to Android, desktop, Steam. Free. | Android export is friction. Slower couch-tune loop. GDScript or C# beside content TS. |
| Unity | Mobile muscle, StS-shaped tooling. | License, weight, overkill for a 10-node card run. |
| Unreal | — | 3D tax for a hand of cards. No. |
| Flutter / Flame | One mobile binary. | Weaker card-UI ecosystem. Dart for no gain. |
| PixiJS alone | Lighter canvas than Phaser. | We would rebuild scenes Phaser already has. |

Unreal and Unity are the wrong size. Godot is the right *ship* engine. React is the right *menu* stack. Phaser is the right *experiment* engine: we need a fight scene and a map, not only a Ledger.

## Decision

**Phaser 3, TypeScript, Vite, content as JSON, ship as a PWA.**

Holdfast’s first job is tuning decks, dice, and Ledger prices, then looking at art on a phone. A browser tab is the fastest way to do that. Card frames and `{dice}` strings are engine-drawn (see [art.md](art.md)), so canvas text is a cost we accept.

If the PWA is not enough after a playable exists, we re-evaluate Godot. We do not start there. If combat juice never needs a canvas, React can still steal the Camp screens later. We do not start with two stacks.
