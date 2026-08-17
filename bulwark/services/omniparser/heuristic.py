"""Parameter-free UI element detector used when OmniParser weights are absent."""

from __future__ import annotations

import base64
import binascii
from collections import deque
from dataclasses import dataclass
from io import BytesIO
from typing import Iterable, Literal

import numpy as np
from PIL import Image, UnidentifiedImageError

ElementKind = Literal["text", "icon", "image", "container", "unknown"]


@dataclass(frozen=True)
class DetectionElement:
    box: tuple[int, int, int, int]
    label: str
    kind: ElementKind
    confidence: float
    interactive: bool


def decode_image_base64(image_base64: str) -> Image.Image:
    """Decode the JSON payload's base64 image into an RGBA Pillow image."""

    payload = image_base64.split(",", 1)[1] if image_base64.startswith("data:") else image_base64
    try:
        image_bytes = base64.b64decode(payload, validate=True)
        return Image.open(BytesIO(image_bytes)).convert("RGBA")
    except (binascii.Error, UnidentifiedImageError, OSError) as exc:
        raise ValueError("image_base64 must contain a valid base64-encoded image") from exc


def detect_elements(
    image: Image.Image,
    *,
    min_confidence: float = 0.2,
    max_overlap: float = 0.6,
) -> list[DetectionElement]:
    """Detect UI-ish regions with connected components over color and edge masks."""

    rgb = _to_rgb_array(image)
    height, width = rgb.shape[:2]
    if width == 0 or height == 0:
        return []

    mask = _foreground_mask(rgb)
    mask = _dilate(mask, iterations=1)
    raw_components = _connected_components(mask, min_area=max(12, int(width * height * 0.00015)))
    elements = [_component_to_element(component, width, height, rgb) for component in raw_components]
    elements = [element for element in elements if element.confidence >= min_confidence]
    return _suppress_overlaps(elements, max_overlap=max_overlap)


def _to_rgb_array(image: Image.Image) -> np.ndarray:
    rgba = np.asarray(image.convert("RGBA"), dtype=np.uint8)
    alpha = rgba[:, :, 3:4].astype(np.float32) / 255.0
    composited = rgba[:, :, :3].astype(np.float32) * alpha + 255.0 * (1.0 - alpha)
    return composited.astype(np.uint8)


def _foreground_mask(rgb: np.ndarray) -> np.ndarray:
    height, width = rgb.shape[:2]
    border = np.concatenate((rgb[0, :, :], rgb[-1, :, :], rgb[:, 0, :], rgb[:, -1, :]), axis=0)
    background = np.median(border, axis=0)
    color_distance = np.max(np.abs(rgb.astype(np.int16) - background.astype(np.int16)), axis=2)

    gray = (
        0.299 * rgb[:, :, 0].astype(np.float32)
        + 0.587 * rgb[:, :, 1].astype(np.float32)
        + 0.114 * rgb[:, :, 2].astype(np.float32)
    )
    gradient = np.zeros((height, width), dtype=np.float32)
    gradient[:, 1:] = np.maximum(gradient[:, 1:], np.abs(gray[:, 1:] - gray[:, :-1]))
    gradient[1:, :] = np.maximum(gradient[1:, :], np.abs(gray[1:, :] - gray[:-1, :]))

    mask = (color_distance > 22) | (gradient > 18)
    if width > 2 and height > 2:
        mask[[0, height - 1], :] = False
        mask[:, [0, width - 1]] = False
    return mask


def _dilate(mask: np.ndarray, *, iterations: int) -> np.ndarray:
    dilated = mask
    for _ in range(iterations):
        padded = np.pad(dilated, 1, mode="constant", constant_values=False)
        next_mask = np.zeros_like(dilated)
        for y_offset in range(3):
            for x_offset in range(3):
                next_mask |= padded[y_offset : y_offset + dilated.shape[0], x_offset : x_offset + dilated.shape[1]]
        dilated = next_mask
    return dilated


