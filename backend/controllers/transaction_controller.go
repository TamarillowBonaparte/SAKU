package controllers

import (
	"financial-freedom/models"
	"financial-freedom/services"
	"financial-freedom/utils"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type TransactionController struct {
	transactionService services.TransactionService
}

func NewTransactionController(transactionService services.TransactionService) *TransactionController {
	return &TransactionController{transactionService}
}

type CreateTransactionRequest struct {
	CategoryID uint    `json:"category_id"`
	Title      string  `json:"title" binding:"required"`
	Amount     float64 `json:"amount" binding:"required"`
	Type       string  `json:"type" binding:"required,oneof=income expense"`
	Date       string  `json:"date" binding:"required"`
	Note       string  `json:"note"`
	ReceiptURL string  `json:"receipt_url"`
}

type UpdateTransactionRequest struct {
	CategoryID *uint    `json:"category_id"`
	Title      *string  `json:"title"`
	Amount     *float64 `json:"amount"`
	Type       *string  `json:"type" binding:"omitempty,oneof=income expense"`
	Date       *string  `json:"date"`
	Note       *string  `json:"note"`
	ReceiptURL *string  `json:"receipt_url"`
}

func (tc *TransactionController) CreateTransaction(c *gin.Context) {
	var req CreateTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		utils.RespondWithError(c, http.StatusUnauthorized, "User not authenticated", "")
		return
	}

	// Parse date
	parsedDate, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid date format", "use YYYY-MM-DD")
		return
	}

	transaction := &models.Transaction{
		UserID:     userID.(uint),
		CategoryID: req.CategoryID,
		Title:      req.Title,
		Amount:     req.Amount,
		Type:       req.Type,
		Date:       parsedDate,
		Note:       req.Note,
		ReceiptUrl: req.ReceiptURL,
	}

	if err := tc.transactionService.CreateTransaction(transaction); err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to create transaction", err.Error())
		return
	}

	utils.RespondWithSuccess(c, http.StatusCreated, "Transaction created", transaction)
}

func (tc *TransactionController) GetTransaction(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid transaction ID", err.Error())
		return
	}

	transaction, err := tc.transactionService.GetTransactionByID(uint(id))
	if err != nil {
		utils.RespondWithError(c, http.StatusNotFound, "Transaction not found", err.Error())
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Transaction retrieved", transaction)
}

func (tc *TransactionController) ListTransactions(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	userID, exists := c.Get("userID")
	if !exists {
		utils.RespondWithError(c, http.StatusUnauthorized, "User not authenticated", "")
		return
	}

	transactions, total, err := tc.transactionService.GetUserTransactions(userID.(uint), page, limit)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to fetch transactions", err.Error())
		return
	}

	// Return empty array instead of null
	if transactions == nil {
		transactions = []models.Transaction{}
	}

	utils.RespondWithPaginated(c, http.StatusOK, "Transactions retrieved", transactions, page, limit, total)
}

func (tc *TransactionController) UpdateTransaction(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid transaction ID", err.Error())
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		utils.RespondWithError(c, http.StatusUnauthorized, "User not authenticated", "")
		return
	}

	transaction, err := tc.transactionService.GetTransactionByID(uint(id))
	if err != nil {
		utils.RespondWithError(c, http.StatusNotFound, "Transaction not found", err.Error())
		return
	}

	if transaction.UserID != userID.(uint) {
		utils.RespondWithError(c, http.StatusForbidden, "Forbidden", "you can only update your own transactions")
		return
	}

	var req UpdateTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	if req.CategoryID != nil {
		transaction.CategoryID = *req.CategoryID
	}
	if req.Title != nil {
		transaction.Title = *req.Title
	}
	if req.Amount != nil {
		transaction.Amount = *req.Amount
	}
	if req.Type != nil {
		transaction.Type = *req.Type
	}
	if req.Date != nil {
		parsedDate, dateErr := time.Parse("2006-01-02", *req.Date)
		if dateErr != nil {
			parsedDate, dateErr = time.Parse(time.RFC3339, *req.Date)
		}
		if dateErr != nil {
			utils.RespondWithError(c, http.StatusBadRequest, "Invalid date format", "use YYYY-MM-DD or RFC3339")
			return
		}
		transaction.Date = parsedDate
	}
	if req.Note != nil {
		transaction.Note = *req.Note
	}
	if req.ReceiptURL != nil {
		transaction.ReceiptUrl = *req.ReceiptURL
	}

	if err := tc.transactionService.UpdateTransaction(transaction); err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to update transaction", err.Error())
		return
	}

	updatedTransaction, err := tc.transactionService.GetTransactionByID(uint(id))
	if err != nil {
		utils.RespondWithSuccess(c, http.StatusOK, "Transaction updated", transaction)
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Transaction updated", updatedTransaction)
}

func (tc *TransactionController) DeleteTransaction(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid transaction ID", err.Error())
		return
	}

	if err := tc.transactionService.DeleteTransaction(uint(id)); err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to delete transaction", err.Error())
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Transaction deleted", nil)
}
