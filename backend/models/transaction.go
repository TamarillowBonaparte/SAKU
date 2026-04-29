package models

import (
	"time"
)

type Transaction struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	UserID     uint      `gorm:"index;not null" json:"user_id"`
	CategoryID uint      `gorm:"index;not null" json:"category_id"`
	Title      string    `gorm:"not null" json:"title"`
	Amount     float64   `gorm:"not null" json:"amount"`
	Type       string    `gorm:"not null" json:"type"` // "income" or "expense"
	Date       time.Time `gorm:"not null" json:"date"`
	Note       string    `json:"note"`
	ReceiptUrl string    `json:"receipt_url"`
	CreatedAt  time.Time `json:"created_at"`

	// Relations
	User     User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Category Category `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
}

func (Transaction) TableName() string {
	return "transactions"
}
