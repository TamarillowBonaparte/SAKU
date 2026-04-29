package repositories

import (
	"financial-freedom/models"

	"gorm.io/gorm"
)

type BudgetRepository interface {
	Create(budget *models.Budget) error
	FindByID(id uint) (*models.Budget, error)
	FindByUserID(userID uint, page int, limit int) ([]models.Budget, int64, error)
	Update(budget *models.Budget) error
	Delete(id uint) error
}

type budgetRepository struct {
	db *gorm.DB
}

func NewBudgetRepository(db *gorm.DB) BudgetRepository {
	return &budgetRepository{db}
}

func (r *budgetRepository) Create(budget *models.Budget) error {
	return r.db.Create(budget).Error
}

func (r *budgetRepository) FindByID(id uint) (*models.Budget, error) {
	var budget models.Budget
	err := r.db.First(&budget, id).Error
	if err != nil {
		return nil, err
	}
	return &budget, nil
}

func (r *budgetRepository) FindByUserID(userID uint, page int, limit int) ([]models.Budget, int64, error) {
	var budgets []models.Budget
	var total int64

	offset := (page - 1) * limit

	err := r.db.Where("user_id = ?", userID).
		Model(&models.Budget{}).
		Count(&total).
		Offset(offset).
		Limit(limit).
		Preload("Category").
		Find(&budgets).Error

	return budgets, total, err
}

func (r *budgetRepository) Update(budget *models.Budget) error {
	return r.db.Save(budget).Error
}

func (r *budgetRepository) Delete(id uint) error {
	return r.db.Delete(&models.Budget{}, id).Error
}
