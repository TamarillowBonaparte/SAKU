package repositories

import (
	"financial-freedom/models"

	"gorm.io/gorm"
)

type DebtRepository interface {
	Create(debt *models.Debt) error
	FindByID(id uint) (*models.Debt, error)
	FindByUserID(userID uint, page int, limit int) ([]models.Debt, int64, error)
	Update(debt *models.Debt) error
	Delete(id uint) error
}

type debtRepository struct {
	db *gorm.DB
}

func NewDebtRepository(db *gorm.DB) DebtRepository {
	return &debtRepository{db}
}

func (r *debtRepository) Create(debt *models.Debt) error {
	return r.db.Create(debt).Error
}

func (r *debtRepository) FindByID(id uint) (*models.Debt, error) {
	var debt models.Debt
	err := r.db.First(&debt, id).Error
	if err != nil {
		return nil, err
	}
	return &debt, nil
}

func (r *debtRepository) FindByUserID(userID uint, page int, limit int) ([]models.Debt, int64, error) {
	var debts []models.Debt
	var total int64

	offset := (page - 1) * limit

	err := r.db.Where("user_id = ?", userID).
		Model(&models.Debt{}).
		Count(&total).
		Offset(offset).
		Limit(limit).
		Order("due_date ASC").
		Find(&debts).Error

	return debts, total, err
}

func (r *debtRepository) Update(debt *models.Debt) error {
	return r.db.Save(debt).Error
}

func (r *debtRepository) Delete(id uint) error {
	return r.db.Delete(&models.Debt{}, id).Error
}
