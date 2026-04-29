package main

import (
	"financial-freedom/config"
	"financial-freedom/models"
	"log"
)

func main() {
	// Load environment
	config.LoadEnv()

	// Initialize database connection (tanpa auto-migrate)
	db := config.InitDatabaseRaw()

	log.Println("Dropping existing tables...")

	// Drop semua tabel lama (urutan penting karena ada foreign key)
	err := db.Migrator().DropTable(
		&models.OtpCode{},
		&models.Transaction{},
		&models.Budget{},
		&models.Debt{},
		&models.Todo{},
		&models.Category{},
		&models.User{},
	)
	if err != nil {
		log.Println("Warning saat drop tables (mungkin belum ada):", err)
	} else {
		log.Println("Semua tabel lama berhasil dihapus")
	}

	log.Println("Membuat tabel baru dengan skema terbaru...")

	// Migrate ulang dengan skema yang benar
	err = db.AutoMigrate(
		&models.User{},
		&models.OtpCode{},
		&models.Category{},
		&models.Transaction{},
		&models.Budget{},
		&models.Debt{},
		&models.Todo{},
	)
	if err != nil {
		log.Fatal("Gagal membuat tabel:", err)
	}

	log.Println("✅ Reset database berhasil! Semua tabel telah dibuat ulang.")
}
