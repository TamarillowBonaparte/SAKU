package controllers

import (
	"errors"
	"financial-freedom/models"
	"financial-freedom/services"
	"financial-freedom/utils"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type TodoController struct {
	todoService services.TodoService
}

func NewTodoController(todoService services.TodoService) *TodoController {
	return &TodoController{todoService: todoService}
}

type CreateTodoRequest struct {
	Title                 string `json:"title" binding:"required"`
	Date                  string `json:"date" binding:"required"`
	Time                  string `json:"time"`
	IsDone                *bool  `json:"is_done"`
	NotifyEnabled         *bool  `json:"notify_enabled"`
	ReminderOffsetMinutes *int   `json:"reminder_offset_minutes"`
}

type UpdateTodoRequest struct {
	Title                 *string `json:"title"`
	Date                  *string `json:"date"`
	Time                  *string `json:"time"`
	IsDone                *bool   `json:"is_done"`
	NotifyEnabled         *bool   `json:"notify_enabled"`
	ReminderOffsetMinutes *int    `json:"reminder_offset_minutes"`
}

func getTodoLocation() *time.Location {
	location, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		return time.Local
	}

	return location
}

func parseTodoDate(dateText string) (time.Time, error) {
	return time.ParseInLocation("2006-01-02", strings.TrimSpace(dateText), getTodoLocation())
}

func parseTodoTime(dateValue time.Time, timeText string) (time.Time, error) {
	trimmed := strings.TrimSpace(timeText)
	if trimmed == "" {
		return time.Date(
			dateValue.Year(),
			dateValue.Month(),
			dateValue.Day(),
			0,
			0,
			0,
			0,
			dateValue.Location(),
		), nil
	}

	layouts := []string{"15:04", "15:04:05", time.RFC3339}
	for _, layout := range layouts {
		parsedTime, err := time.ParseInLocation(layout, trimmed, dateValue.Location())
		if err == nil {
			return time.Date(
				dateValue.Year(),
				dateValue.Month(),
				dateValue.Day(),
				parsedTime.Hour(),
				parsedTime.Minute(),
				parsedTime.Second(),
				0,
				dateValue.Location(),
			), nil
		}
	}

	return time.Time{}, errors.New("invalid time format")
}

func (tc *TodoController) CreateTodo(c *gin.Context) {
	var req CreateTodoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		utils.RespondWithError(c, http.StatusUnauthorized, "User not authenticated", "")
		return
	}

	parsedDate, err := parseTodoDate(req.Date)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid date format", "use YYYY-MM-DD")
		return
	}

	parsedTime, err := parseTodoTime(parsedDate, req.Time)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid time format", "use HH:mm, HH:mm:ss, or RFC3339")
		return
	}

	todo := &models.Todo{
		UserID:                userID.(uint),
		Title:                 req.Title,
		Date:                  parsedDate,
		Time:                  parsedTime,
		IsDone:                false,
		NotifyEnabled:         true,
		ReminderOffsetMinutes: 60,
	}

	if req.IsDone != nil {
		todo.IsDone = *req.IsDone
	}
	if req.NotifyEnabled != nil {
		todo.NotifyEnabled = *req.NotifyEnabled
	}
	if req.ReminderOffsetMinutes != nil && *req.ReminderOffsetMinutes >= 0 {
		todo.ReminderOffsetMinutes = *req.ReminderOffsetMinutes
	}

	if err := tc.todoService.CreateTodo(todo); err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to create todo", err.Error())
		return
	}

	utils.RespondWithSuccess(c, http.StatusCreated, "Todo created", todo)
}

func (tc *TodoController) GetTodo(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid todo ID", err.Error())
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		utils.RespondWithError(c, http.StatusUnauthorized, "User not authenticated", "")
		return
	}

	todo, err := tc.todoService.GetTodoByID(uint(id))
	if err != nil {
		utils.RespondWithError(c, http.StatusNotFound, "Todo not found", err.Error())
		return
	}

	if todo.UserID != userID.(uint) {
		utils.RespondWithError(c, http.StatusForbidden, "Forbidden", "you can only access your own todos")
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Todo retrieved", todo)
}

func (tc *TodoController) ListTodos(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	userID, exists := c.Get("userID")
	if !exists {
		utils.RespondWithError(c, http.StatusUnauthorized, "User not authenticated", "")
		return
	}

	todos, total, err := tc.todoService.GetUserTodos(userID.(uint), page, limit)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to fetch todos", err.Error())
		return
	}

	if todos == nil {
		todos = []models.Todo{}
	}

	utils.RespondWithPaginated(c, http.StatusOK, "Todos retrieved", todos, page, limit, total)
}

func (tc *TodoController) UpdateTodo(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid todo ID", err.Error())
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		utils.RespondWithError(c, http.StatusUnauthorized, "User not authenticated", "")
		return
	}

	todo, err := tc.todoService.GetTodoByID(uint(id))
	if err != nil {
		utils.RespondWithError(c, http.StatusNotFound, "Todo not found", err.Error())
		return
	}

	if todo.UserID != userID.(uint) {
		utils.RespondWithError(c, http.StatusForbidden, "Forbidden", "you can only update your own todos")
		return
	}

	var req UpdateTodoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	parsedDate := todo.Date
	if req.Date != nil {
		parsedDate, err = parseTodoDate(*req.Date)
		if err != nil {
			utils.RespondWithError(c, http.StatusBadRequest, "Invalid date format", "use YYYY-MM-DD")
			return
		}
		todo.Date = parsedDate
	}

	parsedTime := todo.Time
	if req.Time != nil {
		parsedTime, err = parseTodoTime(parsedDate, *req.Time)
		if err != nil {
			utils.RespondWithError(c, http.StatusBadRequest, "Invalid time format", "use HH:mm, HH:mm:ss, or RFC3339")
			return
		}
	}

	todo.Time = parsedTime

	if req.Title != nil {
		todo.Title = *req.Title
	}
	if req.IsDone != nil {
		todo.IsDone = *req.IsDone
	}
	if req.NotifyEnabled != nil {
		todo.NotifyEnabled = *req.NotifyEnabled
	}
	if req.ReminderOffsetMinutes != nil && *req.ReminderOffsetMinutes >= 0 {
		todo.ReminderOffsetMinutes = *req.ReminderOffsetMinutes
	}

	if err := tc.todoService.UpdateTodo(todo); err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to update todo", err.Error())
		return
	}

	updatedTodo, err := tc.todoService.GetTodoByID(uint(id))
	if err != nil {
		utils.RespondWithSuccess(c, http.StatusOK, "Todo updated", todo)
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Todo updated", updatedTodo)
}

func (tc *TodoController) DeleteTodo(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid todo ID", err.Error())
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		utils.RespondWithError(c, http.StatusUnauthorized, "User not authenticated", "")
		return
	}

	todo, err := tc.todoService.GetTodoByID(uint(id))
	if err != nil {
		utils.RespondWithError(c, http.StatusNotFound, "Todo not found", err.Error())
		return
	}

	if todo.UserID != userID.(uint) {
		utils.RespondWithError(c, http.StatusForbidden, "Forbidden", "you can only delete your own todos")
		return
	}

	if err := tc.todoService.DeleteTodo(uint(id)); err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to delete todo", err.Error())
		return
	}

	utils.RespondWithSuccess(c, http.StatusOK, "Todo deleted", nil)
}
