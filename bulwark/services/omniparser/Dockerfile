FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    OMNIPARSER_WEIGHTS_ROOT=/app/weights \
    OMNIPARSER_WEIGHTS_DIR=/app/weights/icon_detect \
    OMNIPARSER_CAPTION_DIR=/app/weights/icon_caption \
    OMNIPARSER_DEVICE=cpu \
    OMNIPARSER_CAPTION=1 \
    OMNIPARSER_CAPTION_BATCH=2 \
    TRANSFORMERS_VERBOSITY=error

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    git \
    libglib2.0-0 \
    libgl1 \
    libsm6 \
    libxext6 \
    libxrender1 \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt requirements-yolo.txt ./

# CPU wheels only — default torch pulls multi-GB CUDA libs we do not need in Docker Desktop.
RUN pip install --no-cache-dir \
      "numpy>=1.26.4,<2" \
      "pillow" \
      "fastapi" \
      "uvicorn[standard]" \
  && pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu \
      "torch>=2.2.0,<2.7" "torchvision>=0.17.0,<0.22" \
  && pip install --no-cache-dir \
      "opencv-python-headless>=4.8,<4.11" \
      "ultralytics>=8.3.0,<8.5" \
      "huggingface_hub>=0.24.0" \
      "transformers>=4.45.0,<4.50" \
      "einops>=0.8.0" \
      "timm>=1.0.0" \
      "accelerate>=0.34.0" \
  && pip uninstall -y opencv-python || true \
  && pip install --no-cache-dir --force-reinstall "opencv-python-headless>=4.8,<4.11" "numpy>=1.26.4,<2"

COPY download_weights.py ./
RUN python download_weights.py

COPY heuristic.py yolo_detector.py florence_captioner.py app.py ./

EXPOSE 8801
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8801"]
