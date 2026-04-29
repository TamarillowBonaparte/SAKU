package services

import (
	"financial-freedom/models"
	"financial-freedom/repositories"
	"time"
)

type TransactionService interface {
	CreateTransaction(transaction *models.Transaction) error
	GetTransactionByID(id uint) (*models.Transaction, error)
	GetUserTransactions(userID uint, page int, limit int) ([]models.Transaction, int64, error)
	GetUserTransactionsByDateRange(userID uint, startDate time.Time, endDate time.Time, page int, limit int) ([]models.Transaction, int64, error)
	UpdateTransaction(transaction *models.Transaction) error
	DeleteTransaction(id uint) error
}

type transactionService struct {
	transactionRepository repositories.TransactionRepository
}

func NewTransactionService(transactionRepository repositories.TransactionRepository) TransactionService {
	return &transactionService{transactionRepository}
}

func (s *transactionService) CreateTransaction(transaction *models.Transaction) error {
	return s.transactionRepository.Create(transaction)
}

func (s *transactionService) GetTransactionByID(id uint) (*models.Transaction, error) {
	return s.transactionRepository.FindByID(id)
}

func (s *transactionService) GetUserTransactions(userID uint, page int, limit int) ([]models.Transaction, int64, error) {
	return s.transactionRepository.FindByUserID(userID, page, limit)
}

func (s *transactionService) GetUserTransactionsByDateRange(userID uint, startDate time.Time, endDate time.Time, page int, limit int) ([]models.Transaction, int64, error) {
	return s.transactionRepository.FindByUserIDAndDateRange(userID, startDate, endDate, page, limit)
}

func (s *transactionService) UpdateTransaction(transaction *models.Transaction) error {
	return s.transactionRepository.Update(transaction)
}

func (s *transactionService) DeleteTransaction(id uint) error {
	return s.transactionRepository.Delete(id)
}
