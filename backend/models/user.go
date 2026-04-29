package models

import (
	"time"
)

type User struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	FirebaseUID  string    `gorm:"uniqueIndex;default:null" json:"firebase_uid,omitempty"`
	Name         string    `gorm:"not null" json:"name"`
	Email        string    `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash string    `json:"-"`
	PhotoUrl     string    `json:"photo_url,omitempty"`
	IsVerified   bool      `gorm:"default:false" json:"is_verified"`
	CreatedAt    time.Time `json:"created_at"`

	// Relations
	Transactions []Transaction `gorm:"foreignKey:UserID" json:"transactions,omitempty"`
	Categories   []Category    `gorm:"foreignKey:UserID" json:"categories,omitempty"`
	Budgets      []Budget      `gorm:"foreignKey:UserID" json:"budgets,omitempty"`
	Debts        []Debt        `gorm:"foreignKey:UserID" json:"debts,omitempty"`
	Todos        []Todo        `gorm:"foreignKey:UserID" json:"todos,omitempty"`
	OtpCodes     []OtpCode     `gorm:"foreignKey:UserID" json:"otp_codes,omitempty"`
}

func (User) TableName() string {
	return "users"
}
