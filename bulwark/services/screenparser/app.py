"""FastAPI entrypoint for the Bulwark ScreenParser detector service."""

from __future__ import annotations

import logging
import os
from typing import Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

try:
    from .detector import decode_image_base64, try_load_detector
except ImportError:  # pragma: no cover
    from detector import decode_image_base64, try_load_detector

LOGGER = logging.getLogger("bulwark.screenparser")
logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"))

DETECTOR = try_load_detector()
if DETECTOR is not None:
    MODEL_NAME = DETECTOR.model_name
    WEIGHTS_LOADED = True
    LOGGER.info("detector backend: %s", MODEL_NAME)
else:
    MODEL_NAME = "screenparser:unavailable"
    WEIGHTS_LOADED = False
    LOGGER.error("ScreenParser weights failed to load")


class DetectionRequest(BaseModel):
    image_base64: str = Field(min_length=1)
    surface: Literal["design", "live"]
    min_confidence: float | None = Field(default=None, ge=0.0, le=1.0)
    max_overlap: float | None = Field(default=None, ge=0.0, le=1.0)
    # Optional A/B knobs (default to service env / tuned behavior).
    agnostic_nms: bool | None = None
    denest: bool | None = None


app = FastAPI(
    title="Bulwark ScreenParser Service",
    version="0.1.0",
    description="docling ScreenParser (YOLO11-L) UI element detection for Bulwark.",
)


@app.get("/health")
def health() -> dict[str, object]:
    return {
        "status": "ok" if WEIGHTS_LOADED else "degraded",
        "model": MODEL_NAME,
        "weights_loaded": WEIGHTS_LOADED,
    }


@app.post("/v1/detect")
def detect(request: DetectionRequest) -> dict[str, object]:
    if DETECTOR is None:
        raise HTTPException(status_code=503, detail="ScreenParser weights are not loaded")

    try:
        image = decode_image_base64(request.image_base64)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    # HF docs default conf=0.10 / iou=0.10 for dense UI inventory.
    min_confidence = request.min_confidence if request.min_confidence is not None else 0.1
    max_overlap = request.max_overlap if request.max_overlap is not None else 0.1

    elements = DETECTOR.detect(
        image,
        min_confidence=min_confidence,
        max_overlap=max_overlap,
        agnostic_nms=request.agnostic_nms,
        denest=request.denest,
    )
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
