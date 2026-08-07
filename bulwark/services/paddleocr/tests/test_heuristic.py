from __future__ import annotations

import base64
import unittest
from io import BytesIO

from PIL import Image, ImageDraw

from services.paddleocr.heuristic import decode_image_base64, recognize_text_regions, tight_ink_box


class PaddleOcrHeuristicTests(unittest.TestCase):
    def test_tight_ink_box_bounds_foreground_pixels(self) -> None:
        image = Image.new("RGB", (160, 80), "white")
        draw = ImageDraw.Draw(image)
        draw.rectangle((30, 22, 110, 38), fill="black")

        self.assertEqual(tight_ink_box(image), (30, 22, 111, 39))

    def test_fallback_recognizer_returns_empty_text_run_for_ink(self) -> None:
        image = Image.new("RGB", (160, 80), "white")
        draw = ImageDraw.Draw(image)
        draw.rectangle((30, 22, 110, 38), fill="black")

        runs = recognize_text_regions(image, min_confidence=0.0)

        self.assertGreaterEqual(len(runs), 1)
        self.assertEqual(runs[0].box, (30, 22, 111, 39))
        self.assertIsInstance(runs[0].text, str)

    def test_decodes_plain_base64(self) -> None:
        image = Image.new("RGB", (5, 6), "white")
        buffer = BytesIO()
        image.save(buffer, format="PNG")
        encoded = base64.b64encode(buffer.getvalue()).decode("ascii")

        decoded = decode_image_base64(encoded)

        self.assertEqual(decoded.size, (5, 6))


if __name__ == "__main__":
    unittest.main()
