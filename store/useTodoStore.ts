import todoService from '@/services/todoService';
import { create } from 'zustand';

export type Todo = {
  id: number;
  user_id: number;
  title: string;
  date: string;
  time?: string;
  is_done: boolean;
  notify_enabled?: boolean;
  reminder_offset_minutes?: number;
};

type Store = {
  todos: Todo[];
  isLoading: boolean;
  error: string | null;
  addTodo: (todo: Omit<Todo, 'id' | 'user_id'>) => Promise<void>;
  setTodos: (todos: Todo[]) => void;
  deleteTodo: (id: number) => Promise<void>;
  toggleTodo: (id: number) => Promise<void>;
  updateTodo: (id: number, todo: Partial<Todo>) => Promise<void>;
  loadTodos: () => Promise<void>;
  rescheduleAllNotifications: () => Promise<void>;
};


// Helper: Schedule notifikasi

export const useTodoStore = create<Store>((set, get) => ({
  todos: [],
  isLoading: false,
  error: null,

  addTodo: async (todo) => {
    try {
      set({ isLoading: true, error: null });
      
      // Save to API
      const newTodo = await todoService.createTodo({
        title: todo.title,
        date: todo.date,
        time: todo.time,
        is_done: todo.is_done || false,
      });
      
      // Update state
      set((state) => ({
        todos: [...state.todos, newTodo],
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error adding todo';
      console.error('Error adding todo:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  setTodos: (todos) =>
    set(() => ({
      todos,
    })),

  deleteTodo: async (id) => {
    try {
      set({ isLoading: true, error: null });
      
      await todoService.deleteTodo(id);
      set((state) => ({
        todos: state.todos.filter((t) => t.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error deleting todo';
      console.error('Error deleting todo:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  toggleTodo: async (id) => {
    try {
      set({ isLoading: true, error: null });
      
      const currentTodo = get().todos.find((t) => t.id === id);
      if (!currentTodo) return;

      const newDoneStatus = !currentTodo.is_done;
      
      await todoService.updateTodo(id, { is_done: newDoneStatus });
      
      set((state) => ({
        todos: state.todos.map((t) =>
          t.id === id
            ? {
                ...t,
                is_done: newDoneStatus,
              }
            : t
        ),
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error toggling todo';
      console.error('Error toggling todo:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateTodo: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });
      
      await todoService.updateTodo(id, updates);
      
      set((state) => ({
        todos: state.todos.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error updating todo';
      console.error('Error updating todo:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  loadTodos: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const todos = await todoService.getTodos();
      
      set(() => ({
        todos: todos || [],
        isLoading: false,
      }));
    } catch (error: any) {
      // Silently handle - show empty state
      console.warn('Could not load todos:', error?.message || error);
      set({ todos: [], isLoading: false });
    }
  },

  rescheduleAllNotifications: async () => {
    // Notification scheduling removed - use backend scheduling instead
    console.log('Notification scheduling handled by backend');
  },
}));
