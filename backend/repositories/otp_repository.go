package repositories

import (
	"financial-freedom/models"
	"time"

	"gorm.io/gorm"
)

type OtpCodeRepository interface {
	Create(otpCode *models.OtpCode) error
	FindByUserIDAndType(userID uint, otpType string) (*models.OtpCode, error)
	FindValid(userID uint, otpType string) (*models.OtpCode, error)
	MarkAsUsed(id uint) error
	Delete(id uint) error
	DeleteExpired() error
	DeleteByUserIDAndType(userID uint, otpType string) error
	FindValidByEmail(email string, otpType string) (*models.OtpCode, error)
	DeleteByEmailAndType(email string, otpType string) error
}

type otpCodeRepository struct {
	db *gorm.DB
}

func NewOtpCodeRepository(db *gorm.DB) OtpCodeRepository {
	return &otpCodeRepository{db}
}

func (r *otpCodeRepository) Create(otpCode *models.OtpCode) error {
	return r.db.Create(otpCode).Error
}

func (r *otpCodeRepository) FindByUserIDAndType(userID uint, otpType string) (*models.OtpCode, error) {
	var otpCode models.OtpCode
	err := r.db.Where("user_id = ? AND type = ?", userID, otpType).
		Order("created_at DESC").
		First(&otpCode).Error
	if err != nil {
		return nil, err
	}
	return &otpCode, nil
}

func (r *otpCodeRepository) FindValid(userID uint, otpType string) (*models.OtpCode, error) {
	var otpCode models.OtpCode
	err := r.db.Where("user_id = ? AND type = ? AND is_used = ? AND expires_at > ?",
		userID, otpType, false, time.Now()).
		Order("created_at DESC").
		First(&otpCode).Error
	if err != nil {
		return nil, err
	}
	return &otpCode, nil
}

func (r *otpCodeRepository) MarkAsUsed(id uint) error {
	return r.db.Model(&models.OtpCode{}).Where("id = ?", id).Update("is_used", true).Error
}

func (r *otpCodeRepository) Delete(id uint) error {
	return r.db.Delete(&models.OtpCode{}, id).Error
}

func (r *otpCodeRepository) DeleteExpired() error {
	return r.db.Where("expires_at < ?", time.Now()).Delete(&models.OtpCode{}).Error
}

func (r *otpCodeRepository) DeleteByUserIDAndType(userID uint, otpType string) error {
	return r.db.Where("user_id = ? AND type = ?", userID, otpType).Delete(&models.OtpCode{}).Error
}

func (r *otpCodeRepository) FindValidByEmail(email string, otpType string) (*models.OtpCode, error) {
	var otpCode models.OtpCode
	err := r.db.Where("email = ? AND type = ? AND is_used = ? AND expires_at > ?",
		email, otpType, false, time.Now()).
		Order("created_at DESC").
		First(&otpCode).Error
	if err != nil {
		return nil, err
	}
	return &otpCode, nil
}

func (r *otpCodeRepository) DeleteByEmailAndType(email string, otpType string) error {
	return r.db.Where("email = ? AND type = ?", email, otpType).Delete(&models.OtpCode{}).Error
}
