#!/usr/bin/env python3
from pathlib import Path

from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parent


def oval_cut(src: Path, dest: Path, cx: float, cy: float, rx: float, ry: float) -> None:
    im = Image.open(src).convert("RGBA")
    arr = np.array(im)
    h, w = arr.shape[:2]
    yy, xx = np.ogrid[:h, :w]
    dist = ((xx - w * cx) / (w * rx)) ** 2 + ((yy - h * cy) / (h * ry)) ** 2
    alpha = np.clip(1.35 - dist, 0, 1)
    alpha = np.power(alpha, 1.6)
    arr[:, :, 3] = (alpha * 255).astype(np.uint8)
    dest.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(arr).save(dest)
    preview = Image.new("RGBA", (w, h), (40, 90, 50, 255))
    preview.alpha_composite(Image.fromarray(arr))
    preview.convert("RGB").save(dest.with_name(dest.stem + "-preview.jpg"), quality=85)
    print(dest.name)


if __name__ == "__main__":
    oval_cut(ROOT / "warrior-body.jpg", ROOT / "puppets/warrior.png", 0.48, 0.50, 0.42, 0.48)
    oval_cut(ROOT / "enemy-body.jpg", ROOT / "puppets/enemy.png", 0.50, 0.46, 0.40, 0.48)