def _connected_components(mask: np.ndarray, *, min_area: int) -> list[tuple[int, int, int, int, int]]:
    height, width = mask.shape
    visited = np.zeros_like(mask, dtype=bool)
    components: list[tuple[int, int, int, int, int]] = []

    for start_y, start_x in zip(*np.nonzero(mask)):
        if visited[start_y, start_x]:
            continue

        queue: deque[tuple[int, int]] = deque([(int(start_y), int(start_x))])
        visited[start_y, start_x] = True
        x_min = x_max = int(start_x)
        y_min = y_max = int(start_y)
        area = 0

        while queue:
            y, x = queue.popleft()
            area += 1
            x_min = min(x_min, x)
            x_max = max(x_max, x)
            y_min = min(y_min, y)
            y_max = max(y_max, y)

            for next_y in (y - 1, y, y + 1):
                for next_x in (x - 1, x, x + 1):
                    if next_y == y and next_x == x:
                        continue
                    if next_y < 0 or next_y >= height or next_x < 0 or next_x >= width:
                        continue
                    if visited[next_y, next_x] or not mask[next_y, next_x]:
                        continue
                    visited[next_y, next_x] = True
                    queue.append((next_y, next_x))

        box_width = x_max - x_min + 1
        box_height = y_max - y_min + 1
        if area >= min_area and box_width >= 3 and box_height >= 3:
            components.append((x_min, y_min, x_max + 1, y_max + 1, area))

    return components


def _component_to_element(
    component: tuple[int, int, int, int, int],
    image_width: int,
    image_height: int,
    rgb: np.ndarray,
) -> DetectionElement:
    x_min, y_min, x_max, y_max, area = component
    box_width = x_max - x_min
    box_height = y_max - y_min
    box_area = max(1, box_width * box_height)
    fill_ratio = area / box_area
    aspect_ratio = box_width / max(1, box_height)
    image_area_ratio = box_area / max(1, image_width * image_height)

    kind = _classify_component(
        box_width=box_width,
        box_height=box_height,
        fill_ratio=fill_ratio,
        aspect_ratio=aspect_ratio,
        image_area_ratio=image_area_ratio,
        patch=rgb[y_min:y_max, x_min:x_max, :],
    )
    confidence = _confidence(kind, fill_ratio=fill_ratio, image_area_ratio=image_area_ratio)

    return DetectionElement(
        box=(x_min, y_min, x_max, y_max),
        label=f"heuristic-{kind}",
        kind=kind,
        confidence=confidence,
        interactive=kind in {"icon", "container"},
    )


def _classify_component(
    *,
    box_width: int,
    box_height: int,
    fill_ratio: float,
    aspect_ratio: float,
    image_area_ratio: float,
    patch: np.ndarray,
) -> ElementKind:
    if box_height <= 28 and aspect_ratio >= 1.8:
        return "text"
    if box_width <= 48 and box_height <= 48 and 0.55 <= aspect_ratio <= 1.65:
        return "icon"
    if image_area_ratio >= 0.08 and fill_ratio >= 0.45 and _color_variance(patch) > 500:
        return "image"
    if image_area_ratio >= 0.01 or fill_ratio <= 0.45:
        return "container"
    return "unknown"


def _color_variance(patch: np.ndarray) -> float:
    if patch.size == 0:
        return 0.0
    return float(np.var(patch.astype(np.float32)))


def _confidence(kind: ElementKind, *, fill_ratio: float, image_area_ratio: float) -> float:
    if kind == "text":
        return 0.58
    if kind == "icon":
        return 0.52
    if kind == "container":
        return min(0.76, 0.42 + image_area_ratio * 2.0 + max(0.0, 0.5 - fill_ratio) * 0.25)
    if kind == "image":
        return 0.62
    return 0.35


def _suppress_overlaps(elements: Iterable[DetectionElement], *, max_overlap: float) -> list[DetectionElement]:
    ordered = sorted(elements, key=lambda element: element.confidence, reverse=True)
    kept: list[DetectionElement] = []
    for element in ordered:
        if all(_intersection_over_union(element.box, existing.box) <= max_overlap for existing in kept):
            kept.append(element)
    return sorted(kept, key=lambda element: (element.box[1], element.box[0]))


def _intersection_over_union(
    first: tuple[int, int, int, int], second: tuple[int, int, int, int]
) -> float:
    x_min = max(first[0], second[0])
    y_min = max(first[1], second[1])
    x_max = min(first[2], second[2])
    y_max = min(first[3], second[3])
    intersection = max(0, x_max - x_min) * max(0, y_max - y_min)
    if intersection == 0:
        return 0.0
    first_area = max(0, first[2] - first[0]) * max(0, first[3] - first[1])
    second_area = max(0, second[2] - second[0]) * max(0, second[3] - second[1])
    return intersection / max(1, first_area + second_area - intersection)
