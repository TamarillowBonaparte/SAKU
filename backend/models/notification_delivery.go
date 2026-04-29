package models

import "time"

type NotificationDelivery struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"index;not null" json:"user_id"`
	EventKey  string    `gorm:"uniqueIndex;not null" json:"event_key"`
	Title     string    `gorm:"not null" json:"title"`
	Body      string    `gorm:"not null" json:"body"`
	SentAt    time.Time `json:"sent_at"`
	CreatedAt time.Time `json:"created_at"`
}

func (NotificationDelivery) TableName() string {
	return "notification_deliveries"
}
