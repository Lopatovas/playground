"""ScreenParser (docling YOLO11-L) detector mapped onto Bulwark's element kinds."""

from __future__ import annotations

import logging
import os
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from PIL import Image

ElementKind = Literal["text", "icon", "image", "container", "unknown"]

LOGGER = logging.getLogger("bulwark.screenparser")

# ScreenParse's 55 class names → Bulwark's coarse kinds used by matching/checks.
KIND_BY_CLASS: dict[str, ElementKind] = {
    "Text": "text",
    "Heading": "text",
    "Link": "text",
    "Code snippet": "text",
    "Breadcrumb": "text",
    "Button": "icon",
    "Utility Button": "icon",
    "App Icon": "icon",
    "File Icon": "icon",
    "Checkbox": "icon",
    "Radiobox": "icon",
    "Switch": "icon",
    "Toggles": "icon",
    "Steppers": "icon",
    "Rating Indicator": "icon",
    "Badge": "icon",
    "Avatar": "image",
    "Image": "image",
    "Logo": "image",
    "Chart": "image",
    "Video": "image",
    "Carousel": "image",
    "Text Input": "container",
    "Search Field": "container",
    "Search Bar": "container",
    "Select": "container",
    "Table": "container",
    "Column/Browser": "container",
    "Navigation Bar": "container",
    "Status Bar": "container",
    "Toolbar": "container",
    "Tooltip": "container",
    "Tab Bar": "container",
    "Side Bar": "container",
    "Slider": "container",
    "Picker": "container",
    "ContextMenu": "container",
    "DockMenu": "container",
    "EditMenu": "container",
    "Scroll": "container",
    "Window": "container",
    "Screen": "container",
    "List": "container",
    "List Item": "container",
    "PopUp Menu": "container",
    "Alert": "container",
    "Progress bar": "container",
    "Bottom navigation": "container",
    "Page control": "container",
    "Menu": "container",
    "Pagination": "container",
    "Tab": "container",
    "Date-Time picker": "container",
    "Calendar": "container",
    "Notification": "container",
}

INTERACTIVE_KINDS = frozenset({"icon", "text", "container"})

# When two boxes cover nearly the same ink, prefer the more specific UI class.
CLASS_PRIORITY: dict[str, int] = {
    "Heading": 100,
    "Link": 95,
    "Button": 90,
    "Utility Button": 90,
    "Logo": 85,
    "App Icon": 85,
    "Text Input": 80,
    "Search Field": 80,
    "Search Bar": 80,
    "Checkbox": 75,
    "Radiobox": 75,
    "Switch": 75,
    "Text": 50,
    "List Item": 35,
    "List": 30,
    "Navigation Bar": 25,
    "Side Bar": 25,
    "Table": 20,
    "Screen": 5,
    "Window": 5,
}


@dataclass(frozen=True)
class DetectionElement:
    box: tuple[int, int, int, int]
    label: str
    kind: ElementKind
    confidence: float
    interactive: bool


def _box_area(box: tuple[int, int, int, int]) -> int:
    return max(1, (box[2] - box[0]) * (box[3] - box[1]))


def _containment_and_iou(
    a: tuple[int, int, int, int], b: tuple[int, int, int, int]
) -> tuple[float, float, float]:
    """Return (frac of A inside B, frac of B inside A, IoU)."""
    x1 = max(a[0], b[0])
    y1 = max(a[1], b[1])
    x2 = min(a[2], b[2])
    y2 = min(a[3], b[3])
    if x2 <= x1 or y2 <= y1:
        return 0.0, 0.0, 0.0
    inter = (x2 - x1) * (y2 - y1)
    area_a = _box_area(a)
    area_b = _box_area(b)
    return inter / area_a, inter / area_b, inter / (area_a + area_b - inter)


def suppress_nested_duplicates(
    elements: list[DetectionElement],
    *,
    min_iou: float = 0.55,
    min_containment: float = 0.85,
) -> list[DetectionElement]:
    """Drop near-duplicate / parent-wrapper boxes; keep the higher-priority class.

    ScreenParser often emits both a `Heading` and a covering `Text`, or a `List Item`
    that is geometrically identical to its inner `Text`. Matching then double-counts
    the same control. Prefer specific leaves over wrappers when overlap is high.
    """
    ranked = sorted(
        elements,
        key=lambda el: (
            CLASS_PRIORITY.get(el.label, 40),
            el.confidence,
            -_box_area(el.box),  # tighter box wins ties
        ),
        reverse=True,
    )
    kept: list[DetectionElement] = []
    for candidate in ranked:
        drop = False
        for winner in kept:
            frac_c, frac_w, iou = _containment_and_iou(candidate.box, winner.box)
            near_dup = iou >= min_iou or frac_c >= min_containment or frac_w >= min_containment
            if not near_dup:
                continue
            # Always drop the lower-ranked near-duplicate (candidate is lower by sort).
            drop = True
            break
        if not drop:
            kept.append(candidate)
    # Stable reading order for the rest of the pipeline.
    kept.sort(key=lambda el: (el.box[1], el.box[0], el.box[2], el.box[3], el.label))
    return kept


