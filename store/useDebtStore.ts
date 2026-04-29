import debtService from '@/services/debtService';
import { create } from 'zustand';

export type Debt = {
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
};

type Store = {
  debts: Debt[];
  isLoading: boolean;
  error: string | null;
  addDebt: (debt: Omit<Debt, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  setDebts: (debts: Debt[]) => void;
  deleteDebt: (id: number) => Promise<void>;
  updateDebt: (id: number, debt: Partial<Debt>) => Promise<void>;
  loadDebts: () => Promise<void>;
};

export const useDebtStore = create<Store>((set) => ({
  debts: [],
  isLoading: false,
  error: null,

  addDebt: async (debt) => {
    try {
      set({ isLoading: true, error: null });
      const newDebt = await debtService.createDebt({
        name: debt.name,
        amount: debt.amount,
        type: debt.type,
        status: debt.status,
        due_date: debt.due_date,
      });
      set((state) => ({
        debts: [...state.debts, newDebt],
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error adding debt';
      console.error('Error adding debt:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  setDebts: (debts) =>
    set(() => ({
      debts,
    })),

  deleteDebt: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await debtService.deleteDebt(id);
      set((state) => ({
        debts: state.debts.filter((d) => d.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error deleting debt';
      console.error('Error deleting debt:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateDebt: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });
      const updated = await debtService.updateDebt(id, updates);
      set((state) => ({
        debts: state.debts.map((d) => (d.id === id ? updated : d)),
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error updating debt';
      console.error('Error updating debt:', error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  loadDebts: async () => {
    try {
      set({ isLoading: true, error: null });
      const debts = await debtService.getDebts();
      set(() => ({
        debts: debts || [],
        isLoading: false,
      }));
    } catch (error: any) {
      // Silently handle - show empty state
      console.warn('Could not load debts:', error?.message || error);
      set({ debts: [], isLoading: false });
    }
  },
}));
