import budgetService from '@/services/budgetService';
import { create } from 'zustand';

export type Budget = {
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
};

type Store = {
  budgets: Budget[];
  isLoading: boolean;
  error: string | null;
  addBudget: (budget: Omit<Budget, 'id' | 'user_id'>) => Promise<void>;
  setBudgets: (budgets: Budget[]) => void;
  deleteBudget: (id: number) => Promise<void>;
  updateBudget: (id: number, budget: Partial<Budget>) => Promise<void>;
  updateBudgets: (budgets: Budget[]) => void;
  loadBudgets: () => Promise<void>;
};

export const useBudgetStore = create<Store>((set) => ({
  budgets: [],
  isLoading: false,
  error: null,

  addBudget: async (budget) => {
    try {
      set({ isLoading: true, error: null });
      const newBudget = await budgetService.createBudget({
        category_id: budget.category_id,
        daily_limit: budget.daily_limit,
        date: budget.date,
      });
      set((state) => ({
        budgets: [...state.budgets, newBudget],
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error adding budget';
      console.error('Error adding budget:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  setBudgets: (budgets) =>
    set(() => ({
      budgets,
    })),

  deleteBudget: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await budgetService.deleteBudget(id);
      set((state) => ({
        budgets: state.budgets.filter((b) => b.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error deleting budget';
      console.error('Error deleting budget:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateBudget: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });
      const updated = await budgetService.updateBudget(id, updates);
      set((state) => ({
        budgets: state.budgets.map((b) => (b.id === id ? updated : b)),
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error updating budget';
      console.error('Error updating budget:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateBudgets: (budgets) =>
    set(() => ({
      budgets,
    })),

  loadBudgets: async () => {
    try {
      set({ isLoading: true, error: null });
      const budgets = await budgetService.getBudgets();
      set(() => ({
        budgets: budgets || [],
        isLoading: false,
      }));
    } catch (error: any) {
      // Silently handle errors - show empty state instead of crashing
      console.warn('Could not load budgets:', error?.message || error);
      set({ budgets: [], isLoading: false });
    }
  },
}));
