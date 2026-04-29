import apiClient from './api';

export interface Debt {
  id: number;
  user_id: number;
  name: string;
  amount: number;
  type: string;
  status: string;
  due_date: string;
  created_at: string;
  notify_enabled?: boolean;
  reminder_days?: number;
}

export interface CreateDebtRequest {
  name: string;
  amount: number;
  type: string;
  status: string;
  due_date: string;
  notify_enabled?: boolean;
  reminder_days?: number;
}

export interface UpdateDebtRequest {
  name?: string;
  amount?: number;
  type?: string;
  status?: string;
  due_date?: string;
  notify_enabled?: boolean;
  reminder_days?: number;
}

export interface DebtResponse {
  data: Debt[];
  total: number;
}

class DebtService {
  async getDebts(): Promise<Debt[]> {
    try {
      const response = await apiClient.get<{ success: boolean; data: Debt[]; total: number }>('/debts');
      return response.data.data || [];
    } catch (error) {
      console.warn('Get debts error (route may not exist yet):', error);
      return [];
    }
  }

  async getDebt(id: number): Promise<Debt> {
    try {
      const response = await apiClient.get<{ data: Debt }>(`/debts/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Get debt error:', error);
      throw error;
    }
  }

  async createDebt(data: CreateDebtRequest): Promise<Debt> {
    try {
      const response = await apiClient.post<{ data: Debt }>('/debts', data);
      return response.data.data;
    } catch (error) {
      console.error('Create debt error:', error);
      throw error;
    }
  }

  async updateDebt(id: number, data: UpdateDebtRequest): Promise<Debt> {
    try {
      const response = await apiClient.put<{ data: Debt }>(`/debts/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error('Update debt error:', error);
      throw error;
    }
  }

  async deleteDebt(id: number): Promise<void> {
    try {
      await apiClient.delete(`/debts/${id}`);
    } catch (error) {
      console.error('Delete debt error:', error);
      throw error;
    }
  }
}

export default new DebtService();
