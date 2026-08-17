"""FastAPI entrypoint for the Bulwark OmniParser-compatible detector service."""

from __future__ import annotations

import logging
import os
from typing import Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

try:
    from .florence_captioner import try_load_florence_captioner
    from .heuristic import decode_image_base64, detect_elements
    from .yolo_detector import try_load_yolo_detector
except ImportError:  # pragma: no cover - used when uvicorn imports app.py from this directory.
    from florence_captioner import try_load_florence_captioner
    from heuristic import decode_image_base64, detect_elements
    from yolo_detector import try_load_yolo_detector

LOGGER = logging.getLogger("bulwark.omniparser")
logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"))

FORCE_HEURISTIC = os.environ.get("OMNIPARSER_FORCE_HEURISTIC", "").lower() in {
    "1",
    "true",
    "yes",
}

CAPTIONER = None if FORCE_HEURISTIC else try_load_florence_captioner()
YOLO = None if FORCE_HEURISTIC else try_load_yolo_detector(captioner=CAPTIONER)

if YOLO is not None:
    MODEL_NAME = YOLO.model_name
    WEIGHTS_LOADED = True
    LOGGER.info(
        "detector backend: %s (captioner=%s)",
        MODEL_NAME,
        CAPTIONER.model_name if CAPTIONER is not None else "none",
    )
else:
    MODEL_NAME = "bulwark-omniparser-heuristic-v0"
    WEIGHTS_LOADED = False
    LOGGER.info("detector backend: heuristic fallback")


class DetectionRequest(BaseModel):
    image_base64: str = Field(min_length=1)
    surface: Literal["design", "live"]
    min_confidence: float | None = Field(default=None, ge=0.0, le=1.0)
    max_overlap: float | None = Field(default=None, ge=0.0, le=1.0)


app = FastAPI(
    title="Bulwark OmniParser Service",
    version="0.3.0",
    description="OmniParser-compatible UI element detection for Bulwark (YOLO + optional Florence).",
)


@app.get("/health")
def health() -> dict[str, object]:
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "weights_loaded": WEIGHTS_LOADED,
        "captioner_loaded": CAPTIONER is not None,
    }


@app.post("/v1/detect")
def detect(request: DetectionRequest) -> dict[str, object]:
    try:
        image = decode_image_base64(request.image_base64)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    min_confidence = request.min_confidence if request.min_confidence is not None else 0.2
    max_overlap = request.max_overlap if request.max_overlap is not None else 0.6

    if YOLO is not None:
        elements = YOLO.detect(image, min_confidence=min_confidence, max_overlap=max_overlap)
    else:
        elements = detect_elements(image, min_confidence=min_confidence, max_overlap=max_overlap)

    return {
        "model": MODEL_NAME,
        "image": {"width": image.width, "height": image.height},
        "elements": [
            {
                "box": list(element.box),
                "label": element.label,
                "kind": element.kind,
                "confidence": element.confidence,
                "interactive": element.interactive,
            }
            for element in elements
        ],
    }
