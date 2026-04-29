package models

import (
	"time"
)

type Todo struct {
	ID                    uint      `gorm:"primaryKey" json:"id"`
	UserID                uint      `gorm:"index;not null" json:"user_id"`
	Title                 string    `gorm:"not null" json:"title"`
	Date                  time.Time `gorm:"not null" json:"date"`
	Time                  time.Time `json:"time"`
	IsDone                bool      `gorm:"default:false" json:"is_done"`
	NotifyEnabled         bool      `gorm:"default:true" json:"notify_enabled"`
	ReminderOffsetMinutes int       `gorm:"default:60" json:"reminder_offset_minutes"`

	// Relations
	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (Todo) TableName() string {
	return "todos"
}
