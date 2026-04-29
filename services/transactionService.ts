import apiClient from './api';

export interface Transaction {
  id: number;
  user_id: number;
  category_id: number;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  note?: string;
  receipt_url?: string;
  created_at: string;
  category?: {
    id: number;
    name: string;
    icon?: string;
    is_default: boolean;
  };
}

export interface CreateTransactionRequest {
  category_id: number;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  note?: string;
  receipt_url?: string;
}

export interface UpdateTransactionRequest {
  category_id?: number;
  title?: string;
  amount?: number;
  type?: 'income' | 'expense';
  date?: string;
  note?: string;
  receipt_url?: string;
}

export interface TransactionResponse {
  data: Transaction[];
  total: number;
  page: number;
  per_page: number;
}

// Backend paginated response format
interface BackendPaginatedResponse {
  success: boolean;
  message: string;
  data: Transaction[];
  page: number;
  limit: number;
  total: number;
}

class TransactionService {
  async getTransactions(page = 1, limit = 50): Promise<TransactionResponse> {
    try {
      const response = await apiClient.get<BackendPaginatedResponse>('/transactions', {
        params: { page, limit },
      });
      // Backend: { success, message, data: [...], page, limit, total }
      return {
        data: response.data.data || [],
        total: response.data.total || 0,
        page: response.data.page || 1,
        per_page: response.data.limit || limit,
      };
    } catch (error) {
      console.error('Get transactions error:', error);
      // Return empty on error instead of throwing
      return { data: [], total: 0, page: 1, per_page: limit };
    }
  }

  async getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    try {
      const response = await apiClient.get<{ data: Transaction[] }>('/transactions', {
        params: { start_date: startDate, end_date: endDate },
      });
      return response.data.data;
    } catch (error) {
      console.error('Get transactions by date range error:', error);
      throw error;
    }
  }

  async getTransaction(id: number): Promise<Transaction> {
    try {
      const response = await apiClient.get<{ data: Transaction }>(`/transactions/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Get transaction error:', error);
      throw error;
    }
  }

  async createTransaction(data: CreateTransactionRequest): Promise<Transaction> {
    try {
      const response = await apiClient.post<{ data: Transaction }>('/transactions', data);
      return response.data.data;
    } catch (error) {
      console.error('Create transaction error:', error);
      throw error;
    }
  }

  async updateTransaction(id: number, data: UpdateTransactionRequest): Promise<Transaction> {
    try {
      const response = await apiClient.put<{ data: Transaction }>(`/transactions/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error('Update transaction error:', error);
      throw error;
    }
  }

  async deleteTransaction(id: number): Promise<void> {
    try {
      await apiClient.delete(`/transactions/${id}`);
    } catch (error) {
      console.error('Delete transaction error:', error);
      throw error;
    }
  }
}

export default new TransactionService();
