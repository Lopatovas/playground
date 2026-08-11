"""Download ScreenParser YOLO11-L weights from Hugging Face."""

from __future__ import annotations

import os
import sys
from pathlib import Path

from huggingface_hub import hf_hub_download

REPO_ID = "docling-project/ScreenParser"
FILENAME = "best.pt"


def download(dest_root: Path) -> Path:
    dest_root.mkdir(parents=True, exist_ok=True)
    target = dest_root / "best.pt"
    if target.is_file() and target.stat().st_size > 1_000_000:
        print(f"ScreenParser weights already present: {target}")
        return target

    path = hf_hub_download(repo_id=REPO_ID, filename=FILENAME)
    target.write_bytes(Path(path).read_bytes())
    print(f"downloaded {REPO_ID}/{FILENAME} -> {target}")
    return target


def main() -> int:
    dest_root = Path(os.environ.get("SCREENPARSER_WEIGHTS_DIR", "/app/weights"))
    try:
        path = download(dest_root)
    except Exception as exc:  # noqa: BLE001
        print(str(exc), file=sys.stderr)
        return 1
    print(f"ready: {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