class ScreenParserDetector:
    """Ultralytics wrapper around docling-project/ScreenParser."""

    def __init__(self, weights_path: Path, device: str = "cpu", imgsz: int = 1280) -> None:
        from ultralytics import YOLO

        self.weights_path = weights_path
        self.device = device
        self.imgsz = imgsz
        self.model = YOLO(str(weights_path))
        self.model_name = f"screenparser:{weights_path.name}"
        LOGGER.info("loaded ScreenParser weights from %s on %s (imgsz=%s)", weights_path, device, imgsz)

    def detect(
        self,
        image: Image.Image,
        *,
        min_confidence: float = 0.1,
        max_overlap: float = 0.1,
        agnostic_nms: bool | None = None,
        denest: bool | None = None,
    ) -> list[DetectionElement]:
        use_agnostic = (
            agnostic_nms
            if agnostic_nms is not None
            else os.environ.get("SCREENPARSER_AGNOSTIC_NMS", "1").lower() in {"1", "true", "yes"}
        )
        use_denest = (
            denest
            if denest is not None
            else os.environ.get("SCREENPARSER_DENEST", "1").lower() in {"1", "true", "yes"}
        )
        rgb = image.convert("RGB")
        with tempfile.NamedTemporaryFile(suffix=".png", delete=True) as handle:
            rgb.save(handle, format="PNG")
            handle.flush()
            results = self.model.predict(
                source=handle.name,
                conf=min_confidence,
                iou=max_overlap,
                imgsz=self.imgsz,
                verbose=False,
                device=self.device,
                agnostic_nms=use_agnostic,
            )
        if not results:
            return []

        result = results[0]
        boxes = result.boxes
        if boxes is None or len(boxes) == 0:
            return []

        width, height = rgb.size
        names = self.model.names
        elements: list[DetectionElement] = []
        xyxy = boxes.xyxy.cpu().numpy()
        confs = boxes.conf.cpu().numpy()
        classes = boxes.cls.cpu().numpy()

        for box, confidence, cls_id in zip(xyxy, confs, classes, strict=True):
            x1, y1, x2, y2 = [int(round(value)) for value in box.tolist()]
            x1 = max(0, min(width - 1, x1))
            y1 = max(0, min(height - 1, y1))
            x2 = max(x1 + 1, min(width, x2))
            y2 = max(y1 + 1, min(height, y2))
            class_name = str(names.get(int(cls_id), f"class-{int(cls_id)}"))
            kind = KIND_BY_CLASS.get(class_name, "unknown")
            elements.append(
                DetectionElement(
                    box=(x1, y1, x2, y2),
                    label=class_name,
                    kind=kind,
                    confidence=float(confidence),
                    interactive=kind in INTERACTIVE_KINDS,
                )
            )
        return suppress_nested_duplicates(elements) if use_denest else elements


def resolve_weights_path() -> Path | None:
    explicit = os.environ.get("SCREENPARSER_WEIGHTS_PATH")
    if explicit:
        path = Path(explicit)
        return path if path.is_file() else None

    weights_dir = Path(os.environ.get("SCREENPARSER_WEIGHTS_DIR", "/app/weights"))
    candidates = [
        weights_dir / "best.pt",
        weights_dir / "model.pt",
        Path(__file__).resolve().parent / "weights" / "best.pt",
    ]
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    return None


def try_load_detector() -> ScreenParserDetector | None:
    weights = resolve_weights_path()
    if weights is None:
        LOGGER.error("ScreenParser weights not found")
        return None
    device = os.environ.get("SCREENPARSER_DEVICE", "cpu")
    imgsz = int(os.environ.get("SCREENPARSER_IMGSZ", "1280"))
    try:
        return ScreenParserDetector(weights, device=device, imgsz=imgsz)
    except Exception:  # pragma: no cover
        LOGGER.exception("failed to load ScreenParser from %s", weights)
        return None


def decode_image_base64(payload: str) -> Image.Image:
    import base64
    import io

    try:
        raw = base64.b64decode(payload, validate=False)
    except Exception as exc:  # noqa: BLE001
        raise ValueError(f"invalid base64 image: {exc}") from exc
    try:
        return Image.open(io.BytesIO(raw))
    except Exception as exc:  # noqa: BLE001
        raise ValueError(f"could not decode image: {exc}") from exc
