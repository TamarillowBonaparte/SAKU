package main

import (
	"context"
	"financial-freedom/config"
	"financial-freedom/controllers"
	"financial-freedom/middleware"
	"financial-freedom/repositories"
	"financial-freedom/routes"
	"financial-freedom/services"
	"log"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load environment variables
	config.LoadEnv()

	// Initialize Firebase (untuk Google Sign-In)
	config.InitFirebase()

	// Initialize database
	db := config.InitDatabase()

	// Initialize repositories
	userRepository := repositories.NewUserRepository(db)
	otpCodeRepository := repositories.NewOtpCodeRepository(db)
	budgetRepository := repositories.NewBudgetRepository(db)
	transactionRepository := repositories.NewTransactionRepository(db)
	categoryRepository := repositories.NewCategoryRepository(db)
	debtRepository := repositories.NewDebtRepository(db)
	todoRepository := repositories.NewTodoRepository(db)

	// Initialize services
	authService := services.NewAuthService(userRepository, otpCodeRepository)
	budgetService := services.NewBudgetService(budgetRepository)
	transactionService := services.NewTransactionService(transactionRepository)
	categoryService := services.NewCategoryService(categoryRepository)
	debtService := services.NewDebtService(debtRepository)
	todoService := services.NewTodoService(todoRepository)
	notificationService := services.NewNotificationService(db)
	receiptOCRService := services.NewReceiptOCRService()

	// Initialize controllers
	authController := controllers.NewAuthController(authService, categoryService)
	budgetController := controllers.NewBudgetController(budgetService)
	transactionController := controllers.NewTransactionController(transactionService)
	categoryController := controllers.NewCategoryController(categoryService)
	debtController := controllers.NewDebtController(debtService)
	todoController := controllers.NewTodoController(todoService)
	notificationController := controllers.NewNotificationController(notificationService)
	receiptController := controllers.NewReceiptController(receiptOCRService)

	go notificationService.StartReminderWorker(context.Background())

	// Setup Gin router
	router := gin.Default()

	// Setup CORS
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Inject Firebase Auth client ke semua request
	router.Use(middleware.FirebaseMiddleware())

	// Setup routes
	routes.SetupRoutes(router, authController, budgetController, transactionController, categoryController, debtController, todoController, notificationController, receiptController)

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	// Start server
	port := config.GetEnv("PORT", "8080")
	log.Printf("Starting server on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
