package utils

import "github.com/gin-gonic/gin"

type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

type PaginatedResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
	Page    int         `json:"page"`
	Limit   int         `json:"limit"`
	Total   int64       `json:"total"`
}

func RespondWithSuccess(c *gin.Context, statusCode int, message string, data interface{}) {
	c.JSON(statusCode, Response{
		Success: true,
		Message: message,
		Data:    data,
	})
}

func RespondWithError(c *gin.Context, statusCode int, message string, error string) {
	c.JSON(statusCode, Response{
		Success: false,
		Message: message,
		Error:   error,
	})
}

func RespondWithPaginated(c *gin.Context, statusCode int, message string, data interface{}, page int, limit int, total int64) {
	c.JSON(statusCode, PaginatedResponse{
		Success: true,
		Message: message,
		Data:    data,
		Page:    page,
		Limit:   limit,
		Total:   total,
	})
}
