package models

type Category struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	UserID    uint   `gorm:"index" json:"user_id"`
	Name      string `gorm:"not null" json:"name"`
	Type      string `gorm:"not null" json:"type"` // "income" or "expense"
	Icon      string `json:"icon"`
	Color     string `json:"color"`
	IsDefault bool   `gorm:"default:false" json:"is_default"`

	// Relations
	User         User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Transactions []Transaction `gorm:"foreignKey:CategoryID" json:"transactions,omitempty"`
	Budgets      []Budget      `gorm:"foreignKey:CategoryID" json:"budgets,omitempty"`
}

func (Category) TableName() string {
	return "categories"
}
