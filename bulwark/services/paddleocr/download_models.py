"""Warm PaddleOCR so detection/recognition weights land in the image."""

from __future__ import annotations

import os
import sys

import numpy as np


def main() -> int:
    lang = os.environ.get("PADDLEOCR_LANG", "en")
    try:
        from paddleocr import PaddleOCR
    except Exception as exc:  # noqa: BLE001
        print(f"paddleocr import failed: {exc}", file=sys.stderr)
        return 1

    print(f"initializing PaddleOCR(lang={lang}) — downloading models if needed…")
    try:
        ocr = PaddleOCR(use_angle_cls=True, lang=lang, show_log=True, use_gpu=False)
    except TypeError:
        ocr = PaddleOCR(lang=lang, use_angle_cls=True)

    # Tiny white canvas with a dark bar so det/rec both exercise.
    image = np.full((64, 256, 3), 255, dtype=np.uint8)
    image[20:44, 40:220] = 20
    try:
        _ = ocr.ocr(image, cls=True)
    except TypeError:
        _ = ocr.ocr(image)

    print("PaddleOCR weights ready")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
