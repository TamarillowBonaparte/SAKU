package models

import (
	"time"
)

type Budget struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	UserID     uint      `gorm:"index;not null" json:"user_id"`
	CategoryID uint      `gorm:"index;not null" json:"category_id"`
	DailyLimit float64   `gorm:"not null" json:"daily_limit"`
	Date       time.Time `gorm:"not null" json:"date"`

	// Relations
	User     User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Category Category `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
}

func (Budget) TableName() string {
	return "budgets"
}
