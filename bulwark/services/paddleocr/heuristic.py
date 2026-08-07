"""Fallback text-region recognizer used when PaddleOCR is unavailable."""

from __future__ import annotations

import base64
import binascii
from dataclasses import dataclass
from io import BytesIO

import numpy as np
from PIL import Image, UnidentifiedImageError


@dataclass(frozen=True)
class RecognitionRun:
    box: tuple[int, int, int, int]
    text: str
    confidence: float


def decode_image_base64(image_base64: str) -> Image.Image:
    """Decode the JSON payload's base64 image into an RGBA Pillow image."""

    payload = image_base64.split(",", 1)[1] if image_base64.startswith("data:") else image_base64
    try:
        image_bytes = base64.b64decode(payload, validate=True)
        return Image.open(BytesIO(image_bytes)).convert("RGBA")
    except (binascii.Error, UnidentifiedImageError, OSError) as exc:
        raise ValueError("image_base64 must contain a valid base64-encoded image") from exc


def recognize_text_regions(image: Image.Image, *, min_confidence: float = 0.0) -> list[RecognitionRun]:
    """Return OCR runs from pytesseract when present, otherwise one tight ink box."""

    tesseract_runs = _try_tesseract(image)
    if tesseract_runs:
        return [run for run in tesseract_runs if run.confidence >= min_confidence]

    ink_box = tight_ink_box(image)
    if ink_box is None:
        return []

    fallback_run = RecognitionRun(box=ink_box, text="", confidence=0.1)
    return [fallback_run] if fallback_run.confidence >= min_confidence else []


def tight_ink_box(image: Image.Image) -> tuple[int, int, int, int] | None:
    """Find the minimal box around pixels that differ from the border background."""

    rgb = _to_rgb_array(image)
    height, width = rgb.shape[:2]
    if width == 0 or height == 0:
        return None

    border = np.concatenate((rgb[0, :, :], rgb[-1, :, :], rgb[:, 0, :], rgb[:, -1, :]), axis=0)
    background = np.median(border, axis=0)
    color_distance = np.max(np.abs(rgb.astype(np.int16) - background.astype(np.int16)), axis=2)
    foreground = color_distance > 22

    if not np.any(foreground):
        return None

    ys, xs = np.nonzero(foreground)
    return (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)


def _to_rgb_array(image: Image.Image) -> np.ndarray:
    rgba = np.asarray(image.convert("RGBA"), dtype=np.uint8)
    alpha = rgba[:, :, 3:4].astype(np.float32) / 255.0
    composited = rgba[:, :, :3].astype(np.float32) * alpha + 255.0 * (1.0 - alpha)
    return composited.astype(np.uint8)


def _try_tesseract(image: Image.Image) -> list[RecognitionRun]:
    try:
        import pytesseract
        from pytesseract import Output
    except ImportError:
        return []

    try:
        data = pytesseract.image_to_data(image.convert("RGB"), output_type=Output.DICT)
    except (RuntimeError, OSError, pytesseract.TesseractError):
        return []

    runs: list[RecognitionRun] = []
    for index, raw_text in enumerate(data.get("text", [])):
        text = str(raw_text).strip()
        if not text:
            continue

        confidence = _parse_confidence(data.get("conf", ["-1"])[index])
        if confidence < 0:
            continue

        left = int(data["left"][index])
        top = int(data["top"][index])
        width = int(data["width"][index])
        height = int(data["height"][index])
        if width <= 0 or height <= 0:
            continue

        runs.append(
            RecognitionRun(
                box=(left, top, left + width, top + height),
                text=text,
                confidence=min(1.0, max(0.0, confidence / 100.0)),
            )
        )
    return runs


def _parse_confidence(value: object) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return -1.0
