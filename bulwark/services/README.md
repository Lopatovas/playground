# Bulwark vision services

This directory contains Docker-friendly Python HTTP services that implement the
wire contracts in `packages/adapters/src/vision/contract.ts`.

## ScreenParser detector

- Location: `services/screenparser`
- Port: `8804`
- Model: [docling-project/ScreenParser](https://huggingface.co/docling-project/ScreenParser) (YOLO11-L, 55 UI classes)
- Same `/health` + `/v1/detect` contract as OmniParser
- Defaults: `min_confidence=0.1`, `max_overlap=0.1`, `imgsz=1280`
- Labels are class names (Heading, Button, …); no OCR captions

## PaddleOCR recognizer

- Location: `services/omniparser`
- Port: `8801`
- Health: `GET /health`
- Detect: `POST /v1/detect`

Request:

```json
{
  "image_base64": "<base64 png/jpeg/webp>",
  "surface": "design",
  "min_confidence": 0.2,
  "max_overlap": 0.6
}
```

Response:

```json
{
  "model": "bulwark-omniparser-heuristic-v0",
  "image": { "width": 1024, "height": 768 },
  "elements": [
    {
      "box": [10, 20, 120, 48],
      "label": "heuristic-text",
      "kind": "text",
      "confidence": 0.58,
      "interactive": false
    }
  ]
}
```

The current POC defaults to a deterministic connected-component detector over color
and edge masks. It classifies regions roughly as `text`, `icon`, `image`,
`container`, or `unknown` based on aspect ratio, size, fill ratio, and color
variance.

When OmniParser YOLO weights are present (`OMNIPARSER_WEIGHTS_DIR` /
`OMNIPARSER_WEIGHTS_PATH`), the same service loads Ultralytics YOLO instead and
`/health` reports `"weights_loaded": true`.

When Florence caption weights are present (`OMNIPARSER_CAPTION_DIR`, default on),
each YOLO crop is captioned and returned as `label`. Disable with
`OMNIPARSER_CAPTION=0`. Expect multi-minute detects on CPU for busy pages.

The Compose image builds with YOLO + Florence and downloads Microsoft's
`icon_detect` / `icon_caption` checkpoints at image build time (CPU). For a host
venv instead, use `scripts/setup-omniparser-local.sh`.

## PaddleOCR-compatible recognizer

- Location: `services/paddleocr`
- Port: `8802`
- Health: `GET /health`
- Recognize: `POST /v1/recognize`

Request:

```json
{
  "image_base64": "<base64 png/jpeg/webp>",
  "min_confidence": 0.0
}
```

Response:

```json
{
  "model": "bulwark-paddleocr-heuristic-v0",
  "runs": [{ "box": [10, 20, 120, 48], "text": "", "confidence": 0.1 }]
}
```

At startup the service tries to import and initialize `paddleocr.PaddleOCR` if
the package is installed. The Compose image installs PaddlePaddle CPU + PaddleOCR
and warms English weights at build time. When PaddleOCR is not available, the
fallback first tries `pytesseract` if it is installed and working; otherwise it
returns a single tight bounding box around non-background ink with empty text.
If no ink-like pixels are found it returns an empty `runs` array.

## Local usage

```sh
cd services/omniparser
python3 -m pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8801
```

```sh
cd services/paddleocr
python3 -m pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8802
```

Both services accept plain base64 strings and `data:image/...;base64,...` data
URLs. The Node adapters post to `/v1/detect` and `/v1/recognize` respectively,
so those paths are kept exact.
