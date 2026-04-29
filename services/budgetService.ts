import apiClient from './api';

export interface Budget {
  id: number;
  user_id: number;
  category_id: number;
  daily_limit: number;
  date: string;
  category?: {
    id: number;
    name: string;
    icon?: string;
    is_default: boolean;
  };
}

export interface CreateBudgetRequest {
  category_id: number;
  daily_limit: number;
  date: string;
}

export interface UpdateBudgetRequest {
  category_id?: number;
  daily_limit?: number;
  date?: string;
}

export interface BudgetResponse {
  data: Budget[];
  total: number;
}

// Backend paginated response format
interface BackendBudgetPaginatedResponse {
  success: boolean;
  message: string;
  data: Budget[];
  page: number;
  limit: number;
  total: number;
}

class BudgetService {
  async getBudgets(): Promise<Budget[]> {
    try {
      const response = await apiClient.get<BackendBudgetPaginatedResponse>('/budgets');
      // Backend: { success, message, data: [...], page, limit, total }
      return response.data.data || [];
    } catch (error) {
      console.error('Get budgets error:', error);
      // Return empty array instead of throwing to prevent UI crash
      return [];
    }
  }

  async getBudget(id: number): Promise<Budget> {
    try {
      const response = await apiClient.get<{ data: Budget }>(`/budgets/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Get budget error:', error);
      throw error;
    }
  }

  async createBudget(data: CreateBudgetRequest): Promise<Budget> {
    try {
      const response = await apiClient.post<{ data: Budget }>('/budgets', data);
      return response.data.data;
    } catch (error) {
      console.error('Create budget error:', error);
      throw error;
    }
  }

  async updateBudget(id: number, data: UpdateBudgetRequest): Promise<Budget> {
    try {
      const response = await apiClient.put<{ data: Budget }>(`/budgets/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error('Update budget error:', error);
      throw error;
    }
  }

  async deleteBudget(id: number): Promise<void> {
    try {
      await apiClient.delete(`/budgets/${id}`);
    } catch (error) {
      console.error('Delete budget error:', error);
      throw error;
    }
  }
}

export default new BudgetService();
