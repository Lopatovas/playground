"""Download OmniParser YOLO + Florence caption weights."""

from __future__ import annotations

import os
import sys
from pathlib import Path

from huggingface_hub import hf_hub_download, snapshot_download


def download_yolo(dest_root: Path) -> Path:
    dest = dest_root / "icon_detect"
    dest.mkdir(parents=True, exist_ok=True)
    target = dest / "model.pt"
    if target.is_file() and target.stat().st_size > 1_000_000:
        print(f"YOLO weights already present: {target}")
        return target

    candidates = [
        ("microsoft/OmniParser-v2.0", "icon_detect/model.pt"),
        ("microsoft/OmniParser", "icon_detect/model.pt"),
    ]
    last_error: Exception | None = None
    for repo, filename in candidates:
        try:
            path = hf_hub_download(repo_id=repo, filename=filename)
            target.write_bytes(Path(path).read_bytes())
            print(f"downloaded {repo}/{filename} -> {target}")
            return target
        except Exception as exc:  # noqa: BLE001
            last_error = exc
    raise RuntimeError(f"could not download OmniParser YOLO weights: {last_error}")


def download_florence(dest_root: Path) -> Path:
    dest = dest_root / "icon_caption"
    marker = dest / "config.json"
    if marker.is_file():
        print(f"Florence caption weights already present: {dest}")
        return dest

    dest.mkdir(parents=True, exist_ok=True)
    try:
        snapshot_download(
            repo_id="microsoft/OmniParser-v2.0",
            allow_patterns=["icon_caption/*"],
            local_dir=str(dest_root),
        )
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError(f"could not download OmniParser Florence weights: {exc}") from exc

    # snapshot may place files under icon_caption/
    if not marker.is_file():
        nested = dest_root / "icon_caption"
        if (nested / "config.json").is_file():
            return nested
        raise RuntimeError(f"Florence download finished but config.json missing under {dest}")
    print(f"downloaded Florence caption weights -> {dest}")
    return dest


def main() -> int:
    dest_root = Path(os.environ.get("OMNIPARSER_WEIGHTS_ROOT", "/app/weights"))
    # Back-compat: if only WEIGHTS_DIR is set to .../icon_detect, use its parent.
    weights_dir = os.environ.get("OMNIPARSER_WEIGHTS_DIR")
    if weights_dir:
        path = Path(weights_dir)
        dest_root = path.parent if path.name in {"icon_detect", "icon_caption"} else path

    dest_root.mkdir(parents=True, exist_ok=True)
    try:
        yolo = download_yolo(dest_root)
        florence = download_florence(dest_root)
    except Exception as exc:  # noqa: BLE001
        print(str(exc), file=sys.stderr)
        return 1

    print(f"ready: yolo={yolo} florence={florence}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
