package controllers

import (
	"financial-freedom/models"
	"financial-freedom/services"
	"financial-freedom/utils"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type CategoryController struct {
	categoryService services.CategoryService
}

func NewCategoryController(categoryService services.CategoryService) *CategoryController {
	return &CategoryController{categoryService}
}

type CreateCategoryRequest struct {
	Name  string `json:"name" binding:"required"`
	Type  string `json:"type" binding:"required,oneof=income expense"`
	Icon  string `json:"icon"`
	Color string `json:"color"`
}

func (cc *CategoryController) CreateCategory(c *gin.Context) {
	var req CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		utils.RespondWithError(c, http.StatusUnauthorized, "User not authenticated", "")
		return
	}

	category := &models.Category{
		UserID: userID.(uint),
		Name:   req.Name,
		Type:   req.Type,
		Icon:   req.Icon,
		Color:  req.Color,
	}

	if err := cc.categoryService.CreateCategory(category); err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to create category", err.Error())
		return
	}

	utils.RespondWithSuccess(c, http.StatusCreated, "Category created", category)
}

func (cc *CategoryController) GetCategory(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid category ID", err.Error())
		return
	}

	category, err := cc.categoryService.GetCategoryByID(uint(id))
	if err != nil {
		utils.RespondWithError(c, http.StatusNotFound, "Category not found", err.Error())
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Category retrieved", category)
}

func (cc *CategoryController) ListCategories(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		utils.RespondWithError(c, http.StatusUnauthorized, "User not authenticated", "")
		return
	}

	categories, err := cc.categoryService.GetUserCategories(userID.(uint))
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to fetch categories", err.Error())
		return
	}

	// Auto-create default categories if empty
	if len(categories) == 0 {
		_ = cc.categoryService.CreateDefaultCategories(userID.(uint))
		categories, err = cc.categoryService.GetUserCategories(userID.(uint))
		if err != nil {
			categories = []models.Category{}
		}
	}

	// Return empty array instead of null
	if categories == nil {
		categories = []models.Category{}
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Categories retrieved", categories)
}

func (cc *CategoryController) UpdateCategory(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid category ID", err.Error())
		return
	}

	var req CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	category, err := cc.categoryService.GetCategoryByID(uint(id))
	if err != nil {
		utils.RespondWithError(c, http.StatusNotFound, "Category not found", err.Error())
		return
	}

	category.Name = req.Name
	category.Type = req.Type
	category.Icon = req.Icon
	category.Color = req.Color

	if err := cc.categoryService.UpdateCategory(category); err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to update category", err.Error())
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Category updated", category)
}

func (cc *CategoryController) DeleteCategory(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid category ID", err.Error())
		return
	}

	if err := cc.categoryService.DeleteCategory(uint(id)); err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to delete category", err.Error())
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Category deleted", nil)
}
