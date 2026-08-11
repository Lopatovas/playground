"""FastAPI entrypoint for the Bulwark PaddleOCR-compatible recognizer service."""

from __future__ import annotations

import logging
import os
from typing import Any

import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

try:
    from .heuristic import RecognitionRun, decode_image_base64, recognize_text_regions
except ImportError:  # pragma: no cover - used when uvicorn imports app.py from this directory.
    from heuristic import RecognitionRun, decode_image_base64, recognize_text_regions

LOGGER = logging.getLogger("bulwark.paddleocr")
logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"))
FALLBACK_MODEL_NAME = "bulwark-paddleocr-heuristic-v0"


class RecognitionRequest(BaseModel):
    image_base64: str = Field(min_length=1)
    min_confidence: float | None = Field(default=None, ge=0.0, le=1.0)


app = FastAPI(
    title="Bulwark PaddleOCR Service",
    version="0.2.0",
    description="PaddleOCR text recognition for Bulwark (CPU). Falls back to ink heuristic if disabled.",
)


def _load_paddleocr() -> Any | None:
    if os.environ.get("PADDLEOCR_DISABLE", "").lower() in {"1", "true", "yes"}:
        LOGGER.info("PaddleOCR disabled via PADDLEOCR_DISABLE")
        return None

    try:
        from paddleocr import PaddleOCR
    except Exception as exc:
        LOGGER.info("PaddleOCR is not importable; using heuristic fallback: %s", exc)
        return None

    language = os.environ.get("PADDLEOCR_LANG", "en")
    try:
        engine = PaddleOCR(use_angle_cls=True, lang=language, show_log=False, use_gpu=False)
    except TypeError:
        try:
            engine = PaddleOCR(lang=language, use_angle_cls=True)
        except Exception as exc:
            LOGGER.warning("PaddleOCR could not initialize; using heuristic fallback: %s", exc)
            return None
    except Exception as exc:
        LOGGER.warning("PaddleOCR could not initialize; using heuristic fallback: %s", exc)
        return None

    LOGGER.info("detector backend: PaddleOCR (lang=%s)", language)
    return engine


OCR_ENGINE = _load_paddleocr()
MODEL_NAME = (
    f"paddleocr:{os.environ.get('PADDLEOCR_LANG', 'en')}"
    if OCR_ENGINE is not None
    else FALLBACK_MODEL_NAME
)
WEIGHTS_LOADED = OCR_ENGINE is not None


@app.get("/health")
def health() -> dict[str, object]:
    return {"status": "ok", "model": MODEL_NAME, "weights_loaded": WEIGHTS_LOADED}


@app.post("/v1/recognize")
def recognize(request: RecognitionRequest) -> dict[str, object]:
    try:
        image = decode_image_base64(request.image_base64)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    min_confidence = request.min_confidence if request.min_confidence is not None else 0.0
    runs = _recognize_with_paddle(image, min_confidence=min_confidence) if OCR_ENGINE else []
    model = MODEL_NAME
    if not runs:
        runs = recognize_text_regions(image, min_confidence=min_confidence)
        if OCR_ENGINE is None:
            model = FALLBACK_MODEL_NAME
        elif runs:
            model = f"{MODEL_NAME}+heuristic-fallback"

    return {
        "model": model,
        "runs": [
            {"box": list(run.box), "text": run.text, "confidence": run.confidence}
            for run in runs
        ],
    }


def _recognize_with_paddle(image: Any, *, min_confidence: float) -> list[RecognitionRun]:
    rgb = np.asarray(image.convert("RGB"))
    try:
        result = OCR_ENGINE.ocr(rgb, cls=True)
    except TypeError:
        try:
            result = OCR_ENGINE.ocr(rgb)
        except Exception as exc:
            LOGGER.warning("PaddleOCR request failed; using heuristic fallback: %s", exc)
            return []
    except Exception as exc:
        LOGGER.warning("PaddleOCR request failed; using heuristic fallback: %s", exc)
        return []

    runs = _extract_paddle_runs(result)
    return [run for run in runs if run.confidence >= min_confidence]


def _extract_paddle_runs(result: Any) -> list[RecognitionRun]:
    if isinstance(result, dict):
        return _extract_paddle_dict_runs(result)

    runs: list[RecognitionRun] = []
    for item in _flatten_paddle_items(result):
        parsed = _parse_paddle_item(item)
        if parsed is not None:
            runs.append(parsed)
    return runs


def _extract_paddle_dict_runs(result: dict[str, Any]) -> list[RecognitionRun]:
    texts = result.get("rec_texts") or result.get("texts") or []
    scores = result.get("rec_scores") or result.get("scores") or []
    boxes = result.get("rec_boxes") or result.get("dt_polys") or result.get("boxes") or []

    runs: list[RecognitionRun] = []
    for index, text in enumerate(texts):
        if index >= len(boxes):
            break
        confidence = float(scores[index]) if index < len(scores) else 1.0
        box = _points_to_box(boxes[index])
        if box is None:
            continue
        runs.append(
            RecognitionRun(box=box, text=str(text), confidence=min(1.0, max(0.0, confidence)))
        )
    return runs


def _flatten_paddle_items(result: Any) -> list[Any]:
    if not isinstance(result, list):
        return []
    if _looks_like_paddle_item(result):
        return [result]

    items: list[Any] = []
    for entry in result:
        if entry is None:
            continue
        if _looks_like_paddle_item(entry):
            items.append(entry)
        elif isinstance(entry, list):
            items.extend(_flatten_paddle_items(entry))
    return items


def _looks_like_paddle_item(value: Any) -> bool:
    if not (
        isinstance(value, (list, tuple))
        and len(value) >= 2
        and isinstance(value[1], (list, tuple))
        and len(value[1]) >= 2
        and isinstance(value[1][0], str)
    ):
        return False
    try:
        float(value[1][1])
    except (TypeError, ValueError):
        return False
    return True


def _parse_paddle_item(item: Any) -> RecognitionRun | None:
    try:
        box = _points_to_box(item[0])
        text = str(item[1][0])
        confidence = float(item[1][1])
    except (TypeError, ValueError, IndexError):
        return None

    if box is None:
        return None
    return RecognitionRun(box=box, text=text, confidence=min(1.0, max(0.0, confidence)))


def _points_to_box(points: Any) -> tuple[int, int, int, int] | None:
    array = np.asarray(points, dtype=float)
    if array.size < 4:
        return None
    array = array.reshape(-1, 2)
    x_min = int(np.floor(np.min(array[:, 0])))
    y_min = int(np.floor(np.min(array[:, 1])))
    x_max = int(np.ceil(np.max(array[:, 0])))
    y_max = int(np.ceil(np.max(array[:, 1])))
    if x_max <= x_min or y_max <= y_min:
        return None
    return (x_min, y_min, x_max, y_max)
