package routes

import (
	"financial-freedom/controllers"
	"financial-freedom/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(
	router *gin.Engine,
	authController *controllers.AuthController,
	budgetController *controllers.BudgetController,
	transactionController *controllers.TransactionController,
	categoryController *controllers.CategoryController,
	debtController *controllers.DebtController,
	todoController *controllers.TodoController,
	notificationController *controllers.NotificationController,
	receiptController *controllers.ReceiptController,
) {
	// Public routes
	authGroup := router.Group("/api/auth")
	{
		authGroup.POST("/register", authController.Register)
		authGroup.POST("/login", authController.Login)
		authGroup.POST("/google-login", authController.GoogleLogin)
		authGroup.POST("/request-otp", authController.RequestOTP)
		authGroup.POST("/verify-otp", authController.VerifyOTP)
		authGroup.POST("/reset-password", authController.ResetPassword)
		authGroup.POST("/register-send-otp", authController.RegisterSendOTP)
		// Reset password by email (tanpa user_id)
		authGroup.POST("/reset-send-otp", authController.ResetSendOTP)
		authGroup.POST("/verify-reset-otp", authController.VerifyResetOTP)
		authGroup.POST("/reset-password-by-email", authController.ResetPasswordByEmail)
	}

	// Protected routes
	protectedGroup := router.Group("/api")
	protectedGroup.Use(middleware.AuthMiddleware())
	{
		// Category routes
		categoryGroup := protectedGroup.Group("/categories")
		{
			categoryGroup.POST("", categoryController.CreateCategory)
			categoryGroup.GET("", categoryController.ListCategories)
			categoryGroup.GET("/:id", categoryController.GetCategory)
			categoryGroup.PUT("/:id", categoryController.UpdateCategory)
			categoryGroup.DELETE("/:id", categoryController.DeleteCategory)
		}

		// Budget routes
		budgetGroup := protectedGroup.Group("/budgets")
		{
			budgetGroup.POST("", budgetController.CreateBudget)
			budgetGroup.GET("", budgetController.ListBudgets)
			budgetGroup.GET("/:id", budgetController.GetBudget)
			budgetGroup.PUT("/:id", budgetController.UpdateBudget)
			budgetGroup.DELETE("/:id", budgetController.DeleteBudget)
		}

		// Transaction routes
		transactionGroup := protectedGroup.Group("/transactions")
		{
			transactionGroup.POST("", transactionController.CreateTransaction)
			transactionGroup.GET("", transactionController.ListTransactions)
			transactionGroup.GET("/:id", transactionController.GetTransaction)
			transactionGroup.PUT("/:id", transactionController.UpdateTransaction)
			transactionGroup.DELETE("/:id", transactionController.DeleteTransaction)
		}

		// Debt routes
		debtGroup := protectedGroup.Group("/debts")
		{
			debtGroup.POST("", debtController.CreateDebt)
			debtGroup.GET("", debtController.ListDebts)
			debtGroup.GET("/:id", debtController.GetDebt)
			debtGroup.PUT("/:id", debtController.UpdateDebt)
			debtGroup.DELETE("/:id", debtController.DeleteDebt)
		}

		// Todo routes
		todoGroup := protectedGroup.Group("/todos")
		{
			todoGroup.POST("", todoController.CreateTodo)
			todoGroup.GET("", todoController.ListTodos)
			todoGroup.GET("/:id", todoController.GetTodo)
			todoGroup.PUT("/:id", todoController.UpdateTodo)
			todoGroup.DELETE("/:id", todoController.DeleteTodo)
		}

		notificationGroup := protectedGroup.Group("/notifications")
		{
			notificationGroup.POST("/register-token", notificationController.RegisterPushToken)
		}

		receiptGroup := protectedGroup.Group("/receipts")
		{
			receiptGroup.POST("/scan", receiptController.ScanReceipt)
		}
	}
}
