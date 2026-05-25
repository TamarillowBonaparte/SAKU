package services

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"financial-freedom/config"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"
)

// ─── Interface ────────────────────────────────────────────────────────────────

type ReceiptOCRService interface {
	ScanImage(ctx context.Context, imageBytes []byte) (string, error)
	Shutdown()
}

// ─── PaddleOCR response ───────────────────────────────────────────────────────

type paddleOCRResponse struct {
	RawText        string  `json:"raw_text"`
	Confidence     float64 `json:"confidence"`
	LineCount      int     `json:"line_count"`
	ProcessingTime float64 `json:"processing_time_s"`
}

// ─── Service ──────────────────────────────────────────────────────────────────

type paddleOCRService struct {
	serviceURL string
	httpClient *http.Client
	process    *os.Process
	mu         sync.Mutex
}

func NewReceiptOCRService() ReceiptOCRService {
	url := config.GetEnv("PADDLE_OCR_URL", "http://localhost:8090/ocr")

	svc := &paddleOCRService{
		serviceURL: url,
		httpClient: &http.Client{Timeout: 90 * time.Second},
	}

	// Jika URL mengarah ke localhost, coba spawn Python service otomatis
	if strings.Contains(url, "localhost") || strings.Contains(url, "127.0.0.1") {
		svc.ensureServiceRunning()
	}

	return svc
}

// ensureServiceRunning: cek apakah service sudah jalan; jika belum, spawn.
func (s *paddleOCRService) ensureServiceRunning() {
	if s.isHealthy() {
		log.Println("✅ PaddleOCR service sudah berjalan")
		return
	}
	log.Println("🔄 PaddleOCR service belum jalan — mencoba spawn otomatis...")
	if err := s.spawnPythonService(); err != nil {
		log.Printf("⚠️  Gagal spawn PaddleOCR service: %v", err)
		log.Println("💡 Jalankan manual: cd backend/ocr_service && start.bat")
	}
}

// spawnPythonService mencari direktori ocr_service dan menjalankan main.py.
func (s *paddleOCRService) spawnPythonService() error {
	ocrDir, err := findOCRServiceDir()
	if err != nil {
		return fmt.Errorf("direktori ocr_service tidak ditemukan: %v", err)
	}

	pythonCmd := detectPython()
	if pythonCmd == "" {
		return errors.New("Python 3 tidak ditemukan. Install Python 3.8+ dan tambahkan ke PATH")
	}

	mainPy := filepath.Join(ocrDir, "main.py")
	if _, err := os.Stat(mainPy); os.IsNotExist(err) {
		return fmt.Errorf("main.py tidak ditemukan di %s", ocrDir)
	}

	// Install dependencies jika belum (non-blocking, lanjut ke spawn)
	go s.installDeps(pythonCmd, ocrDir)

	log.Printf("🐍 Spawning: %s %s (dir: %s)", pythonCmd, mainPy, ocrDir)
	cmd := exec.Command(pythonCmd, mainPy)
	cmd.Dir = ocrDir
	cmd.Stdout = newPrefixWriter("  [OCR] ")
	cmd.Stderr = newPrefixWriter("  [OCR] ")

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("gagal start Python: %v", err)
	}

	s.mu.Lock()
	s.process = cmd.Process
	s.mu.Unlock()

	// Pantau proses agar kita tahu jika crash
	go func() {
		if err := cmd.Wait(); err != nil {
			log.Printf("⚠️  PaddleOCR process berhenti: %v", err)
		}
		s.mu.Lock()
		s.process = nil
		s.mu.Unlock()
	}()

	// Tunggu service siap (max 120 detik — model load pertama kali lama)
	return s.waitHealthy(120 * time.Second)
}

// installDeps menjalankan pip install -r requirements.txt secara silent.
func (s *paddleOCRService) installDeps(pythonCmd, ocrDir string) {
	reqFile := filepath.Join(ocrDir, "requirements.txt")
	if _, err := os.Stat(reqFile); os.IsNotExist(err) {
		return
	}

	log.Println("📦 Menginstall Python dependencies (background)...")
	cmd := exec.Command(pythonCmd, "-m", "pip", "install", "-r", reqFile, "-q", "--no-warn-script-location")
	cmd.Dir = ocrDir
	out, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("⚠️  pip install error: %v\n%s", err, string(out))
	} else {
		log.Println("✅ Python dependencies OK")
	}
}

// waitHealthy polling /health sampai service siap atau timeout.
func (s *paddleOCRService) waitHealthy(timeout time.Duration) error {
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		if s.isHealthy() {
			log.Println("✅ PaddleOCR service siap")
			return nil
		}
		time.Sleep(3 * time.Second)
	}
	return fmt.Errorf("PaddleOCR service tidak merespons dalam %s", timeout)
}

func (s *paddleOCRService) isHealthy() bool {
	baseURL := strings.TrimSuffix(s.serviceURL, "/ocr")
	client := &http.Client{Timeout: 4 * time.Second}
	resp, err := client.Get(baseURL + "/health")
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	return resp.StatusCode == http.StatusOK
}

// ─── Scan ─────────────────────────────────────────────────────────────────────

