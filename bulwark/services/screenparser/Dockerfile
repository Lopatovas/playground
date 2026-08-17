FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    SCREENPARSER_WEIGHTS_DIR=/app/weights \
    SCREENPARSER_DEVICE=cpu \
    SCREENPARSER_IMGSZ=1280

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    libglib2.0-0 \
    libgl1 \
    libsm6 \
    libxext6 \
    libxrender1 \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./

# CPU torch only — same pattern as OmniParser; YOLO11-L is heavy enough without CUDA wheels.
RUN pip install --no-cache-dir \
      "numpy>=1.26.4,<2" \
      "pillow" \
      "fastapi" \
      "uvicorn[standard]" \
      "huggingface_hub>=0.24.0" \
  && pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu \
      "torch>=2.2.0,<2.7" "torchvision>=0.17.0,<0.22" \
  && pip install --no-cache-dir \
      "opencv-python-headless>=4.8,<4.11" \
      "ultralytics>=8.3.0,<8.5" \
  && pip uninstall -y opencv-python || true \
  && pip install --no-cache-dir --force-reinstall \
      "opencv-python-headless>=4.8,<4.11" \
      "numpy>=1.26.4,<2"

COPY download_weights.py ./
RUN python download_weights.py

COPY detector.py app.py ./

EXPOSE 8804
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8804"]
