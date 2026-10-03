# Art path (AI only, no hired modeling)

2D. Portraits, Hold plates, enemies. Card frames, energy, cost, and `{dice}` text are **code**, never generated pixels. No hired modeler, no image-to-3D, no mesh pipeline.

## What the tools actually are

| Tool | Good for | Limit |
| ---- | -------- | ----- |
| One-shot generators (Cursor, Midjourney, Flux, DALL·E) | Finding a look in a day | Faces and gear drift every prompt. Bad at text. Midjourney `--sref` helps; still not a card set. |
| Scenario / Leonardo + a LoRA | Same look across 40 portraits | Needs a style pack first. Paid tiers for commercial use. |
| Local ComfyUI + Flux / SDXL + IP-Adapter | Repeatable, no per-image vendor | Setup cost. Flux Dev license is picky (non-commercial clauses). |
| Adobe Firefly | Safer training-data story | Weaker “our Hold” look. Fine for UI chrome we will not generate anyway. |
| Recraft / Ideogram | Icons, text-in-image | We do **not** want text in the PNG. Icons stay engine-drawn. |
| Image-to-3D (Meshy, Tripo, InstantMesh) | — | Rejected. We are not doing 3D. |

Hard limits no tool removes: **consistency**, **hands / rune-glyphs**, **readable tiny icons**, **text in the image**. Do not generate words on cards.

## Decision

1. **Lock a style with 4–5 hero shots** (Hold, Warrior, Runesmith, one enemy). Done in `art-spike/`.
2. Treat those as the bible. Later images are img2img / reference off that set, same prompt stem.
3. **Portraits only in the PNG.** Frame, energy, `{dice}` string, keywords — Phaser.
4. When the bible is boringly consistent, train a tiny LoRA (Scenario or local) on it. Not before.
5. Icons: simple painted shapes or engine-drawn, not a new AI roll per icon.

Prompt stem for the spike (reuse it):

> Hand-painted fantasy illustration, warm torchlight on wet stone, dwarven hold, thick painterly brushwork, no text, no UI, no watermark, not photoreal, not anime, not chibi.

## Spike result

Tried, not theorized. Four plates, same stem, no hired artist.

| File | Role | What we learned |
| ---- | ---- | --------------- |
| `art-spike/holdfast-hold-hearth.jpg` | Camp | Hearth + rope-winch + door. More CG-lit stone than brush. Outlier. |
| `art-spike/holdfast-warrior.jpg` | Warrior face | Painterly, braids, mail. Closest to the stem. |
| `art-spike/holdfast-runesmith.jpg` | Runesmith face | Same torch + brush family. Hair-runes and crystal chisel read. Hands still a risk. |
| `art-spike/holdfast-enemy-knuckle.jpg` | Enemy face | Pale knuckle-thing in a tunnel. Same paint, different anatomy. Fine as a bible plate. |

Portraits share a world. The hearth plate does not — next Hold shot should be img2img *from the Warrior/Runesmith paint*, not a new lit-3D prompt. Faces will still drift on a fresh text-only batch. That is the known hole.

Commercial ship later: keep license notes per batch. Playground spike is for look, not a store page.
