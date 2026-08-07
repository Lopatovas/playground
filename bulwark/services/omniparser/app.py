"""FastAPI entrypoint for the Bulwark OmniParser-compatible detector service."""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

try:
    from .heuristic import decode_image_base64, detect_elements
except ImportError:  # pragma: no cover - used when uvicorn imports app.py from this directory.
    from heuristic import decode_image_base64, detect_elements

LOGGER = logging.getLogger("bulwark.omniparser")
MODEL_NAME = "bulwark-omniparser-heuristic-v0"


class DetectionRequest(BaseModel):
    image_base64: str = Field(min_length=1)
    surface: Literal["design", "live"]
    min_confidence: float | None = Field(default=None, ge=0.0, le=1.0)
    max_overlap: float | None = Field(default=None, ge=0.0, le=1.0)


app = FastAPI(
    title="Bulwark OmniParser Service",
    version="0.1.0",
    description="OmniParser-compatible UI element detection for Bulwark.",
)


def _weights_loaded() -> bool:
    weights_dir = os.environ.get("OMNIPARSER_WEIGHTS_DIR")
    if not weights_dir:
        return False
    path = Path(weights_dir)
    if not path.exists():
        LOGGER.warning("OMNIPARSER_WEIGHTS_DIR does not exist: %s", path)
        return False

    LOGGER.info(
        "OMNIPARSER_WEIGHTS_DIR is present at %s, but this POC build has no OmniParser runtime; using heuristic fallback",
        path,
    )
    return False


WEIGHTS_LOADED = _weights_loaded()


@app.get("/health")
def health() -> dict[str, object]:
    return {"status": "ok", "model": MODEL_NAME, "weights_loaded": WEIGHTS_LOADED}


@app.post("/v1/detect")
def detect(request: DetectionRequest) -> dict[str, object]:
    try:
        image = decode_image_base64(request.image_base64)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    min_confidence = request.min_confidence if request.min_confidence is not None else 0.2
    max_overlap = request.max_overlap if request.max_overlap is not None else 0.6
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
