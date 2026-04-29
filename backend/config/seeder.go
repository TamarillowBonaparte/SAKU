package config

import (
	"log"

	"gorm.io/gorm"
)

func SeedDefaultCategories(db *gorm.DB) {
	// Categories are now created per-user during registration/signup
	// This function is deprecated and kept for backwards compatibility
	// Default categories will be seeded for each new user via the CategoryService
	log.Println("Default categories are now created per-user during registration")
}
