# Performance

We care about **FPS** and **load times**. Not synthetic GFLOPS.

## Bars (first cut)

| Surface | Target | Fail |
| ------- | ------ | ---- |
| Desktop peek, 1080p | 60 fps average over 5s, 1% low ≥ 45 | avg < 50 or hitch > 200ms |
| Mid phone (HTML5 or APK peek) | 30 fps average, 1% low ≥ 20 | avg < 25 or hitch > 400ms |
| Cold boot → peek ready | Desktop ≤ 5s, phone ≤ 10s | 2× target |
| Content JSON load | ≤ 100ms for MVP catalog | > 250ms |
| Enter fight from map (warm) | ≤ 2s | > 4s |
| Intro scene first paint | ≤ 3s after boot | > 6s |

MVP catalog is small. If JSON load is slow, we did something stupid (parsing on the main thread in a loop, not the file size).

These numbers move after we have a real peek on a real device. The **harness** does not move.

## How we test FPS

1. **PeekBench** Godot scene (part of foundation). No full run.
   - 3s camp idle (walkers + hearth particles)
   - 3s fight (dwarf idle, one `OnPlay` perform, enemy flinch)
   - 3s rope haul
2. Each frame: record `Engine.GetFramesPerSecond()` and frame Δ.
3. Write `user://perf-peek.json`: `{ avg, p1, hitchMs[], loadMs }`.
4. Desktop CI (Linux export or editor `--headless` is **not** enough for GPU FPS). Headless checks *load timestamps only*.
5. GPU FPS: Linux windowed export on a box with a display, or HTML5 in Chrome + a small script reading the dumped JSON. Agent peek on a machine with a screen is the same path.
6. Phone: sideload APK, PeekBench writes the same JSON, pull with `adb`. Not every PR — every ship candidate.

Do **not** use BenchmarkDotNet for FPS. Use it only if Domain dice/combat CPU ever shows up in a profile (it should not).

## How we test load times

Instrument Boot:

| Mark | When |
| ---- | ---- |
| `t0` | process start |
| `t_godot` | first `_Ready` |
| `t_content` | ContentService finished |
| `t_peek` | peek scene `ready` and first texture painted |

Dump the marks next to the FPS file. CI fails the **load** gates on headless Linux (`godot --headless --quit-after N` is fine for clocks, not for FPS).

## What we do not do

- Cap particle counts in Domain.
- Fail CI because a laptop was on battery once — pin the bench machine or use a percentile over 3 runs.
- Optimize Unreal-style before PeekBench exists.
