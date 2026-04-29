package config

import (
	"financial-freedom/models"
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func InitDatabase() *gorm.DB {
	db := InitDatabaseRaw()

	// Auto migrate all models
	MigrateModels(db)

	return db
}

func InitDatabaseRaw() *gorm.DB {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s TimeZone=Asia/Jakarta client_encoding=UTF8",
		GetEnv("DB_HOST", "localhost"),
		GetEnv("DB_PORT", "5432"),
		GetEnv("DB_USER", "postgres"),
		GetEnv("DB_PASSWORD", ""),
		GetEnv("DB_NAME", "financial_freedom"),
		GetEnv("DB_SSLMODE", "disable"),
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("Database connected successfully")
	return db
}

func MigrateModels(db *gorm.DB) {
	err := db.AutoMigrate(
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
	if err != nil {
		log.Fatal("Failed to migrate models:", err)
	}

	log.Println("Database models migrated successfully")
}
