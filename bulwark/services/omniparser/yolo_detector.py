"""Optional YOLO backend using OmniParser icon-detect weights."""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from PIL import Image

ElementKind = Literal["text", "icon", "image", "container", "unknown"]

LOGGER = logging.getLogger("bulwark.omniparser.yolo")


@dataclass(frozen=True)
class DetectionElement:
    box: tuple[int, int, int, int]
    label: str
    kind: ElementKind
    confidence: float
    interactive: bool


class YoloIconDetector:
    """Thin wrapper around OmniParser's icon-detect YOLO checkpoint."""

    def __init__(self, weights_path: Path, device: str = "cpu", captioner=None) -> None:
        from ultralytics import YOLO

        self.weights_path = weights_path
        self.device = device
        self.captioner = captioner
        self.model = YOLO(str(weights_path))
        suffix = "+florence" if captioner is not None else ""
        self.model_name = f"omniparser-yolo{suffix}:{weights_path.name}"
        LOGGER.info("loaded YOLO weights from %s on %s", weights_path, device)

    def detect(
        self,
        image: Image.Image,
        *,
        min_confidence: float = 0.2,
        max_overlap: float = 0.6,
    ) -> list[DetectionElement]:
        import tempfile

        rgb = image.convert("RGB")
        # Predict from a temp PNG so Ultralytics owns the decode path; this avoids
        # brittle host NumPy/torch binary mismatches on macOS.
        with tempfile.NamedTemporaryFile(suffix=".png", delete=True) as handle:
            rgb.save(handle, format="PNG")
            handle.flush()
            results = self.model.predict(
                source=handle.name,
                conf=min_confidence,
                iou=max_overlap,
                verbose=False,
                device=self.device,
            )
        if not results:
            return []

        result = results[0]
        boxes = result.boxes
        if boxes is None or len(boxes) == 0:
            return []

        width, height = rgb.size
        raw: list[tuple[tuple[int, int, int, int], float, ElementKind]] = []
        xyxy = boxes.xyxy.cpu().numpy()
        confs = boxes.conf.cpu().numpy()
        for box, confidence in zip(xyxy, confs, strict=True):
            x1, y1, x2, y2 = [int(round(value)) for value in box.tolist()]
            x1 = max(0, min(width - 1, x1))
            y1 = max(0, min(height - 1, y1))
            x2 = max(x1 + 1, min(width, x2))
            y2 = max(y1 + 1, min(height, y2))
            kind = _classify_box(x2 - x1, y2 - y1, width, height)
            raw.append(((x1, y1, x2, y2), float(confidence), kind))

        labels = [f"yolo-{kind}-{index + 1}" for index, (_, _, kind) in enumerate(raw)]
        kinds: list[ElementKind] = [kind for _, _, kind in raw]

        if self.captioner is not None and raw:
            try:
                from florence_captioner import crop_element, kind_from_caption
            except ImportError:  # pragma: no cover
                from .florence_captioner import crop_element, kind_from_caption

            crops = [crop_element(rgb, box) for box, _, _ in raw]
            LOGGER.info("captioning %s crops with Florence (CPU-friendly batching)", len(crops))
            captions = self.captioner.caption_crops(crops)
            for index, caption in enumerate(captions):
                labels[index] = caption
                kinds[index] = kind_from_caption(caption, kinds[index])  # type: ignore[assignment]

        elements: list[DetectionElement] = []
        for index, ((box, confidence, _), label, kind) in enumerate(zip(raw, labels, kinds, strict=True)):
            elements.append(
                DetectionElement(
                    box=box,
                    label=label,
                    kind=kind,
                    confidence=confidence,
                    interactive=kind in {"icon", "text", "container"},
                )
            )
        return elements


def resolve_weights_path() -> Path | None:
    """Find a YOLO checkpoint from env or the local weights directory."""

    explicit = os.environ.get("OMNIPARSER_WEIGHTS_PATH")
    if explicit:
        path = Path(explicit)
        return path if path.is_file() else None

    weights_dir = os.environ.get("OMNIPARSER_WEIGHTS_DIR")
    candidates: list[Path] = []
    if weights_dir:
        root = Path(weights_dir)
        candidates.extend(
            [
                root / "model.pt",
                root / "icon_detect" / "model.pt",
                root.parent / "icon_detect" / "model.pt",
                root / "icon_detect_v3" / "model.pt",
                root / "icon_detect_v1_5" / "model_v1_5.pt",
            ]
        )
        candidates.extend(sorted(root.glob("**/*.pt")))

    local = Path(__file__).resolve().parent / "weights"
    candidates.extend(
        [
            local / "model.pt",
            local / "icon_detect" / "model.pt",
            local / "icon_detect_v3" / "model.pt",
        ]
    )
    candidates.extend(sorted(local.glob("**/*.pt")))

    for candidate in candidates:
        if candidate.is_file() and "caption" not in candidate.parts:
            return candidate
    return None


def try_load_yolo_detector(captioner=None) -> YoloIconDetector | None:
    weights = resolve_weights_path()
    if weights is None:
        return None

    device = os.environ.get("OMNIPARSER_DEVICE", "cpu")
    try:
        return YoloIconDetector(weights, device=device, captioner=captioner)
    except Exception:  # pragma: no cover - import/runtime failures stay on heuristic
        LOGGER.exception("failed to load YOLO weights from %s; using heuristic", weights)
        return None


def _classify_box(box_w: int, box_h: int, image_w: int, image_h: int) -> ElementKind:
    area = box_w * box_h
    image_area = max(1, image_w * image_h)
    ratio = area / image_area
    aspect = box_w / max(1, box_h)
    if ratio > 0.35:
        return "container"
    if 0.7 <= aspect <= 1.4 and ratio < 0.05:
        return "icon"
    if aspect > 2.2 or aspect < 0.45:
        return "text"
    if ratio > 0.08:
        return "image"
    return "unknown"