func (s *paddleOCRService) ScanImage(ctx context.Context, imageBytes []byte) (string, error) {
	if len(imageBytes) == 0 {
		return "", errors.New("file gambar kosong")
	}

	// Jika service tidak sehat, coba spawn ulang sekali
	if !s.isHealthy() {
		log.Println("⚠️  PaddleOCR service tidak merespons — mencoba restart...")
		s.mu.Lock()
		procDead := s.process == nil
		s.mu.Unlock()

		if procDead {
			if err := s.spawnPythonService(); err != nil {
				return "", fmt.Errorf(
					"PaddleOCR service tidak aktif dan gagal di-restart: %v. "+
						"Jalankan manual: backend/ocr_service/start.bat", err,
				)
			}
		} else {
			// Proses ada tapi belum sehat — tunggu sebentar
			if err := s.waitHealthy(30 * time.Second); err != nil {
				return "", errors.New("PaddleOCR service tidak merespons. Tunggu sebentar dan coba lagi")
			}
		}
	}

	rawText, err := s.callOCR(ctx, imageBytes)
	if err != nil {
		// 1 retry
		log.Printf("⚠️  OCR attempt 1 gagal: %v — retry...", err)
		time.Sleep(2 * time.Second)
		rawText, err = s.callOCR(ctx, imageBytes)
	}
	return rawText, err
}

func (s *paddleOCRService) callOCR(ctx context.Context, imageBytes []byte) (string, error) {
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	part, err := writer.CreateFormFile("image", "receipt.jpg")
	if err != nil {
		return "", err
	}
	if _, err = part.Write(imageBytes); err != nil {
		return "", err
	}
	writer.Close()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, s.serviceURL, &body)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := s.httpClient.Do(req)
	if err != nil {
		if ctx.Err() == context.DeadlineExceeded {
			return "", errors.New("OCR timeout — coba foto dengan pencahayaan lebih baik")
		}
		return "", fmt.Errorf("HTTP error: %v", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("OCR service error %d: %s", resp.StatusCode, string(respBody))
	}

	var ocrResp paddleOCRResponse
	if err := json.Unmarshal(respBody, &ocrResp); err != nil {
		return "", fmt.Errorf("gagal parse response: %v", err)
	}

	rawText := strings.TrimSpace(ocrResp.RawText)
	log.Printf("✅ PaddleOCR: %d baris, conf=%.1f%%, %.2fs, %d chars",
		ocrResp.LineCount, ocrResp.Confidence, ocrResp.ProcessingTime, len(rawText))

	return rawText, nil
}

// Shutdown menghentikan Python process saat Go server berhenti.
func (s *paddleOCRService) Shutdown() {
	s.mu.Lock()
	proc := s.process
	s.mu.Unlock()

	if proc != nil {
		log.Println("🛑 Menghentikan PaddleOCR service...")
		proc.Kill()
	}
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// findOCRServiceDir mencari direktori ocr_service relatif terhadap executable.
func findOCRServiceDir() (string, error) {
	// Cari dari working directory ke atas
	candidates := []string{
		filepath.Join("ocr_service"),
		filepath.Join("backend", "ocr_service"),
		filepath.Join("..", "ocr_service"),
	}

	// Juga coba relatif dari executable path
	if exePath, err := os.Executable(); err == nil {
		exeDir := filepath.Dir(exePath)
		candidates = append(candidates,
			filepath.Join(exeDir, "ocr_service"),
			filepath.Join(exeDir, "..", "ocr_service"),
		)
	}

	for _, c := range candidates {
		abs, err := filepath.Abs(c)
		if err != nil {
			continue
		}
		if info, err := os.Stat(abs); err == nil && info.IsDir() {
			if _, err := os.Stat(filepath.Join(abs, "main.py")); err == nil {
				return abs, nil
			}
		}
	}
	return "", errors.New("tidak ditemukan (cari main.py di ocr_service/)")
}

// detectPython mengembalikan perintah Python yang tersedia di sistem.
func detectPython() string {
	var cmds []string
	if runtime.GOOS == "windows" {
		cmds = []string{"python", "python3", "py"}
	} else {
		cmds = []string{"python3", "python"}
	}

	for _, cmd := range cmds {
		out, err := exec.Command(cmd, "--version").CombinedOutput()
		if err == nil && strings.Contains(string(out), "Python 3") {
			log.Printf("🐍 Python ditemukan: %s (%s)", cmd, strings.TrimSpace(string(out)))
			return cmd
		}
	}
	return ""
}

// prefixWriter adalah io.Writer yang menambahkan prefix ke setiap baris log.
type prefixWriter struct {
	prefix string
	buf    []byte
}

func newPrefixWriter(prefix string) *prefixWriter {
	return &prefixWriter{prefix: prefix}
}

func (pw *prefixWriter) Write(p []byte) (n int, err error) {
	pw.buf = append(pw.buf, p...)
	for {
		idx := bytes.IndexByte(pw.buf, '\n')
		if idx < 0 {
			break
		}
		line := strings.TrimRight(string(pw.buf[:idx]), "\r")
		if line != "" {
			log.Printf("%s%s", pw.prefix, line)
		}
		pw.buf = pw.buf[idx+1:]
	}
	return len(p), nil
}
