import apiClient from './api';

export interface Category {
  id: number;
  user_id: number;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  is_default: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  type?: 'income' | 'expense';
  icon?: string;
  color?: string;
}

export interface CategoryResponse {
  data: Category[];
  total: number;
}

class CategoryService {
  async getCategories(): Promise<Category[]> {
    try {
      const response = await apiClient.get<{ success: boolean; data: Category[] }>('/categories');
      return response.data.data || [];
    } catch (error) {
      console.warn('Get categories error (route may not exist yet):', error);
      return [];
    }
  }

  async getCategoriesByType(type: 'income' | 'expense'): Promise<Category[]> {
    try {
      const response = await apiClient.get<CategoryResponse>('/categories', {
        params: { type },
      });
      return response.data.data;
    } catch (error) {
      console.error('Get categories by type error:', error);
      throw error;
    }
  }

  async getCategory(id: number): Promise<Category> {
    try {
      const response = await apiClient.get<{ data: Category }>(`/categories/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Get category error:', error);
      throw error;
    }
  }

  async createCategory(data: CreateCategoryRequest): Promise<Category> {
    try {
      const response = await apiClient.post<{ data: Category }>('/categories', data);
      return response.data.data;
    } catch (error) {
      console.error('Create category error:', error);
      throw error;
    }
  }

  async updateCategory(id: number, data: UpdateCategoryRequest): Promise<Category> {
    try {
      const response = await apiClient.put<{ data: Category }>(`/categories/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error('Update category error:', error);
      throw error;
    }
  }

  async deleteCategory(id: number): Promise<void> {
    try {
      await apiClient.delete(`/categories/${id}`);
    } catch (error) {
      console.error('Delete category error:', error);
      throw error;
    }
  }
}

export default new CategoryService();
