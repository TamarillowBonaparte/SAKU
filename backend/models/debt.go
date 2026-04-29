package models

import (
	"time"
)

type Debt struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	UserID        uint      `gorm:"index;not null" json:"user_id"`
	Name          string    `gorm:"not null" json:"name"`
	Amount        float64   `gorm:"not null" json:"amount"`
	Type          string    `gorm:"not null" json:"type"`
	Status        string    `gorm:"not null" json:"status"`
	DueDate       time.Time `gorm:"not null" json:"due_date"`
	CreatedAt     time.Time `json:"created_at"`
	NotifyEnabled bool      `gorm:"default:true" json:"notify_enabled"`
	ReminderDays  int       `gorm:"default:1" json:"reminder_days"`

	// Relations
	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (Debt) TableName() string {
	return "debts"
}
