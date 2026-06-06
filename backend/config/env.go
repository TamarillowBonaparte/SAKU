package config

import (
	"log"
	"os"
	"path/filepath"
	"runtime"

	"github.com/joho/godotenv"
)

func LoadEnv() {
	// Cari .env relatif terhadap lokasi file ini (config/env.go)
	_, filename, _, _ := runtime.Caller(0)
	dir := filepath.Dir(filename)                  // .../backend/config
	envPath := filepath.Join(dir, "..", ".env")    // .../backend/.env

	err := godotenv.Overload(envPath)
	if err != nil {
		// Fallback: coba dari working directory
		err = godotenv.Overload(".env")
		if err != nil {
			log.Fatalf("❌ Gagal load .env file: %v", err)
		}
	}
	log.Println("✅ .env berhasil dimuat")
}

// GetEnv tanpa default — wajib ada di .env untuk config kritis
func GetEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// MustGetEnv — fatal jika key tidak ada (untuk config kritis)
func MustGetEnv(key string) string {
	value := os.Getenv(key)
	if value == "" {
		log.Fatalf("❌ Environment variable '%s' tidak ditemukan di .env", key)
	}
	return value
}
