package config

import (
	"context"
	"log"
	"os"

	firebase "firebase.google.com/go"
	"firebase.google.com/go/auth"
	"google.golang.org/api/option"
)

var firebaseAuth *auth.Client

func InitFirebase() *auth.Client {
	credFile := GetEnv("FIREBASE_CREDENTIALS", "serviceAccountKey.json")

	// Jika file tidak ada, skip Firebase (logout Google Login tidak akan berfungsi)
	if _, err := os.Stat(credFile); os.IsNotExist(err) {
		log.Printf("⚠️  Firebase skipped: '%s' tidak ditemukan. Google Login tidak aktif.", credFile)
		log.Printf("   Download dari: Firebase Console → Project Settings → Service Accounts → Generate new private key")
		return nil
	}

	opt := option.WithCredentialsFile(credFile)
	app, err := firebase.NewApp(context.Background(), nil, opt)
	if err != nil {
		log.Printf("❌ Failed to initialize Firebase: %v", err)
		return nil
	}

	client, err := app.Auth(context.Background())
	if err != nil {
		log.Printf("❌ Failed to get Firebase Auth client: %v", err)
		return nil
	}

	firebaseAuth = client
	log.Println("✅ Firebase initialized successfully")
	return client
}

func GetFirebaseAuth() *auth.Client {
	return firebaseAuth
}
