# Engine decision

The game is not a hand of cards on a still. Intro cinematic, idle/perform on dwarf and enemy, living camp, rope-haul when you drop. Steam and phone stores. Agents implement it and must boot a scene and look.

Language is not a constraint: C# and C++ are both fine.

## Weighted

| Option | Why it could win | Why it loses |
| ------ | ---------------- | ------------ |
| **Godot 4 + C#** | Native 2D. Scenes for camp, fight, intro, extraction. AnimationPlayer, SpriteFrames, cutout skeletons, GPU particles. One project to Steam, desktop, Android, iOS. Free. C# is official. JSON content still data. | Not TypeScript. Agents need the editor (or a peek scene they can screenshot). GDScript tutorials must be translated. |
| Phaser + TypeScript + Tauri | Best agent peek (`npm run peek`). Fine card juice. | You would fake Timeline, a living camp, and performing characters in a canvas. That is how the screen breaks while tests pass. |
| Unity + C# | Timeline, Animator, store SDK soup. Same language. | License, weight, 2D sits on a 3D engine. Agents cannot open that editor here and look. Overkill for this cast. |
| Unreal + C++ | Film tools. | 3D tax, gigabyte editor, Paper2D is not a 2D pipeline. No. |
| GodotJS (TypeScript on Godot) | TypeScript comfort. | Community plugin, not official. We do not need it. |

Phaser won when the game was “tune JSON in a tab.” That game is gone. Unity/Unreal do not buy us WC3-grade film; that is still a movie studio. Godot is the 2D director we can actually ship.

## Decision

**Godot 4. Gameplay in C#. Content stays JSON.**

- **C#** for scenes, cards, combat, camp, cutscenes, peek.
- **C++** (GDExtension) only if we *measure* a hot path. We will not start there. A card fight will not need it.
- **GDScript:** do not. One language. Agents and you both in C#.
- **GodotJS:** do not.

Ship: desktop + Steam from the same project, phone stores via Godot export. Frames and `{dice}` are engine-drawn ([art.md](art.md)). Art bible stays stills; motion is cutout / frame loops / particles / camera ([art.md](art.md)).

Intro cinematic is a **Godot scene** that reuses camp actors (hearth, dwarf, rope), not a Blizzard CGI file. A video plate is allowed later if we make one that matches the bible.

## Peek contract (non-negotiable)

Unit tests are not enough. Godot makes peek harder; we pay it.

1. Godot is installed in the agent environment.
2. A `peek` scene boots camp idle, a fight perform, and the rope haul — no full run required.
3. An agent is not done until that scene is **running and looked at** (screenshot). Green tests on a black viewport fail the contract.
4. New systems get a peek button or a peek route. Do not hide work behind a Brand 0 clear.

## Not starting

No Godot project in this repo yet. This file is the lock. Scaffold when we want a peek scene, not before.
