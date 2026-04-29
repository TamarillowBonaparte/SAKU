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

type DebtController struct {
	debtService services.DebtService
}

func NewDebtController(debtService services.DebtService) *DebtController {
	return &DebtController{debtService: debtService}
}

type CreateDebtRequest struct {
	Name          string  `json:"name" binding:"required"`
	Amount        float64 `json:"amount" binding:"required,gt=0"`
	Type          string  `json:"type" binding:"required,oneof=utang piutang debt receivable"`
	Status        string  `json:"status" binding:"required,oneof=aktif jatuh_tempo lunas active overdue paid"`
	DueDate       string  `json:"due_date" binding:"required"`
	NotifyEnabled *bool   `json:"notify_enabled"`
	ReminderDays  *int    `json:"reminder_days"`
}

type UpdateDebtRequest struct {
	Name          *string  `json:"name"`
	Amount        *float64 `json:"amount" binding:"omitempty,gt=0"`
	Type          *string  `json:"type" binding:"omitempty,oneof=utang piutang debt receivable"`
	Status        *string  `json:"status" binding:"omitempty,oneof=aktif jatuh_tempo lunas active overdue paid"`
	DueDate       *string  `json:"due_date"`
	NotifyEnabled *bool    `json:"notify_enabled"`
	ReminderDays  *int     `json:"reminder_days"`
}

func parseDebtDate(dateText string) (time.Time, error) {
	parsed, err := time.Parse("2006-01-02", dateText)
	if err == nil {
		return parsed, nil
	}

	parsed, err = time.Parse(time.RFC3339, dateText)
	if err == nil {
		return parsed, nil
	}

	return time.Time{}, err
}

func (dc *DebtController) CreateDebt(c *gin.Context) {
	var req CreateDebtRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		utils.RespondWithError(c, http.StatusUnauthorized, "User not authenticated", "")
		return
	}

	parsedDueDate, err := parseDebtDate(req.DueDate)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid date format", "use YYYY-MM-DD or RFC3339")
		return
	}

	debt := &models.Debt{
		UserID:        userID.(uint),
		Name:          req.Name,
		Amount:        req.Amount,
		Type:          req.Type,
		Status:        req.Status,
		DueDate:       parsedDueDate,
		NotifyEnabled: true,
		ReminderDays:  1,
	}

	if req.NotifyEnabled != nil {
		debt.NotifyEnabled = *req.NotifyEnabled
	}
	if req.ReminderDays != nil && *req.ReminderDays >= 0 {
		debt.ReminderDays = *req.ReminderDays
	}

	if err := dc.debtService.CreateDebt(debt); err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to create debt", err.Error())
		return
	}

	utils.RespondWithSuccess(c, http.StatusCreated, "Debt created", debt)
}

func (dc *DebtController) GetDebt(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid debt ID", err.Error())
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		utils.RespondWithError(c, http.StatusUnauthorized, "User not authenticated", "")
		return
	}

	debt, err := dc.debtService.GetDebtByID(uint(id))
	if err != nil {
		utils.RespondWithError(c, http.StatusNotFound, "Debt not found", err.Error())
		return
	}

	if debt.UserID != userID.(uint) {
		utils.RespondWithError(c, http.StatusForbidden, "Forbidden", "you can only access your own debts")
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Debt retrieved", debt)
}

func (dc *DebtController) ListDebts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	userID, exists := c.Get("userID")
	if !exists {
		utils.RespondWithError(c, http.StatusUnauthorized, "User not authenticated", "")
		return
	}

	debts, total, err := dc.debtService.GetUserDebts(userID.(uint), page, limit)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to fetch debts", err.Error())
		return
	}

	if debts == nil {
		debts = []models.Debt{}
	}

	utils.RespondWithPaginated(c, http.StatusOK, "Debts retrieved", debts, page, limit, total)
}

func (dc *DebtController) UpdateDebt(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid debt ID", err.Error())
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		utils.RespondWithError(c, http.StatusUnauthorized, "User not authenticated", "")
		return
	}

	debt, err := dc.debtService.GetDebtByID(uint(id))
	if err != nil {
		utils.RespondWithError(c, http.StatusNotFound, "Debt not found", err.Error())
		return
	}

	if debt.UserID != userID.(uint) {
		utils.RespondWithError(c, http.StatusForbidden, "Forbidden", "you can only update your own debts")
		return
	}

	var req UpdateDebtRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	if req.Name != nil {
		debt.Name = *req.Name
	}
	if req.Amount != nil {
		debt.Amount = *req.Amount
	}
	if req.Type != nil {
		debt.Type = *req.Type
	}
	if req.Status != nil {
		debt.Status = *req.Status
	}
	if req.DueDate != nil {
		parsedDueDate, parseErr := parseDebtDate(*req.DueDate)
		if parseErr != nil {
			utils.RespondWithError(c, http.StatusBadRequest, "Invalid date format", "use YYYY-MM-DD or RFC3339")
			return
		}
		debt.DueDate = parsedDueDate
	}
	if req.NotifyEnabled != nil {
		debt.NotifyEnabled = *req.NotifyEnabled
	}
	if req.ReminderDays != nil && *req.ReminderDays >= 0 {
		debt.ReminderDays = *req.ReminderDays
	}

	if err := dc.debtService.UpdateDebt(debt); err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to update debt", err.Error())
		return
	}

	updatedDebt, err := dc.debtService.GetDebtByID(uint(id))
	if err != nil {
		utils.RespondWithSuccess(c, http.StatusOK, "Debt updated", debt)
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Debt updated", updatedDebt)
}

func (dc *DebtController) DeleteDebt(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid debt ID", err.Error())
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		utils.RespondWithError(c, http.StatusUnauthorized, "User not authenticated", "")
		return
	}

	debt, err := dc.debtService.GetDebtByID(uint(id))
	if err != nil {
		utils.RespondWithError(c, http.StatusNotFound, "Debt not found", err.Error())
		return
	}

	if debt.UserID != userID.(uint) {
		utils.RespondWithError(c, http.StatusForbidden, "Forbidden", "you can only delete your own debts")
		return
	}

	if err := dc.debtService.DeleteDebt(uint(id)); err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to delete debt", err.Error())
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Debt deleted", nil)
}
