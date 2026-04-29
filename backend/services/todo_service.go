package services

import (
	"financial-freedom/models"
	"financial-freedom/repositories"
)

type TodoService interface {
	CreateTodo(todo *models.Todo) error
	GetTodoByID(id uint) (*models.Todo, error)
	GetUserTodos(userID uint, page int, limit int) ([]models.Todo, int64, error)
	UpdateTodo(todo *models.Todo) error
	DeleteTodo(id uint) error
}

type todoService struct {
	todoRepository repositories.TodoRepository
}

func NewTodoService(todoRepository repositories.TodoRepository) TodoService {
	return &todoService{todoRepository}
}

func (s *todoService) CreateTodo(todo *models.Todo) error {
	return s.todoRepository.Create(todo)
}

func (s *todoService) GetTodoByID(id uint) (*models.Todo, error) {
	return s.todoRepository.FindByID(id)
}

func (s *todoService) GetUserTodos(userID uint, page int, limit int) ([]models.Todo, int64, error) {
	return s.todoRepository.FindByUserID(userID, page, limit)
}

func (s *todoService) UpdateTodo(todo *models.Todo) error {
	return s.todoRepository.Update(todo)
}

func (s *todoService) DeleteTodo(id uint) error {
	return s.todoRepository.Delete(id)
}
