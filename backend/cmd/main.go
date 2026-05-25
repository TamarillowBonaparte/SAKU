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
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

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
	receiptOCRService := services.NewReceiptOCRService() // auto-spawn PaddleOCR

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
		c.JSON(200, gin.H{"status": "ok"})
	})

	// ─── Graceful shutdown ────────────────────────────────────────────────────
	port := config.GetEnv("PORT", "8080")
	srv := &http.Server{
		Addr:    ":" + port,
		Handler: router,
	}

	// Jalankan server di goroutine
	go func() {
		log.Printf("🚀 Server berjalan di port %s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Tunggu sinyal OS (Ctrl+C / SIGTERM)
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("⏳ Menghentikan server...")

	// Beri waktu 10 detik untuk request yang sedang berjalan selesai
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("Server shutdown error: %v", err)
	}

	// Hentikan PaddleOCR Python process
	receiptOCRService.Shutdown()

	log.Println("✅ Server berhenti dengan bersih")
}
