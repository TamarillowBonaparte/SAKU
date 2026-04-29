import apiClient from './api';

export interface Todo {
  id: number;
  user_id: number;
  title: string;
  date: string;
  time?: string;
  is_done: boolean;
  notify_enabled?: boolean;
  reminder_offset_minutes?: number;
}

export interface CreateTodoRequest {
  title: string;
  date: string;
  time?: string;
  is_done?: boolean;
  notify_enabled?: boolean;
  reminder_offset_minutes?: number;
}

export interface UpdateTodoRequest {
  title?: string;
  date?: string;
  time?: string;
  is_done?: boolean;
  notify_enabled?: boolean;
  reminder_offset_minutes?: number;
}

export interface TodoResponse {
  data: Todo[];
  total: number;
}

class TodoService {
  async getTodos(): Promise<Todo[]> {
    try {
      const response = await apiClient.get<{ success: boolean; data: Todo[]; total: number }>('/todos');
      return response.data.data || [];
    } catch (error) {
      console.warn('Get todos error (route may not exist yet):', error);
      return [];
    }
  }

  async getTodo(id: number): Promise<Todo> {
    try {
      const response = await apiClient.get<{ data: Todo }>(`/todos/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Get todo error:', error);
      throw error;
    }
  }

  async createTodo(data: CreateTodoRequest): Promise<Todo> {
    try {
      const response = await apiClient.post<{ data: Todo }>('/todos', data);
      return response.data.data;
    } catch (error) {
      console.error('Create todo error:', error);
      throw error;
    }
  }

  async updateTodo(id: number, data: UpdateTodoRequest): Promise<Todo> {
    try {
      const response = await apiClient.put<{ data: Todo }>(`/todos/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error('Update todo error:', error);
      throw error;
    }
  }

  async deleteTodo(id: number): Promise<void> {
    try {
      await apiClient.delete(`/todos/${id}`);
    } catch (error) {
      console.error('Delete todo error:', error);
      throw error;
    }
  }
}

export default new TodoService();
