# Bulwark PaddleOCR service

HTTP service for the Bulwark text-recognition contract.

- Port: `8802`
- `GET /health` returns `{ "status": "ok", "model": "...", "weights_loaded": bool }`
- `POST /v1/recognize` accepts `{ image_base64, min_confidence? }`

The default image installs only FastAPI, Uvicorn, Pillow, and NumPy. If
`paddleocr` is available at runtime, the service tries to initialize it and
reports `weights_loaded: true` on success. Otherwise it falls back to
`pytesseract` when available, then to a deterministic tight-ink-box detector
that returns empty text.

Set `PADDLEOCR_DISABLE=1` to force the heuristic path. Set `PADDLEOCR_LANG` to
change the language passed to PaddleOCR when it is installed.

## Run locally

```sh
python3 -m pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8802
```

## Build

```sh
docker build -t bulwark-paddleocr services/paddleocr
docker run --rm -p 8802:8802 bulwark-paddleocr
```
