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

type BudgetController struct {
	budgetService services.BudgetService
}

func NewBudgetController(budgetService services.BudgetService) *BudgetController {
	return &BudgetController{budgetService}
}

type CreateBudgetRequest struct {
	CategoryID float64 `json:"category_id"`
	DailyLimit float64 `json:"daily_limit" binding:"required"`
	Date       string  `json:"date" binding:"required"`
}

func (bc *BudgetController) CreateBudget(c *gin.Context) {
	var req CreateBudgetRequest
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
		parsedDate = time.Now()
	}

	budget := &models.Budget{
		UserID:     userID.(uint),
		CategoryID: uint(req.CategoryID),
		DailyLimit: req.DailyLimit,
		Date:       parsedDate,
	}

	if err := bc.budgetService.CreateBudget(budget); err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to create budget", err.Error())
		return
	}

	utils.RespondWithSuccess(c, http.StatusCreated, "Budget created", budget)
}

func (bc *BudgetController) GetBudget(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid budget ID", err.Error())
		return
	}

	budget, err := bc.budgetService.GetBudgetByID(uint(id))
	if err != nil {
		utils.RespondWithError(c, http.StatusNotFound, "Budget not found", err.Error())
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Budget retrieved", budget)
}

func (bc *BudgetController) ListBudgets(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	userID, exists := c.Get("userID")
	if !exists {
		utils.RespondWithError(c, http.StatusUnauthorized, "User not authenticated", "")
		return
	}

	budgets, total, err := bc.budgetService.GetUserBudgets(userID.(uint), page, limit)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to fetch budgets", err.Error())
		return
	}

	// Return empty array instead of null
	if budgets == nil {
		budgets = []models.Budget{}
	}

	utils.RespondWithPaginated(c, http.StatusOK, "Budgets retrieved", budgets, page, limit, total)
}

func (bc *BudgetController) UpdateBudget(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid budget ID", err.Error())
		return
	}

	budget, err := bc.budgetService.GetBudgetByID(uint(id))
	if err != nil {
		utils.RespondWithError(c, http.StatusNotFound, "Budget not found", err.Error())
		return
	}

	if err := c.ShouldBindJSON(budget); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	if err := bc.budgetService.UpdateBudget(budget); err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to update budget", err.Error())
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Budget updated", budget)
}

func (bc *BudgetController) DeleteBudget(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid budget ID", err.Error())
		return
	}

	if err := bc.budgetService.DeleteBudget(uint(id)); err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to delete budget", err.Error())
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Budget deleted", nil)
}
