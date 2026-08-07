from __future__ import annotations

import base64
import unittest
from io import BytesIO

from PIL import Image, ImageDraw

from services.omniparser.heuristic import decode_image_base64, detect_elements


class OmniParserHeuristicTests(unittest.TestCase):
    def test_detects_basic_ui_shapes(self) -> None:
        image = Image.new("RGB", (220, 120), "white")
        draw = ImageDraw.Draw(image)
        draw.rectangle((20, 20, 145, 75), outline="black", width=2)
        draw.rectangle((34, 36, 115, 45), fill="black")
        draw.rectangle((170, 25, 194, 49), fill="black")

        elements = detect_elements(image, min_confidence=0.2, max_overlap=0.6)
        kinds = {element.kind for element in elements}

        self.assertIn("container", kinds)
        self.assertIn("text", kinds)
        self.assertIn("icon", kinds)
        for element in elements:
            x_min, y_min, x_max, y_max = element.box
            self.assertGreaterEqual(x_min, 0)
            self.assertGreaterEqual(y_min, 0)
            self.assertLessEqual(x_max, image.width)
            self.assertLessEqual(y_max, image.height)

    def test_decodes_data_url(self) -> None:
        image = Image.new("RGB", (4, 3), "white")
        buffer = BytesIO()
        image.save(buffer, format="PNG")
        encoded = base64.b64encode(buffer.getvalue()).decode("ascii")

        decoded = decode_image_base64(f"data:image/png;base64,{encoded}")

        self.assertEqual(decoded.size, (4, 3))


if __name__ == "__main__":
    unittest.main()
