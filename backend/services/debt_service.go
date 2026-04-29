package services

import (
	"financial-freedom/models"
	"financial-freedom/repositories"
)

type DebtService interface {
	CreateDebt(debt *models.Debt) error
	GetDebtByID(id uint) (*models.Debt, error)
	GetUserDebts(userID uint, page int, limit int) ([]models.Debt, int64, error)
	UpdateDebt(debt *models.Debt) error
	DeleteDebt(id uint) error
}

type debtService struct {
	debtRepository repositories.DebtRepository
}

func NewDebtService(debtRepository repositories.DebtRepository) DebtService {
	return &debtService{debtRepository}
}

func (s *debtService) CreateDebt(debt *models.Debt) error {
	return s.debtRepository.Create(debt)
}

func (s *debtService) GetDebtByID(id uint) (*models.Debt, error) {
	return s.debtRepository.FindByID(id)
}

func (s *debtService) GetUserDebts(userID uint, page int, limit int) ([]models.Debt, int64, error) {
	return s.debtRepository.FindByUserID(userID, page, limit)
}

func (s *debtService) UpdateDebt(debt *models.Debt) error {
	return s.debtRepository.Update(debt)
}

func (s *debtService) DeleteDebt(id uint) error {
	return s.debtRepository.Delete(id)
}
