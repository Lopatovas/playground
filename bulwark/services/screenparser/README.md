# ScreenParser detector

[docling-project/ScreenParser](https://huggingface.co/docling-project/ScreenParser) — YOLO11-L fine-tuned on ScreenParse v2 (55 UI classes). Speaks the same Bulwark `/v1/detect` contract as OmniParser.

```bash
docker compose up -d --build screenparser
curl -sf http://127.0.0.1:8804/health
```

Defaults: `conf=0.10`, `iou=0.10`, `imgsz=1280` (CPU). Boxes + class labels only — no OCR captions.
