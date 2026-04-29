package services

import (
	"financial-freedom/models"
	"financial-freedom/repositories"
)

type CategoryService interface {
	CreateCategory(category *models.Category) error
	GetCategoryByID(id uint) (*models.Category, error)
	GetUserCategories(userID uint) ([]models.Category, error)
	UpdateCategory(category *models.Category) error
	DeleteCategory(id uint) error
	CreateDefaultCategories(userID uint) error
}

type categoryService struct {
	categoryRepository repositories.CategoryRepository
}

func NewCategoryService(categoryRepository repositories.CategoryRepository) CategoryService {
	return &categoryService{categoryRepository}
}

func (s *categoryService) CreateCategory(category *models.Category) error {
	return s.categoryRepository.Create(category)
}

func (s *categoryService) GetCategoryByID(id uint) (*models.Category, error) {
	return s.categoryRepository.FindByID(id)
}

func (s *categoryService) GetUserCategories(userID uint) ([]models.Category, error) {
	return s.categoryRepository.FindByUserID(userID)
}

func (s *categoryService) UpdateCategory(category *models.Category) error {
	return s.categoryRepository.Update(category)
}

func (s *categoryService) DeleteCategory(id uint) error {
	return s.categoryRepository.Delete(id)
}

// CreateDefaultCategories creates default categories for a new user
func (s *categoryService) CreateDefaultCategories(userID uint) error {
	defaultCategories := []models.Category{
		// Income categories
		{UserID: userID, Name: "GAJI", Type: "income", Icon: "icon-salary", Color: "#F0FDF4", IsDefault: true},
		{UserID: userID, Name: "INVESTASI", Type: "income", Icon: "icon-investment", Color: "#F0FDF4", IsDefault: true},
		{UserID: userID, Name: "BISNIS", Type: "income", Icon: "icon-business", Color: "#FFF7ED", IsDefault: true},

		// Expense categories
		{UserID: userID, Name: "MAKANAN", Type: "expense", Icon: "icon-food", Color: "#FEF3C7", IsDefault: true},
		{UserID: userID, Name: "TRANSPORTASI", Type: "expense", Icon: "icon-transport", Color: "#D1FAE5", IsDefault: true},
		{UserID: userID, Name: "BELANJA", Type: "expense", Icon: "icon-shopping", Color: "#FEE2E2", IsDefault: true},
		{UserID: userID, Name: "TAGIHAN", Type: "expense", Icon: "icon-bill", Color: "#E0E7FF", IsDefault: true},
		{UserID: userID, Name: "HIBURAN", Type: "expense", Icon: "icon-entertainment", Color: "#FCE7F3", IsDefault: true},
		{UserID: userID, Name: "KESEHATAN", Type: "expense", Icon: "icon-health", Color: "#ECFDF5", IsDefault: true},
		{UserID: userID, Name: "PENDIDIKAN", Type: "expense", Icon: "icon-education", Color: "#EFF6FF", IsDefault: true},
	}

	for _, category := range defaultCategories {
		if err := s.categoryRepository.Create(&category); err != nil {
			return err
		}
	}

	return nil
}
