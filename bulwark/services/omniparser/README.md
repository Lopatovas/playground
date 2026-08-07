# Bulwark OmniParser service

HTTP service for the Bulwark element-detection contract.

- Port: `8801`
- `GET /health` returns `{ "status": "ok", "model": "...", "weights_loaded": false }`
- `POST /v1/detect` accepts `{ image_base64, surface, min_confidence?, max_overlap? }`

The default implementation is a deterministic Pillow + NumPy heuristic. It
does not download weights at build time and can run in a slim Python container.
Set `OMNIPARSER_WEIGHTS_DIR` to point at external weights for future real-model
integration; this POC still reports `weights_loaded: false` unless a real
runtime is added.

## Run locally

```sh
python3 -m pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8801
```

## Build

```sh
docker build -t bulwark-omniparser services/omniparser
docker run --rm -p 8801:8801 bulwark-omniparser
```
