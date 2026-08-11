# Bulwark OmniParser service

HTTP service for the Bulwark element-detection contract.

- Port: `8801`
- `GET /health` returns `{ "status": "ok", "model": "...", "weights_loaded": bool, "captioner_loaded": bool }`
- `POST /v1/detect` accepts `{ image_base64, surface, min_confidence?, max_overlap? }`

Backends:

1. **Heuristic** — Pillow + NumPy connected components (`OMNIPARSER_FORCE_HEURISTIC=1`)
2. **YOLO** — OmniParser `icon_detect` via Ultralytics
3. **YOLO + Florence** — same YOLO boxes, then OmniParser `icon_caption` Florence-2 labels (default in Compose)

CPU Florence is slow (minutes for busy pages). Set `OMNIPARSER_CAPTION=0` to skip captions.

```sh
# Local real weights (CPU)
../../scripts/setup-omniparser-local.sh
source .venv/bin/activate
export OMNIPARSER_WEIGHTS_DIR="$PWD/weights/icon_detect"
export OMNIPARSER_CAPTION_DIR="$PWD/weights/icon_caption"
export OMNIPARSER_DEVICE=cpu
uvicorn app:app --host 127.0.0.1 --port 8801
```

## Build (YOLO + Florence image)

```sh
docker build -t bulwark-omniparser services/omniparser
docker run --rm -p 8801:8801 bulwark-omniparser
```
