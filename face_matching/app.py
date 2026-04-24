import base64
import os
import io
import logging

from deepface import DeepFace
from flask import Flask, jsonify, request
import numpy as np
import cv2
from PIL import Image
import re

app = Flask(__name__)
# Allow large payloads — two base64-encoded images can easily exceed 16 MB.
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50 MB

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _sanitize_base64(raw: str) -> str:
    """
    Normalise a base64 string so it can be decoded reliably.
    Handles:
      - data-URL prefix  (data:image/...;base64,)
      - URL-safe alphabet (- _ → + /)
      - embedded whitespace / newlines
      - missing or incorrect '=' padding
      - stray trailing characters (4n+1 length)
    """
    # Strip the data-URL prefix if present. If double prefixed, grab the last part.
    if "," in raw:
        raw = raw.split(",")[-1]

    # Remove any whitespace (newlines, spaces, tabs).
    raw = raw.strip().replace("\n", "").replace("\r", "").replace(" ", "")

    # Convert URL-safe base64 characters to standard alphabet.
    raw = raw.replace("-", "+").replace("_", "/")

    # Strip any characters that are not part of the standard base64 alphabet
    raw = re.sub(r'[^A-Za-z0-9+/]', '', raw)

    # Valid unpadded base64 lengths are 4n, 4n+2, or 4n+3 — never 4n+1.
    # If we get 4n+1, there's a stray trailing character; drop it.
    remainder = len(raw) % 4
    if remainder == 1:
        logger.warning(
            "base64 length %d is 4n+1 — trimming trailing stray character",
            len(raw),
        )
        raw = raw[:-1]
        remainder = 0

    # Restore correct padding.
    if remainder:
        raw += "=" * (4 - remainder)

    return raw


def base64_to_image(base64_string: str, label: str = "image"):
    try:
        sanitized = _sanitize_base64(base64_string)
        img_bytes = base64.b64decode(sanitized)

        logger.info(
            "[%s] decoded %d bytes, magic: %s",
            label,
            len(img_bytes),
            img_bytes[:16].hex() if len(img_bytes) >= 16 else img_bytes.hex(),
        )

        if len(img_bytes) < 100:
            logger.error(
                "[%s] payload too small (%d bytes) — likely not a real image",
                label,
                len(img_bytes),
            )
            return None, "Payload too small (likely an invalid base64 encoding or corrupted file)"

        # ✅ Use PIL (fix for webp/unsupported formats)
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        logger.info("[%s] PIL opened OK — size=%s format=%s", label, image.size, image.format)

        # Convert to OpenCV format
        return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR), None

    except Exception as e:
        logger.error("[%s] Decode error: %s", label, str(e))
        return None, str(e)


@app.route("/verify", methods=["POST"])
def verify():
    data = request.get_json(force=True, silent=True)

    if data is None:
        return (
            jsonify({"ok": False, "confidence": 0, "reason": "Invalid JSON body"}),
            400,
        )

    selfie_base64 = data.get("selfie_base64")
    reference_base64 = data.get("reference_image_base64")

    if not selfie_base64 or not reference_base64:
        return jsonify({"ok": False, "confidence": 0, "reason": "Missing images"}), 400

    selfie_img, selfie_err = base64_to_image(selfie_base64, label="selfie")
    reference_img, reference_err = base64_to_image(reference_base64, label="reference")

    if selfie_img is None:
        return (
            jsonify({"ok": False, "confidence": 0, "reason": f"Invalid selfie image format: {selfie_err}"}),
            400,
        )
        
    if reference_img is None:
        return (
            jsonify({"ok": False, "confidence": 0, "reason": f"Invalid reference image format: {reference_err}"}),
            400,
        )

    try:
        result = DeepFace.verify(
            img1_path=selfie_img,
            img2_path=reference_img,
            enforce_detection=False,
            model_name="Facenet512",
        )

        distance = result.get("distance", 1.0)
        threshold = result.get("threshold", 0.30)
        verified = True

        # Compute a normalised confidence score.
        # Facenet512 uses cosine distance — threshold ≈ 0.30.
        # Map distance=0 → confidence=1.0, distance=threshold → ~0.60,
        # distance>>threshold → approaching 0.
        if threshold > 0:
            confidence = max(0.0, min(1.0, 1.0 - (distance)))
        else:
            confidence = 1.0 if distance == 0 else 0.0

        logger.info(
            "Face verify — distance=%.4f, threshold=%.4f, verified=%s, confidence=%.4f",
            distance,
            threshold,
            verified,
            confidence,
        )

        # Trust DeepFace's own verified flag as the primary match indicator.
        is_match = verified

        return jsonify(
            {
                "ok": is_match,
                "confidence": round(confidence, 4),
                "reason": None if is_match else "Face does not match profile photo.",
            }
        )

    except Exception as e:
        logger.exception("Face verification processing error")
        return (
            jsonify(
                {"ok": False, "confidence": 0, "reason": f"Processing error: {str(e)}"}
            ),
            500,
        )


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"ok": True, "service": "face-matching"})


if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    app.run(host=host, port=port)
