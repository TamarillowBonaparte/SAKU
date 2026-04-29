package utils

import (
	"strconv"

	"github.com/gin-gonic/gin"
)

type PaginationParams struct {
	Page  int
	Limit int
}

func GetPaginationParams(c *gin.Context) PaginationParams {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	return PaginationParams{
		Page:  page,
		Limit: limit,
	}
}

func GetOffset(page int, limit int) int {
	return (page - 1) * limit
}
