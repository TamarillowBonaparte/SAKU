package middleware

import (
	"financial-freedom/config"

	"github.com/gin-gonic/gin"
)

// FirebaseMiddleware menyimpan Firebase Auth client ke Gin context
// agar bisa digunakan oleh controller (misal GoogleLogin)
func FirebaseMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		firebaseAuth := config.GetFirebaseAuth()
		if firebaseAuth != nil {
			c.Set("firebaseAuth", firebaseAuth)
		}
		c.Next()
	}
}
