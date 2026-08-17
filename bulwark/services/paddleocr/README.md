# Bulwark PaddleOCR service

HTTP service for the Bulwark text-recognition contract.

- Port: `8802`
- `GET /health` → `{ "status": "ok", "model": "paddleocr:en", "weights_loaded": true }`
- `POST /v1/recognize` → `{ image_base64, min_confidence? }` → `{ model, runs: [{ box, text, confidence }] }`

## Docker (recommended)

The Compose image installs **PaddlePaddle CPU + PaddleOCR 2.7** and downloads English
det/rec/cls weights at build time (same pattern as OmniParser).

```sh
docker compose build paddleocr
docker compose up -d paddleocr
curl -s http://127.0.0.1:8802/health
```

Disable real OCR (heuristic only):

```yaml
environment:
  PADDLEOCR_DISABLE: "1"
```

## Local (optional)

Needs Python 3.10–3.11 typically:

```sh
pip install -r requirements.txt
pip install -r requirements-paddle.txt -i https://www.paddlepaddle.org.cn/packages/stable/cpu/
# paddlepaddle pin is in requirements-paddle.txt; install paddle from the CPU index first if needed
python download_models.py
uvicorn app:app --host 127.0.0.1 --port 8802
```

## Wire into Bulwark

In `bulwark.config.json`:

```json
"recognizer": {
  "kind": "paddleocr",
  "baseUrl": "http://paddleocr:8802",
  "timeoutMs": 120000
}
```

Demos still default to `ink-projection` until you flip that knob.
