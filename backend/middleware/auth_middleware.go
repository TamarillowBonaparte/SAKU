package middleware

import (
	"errors"
	"financial-freedom/config"
	"financial-freedom/utils"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			utils.RespondWithError(c, http.StatusUnauthorized, "Unauthorized", "Authorization header missing")
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			utils.RespondWithError(c, http.StatusUnauthorized, "Unauthorized", "Invalid authorization header format")
			c.Abort()
			return
		}

		jwtSecret := config.GetEnv("JWT_SECRET", "financial-freedom-secret-key")
		tokenString := parts[1]
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Verify signing method
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("invalid signing method")
			}
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			utils.RespondWithError(c, http.StatusUnauthorized, "Unauthorized", "Invalid token")
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			utils.RespondWithError(c, http.StatusUnauthorized, "Unauthorized", "Invalid token claims")
			c.Abort()
			return
		}

		// JWT numbers are float64, convert to uint
		userIDFloat, ok := claims["user_id"].(float64)
		if !ok {
			utils.RespondWithError(c, http.StatusUnauthorized, "Unauthorized", "Invalid user ID in token")
			c.Abort()
			return
		}
		c.Set("userID", uint(userIDFloat))
		c.Set("email", claims["email"])

		c.Next()
	}
}
