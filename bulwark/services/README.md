# Bulwark vision services

This directory contains Docker-friendly Python HTTP services that implement the
wire contracts in `packages/adapters/src/vision/contract.ts`.

## OmniParser-compatible detector

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

The current POC uses a deterministic connected-component detector over color
and edge masks. It classifies regions roughly as `text`, `icon`, `image`,
`container`, or `unknown` based on aspect ratio, size, fill ratio, and color
variance. If `OMNIPARSER_WEIGHTS_DIR` is set and points at a real directory the
service logs that it found the directory, but this POC image does not bundle an
OmniParser runtime, so `/health` still reports `"weights_loaded": false`.

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
the package is installed. The default `requirements.txt` intentionally excludes
PaddleOCR to avoid heavyweight model downloads during Docker builds. When
PaddleOCR is not available, the fallback first tries `pytesseract` if it is
installed and working; otherwise it returns a single tight bounding box around
non-background ink with empty text. If no ink-like pixels are found it returns
an empty `runs` array.

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
