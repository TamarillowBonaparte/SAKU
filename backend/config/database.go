package config

import (
	"financial-freedom/models"
	"fmt"
	"log"
	"net/url"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func InitDatabase() *gorm.DB {
	db := InitDatabaseRaw()

	// Auto migrate all models
	MigrateModels(db)

	return db
}

func buildDSN() string {
	host := MustGetEnv("DB_HOST")
	port := MustGetEnv("DB_PORT")
	dbName := MustGetEnv("DB_NAME")
	user := GetEnv("DB_USER", "")
	password := GetEnv("DB_PASSWORD", "")
	sslmode := GetEnv("DB_SSLMODE", "disable")

	// Gunakan URL format untuk menghindari parsing error ketika user/password kosong
	u := &url.URL{
		Scheme: "postgres",
		Host:   fmt.Sprintf("%s:%s", host, port),
		Path:   dbName,
	}

	if user != "" {
		if password != "" {
			u.User = url.UserPassword(user, password)
		} else {
			u.User = url.User(user)
		}
	}

	q := u.Query()
	q.Set("sslmode", sslmode)
	q.Set("TimeZone", "Asia/Jakarta")
	q.Set("client_encoding", "UTF8")
	u.RawQuery = q.Encode()

	dsn := u.String()
	log.Printf("🔌 Menghubungkan ke database: %s:%s/%s", host, port, dbName)
	return dsn
}

func InitDatabaseRaw() *gorm.DB {
	dsn := buildDSN()

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("❌ Gagal terhubung ke database: %v", err)
	}

	log.Println("✅ Database connected successfully")
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
