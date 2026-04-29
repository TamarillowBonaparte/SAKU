package models

import (
	"time"
)

type OtpCode struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    *uint     `gorm:"index" json:"user_id,omitempty"`
	Email     string    `gorm:"index" json:"email,omitempty"`
	Code      string    `gorm:"not null" json:"code"`
	Type      string    `gorm:"not null" json:"type"` // "verification" or "reset_password"
	ExpiresAt time.Time `gorm:"not null" json:"expires_at"`
	IsUsed    bool      `gorm:"default:false" json:"is_used"`
	CreatedAt time.Time `json:"created_at"`

	// Relations
	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (OtpCode) TableName() string {
	return "otp_codes"
}
