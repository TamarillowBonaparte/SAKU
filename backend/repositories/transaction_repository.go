package repositories

import (
	"financial-freedom/models"
	"time"

	"gorm.io/gorm"
)

type TransactionRepository interface {
	Create(transaction *models.Transaction) error
	FindByID(id uint) (*models.Transaction, error)
	FindByUserID(userID uint, page int, limit int) ([]models.Transaction, int64, error)
	FindByUserIDAndDateRange(userID uint, startDate time.Time, endDate time.Time, page int, limit int) ([]models.Transaction, int64, error)
	Update(transaction *models.Transaction) error
	Delete(id uint) error
}

type transactionRepository struct {
	db *gorm.DB
}

func NewTransactionRepository(db *gorm.DB) TransactionRepository {
	return &transactionRepository{db}
}

func (r *transactionRepository) Create(transaction *models.Transaction) error {
	return r.db.Create(transaction).Error
}

func (r *transactionRepository) FindByID(id uint) (*models.Transaction, error) {
	var transaction models.Transaction
	err := r.db.Preload("Category").First(&transaction, id).Error
	if err != nil {
		return nil, err
	}
	return &transaction, nil
}

func (r *transactionRepository) FindByUserID(userID uint, page int, limit int) ([]models.Transaction, int64, error) {
	var transactions []models.Transaction
	var total int64

	offset := (page - 1) * limit

	err := r.db.Where("user_id = ?", userID).
		Model(&models.Transaction{}).
		Count(&total).
		Offset(offset).
		Limit(limit).
		Preload("Category").
		Order("date DESC").
		Find(&transactions).Error

	return transactions, total, err
}

func (r *transactionRepository) FindByUserIDAndDateRange(userID uint, startDate time.Time, endDate time.Time, page int, limit int) ([]models.Transaction, int64, error) {
	var transactions []models.Transaction
	var total int64

	offset := (page - 1) * limit

	err := r.db.Where("user_id = ? AND date BETWEEN ? AND ?", userID, startDate, endDate).
		Model(&models.Transaction{}).
		Count(&total).
		Offset(offset).
		Limit(limit).
		Preload("Category").
		Order("date DESC").
		Find(&transactions).Error

	return transactions, total, err
}

func (r *transactionRepository) Update(transaction *models.Transaction) error {
	return r.db.Save(transaction).Error
}

func (r *transactionRepository) Delete(id uint) error {
	return r.db.Delete(&models.Transaction{}, id).Error
}
