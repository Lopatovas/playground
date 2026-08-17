FROM python:3.11-slim

# PaddleOCR CPU service — real weights, same contract as the heuristic stub.
ENV PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PADDLEOCR_LANG=en \
    FLAGS_use_mkldnn=0 \
    HOME=/root

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    libglib2.0-0 \
    libgl1 \
    libgomp1 \
    libsm6 \
    libxext6 \
    libxrender1 \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt requirements-paddle.txt ./

RUN pip install --no-cache-dir \
      "numpy>=1.26.4,<2" \
      "pillow" \
      "fastapi" \
      "uvicorn[standard]" \
  && pip install --no-cache-dir \
      -i https://www.paddlepaddle.org.cn/packages/stable/cpu/ \
      "paddlepaddle==2.6.2" \
  && pip install --no-cache-dir \
      "paddleocr==2.7.3" \
      "opencv-python-headless>=4.8,<4.11" \
  && pip uninstall -y opencv-python || true \
  && pip install --no-cache-dir --force-reinstall \
      "opencv-python-headless>=4.8,<4.11" \
      "numpy>=1.26.4,<2"

COPY download_models.py ./
RUN python download_models.py

COPY heuristic.py app.py ./

EXPOSE 8802
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8802"]
