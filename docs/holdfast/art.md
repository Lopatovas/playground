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

## Locked

These four plates **are** the look. Do not regenerate them. Do not overwrite them.

Canonical copies: [`assets/holdfast/art-bible/`](../../assets/holdfast/art-bible/)

1. Later images are img2img / reference off that set, same prompt stem.
2. **Portraits only in the PNG.** Frame, energy, `{dice}` string, keywords — engine-drawn.
3. When new plates already match this bible, train a tiny LoRA. Not before.
4. Icons: simple painted shapes or engine-drawn, not a new AI roll per icon.

Prompt stem for the spike (reuse it):

> Hand-painted fantasy illustration, warm torchlight on wet stone, dwarven hold, thick painterly brushwork, no text, no UI, no watermark, not photoreal, not anime, not chibi.

## Spike result

Tried, not theorized. Four plates, same stem, no hired artist.

| File | Role |
| ---- | ---- |
| `art-bible/hold-hearth.jpg` | Camp. Hearth, rope-winch, door. |
| `art-bible/warrior.jpg` | Warrior. |
| `art-bible/runesmith.jpg` | Runesmith. |
| `art-bible/enemy-knuckle.jpg` | Enemy. |

Warm torchlight, wet stone, painterly dwarf-hold. New art matches this. Faces will still drift on a fresh text-only batch — that is why new plates start from these files, not from a blank prompt.

Commercial ship later: keep license notes per batch. Playground spike is for look, not a store page.
