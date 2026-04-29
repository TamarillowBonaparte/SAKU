package repositories

import (
	"financial-freedom/models"

	"gorm.io/gorm"
)

type TodoRepository interface {
	Create(todo *models.Todo) error
	FindByID(id uint) (*models.Todo, error)
	FindByUserID(userID uint, page int, limit int) ([]models.Todo, int64, error)
	Update(todo *models.Todo) error
	Delete(id uint) error
}

type todoRepository struct {
	db *gorm.DB
}

func NewTodoRepository(db *gorm.DB) TodoRepository {
	return &todoRepository{db}
}

func (r *todoRepository) Create(todo *models.Todo) error {
	return r.db.Create(todo).Error
}

func (r *todoRepository) FindByID(id uint) (*models.Todo, error) {
	var todo models.Todo
	err := r.db.First(&todo, id).Error
	if err != nil {
		return nil, err
	}
	return &todo, nil
}

func (r *todoRepository) FindByUserID(userID uint, page int, limit int) ([]models.Todo, int64, error) {
	var todos []models.Todo
	var total int64

	offset := (page - 1) * limit

	err := r.db.Where("user_id = ?", userID).
		Model(&models.Todo{}).
		Count(&total).
		Offset(offset).
		Limit(limit).
		Order("date DESC").
		Find(&todos).Error

	return todos, total, err
}

func (r *todoRepository) Update(todo *models.Todo) error {
	return r.db.Save(todo).Error
}

func (r *todoRepository) Delete(id uint) error {
	return r.db.Delete(&models.Todo{}, id).Error
}
