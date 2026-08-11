#!/usr/bin/env bash
# Sets up a local OmniParser YOLO detector for Bulwark (CPU-friendly proof).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SVC="$ROOT/services/omniparser"
VENV="${OMNIPARSER_VENV:-$SVC/.venv}"
WEIGHTS_DIR="${OMNIPARSER_WEIGHTS_DIR:-$SVC/weights/icon_detect}"

pick_python() {
  if [[ -n "${OMNIPARSER_PYTHON:-}" ]]; then
    echo "$OMNIPARSER_PYTHON"
    return
  fi
  for candidate in python3.12 python3.11 python3.10; do
    if command -v "$candidate" >/dev/null 2>&1; then
      echo "$candidate"
      return
    fi
  done
  echo "python3"
}

PYTHON_BIN="$(pick_python)"
PY_VERSION="$("$PYTHON_BIN" -c 'import sys; print("%d.%d" % sys.version_info[:2])')"
case "$PY_VERSION" in
  3.10|3.11|3.12|3.13) ;;
  *)
    echo "PyTorch/Ultralytics need Python 3.10–3.13 (found $PY_VERSION via $PYTHON_BIN)." >&2
    echo "Install one with: brew install python@3.12" >&2
    echo "Then re-run with: OMNIPARSER_PYTHON=python3.12 $0" >&2
    exit 1
    ;;
esac

echo "==> Bulwark local OmniParser setup"
echo "    python:  $PYTHON_BIN ($PY_VERSION)"
echo "    service: $SVC"
echo "    venv:    $VENV"
echo "    weights: $WEIGHTS_DIR"

rm -rf "$VENV"
"$PYTHON_BIN" -m venv "$VENV"
# shellcheck disable=SC1091
source "$VENV/bin/activate"

python -m pip install --upgrade pip
python -m pip install -r "$SVC/requirements.txt" -r "$SVC/requirements-yolo.txt"
python -m pip install --index-url https://download.pytorch.org/whl/cpu \
  "torch>=2.2.0,<2.7" "torchvision>=0.17.0,<0.22" || \
  python -m pip install "torch>=2.2.0,<2.7" "torchvision>=0.17.0,<0.22"
python -m pip install "huggingface_hub>=0.24.0" \
  "transformers>=4.45.0,<4.50" "einops>=0.8.0" "timm>=1.0.0" "accelerate>=0.34.0"

WEIGHTS_ROOT="$(dirname "$WEIGHTS_DIR")"
mkdir -p "$WEIGHTS_DIR"
export OMNIPARSER_WEIGHTS_ROOT="$WEIGHTS_ROOT"
python "$SVC/download_weights.py"

cat <<EOF

==> Setup complete.

Run the detector (CPU; YOLO alone ~10–60s, YOLO+Florence can take minutes):

  source "$VENV/bin/activate"
  export OMNIPARSER_WEIGHTS_DIR="$WEIGHTS_DIR"
  export OMNIPARSER_CAPTION_DIR="$WEIGHTS_ROOT/icon_caption"
  export OMNIPARSER_DEVICE=cpu
  cd "$SVC"
  uvicorn app:app --host 127.0.0.1 --port 8801

Health check (weights_loaded + captioner_loaded should be true):

  curl -s http://127.0.0.1:8801/health

Wire Bulwark:
  - Full Docker (YOLO+Florence): docker compose up -d --build
  - Docker stack + host detector: docker compose -f docker-compose.yml -f docker-compose.omniparser-host.yml up -d
  - Local CLI: pnpm bulwark -- run -c demo/complex/bulwark.local.config.json

EOF
