package services

import (
	"bytes"
	"context"
	"errors"
	"financial-freedom/config"
	"fmt"
	"log"
	"os"
	"os/exec"
	"strings"
	"time"
)

type ReceiptOCRService interface {
	ScanImage(ctx context.Context, imageBytes []byte) (string, error)
}

type receiptOCRService struct {
	tesseractCmd string
	timeout      time.Duration
	lang         string
}

func NewReceiptOCRService() ReceiptOCRService {
	// Detect available languages and pick the best combo
	tesseractCmd := config.GetEnv("TESSERACT_CMD", "tesseract")
	lang := detectBestLanguage(tesseractCmd)
	log.Printf("🔤 OCR language selected: %s", lang)
	return &receiptOCRService{
		tesseractCmd: tesseractCmd,
		timeout:      30 * time.Second,
		lang:         lang,
	}
}

// detectBestLanguage tries to find the best available Tesseract language for Indonesian receipts.
func detectBestLanguage(tesseractCmd string) string {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var out bytes.Buffer
	cmd := exec.CommandContext(ctx, tesseractCmd, "--list-langs")
	cmd.Stdout = &out
	cmd.Stderr = &out
	if err := cmd.Run(); err != nil {
		log.Printf("⚠️  Could not detect Tesseract languages: %v", err)
		return "eng"
	}

	output := out.String()
	hasInd := strings.Contains(output, "ind")
	hasEng := strings.Contains(output, "eng")

	if hasInd && hasEng {
		return "eng+ind"
	} else if hasInd {
		return "ind"
	}
	// Default fallback — eng is always present
	return "eng"
}

func (s *receiptOCRService) ScanImage(ctx context.Context, imageBytes []byte) (string, error) {
	if len(imageBytes) == 0 {
		return "", errors.New("file gambar kosong")
	}

	// Check if tesseract is available
	if err := s.checkTesseractAvailable(); err != nil {
		log.Printf("❌ Tesseract not available: %v", err)
		log.Printf("💡 Windows: download from https://github.com/UB-Mannheim/tesseract/wiki")
		log.Printf("💡 Linux:   sudo apt-get install tesseract-ocr tesseract-ocr-ind")
		log.Printf("💡 Mac:     brew install tesseract")
		return "", fmt.Errorf("Tesseract tidak terinstall. Unduh di: https://github.com/UB-Mannheim/tesseract/wiki. Error: %v", err)
	}

	// Write image to a temp file
	tmpDir := os.TempDir()
	inputFile, err := os.CreateTemp(tmpDir, "receipt-*.png")
	if err != nil {
		log.Printf("Failed to create temp file in %s: %v", tmpDir, err)
		return "", fmt.Errorf("gagal membuat file sementara: %v", err)
	}
	inputPath := inputFile.Name()
	defer os.Remove(inputPath)

	if _, err = inputFile.Write(imageBytes); err != nil {
		inputFile.Close()
		return "", fmt.Errorf("gagal menulis file gambar: %v", err)
	}
	if err = inputFile.Close(); err != nil {
		return "", fmt.Errorf("gagal menutup file: %v", err)
	}

	// Try PSM 4 first — single column, best for narrow thermal receipts
	result, err := s.runTesseract(ctx, inputPath, "4")
	if err == nil && strings.TrimSpace(result) != "" {
		log.Printf("✅ OCR success (PSM 4): %d chars", len(result))
		return result, nil
	}
	if err != nil {
		log.Printf("⚠️  OCR PSM 4 failed: %v — retrying with PSM 6", err)
	} else {
		log.Printf("⚠️  OCR PSM 4 empty — retrying with PSM 6")
	}

	// Fallback: PSM 6 — uniform block of text
	result, err = s.runTesseract(ctx, inputPath, "6")
	if err == nil && strings.TrimSpace(result) != "" {
		log.Printf("✅ OCR success (PSM 6): %d chars", len(result))
		return result, nil
	}
	if err != nil {
		log.Printf("⚠️  OCR PSM 6 failed: %v — retrying with PSM 3", err)
	} else {
		log.Printf("⚠️  OCR PSM 6 empty — retrying with PSM 3")
	}

	// Last fallback: PSM 3 — fully automatic page segmentation
	result, err = s.runTesseract(ctx, inputPath, "3")
	if err != nil {
		return "", fmt.Errorf("OCR gagal setelah semua percobaan: %v", err)
	}

	trimmed := strings.TrimSpace(result)
	if trimmed == "" {
		log.Printf("⚠️  Semua mode OCR menghasilkan teks kosong (%d bytes)", len(imageBytes))
	}
	return trimmed, nil
}

// runTesseract runs tesseract with the given PSM mode and returns stdout.
func (s *receiptOCRService) runTesseract(ctx context.Context, inputPath string, psm string) (string, error) {
	runCtx, cancel := context.WithTimeout(ctx, s.timeout)
	defer cancel()

	var stdout, stderr bytes.Buffer

	cmd := exec.CommandContext(
		runCtx,
		s.tesseractCmd,
		inputPath,
		"stdout",
		"--oem", "3",   // default: LSTM + legacy fallback
		"--psm", psm,
		"-l", s.lang,
		"--dpi", "200", // hint for phone-captured receipts
		// Disable word-frequency & system dictionaries:
		// Without this, Tesseract "corrects" product names (e.g. INDOMIE → INDIE)
		"-c", "load_system_dawg=0",
		"-c", "load_freq_dawg=0",
	)
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		errMsg := strings.TrimSpace(stderr.String())
		if runCtx.Err() == context.DeadlineExceeded {
			return "", errors.New("OCR timeout")
		}
		if errMsg != "" {
			return "", fmt.Errorf("%s", errMsg)
		}
		return "", err
	}

	return stdout.String(), nil
}

func (s *receiptOCRService) checkTesseractAvailable() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, s.tesseractCmd, "--version")
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("tesseract not found at '%s': %v", s.tesseractCmd, err)
	}
	return nil
}
