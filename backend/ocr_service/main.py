"""
Receipt OCR Service
Uses Tesseract OCR with image preprocessing for Indonesian receipts.
"""
import os
import sys
import time
import logging
import tempfile
import io
import re

from flask import Flask, request, jsonify

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [OCR] %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

app = Flask(__name__)

# ── Image processing helpers ──────────────────────────────────────────────────
def preprocess_image(img):
    """Preprocess image for better OCR accuracy on thermal receipts."""
    import cv2
    import numpy as np

    # Convert PIL → numpy if needed
    if not isinstance(img, np.ndarray):
        img = np.array(img)

    # Convert to grayscale
    if len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img.copy()

    # Upscale if small (Tesseract performs better at ~300 DPI equivalent)
    h, w = gray.shape
    if max(h, w) < 1500:
        scale = 2.0
        gray = cv2.resize(gray, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_CUBIC)

    # Denoise
    gray = cv2.fastNlMeansDenoising(gray, h=10)

    # Adaptive thresholding — handles uneven lighting on thermal receipts
    binary = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=31,
        C=15
    )

    # Deskew (auto-rotate)
    coords = np.column_stack(np.where(binary < 128))
    if len(coords) > 0:
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = 90 + angle
        if abs(angle) > 0.5:
            (ch, cw) = binary.shape[:2]
            M = cv2.getRotationMatrix2D((cw // 2, ch // 2), angle, 1.0)
            binary = cv2.warpAffine(binary, M, (cw, ch), flags=cv2.INTER_CUBIC,
                                    borderMode=cv2.BORDER_REPLICATE)

    return binary


def run_tesseract(img_array):
    """Run Tesseract OCR with multiple PSM modes and return best result."""
    import pytesseract

    # Try to detect tesseract path on Windows
    possible_paths = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        r"C:\Users\%s\AppData\Local\Tesseract-OCR\tesseract.exe" % os.environ.get("USERNAME", ""),
    ]
    for p in possible_paths:
        expanded = os.path.expandvars(p)
        if os.path.exists(expanded):
            pytesseract.pytesseract.tesseract_cmd = expanded
            break

    # Detect available languages
    try:
        langs_out = pytesseract.get_languages()
        available = set(langs_out)
    except Exception:
        available = {"eng"}

    lang = "ind+eng" if "ind" in available else "eng"
    log.info(f"Using OCR language: {lang}, available: {available}")

    custom_oem_psm_config = f"--oem 3 --psm 6 -l {lang}"

    # PSM modes to try (6=block, 4=column, 3=auto)
    psm_modes = [6, 4, 3]
    best_text = ""
    best_len = 0

    for psm in psm_modes:
        try:
            cfg = f"--oem 3 --psm {psm} -l {lang}"
            text = pytesseract.image_to_string(img_array, config=cfg)
            text = text.strip()
            if len(text) > best_len:
                best_len = len(text)
                best_text = text
        except Exception as e:
            log.warning(f"PSM {psm} failed: {e}")
            continue

    return best_text


# ── OCR endpoint ──────────────────────────────────────────────────────────────
@app.route("/ocr", methods=["POST"])
def ocr():
    start = time.time()

    if "image" not in request.files:
        return jsonify({"error": "Field 'image' tidak ditemukan"}), 400

    file = request.files["image"]
    if not file or file.filename == "":
        return jsonify({"error": "File kosong"}), 400

    try:
        from PIL import Image
        import numpy as np

        img_bytes = file.read()
        if len(img_bytes) == 0:
            return jsonify({"error": "File gambar kosong"}), 400

        pil_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        log.info(f"Image size: {pil_img.size}")

        # Preprocess
        try:
            processed = preprocess_image(pil_img)
        except Exception as e:
            log.warning(f"Preprocessing failed, using original: {e}")
            import numpy as np
            processed = np.array(pil_img.convert("L"))

        # OCR
        raw_text = run_tesseract(processed)

        if not raw_text.strip():
            return jsonify({"error": "Tidak ada teks terdeteksi"}), 422

        lines = [l.strip() for l in raw_text.split("\n") if l.strip()]
        elapsed = time.time() - start

        # Simple confidence heuristic
        has_number = bool(re.search(r'\d{3,}', raw_text))
        has_keyword = bool(re.search(r'total|harga|bayar|jumlah|rp', raw_text, re.IGNORECASE))
        confidence = 85.0 if (has_number and has_keyword) else (65.0 if has_number else 40.0)

        log.info(f"OCR done: {len(lines)} lines, {len(raw_text)} chars, {elapsed:.2f}s")

        return jsonify({
            "raw_text": raw_text,
            "line_count": len(lines),
            "confidence": confidence,
            "processing_time_s": round(elapsed, 2),
        })

    except Exception as e:
        log.error(f"OCR error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "receipt-ocr"}), 200


if __name__ == "__main__":
    port = int(os.environ.get("OCR_PORT", 8090))
    log.info(f"🚀 Receipt OCR service starting on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)
