// package controllers

// import (
// 	"financial-freedom/services"
// 	"financial-freedom/utils"
// 	"io"
// 	"net/http"
// 	"strings"

// 	"github.com/gin-gonic/gin"
// )

// const maxReceiptUploadSize = 6 << 20

// type ReceiptController struct {
// 	receiptOCRService services.ReceiptOCRService
// }

// func NewReceiptController(receiptOCRService services.ReceiptOCRService) *ReceiptController {
// 	return &ReceiptController{receiptOCRService}
// }

// type receiptScanResponse struct {
// 	RawText string `json:"raw_text"`
// }

// func (rc *ReceiptController) ScanReceipt(c *gin.Context) {
// 	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxReceiptUploadSize)

// 	fileHeader, err := c.FormFile("image")
// 	if err != nil {
// 		utils.RespondWithError(c, http.StatusBadRequest, "File gambar tidak ditemukan", err.Error())
// 		return
// 	}
// 	if fileHeader.Size > maxReceiptUploadSize {
// 		utils.RespondWithError(c, http.StatusBadRequest, "Ukuran gambar terlalu besar", "max 6MB")
// 		return
// 	}

// 	file, err := fileHeader.Open()
// 	if err != nil {
// 		utils.RespondWithError(c, http.StatusBadRequest, "Gagal membuka file", err.Error())
// 		return
// 	}
// 	defer file.Close()

// 	imageBytes, err := io.ReadAll(file)
// 	if err != nil {
// 		utils.RespondWithError(c, http.StatusInternalServerError, "Gagal membaca file", err.Error())
// 		return
// 	}

// 	rawText, err := rc.receiptOCRService.ScanImage(c.Request.Context(), imageBytes)
// 	if err != nil {
// 		utils.RespondWithError(c, http.StatusInternalServerError, "OCR gagal", err.Error())
// 		return
// 	}

// 	utils.RespondWithSuccess(c, http.StatusOK, "OCR berhasil", receiptScanResponse{RawText: strings.TrimSpace(rawText)})
// }

package controllers

import (
	"financial-freedom/services"
	"financial-freedom/utils"
	"io"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

const maxReceiptUploadSize = 6 << 20

type ReceiptController struct {
	receiptOCRService services.ReceiptOCRService
}

func NewReceiptController(receiptOCRService services.ReceiptOCRService) *ReceiptController {
	return &ReceiptController{receiptOCRService: receiptOCRService}
}

type ReceiptItemResponse struct {
	Description string   `json:"description"`
	Qty         *float64 `json:"qty,omitempty"`
	UnitPrice   *float64 `json:"unit_price,omitempty"`
	Amount      *float64 `json:"amount,omitempty"`
}

type receiptScanResponse struct {
	RawText     string                `json:"raw_text"`
	StoreName   string                `json:"store_name,omitempty"`
	Date        string                `json:"date,omitempty"`
	TotalAmount *float64              `json:"total_amount,omitempty"`
	Subtotal    *float64              `json:"subtotal,omitempty"`
	Tax         *float64              `json:"tax,omitempty"`
	Confidence  float64               `json:"confidence"`
	Items       []ReceiptItemResponse `json:"items,omitempty"`
	Meta        map[string]any        `json:"meta,omitempty"`
}

func isAllowedImage(filename string, contentType string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	if ext == ".jpg" || ext == ".jpeg" || ext == ".png" || ext == ".webp" {
		return true
	}
	switch contentType {
	case "image/jpeg", "image/png", "image/webp":
		return true
	default:
		return false
	}
}

func (rc *ReceiptController) ScanReceipt(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxReceiptUploadSize)

	fileHeader, err := c.FormFile("image")
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "File gambar tidak ditemukan", err.Error())
		return
	}

	if fileHeader.Size <= 0 {
		utils.RespondWithError(c, http.StatusBadRequest, "File kosong", "image is empty")
		return
	}

	if fileHeader.Size > maxReceiptUploadSize {
		utils.RespondWithError(c, http.StatusBadRequest, "Ukuran gambar terlalu besar", "max 6MB")
		return
	}

	if !isAllowedImage(fileHeader.Filename, fileHeader.Header.Get("Content-Type")) {
		utils.RespondWithError(c, http.StatusBadRequest, "Format file tidak didukung", "only jpg, jpeg, png, webp")
		return
	}

	file, err := fileHeader.Open()
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Gagal membuka file", err.Error())
		return
	}
	defer file.Close()

	imageBytes, err := io.ReadAll(file)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Gagal membaca file", err.Error())
		return
	}

	rawText, err := rc.receiptOCRService.ScanImage(c.Request.Context(), imageBytes)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "OCR gagal", err.Error())
		return
	}

	// Calculate a rough confidence score based on OCR text length
	confidence := calculateConfidence(rawText)

	// Return structured response with raw_text
	response := receiptScanResponse{
		RawText:    rawText,
		Confidence: confidence,
	}

	utils.RespondWithSuccess(c, http.StatusOK, "OCR berhasil", response)
}

// calculateConfidence returns a rough OCR confidence score (0-100) based on text characteristics.
func calculateConfidence(text string) float64 {
	if text == "" {
		return 0
	}
	// Heuristic: longer text with common receipt keywords → higher confidence
	score := 40.0
	trimmed := strings.ToLower(strings.TrimSpace(text))

	// Reward length (up to +20)
	if len(trimmed) > 500 {
		score += 20
	} else if len(trimmed) > 200 {
		score += 14
	} else if len(trimmed) > 80 {
		score += 8
	}

	// Reward common receipt keywords (+5 each, up to +30)
	keywords := []string{"total", "rp", "harga", "bayar", "subtotal", "jumlah", "item", "qty", "terima", "kasih"}
	for _, kw := range keywords {
		if strings.Contains(trimmed, kw) {
			score += 5
			if score >= 95 {
				break
			}
		}
	}

	if score > 95 {
		score = 95
	}
	return score
}
