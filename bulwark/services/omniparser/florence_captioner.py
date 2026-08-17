"""Florence-2 icon captioner (OmniParser icon_caption weights)."""

from __future__ import annotations

import logging
import os
import re
from pathlib import Path

from PIL import Image

LOGGER = logging.getLogger("bulwark.omniparser.florence")


class FlorenceCaptioner:
    """Captions UI crops with OmniParser's fine-tuned Florence-2."""

    def __init__(self, model_dir: Path, device: str = "cpu") -> None:
        import torch
        from transformers import AutoModelForCausalLM, AutoProcessor

        self.device = torch.device(device)
        self.dtype = torch.float32 if self.device.type == "cpu" else torch.float16
        # Processor config comes from upstream Florence-2; weights are OmniParser's.
        self.processor = AutoProcessor.from_pretrained(
            "microsoft/Florence-2-base",
            trust_remote_code=True,
        )
        self.model = AutoModelForCausalLM.from_pretrained(
            str(model_dir),
            torch_dtype=self.dtype,
            trust_remote_code=True,
        ).to(self.device)
        self.model.eval()
        self.batch_size = max(1, int(os.environ.get("OMNIPARSER_CAPTION_BATCH", "2")))
        self.model_name = f"omniparser-florence:{model_dir.name}"
        LOGGER.info(
            "loaded Florence captioner from %s on %s (batch=%s)",
            model_dir,
            self.device,
            self.batch_size,
        )

    def caption_crops(self, crops: list[Image.Image]) -> list[str]:
        if not crops:
            return []

        import torch

        captions: list[str] = []
        prompt = " "
        for start in range(0, len(crops), self.batch_size):
            batch = crops[start : start + self.batch_size]
            inputs = self.processor(
                images=batch,
                text=[prompt] * len(batch),
                return_tensors="pt",
                do_resize=False,
            )
            if self.device.type != "cpu":
                inputs = inputs.to(device=self.device, dtype=self.dtype)
            else:
                inputs = inputs.to(device=self.device)

            with torch.inference_mode():
                generated_ids = self.model.generate(
                    input_ids=inputs["input_ids"],
                    pixel_values=inputs["pixel_values"],
                    max_new_tokens=24,
                    num_beams=1,
                    do_sample=False,
                    early_stopping=False,
                )
            texts = self.processor.batch_decode(generated_ids, skip_special_tokens=True)
            captions.extend(_clean_caption(text) for text in texts)
        return captions


def resolve_caption_dir() -> Path | None:
    explicit = os.environ.get("OMNIPARSER_CAPTION_DIR")
    if explicit:
        path = Path(explicit)
        return path if path.is_dir() else None

    roots: list[Path] = []
    weights_dir = os.environ.get("OMNIPARSER_WEIGHTS_DIR")
    if weights_dir:
        root = Path(weights_dir)
        roots.extend(
            [
                root / "icon_caption",
                root.parent / "icon_caption",
                root,
            ]
        )
    local = Path(__file__).resolve().parent / "weights"
    roots.extend([local / "icon_caption", local])

    for candidate in roots:
        if (candidate / "config.json").is_file() or (candidate / "model.safetensors").is_file():
            return candidate
        # Some snapshots nest files one level deeper.
        nested = candidate / "icon_caption"
        if (nested / "config.json").is_file():
            return nested
    return None


def try_load_florence_captioner() -> FlorenceCaptioner | None:
    if os.environ.get("OMNIPARSER_CAPTION", "1").lower() in {"0", "false", "no", "off"}:
        LOGGER.info("Florence captioning disabled via OMNIPARSER_CAPTION")
        return None

    model_dir = resolve_caption_dir()
    if model_dir is None:
        LOGGER.info("Florence caption weights not found; labels will stay YOLO placeholders")
        return None

    device = os.environ.get("OMNIPARSER_DEVICE", "cpu")
    try:
        return FlorenceCaptioner(model_dir, device=device)
    except Exception:  # pragma: no cover
        LOGGER.exception("failed to load Florence captioner from %s", model_dir)
        return None


def crop_element(image: Image.Image, box: tuple[int, int, int, int], size: int = 64) -> Image.Image:
    x1, y1, x2, y2 = box
    crop = image.convert("RGB").crop((x1, y1, x2, y2))
    return crop.resize((size, size))


def kind_from_caption(caption: str, fallback: str) -> str:
    text = caption.lower()
    if any(token in text for token in ("button", "cta", "click", "submit", "sign in", "login")):
        return "container"
    if any(token in text for token in ("icon", "logo", "avatar", "checkbox", "radio")):
        return "icon"
    if any(token in text for token in ("image", "photo", "thumbnail", "picture")):
        return "image"
    if any(token in text for token in ("text", "label", "heading", "title", "paragraph", "link")):
        return "text"
    return fallback


def _clean_caption(raw: str) -> str:
    text = raw.strip()
    text = re.sub(r"^caption\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s+", " ", text).strip(" .")
    if not text:
        return "ui element"
    # Keep labels short for the defect list.
    if len(text) > 48:
        text = text[:45].rstrip() + "…"
    return text
