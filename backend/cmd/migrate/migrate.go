package main

import (
	"context"
	"financial-freedom/config"
	"financial-freedom/models"
	"log"

	"gorm.io/gorm"
)

func main() {
	// Load environment
	config.LoadEnv()

	// Initialize database
	db := config.InitDatabase()

	// Run migrations
	migrationErr := db.WithContext(context.Background()).AutoMigrate(
		&models.User{},
		&models.OtpCode{},
		&models.Category{},
		&models.Transaction{},
		&models.Budget{},
		&models.Debt{},
		&models.Todo{},
		&models.PushToken{},
		&models.NotificationDelivery{},
	)

	if migrationErr != nil {
		log.Fatal("Migration failed:", migrationErr)
	}

	log.Println("Database migrations completed successfully!")

	// Seed default data if needed
	seedDefaultData(db)
}

func seedDefaultData(db *gorm.DB) {
	log.Println("Seeding default data...")

	// Add default categories for income and expense
	// This can be expanded based on your requirements
}
