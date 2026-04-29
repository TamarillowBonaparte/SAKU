/**
 * Receipt Scanner Hook
 * Provides receipt scanning functionality to React components
 */

import {
    ReceiptData,
    initializeOCR,
    processReceiptImage,
} from "@/services/receiptService";
import { useCallback, useRef } from "react";

export interface UseReceiptScannerOptions {
  onSuccess?: (data: ReceiptData) => void;
  onError?: (error: Error) => void;
}

export function useReceiptScanner(options: UseReceiptScannerOptions = {}) {
  const isInitialized = useRef(false);

  /**
   * Initialize OCR on first use
   */
  const initialize = useCallback(async () => {
    if (!isInitialized.current) {
      try {
        await initializeOCR();
        isInitialized.current = true;
      } catch (error) {
        console.error("Failed to initialize OCR:", error);
        if (options.onError) {
          options.onError(error as Error);
        }
      }
    }
  }, [options]);

  /**
   * Process receipt image
   */
  const processReceipt = useCallback(
    async (imageUri: string) => {
      try {
        await initialize();
        const result = await processReceiptImage(imageUri);

        if (options.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (error) {
        console.error("Receipt processing failed:", error);
        if (options.onError) {
          options.onError(error as Error);
        }
        throw error;
      }
    },
    [initialize, options],
  );

  /**
   * Cleanup OCR worker
   */
  const cleanup = useCallback(async () => {
    try {
      // OCR runs on backend — no client-side cleanup needed
      isInitialized.current = false;
    } catch (error) {
      console.error("OCR cleanup failed:", error);
    }
  }, []);

  return {
    processReceipt,
    initialize,
    cleanup,
    isInitialized: isInitialized.current,
  };
}
