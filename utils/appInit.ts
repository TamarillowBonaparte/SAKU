/**
 * App Initialization
 * Sets up Tesseract OCR on app startup (optional but recommended)
 */

import { initializeOCR } from "@/services/receiptService";

let ocrInitPromise: Promise<void> | null = null;

/**
 * Initialize OCR on app startup
 * This pre-loads the Tesseract model so first receipt scan is faster
 *
 * Call this in your root app layout (_layout.tsx)
 */
export async function setupAppServices() {
  if (ocrInitPromise) {
    return ocrInitPromise;
  }

  ocrInitPromise = (async () => {
    try {
      console.log("[App Init] Starting OCR initialization...");
      await initializeOCR();
      console.log("[App Init] ✓ OCR initialized successfully");
    } catch (error) {
      console.warn(
        "[App Init] OCR initialization failed (will retry on first use):",
        error,
      );
    }
  })();

  return ocrInitPromise;
}

/**
 * Call this to ensure OCR is ready before scanning
 * Useful if you want to guarantee OCR is loaded
 */
export async function ensureReceiptScannerReady() {
  if (ocrInitPromise) {
    return ocrInitPromise;
  }
  return setupAppServices();
}
