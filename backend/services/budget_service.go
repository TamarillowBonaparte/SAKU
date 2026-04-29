package services

import (
	"financial-freedom/models"
	"financial-freedom/repositories"
)

type BudgetService interface {
	CreateBudget(budget *models.Budget) error
	GetBudgetByID(id uint) (*models.Budget, error)
	GetUserBudgets(userID uint, page int, limit int) ([]models.Budget, int64, error)
	UpdateBudget(budget *models.Budget) error
	DeleteBudget(id uint) error
}

type budgetService struct {
	budgetRepository repositories.BudgetRepository
}

func NewBudgetService(budgetRepository repositories.BudgetRepository) BudgetService {
	return &budgetService{budgetRepository}
}

func (s *budgetService) CreateBudget(budget *models.Budget) error {
	return s.budgetRepository.Create(budget)
}

func (s *budgetService) GetBudgetByID(id uint) (*models.Budget, error) {
	return s.budgetRepository.FindByID(id)
}

func (s *budgetService) GetUserBudgets(userID uint, page int, limit int) ([]models.Budget, int64, error) {
	return s.budgetRepository.FindByUserID(userID, page, limit)
}

func (s *budgetService) UpdateBudget(budget *models.Budget) error {
	return s.budgetRepository.Update(budget)
}

func (s *budgetService) DeleteBudget(id uint) error {
	return s.budgetRepository.Delete(id)
}
