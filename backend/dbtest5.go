package main

import (
	"financial-freedom/config"
	"fmt"
	"log"
)

func main() {
	config.LoadEnv()
	dbName := config.GetEnv("DB_NAME", "financial_freedom")
	dbHost := config.GetEnv("DB_HOST", "localhost")
	dbPort := config.GetEnv("DB_PORT", "5432")
	dbUser := config.GetEnv("DB_USER", "postgres")
	fmt.Printf("Env Loaded DB_NAME: %s\n", dbName)
	fmt.Printf("Env Loaded DB_HOST: %s\n", dbHost)
	fmt.Printf("Env Loaded DB_PORT: %s\n", dbPort)
	fmt.Printf("Env Loaded DB_USER: %s\n", dbUser)

	db := config.InitDatabaseRaw()
	var count int64
	db.Table("users").Count(&count)
	fmt.Printf("Number of users in table 'users': %d\n", count)
}
